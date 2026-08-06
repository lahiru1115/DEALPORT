/**
 * The API contract, declared once and imported by both apps.
 *
 * The brief (§7) asks for a typed API client. Hand-copying interfaces into the
 * frontend produces types that drift from the API silently; declaring them here
 * makes drift a compile error instead — see plans/01-ARCHITECTURE.md §2.
 *
 * Everything in this package mirrors plans/02-API.md. Nothing here imports from
 * either app, so it stays buildable on its own.
 */

export * from "./enums";
export * from "./common";
export * from "./auth";
export * from "./taxonomy";
export * from "./product";
export * from "./dashboard";
export * from "./upload";
