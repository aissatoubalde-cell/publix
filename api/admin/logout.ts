/* POST : ferme la session admin. */

import { clearCookie, json } from "../_lib/auth.js";

export function POST() {
  return json(200, { ok: true }, { "Set-Cookie": clearCookie() });
}
