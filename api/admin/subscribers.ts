/* Espace admin, réservé aux sessions connectées.
   GET : liste des inscrits à la newsletter.
   DELETE ?email=... : retire un inscrit. */

import { adminReady, isAdmin, json } from "../_lib/auth.js";
import { deleteSubscriber, listSubscribers, storeReady } from "../_lib/store.js";

async function guard(request: Request) {
  if (!adminReady() || !storeReady()) return json(503, { error: "admin_not_configured" });
  if (!(await isAdmin(request))) return json(401, { error: "unauthorized" });
  return null;
}

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  return json(200, { subscribers: await listSubscribers() });
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const email = (new URL(request.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return json(400, { error: "missing_email" });
  return (await deleteSubscriber(email)) ? json(200, { ok: true }) : json(404, { error: "not_found" });
}
