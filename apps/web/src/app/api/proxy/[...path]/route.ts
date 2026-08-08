import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL, AUTH_COOKIE_NAME } from "@/lib/env";

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];

const SKIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const search = new URL(request.url).search;
  const target = `${API_URL}/${path.join("/")}${search}`;

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Could not reach the server. Please try again." },
      { status: 502 },
    );
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
