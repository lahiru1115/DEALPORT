import { NextResponse } from "next/server";

import { clearAuthCookie } from "@/lib/auth/session";

/**
 * `POST /api/auth/logout`
 *
 * Clears the cookie. There is no server-side revocation to do: the token is a
 * stateless 7-day JWT with no refresh rotation (a documented scope cut — see
 * plans/00-BUILD-PLAN.md), so dropping the cookie is the whole logout.
 *
 * POST rather than GET on purpose — a GET logout can be triggered by any image
 * or link on the page.
 */
export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
