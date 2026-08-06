import { z } from "zod";

import type { Role } from "./enums";

/**
 * `POST /auth/login` — see plans/02-API.md §2.
 *
 * The 8-character minimum mirrors the API's `@MinLength(8)`. Matching it here
 * means the login form rejects a too-short password inline instead of round
 * tripping to a 400 the user cannot act on.
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** The user object returned by both `POST /auth/login` and `GET /auth/me`. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
