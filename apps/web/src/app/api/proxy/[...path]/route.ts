import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL, AUTH_COOKIE_NAME } from "@/lib/env";

/**
 * `/api/proxy/[...path]` — the BFF.
 *
 * Client components fetch this same-origin path; it forwards to NestJS with the
 * JWT read from the httpOnly cookie. Two things fall out of that
 * (plans/01-ARCHITECTURE.md §5):
 *
 *  - the browser never holds the token, so an XSS cannot exfiltrate it the way
 *    it could from `localStorage`;
 *  - the API origin never appears in the client bundle, and CORS stays trivial
 *    because every browser request is same-origin.
 */

/**
 * Only headers we actually need are forwarded.
 *
 * Passing the request's headers through wholesale would leak the browser's
 * `cookie` (including the auth cookie, which belongs to *this* origin, not the
 * API) and send a `host` that does not match the upstream. `content-type` has
 * to survive because it carries the multipart boundary on image uploads.
 */
const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];

/** Hop-by-hop and encoding headers must not be copied onto our own response. */
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
    // Answered here rather than forwarded: without a token the upstream call is
    // guaranteed to 401, and the client handles 401 the same either way.
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

  /*
    The body is buffered rather than streamed. Streaming would need
    `duplex: "half"`, which is inconsistently supported across the runtimes this
    deploys to; uploads are capped at 5MB by the API, so buffering is bounded
    and predictable.
  */
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

  // 204 from `DELETE /products/:id` must stay bodyless — giving a 204 a body is
  // a protocol violation and `fetch` rejects it.
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
