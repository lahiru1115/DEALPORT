import { NextResponse } from "next/server";
import { loginSchema, type LoginResponse } from "@dealport/shared";

import { ApiError } from "@/lib/api/errors";
import { executeRequest } from "@/lib/api/request";
import { setAuthCookie } from "@/lib/auth/session";
import { API_URL } from "@/lib/env";

/**
 * `POST /api/auth/login`
 *
 * The one place the JWT is ever handled in the Next.js layer. It forwards the
 * credentials to NestJS, then writes the returned token into an httpOnly
 * cookie and returns **only the user** to the browser — the token itself never
 * reaches client JavaScript (plans/01-ARCHITECTURE.md §5).
 *
 * This cannot go through the generic proxy: the proxy attaches a token, and
 * this is the request that obtains one.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { statusCode: 400, message: "Invalid request body" },
      { status: 400 },
    );
  }

  // Validated here as well as on the API so an obviously malformed request
  // never leaves this process.
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        statusCode: 400,
        message: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  try {
    const result = await executeRequest<LoginResponse>(API_URL, "/auth/login", {
      method: "POST",
      json: parsed.data,
      cache: "no-store",
    });

    await setAuthCookie(result.accessToken);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof ApiError) {
      /*
        Passed through as-is. The API answers 401 identically for an unknown
        email and a wrong password so it cannot be used to enumerate accounts
        (plans/02-API.md §2) — reworded here, that property would be lost.
      */
      return NextResponse.json(
        error.body ?? { statusCode: error.status, message: error.message },
        { status: error.status },
      );
    }

    // The API being unreachable is not a credentials problem; say so.
    return NextResponse.json(
      { statusCode: 502, message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }
}
