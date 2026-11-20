/* Fonction serverless Vercel : enregistre un inscrit à la newsletter.
   1. Dans la base du site (Upstash Redis, voir api/_lib/store.ts) : visible sur /admin.
   2. En plus, dans une liste Brevo si BREVO_API_KEY et BREVO_LIST_ID sont définies
      (optionnel : BREVO_FIRSTNAME_ATTR, par défaut FIRSTNAME ; PRENOM sur certains comptes français).
   Sans aucune des deux, le site repasse par la messagerie du visiteur (réponse 503). */

import { clientIp, hit, saveSubscriber, storeReady } from "./_lib/store.js";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sendToBrevo(apiKey: string, listId: number, email: string, prenom: string) {
  const send = (attributes?: Record<string, string>) =>
    fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true, ...(attributes ? { attributes } : {}) }),
    });
  const attr = process.env.BREVO_FIRSTNAME_ATTR || "FIRSTNAME";
  let res = await send(prenom ? { [attr]: prenom } : undefined);
  // Attribut inconnu sur ce compte Brevo : on inscrit quand même l'adresse.
  if (res.status === 400 && prenom) res = await send();
  if (!res.ok) console.error("Brevo", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function POST(request: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  const brevo = Boolean(apiKey && listId);
  const store = storeReady();
  if (!brevo && !store) return json(503, { error: "newsletter_not_configured" });

  let data: { email?: unknown; prenom?: unknown; interets?: unknown };
  try {
    data = (await request.json()) as typeof data;
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const prenom = typeof data.prenom === "string" ? data.prenom.trim().slice(0, 80) : "";
  const interets = Array.isArray(data.interets)
    ? data.interets.filter((i): i is string => typeof i === "string").map((i) => i.slice(0, 60)).slice(0, 12)
    : [];
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) return json(400, { error: "invalid_email" });

  let saved = false;
  if (store) {
    try {
      // Au plus 20 inscriptions par heure depuis une même adresse IP (anti-robots).
      if ((await hit(`limite:newsletter:${clientIp(request)}`, 3600)) > 20) return json(429, { error: "too_many" });
      await saveSubscriber({ email, prenom, interets });
      saved = true;
    } catch (e) {
      console.error("Base newsletter", e);
    }
  }
  if (brevo) saved = (await sendToBrevo(apiKey!, listId, email, prenom).catch(() => false)) || saved;

  return saved ? json(200, { ok: true }) : json(502, { error: "save_failed" });
}
