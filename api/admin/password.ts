/* POST { current, next } : change le mot de passe admin (session ouverte + mot de passe actuel requis).
   Toutes les autres sessions sont déconnectées ; celle-ci reçoit un nouveau cookie. */

import { MIN_LENGTH, adminReady, checkPassword, isAdmin, json, sessionCookie, setPassword } from "../_lib/auth.js";
import { clientIp, hit, redis, storeReady } from "../_lib/store.js";

export async function POST(request: Request) {
  if (!adminReady() || !storeReady()) return json(503, { error: "admin_not_configured" });
  if (!(await isAdmin(request))) return json(401, { error: "unauthorized" });

  let current = "";
  let next = "";
  try {
    const body = (await request.json()) as { current?: unknown; next?: unknown };
    current = typeof body.current === "string" ? body.current : "";
    next = typeof body.next === "string" ? body.next : "";
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (next.length < MIN_LENGTH || next.length > 200) return json(400, { error: "too_short" });

  // Même limite que la connexion : 5 mots de passe actuels faux par quart d'heure.
  const key = `limite:admin:${clientIp(request)}`;
  if (Number((await redis<string | null>("GET", key)) ?? 0) >= 5) return json(429, { error: "too_many" });
  if (!(await checkPassword(current))) {
    await hit(key, 15 * 60);
    return json(403, { error: "wrong_password" });
  }
  if (current === next) return json(400, { error: "same_password" });

  await setPassword(next);
  return json(200, { ok: true }, { "Set-Cookie": await sessionCookie() });
}
