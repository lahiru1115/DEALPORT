import { z } from "zod";

import { ProductStatus, StockStatus } from "./enums";

/* ------------------------------------------------------------------ *
 * Response shapes — plans/02-API.md §3
 * ------------------------------------------------------------------ */

/**
 * Money arrives as a **string**, not a number.
 *
 * The API stores prices as `Decimal(10,2)` and serialises them with a fixed two
 * decimal places ("999.00"), because JSON numbers cannot represent every decimal
 * exactly and `$999.89` rendering as `999.8899999` on a review screen is an
 * avoidable embarrassment. Formatting for display is the client's job.
 */
export type MoneyString = string;

/** ISO-8601 timestamp, as serialised by the API. */
export type IsoDateString = string;

export interface ProductImage {
  id: string;
  url: string;
  publicId: string | null;
  position: number;
  isPrimary: boolean;
  productId: string;
  createdAt: IsoDateString;
}

/**
 * The category as embedded in a product. Deliberately *not* the `Category` from
 * `taxonomy.ts`: that one carries `productCount`, which the embedded relation
 * does not include. Sharing one type would make `productCount` look available
 * on a product's category when it is always undefined.
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Full product, as returned by list, detail, create and update. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;

  price: MoneyString;
  discountedPrice: MoneyString | null;
  taxIncluded: boolean;
  currency: string;

  saleStartsAt: IsoDateString | null;
  saleEndsAt: IsoDateString | null;

  stockQuantity: number | null;
  unlimitedStock: boolean;
  stockStatus: StockStatus;

  status: ProductStatus;
  featured: boolean;

  colors: string[];
  totalOrders: number;

  categoryId: string | null;
  createdById: string | null;

  category: ProductCategory | null;
  tags: ProductTag[];
  images: ProductImage[];

  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * The trimmed shape behind `GET /products/top` and `GET /products/best-selling`
 * — the two dashboard widgets the brief requires to be API-driven. `images` is
 * capped at one by the API's select, but stays an array so the shape matches
 * `Product.images`.
 */
export interface WidgetProduct {
  id: string;
  name: string;
  sku: string;
  price: MoneyString;
  totalOrders: number;
  stockStatus: StockStatus;
  images: ProductImage[];
}

/* ------------------------------------------------------------------ *
 * Query params — plans/02-API.md §3
 * ------------------------------------------------------------------ */

export const PRODUCT_SORT_FIELDS = [
  "createdAt",
  "name",
  "price",
  "totalOrders",
] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
}

/* ------------------------------------------------------------------ *
 * Write schema — the contract the Add Product form validates against
 * ------------------------------------------------------------------ */

/**
 * Normalises whatever a form hands in into a number, `undefined`, or the
 * original value.
 *
 * Three inputs all mean "the user left this blank" and must become `undefined`
 * rather than `0` — otherwise an untouched optional price silently posts as
 * free, and a blank *required* price reports "must be at least 0" instead of
 * "required":
 *   - `""`            a plain text input
 *   - `null`          a cleared controlled field
 *   - `NaN`           react-hook-form's `valueAsNumber` on an empty input
 *
 * A non-numeric string is returned **unchanged** so the schema rejects it with
 * "Enter a valid price" rather than the generic NaN message.
 *
 * `z.coerce.number()` is deliberately not used: it maps `""` and `null` to `0`,
 * which is precisely the bug this avoids.
 */
const toNumeric = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

/** Blank-to-`undefined` for non-numeric optional fields (dates). */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

/** The API validates `price` with `@IsNumber({ maxDecimalPlaces: 2 })`. */
const hasAtMostTwoDecimals = (value: number) =>
  /^-?\d+(\.\d{1,2})?$/.test(String(value));

/**
 * Required, unlike `optionalPriceField` below — deliberately built without
 * `z.number({ required_error })`. A required primitive that gets `undefined`
 * fails with Zod's own "invalid_type" issue, which — unlike a `.refine()`
 * issue — marks the whole object schema *aborted* rather than merely
 * *dirty*. `createProductSchema` adds its cross-field issues (the stock
 * quantity rule below, the discount/sale-window rules) via `.superRefine()`,
 * and Zod skips a `superRefine` entirely once the schema it's chained onto
 * has aborted — so a blank price silently swallowed the stock quantity
 * error until price was fixed first. Keeping this field's own "required"
 * check soft (a `.superRefine()` issue, same mechanism as the stock
 * quantity rule) keeps the object merely dirty, so every top-level issue
 * surfaces together on the very first submit.
 */
const priceField = z
  .preprocess(toNumeric, z.union([z.number(), z.string()]).optional())
  .superRefine((value, ctx) => {
    if (value === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Product price is required" });
      return;
    }
    if (typeof value === "string") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid price" });
      return;
    }
    if (value < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price cannot be negative" });
      return;
    }
    if (!hasAtMostTwoDecimals(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use at most 2 decimal places" });
    }
  });

const optionalPriceField = z.preprocess(
  toNumeric,
  z
    .number({ invalid_type_error: "Enter a valid price" })
    .min(0, "Price cannot be negative")
    .refine(hasAtMostTwoDecimals, "Use at most 2 decimal places")
    .optional(),
);

const optionalQuantityField = z.preprocess(
  toNumeric,
  z
    .number({ invalid_type_error: "Enter a whole number" })
    .int("Enter a whole number")
    .min(0, "Quantity cannot be negative")
    .optional(),
);

/** Matches class-validator's `@IsHexColor()`: #rgb, #rgba, #rrggbb, #rrggbbaa. */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid colour");

/**
 * A date the API will accept for `@IsISO8601()`. `<input type="date">` produces
 * `YYYY-MM-DD`, which is valid ISO-8601 and which the API's `new Date(...)`
 * parses correctly, so it is passed through unchanged rather than widened to a
 * full timestamp the user never chose.
 */
const isoDateField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
);

export const productImageSchema = z.object({
  url: z.string().url("Image URL is invalid"),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;

const productBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(160, "Product name must be 160 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or fewer")
    .optional(),

  price: priceField,
  discountedPrice: optionalPriceField,
  taxIncluded: z.boolean().default(true),
  currency: z.string().default("USD"),

  saleStartsAt: isoDateField,
  saleEndsAt: isoDateField,

  stockQuantity: optionalQuantityField,
  unlimitedStock: z.boolean().default(false),
  stockStatus: z.nativeEnum(StockStatus).default(StockStatus.IN_STOCK),

  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  featured: z.boolean().default(false),

  colors: z.array(hexColor).default([]),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  images: z.array(productImageSchema).default([]),
});

type ProductFields = Partial<z.infer<typeof productBaseSchema>>;

/**
 * The cross-field rules the API enforces in `ProductsService` rather than with
 * decorators. They are re-stated here so the form surfaces them inline on the
 * offending field, instead of the user discovering them as a 400 after pressing
 * Publish. Each issue carries a `path` so `react-hook-form` renders it under
 * the right input.
 *
 * Both rules tolerate absent fields, mirroring the API's own guards: a patch
 * that sends only `discountedPrice` cannot be checked against a `price` it did
 * not send. The `typeof` check similarly skips a `price` that failed its own
 * "enter a valid price" check — `priceField`'s `superRefine` already flagged
 * it, so this comparison isn't the right place to say more about it.
 */
const addPriceAndSaleWindowIssues = (data: ProductFields, ctx: z.RefinementCtx) => {
  if (
    data.discountedPrice !== undefined &&
    typeof data.price === "number" &&
    data.discountedPrice >= data.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountedPrice"],
      message: "Discounted price must be less than the price",
    });
  }

  if (
    data.saleStartsAt &&
    data.saleEndsAt &&
    Date.parse(data.saleEndsAt) <= Date.parse(data.saleStartsAt)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["saleEndsAt"],
      message: "End date must be after the start date",
    });
  }
};

/** `POST /products` */
export const createProductSchema = productBaseSchema
  .superRefine((data, ctx) => {
    addPriceAndSaleWindowIssues(data, ctx);

    /*
      Create-only, and deliberately not shared with the update schema.
      `ProductsService.create()` asserts this; `ProductsService.update()` does
      not — a PATCH that touches only the name must not be rejected for omitting
      a stock quantity the product already has.
    */
    if (!data.unlimitedStock && data.stockQuantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stockQuantity"],
        message: "Stock quantity is required unless stock is unlimited",
      });
    }
  })
  /*
    Narrows `price` back to a plain `number` for consumers. `priceField`'s own
    type is deliberately wider (see the comment there) so its "required" check
    can't abort the object before the `superRefine` above runs — by the time a
    parse reaches this transform without issues, `price` is guaranteed numeric.
  */
  .transform((data) => ({ ...data, price: data.price as number }));

/**
 * `PATCH /products/:id`. Every field optional, same constraints — the mirror of
 * the API's `UpdateProductDto extends PartialType(CreateProductDto)`, including
 * the fact that it does *not* re-check the stock rule.
 */
export const updateProductSchema = productBaseSchema
  .partial()
  .superRefine(addPriceAndSaleWindowIssues)
  .transform((data) => ({ ...data, price: data.price as number | undefined }));

/** Input *before* defaults are applied — what a form is allowed to hand in. */
export type CreateProductInput = z.input<typeof createProductSchema>;
/** Output *after* defaults and coercion — the exact JSON body the API receives. */
export type CreateProductPayload = z.output<typeof createProductSchema>;

export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type UpdateProductPayload = z.output<typeof updateProductSchema>;
