import { redirect } from "next/navigation";

/*
  There is no marketing surface in scope — the root exists only to hand off to
  the app. `middleware.ts` decides where an unauthenticated visitor actually
  lands, so this redirects to the dashboard unconditionally and lets the guard
  bounce it to `/login` when there is no session.
*/
export default function RootPage() {
  redirect("/dashboard");
}
