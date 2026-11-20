/* Base de données des inscrits : Upstash Redis (créée depuis Vercel > Storage).
   L'intégration Vercel ajoute toute seule KV_REST_API_URL et KV_REST_API_TOKEN
   (ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN selon la version).
   Les fichiers de api/_lib ne sont pas des routes : Vercel ignore les dossiers préfixés par « _ ». */

export type Subscriber = { email: string; prenom: string; interets: string[]; date: string };

const SUBS = "newsletter:inscrits";

function config() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export const storeReady = () => config() !== null;

/* Exécute une commande Redis via l'API REST d'Upstash. */
export async function redis<T = unknown>(...command: (string | number)[]): Promise<T> {
  const c = config();
  if (!c) throw new Error("store_not_configured");
  const res = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`redis: ${data.error ?? res.status}`);
  return data.result as T;
}

/* Ajoute ou met à jour un inscrit ; la date de première inscription est conservée. */
export async function saveSubscriber(s: Omit<Subscriber, "date">) {
  const previous = await redis<string | null>("HGET", SUBS, s.email);
  let date = new Date().toISOString();
  if (previous) {
    try {
      date = (JSON.parse(previous) as Subscriber).date || date;
    } catch {
      /* ancienne valeur illisible : on la remplace */
    }
  }
  await redis("HSET", SUBS, s.email, JSON.stringify({ ...s, date }));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const flat = (await redis<string[] | null>("HGETALL", SUBS)) ?? [];
  const out: Subscriber[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i]) as Subscriber);
    } catch {
      out.push({ email: flat[i - 1], prenom: "", interets: [], date: "" });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deleteSubscriber(email: string) {
  return (await redis<number>("HDEL", SUBS, email)) > 0;
}

/* Compteur par fenêtre de temps (limite anti-abus). Renvoie le nombre de tentatives dans la fenêtre. */
export async function hit(key: string, windowSeconds: number) {
  const n = await redis<number>("INCR", key);
  if (n === 1) await redis("EXPIRE", key, windowSeconds);
  return n;
}

export const clientIp = (request: Request) =>
  (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnu";
