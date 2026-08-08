import { NextResponse } from "next/server";
import { loginSchema, type LoginResponse } from "@dealport/shared";

import { ApiError } from "@/lib/api/errors";
import { executeRequest } from "@/lib/api/request";
import { setAuthCookie } from "@/lib/auth/session";
import { API_URL } from "@/lib/env";

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
    const forwardedFor = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");

    const result = await executeRequest<LoginResponse>(API_URL, "/auth/login", {
      method: "POST",
      json: parsed.data,
      cache: "no-store",
      headers: {
        ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
        ...(userAgent && { "User-Agent": userAgent }),
      },
    });

    await setAuthCookie(result.accessToken);

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.body ?? { statusCode: error.status, message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { statusCode: 502, message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }
}
