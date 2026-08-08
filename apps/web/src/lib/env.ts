import "server-only";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy apps/web/.env.example to apps/web/.env and fill it in.`,
    );
  }
  return value;
}

export const API_URL = required("API_URL", process.env.API_URL).replace(/\/+$/, "");

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "dealport_token";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
