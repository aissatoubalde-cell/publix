/* Connexion à l'espace admin.
   - Mot de passe de départ (et de secours) : variable ADMIN_PASSWORD, définie uniquement dans Vercel.
   - Depuis /admin, l'équipe peut choisir un nouveau mot de passe : il est stocké chiffré (scrypt) dans la base
     et remplace ADMIN_PASSWORD, sans redéploiement.
   - Oubli : changer ADMIN_PASSWORD dans Vercel puis redéployer. Le mot de passe de la base est alors ignoré
     et ADMIN_PASSWORD redevient valable (le mot de passe de la base est lié à la valeur d'ADMIN_PASSWORD).
   Une fois connecté, le navigateur garde un cookie signé valable 7 jours.
   Tout changement de mot de passe déconnecte toutes les sessions ouvertes. */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { redis } from "./store.js";

const COOKIE = "publix_admin";
const MAX_AGE = 7 * 24 * 3600;
const STORED_KEY = "admin:motdepasse";
export const MIN_LENGTH = 10;

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });

const envPassword = () => process.env.ADMIN_PASSWORD ?? "";
export const adminReady = () => envPassword().length >= MIN_LENGTH;

const hmac = (key: string, value: string) => createHmac("sha256", key).update(value).digest("base64url");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const scryptHash = (pw: string, salt: string) =>
  new Promise<string>((resolve, reject) =>
    scrypt(pw, salt, 32, (err, key) => (err ? reject(err) : resolve(key.toString("base64url")))),
  );

type Stored = { hash: string; salt: string; base: string };

/* Mot de passe choisi depuis /admin, s'il existe et s'il a été défini avec l'ADMIN_PASSWORD actuel. */
async function stored(): Promise<Stored | null> {
  const raw = await redis<string | null>("GET", STORED_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Stored;
    return s.hash && s.salt && same(s.base, hmac(s.salt, envPassword())) ? s : null;
  } catch {
    return null;
  }
}

/* Clé de signature des sessions : elle change à chaque changement de mot de passe. */
async function signingKey() {
  return `publix-admin:${envPassword()}:${(await stored())?.hash ?? ""}`;
}

export async function checkPassword(candidate: string) {
  if (!adminReady()) return false;
  const s = await stored();
  if (s) return same(await scryptHash(candidate, s.salt), s.hash);
  const key = "publix-admin-check";
  return same(hmac(key, candidate), hmac(key, envPassword()));
}

export async function setPassword(next: string) {
  const salt = randomBytes(16).toString("base64url");
  const record: Stored = { hash: await scryptHash(next, salt), salt, base: hmac(salt, envPassword()) };
  await redis("SET", STORED_KEY, JSON.stringify(record));
}

export async function sessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${COOKIE}=${exp}.${hmac(await signingKey(), exp)}; Path=/api/admin; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = () => `${COOKIE}=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function isAdmin(request: Request) {
  if (!adminReady()) return false;
  const raw = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  const [exp, sig] = (raw?.slice(COOKIE.length + 1) ?? "").split(".");
  if (!exp || !sig || Number(exp) <= Date.now() / 1000) return false;
  return same(sig, hmac(await signingKey(), exp));
}
