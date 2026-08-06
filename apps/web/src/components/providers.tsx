"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
