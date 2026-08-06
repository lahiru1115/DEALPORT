/**
 * `GET /categories` and `GET /tags` — see plans/02-API.md §4.
 *
 * Both carry `productCount`, derived from Prisma's `_count`. That is what lets
 * the Product List render its per-category counts and the dashboard's "Add New
 * Product" panel show category sizes without a second round trip.
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

/** Same shape minus `imageUrl` — tags have no artwork in the design. */
export interface Tag {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}
