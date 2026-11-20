/* POST { password } : ouvre une session admin. 5 essais ratés par quart d'heure et par IP au maximum. */

import { adminReady, checkPassword, json, sessionCookie } from "../_lib/auth.js";
import { clientIp, hit, redis, storeReady } from "../_lib/store.js";

export async function POST(request: Request) {
  if (!adminReady() || !storeReady()) return json(503, { error: "admin_not_configured" });

  const key = `limite:admin:${clientIp(request)}`;
  const tries = Number((await redis<string | null>("GET", key)) ?? 0);
  if (tries >= 5) return json(429, { error: "too_many" });

  let candidate = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    candidate = typeof body.password === "string" ? body.password : "";
  } catch {
    return json(400, { error: "invalid_json" });
  }

  if (!(await checkPassword(candidate))) {
    await hit(key, 15 * 60);
    return json(401, { error: "wrong_password" });
  }
  await redis("DEL", key);
  return json(200, { ok: true }, { "Set-Cookie": await sessionCookie() });
}
