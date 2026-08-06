"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { isApiError } from "@/lib/api/errors";

/**
 * A session that expires mid-use surfaces as a 401 from every in-flight
 * query. Without this, that just shows as a generic "Couldn't load" error on
 * whichever widget happened to be fetching — this sends the user back to
 * `/login` instead, in one place rather than every `useQuery` call site.
 *
 * `window.location.assign` rather than `next/navigation`'s router: this runs
 * inside `QueryCache`'s `onError`, outside the component tree, where router
 * hooks aren't available. A full navigation also guarantees the RSC tree
 * re-evaluates `requireSession()` on the way back in.
 */
function handleQueryError(error: unknown) {
  if (isApiError(error) && error.isUnauthorized && typeof window !== "undefined") {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
}

/*
  The dashboard is rendered as RSC and needs no client cache; the Product List
  and Add Product screens do. One provider at the root covers both without
  forcing the dashboard into client components.

  The client is created in state rather than at module scope so that a server
  render never shares a cache between two users' requests.
*/
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleQueryError }),
        mutationCache: new MutationCache({ onError: handleQueryError }),
        defaultOptions: {
          queries: {
            // Product data changes only when this admin changes it, so an
            // immediate refetch on every window focus is noise, not freshness.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
