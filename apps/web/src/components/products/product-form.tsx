"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createProductSchema,
  ProductStatus,
  StockStatus,
  type CreateProductInput,
  type CreateProductPayload,
  type Product,
  type ProductImageInput,
} from "@dealport/shared";

import { AiBeautifyIcon, CalendarIcon, EditIcon, SaveIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { ImageUploader } from "./image-uploader";
import { TagSelect } from "./tag-select";

/** The five swatches in the kit's "Select your color" row, sampled at 2x. */
const COLOR_SWATCHES = ["#D7EACB", "#ECD3D6", "#D5DDE0", "#ECE7C9", "#464A4D"];

const STOCK_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

/** `YYYY-MM-DD` for `<input type="date">`, which rejects a full ISO timestamp. */
function toDateInput(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-caption mt-1.5 text-error">{message}</p>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-section mb-4 text-cyprus">{children}</h2>;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(product);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.tags.list(),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput, unknown, CreateProductPayload>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? undefined,
          price: product.price,
          discountedPrice: product.discountedPrice ?? undefined,
          taxIncluded: product.taxIncluded,
          currency: product.currency,
          saleStartsAt: toDateInput(product.saleStartsAt),
          saleEndsAt: toDateInput(product.saleEndsAt),
          stockQuantity: product.stockQuantity ?? undefined,
          unlimitedStock: product.unlimitedStock,
          stockStatus: product.stockStatus,
          status: product.status,
          featured: product.featured,
          colors: product.colors,
          categoryId: product.categoryId ?? undefined,
          tagIds: product.tags.map((tag) => tag.id),
          images: product.images.map((image) => ({
            url: image.url,
            publicId: image.publicId ?? undefined,
            isPrimary: image.isPrimary,
          })),
        }
      : {
          name: "",
          description: "",
          price: "",
          discountedPrice: "",
          taxIncluded: true,
          currency: "USD",
          unlimitedStock: false,
          stockStatus: StockStatus.IN_STOCK,
          status: ProductStatus.DRAFT,
          featured: false,
          colors: [],
          tagIds: [],
          images: [],
        },
  });

  const unlimitedStock = watch("unlimitedStock");
  const price = Number(watch("price"));
  const discountedPrice = Number(watch("discountedPrice"));
  const colors = watch("colors") ?? [];

  // The kit shows `Sale= $900.89` beside the discounted price — the saving,
  // recomputed live. Only meaningful once both values are valid numbers.
  const saleAmount =
    Number.isFinite(price) && Number.isFinite(discountedPrice) && discountedPrice > 0 && price > discountedPrice
      ? (price - discountedPrice).toFixed(2)
      : null;

  const mutation = useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      product
        ? api.products.update(product.id, payload)
        : api.products.create(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        isEdit
          ? "Product updated"
          : saved.status === ProductStatus.PUBLISHED
            ? "Product published"
            : "Saved to draft",
      );
      router.push("/products");
      router.refresh();
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Could not save the product.");
    },
  });

  /*
    "Publish Product" and "Save to draft" are the same submit through the same
    validation — they differ only in the `status` they post (plans/02-API.md §3).
  */
  const submitAs = (status: ProductStatus) =>
    handleSubmit((values) => mutation.mutate({ ...values, status }));

  const pending = isSubmitting || mutation.isPending;

  function toggleColor(color: string) {
    setValue(
      "colors",
      colors.includes(color) ? colors.filter((c) => c !== color) : [...colors, color],
      { shouldDirty: true },
    );
  }

  return (
    <form className="space-y-5" onSubmit={submitAs(ProductStatus.PUBLISHED)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-section text-cyprus">
          {isEdit ? "Edit Product" : "Add New Product"}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={submitAs(ProductStatus.DRAFT)}
          >
            <SaveIcon className="size-5" />
            Save to draft
          </Button>
          <Button type="button" disabled={pending} onClick={submitAs(ProductStatus.PUBLISHED)}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            Publish Product
          </Button>
        </div>
      </div>

      {/*
        Measured off `8 Add Product.png`: left card 612px, 20px gutter, right
        card 486px within the 1118px content width. (The design doc estimated
        62/38; the artwork is 55/45.)
      */}
      <div className="grid gap-5 lg:grid-cols-[612fr_486fr]">
        <div className="space-y-6">
          <Card>
            <SectionHeading>Basic Details</SectionHeading>

            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="mb-2 font-bold text-cyprus">
                  Product Name
                </Label>
                <Input
                  id="name"
                  placeholder="iPhone 15"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div>
                <Label htmlFor="description" className="mb-2 font-bold text-cyprus">
                  Product Description
                </Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    rows={5}
                    className="pb-12"
                    placeholder="Describe the product…"
                    aria-invalid={Boolean(errors.description)}
                    {...register("description")}
                  />
                  {/*
                    Decorative only — the kit draws an edit and an AI-assist
                    glyph here, and the design system documents the AI one as
                    doing nothing. Rendered as inert marks rather than buttons
                    so they read as ornament, not a broken affordance.
                  */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 bottom-3 flex items-center gap-3 text-grey"
                  >
                    <EditIcon className="size-5" />
                    <AiBeautifyIcon className="size-5" />
                  </div>
                </div>
                <FieldError message={errors.description?.message} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading>Pricing</SectionHeading>

            <div className="space-y-5">
              <div>
                <Label htmlFor="price" className="mb-2 font-bold text-cyprus">
                  Product Price
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    inputMode="decimal"
                    placeholder="999.89"
                    className="pr-24"
                    aria-invalid={Boolean(errors.price)}
                    {...register("price")}
                  />
                  {/*
                    USD is the only currency the API models (`currency` defaults
                    to "USD"), so this is a fixed marker rather than a select
                    that offers choices the backend would reject.
                  */}
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base font-bold text-grey">
                    USD
                  </span>
                </div>
                <FieldError message={errors.price?.message} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="discountedPrice" className="mb-2 font-bold text-cyprus">
                    Discounted Price <span className="font-normal text-grey">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-secondary text-base font-bold text-cyprus">
                      $
                    </span>
                    <Input
                      id="discountedPrice"
                      inputMode="decimal"
                      placeholder="99"
                      className={cn("pl-12", saleAmount && "pr-32")}
                      aria-invalid={Boolean(errors.discountedPrice)}
                      {...register("discountedPrice")}
                    />
                    {saleAmount ? (
                      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base font-bold text-cyprus">
                        Sale= ${saleAmount}
                      </span>
                    ) : null}
                  </div>
                  <FieldError message={errors.discountedPrice?.message} />
                </div>

                <div>
                  <Label className="mb-2 font-bold text-cyprus">Tax Included</Label>
                  <Controller
                    control={control}
                    name="taxIncluded"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value ? "yes" : "no"}
                        onValueChange={(value) => field.onChange(value === "yes")}
                        className="gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <RadioGroupItem value="yes" id="tax-yes" />
                          <Label htmlFor="tax-yes" className="text-base">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <RadioGroupItem value="no" id="tax-no" />
                          <Label htmlFor="tax-no" className="text-base">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 font-bold text-cyprus">Expiration</Label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="relative">
                      <Input
                        type="date"
                        aria-label="Sale start date"
                        aria-invalid={Boolean(errors.saleStartsAt)}
                        {...register("saleStartsAt")}
                      />
                      <CalendarIcon className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-grey" />
                    </div>
                    <FieldError message={errors.saleStartsAt?.message} />
                  </div>
                  <div>
                    <div className="relative">
                      <Input
                        type="date"
                        aria-label="Sale end date"
                        aria-invalid={Boolean(errors.saleEndsAt)}
                        {...register("saleEndsAt")}
                      />
                      <CalendarIcon className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-grey" />
                    </div>
                    <FieldError message={errors.saleEndsAt?.message} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading>Inventory</SectionHeading>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="stockQuantity" className="mb-2 font-bold text-cyprus">
                    Stock Quantity
                  </Label>
                  <Input
                    id="stockQuantity"
                    inputMode="numeric"
                    disabled={unlimitedStock}
                    placeholder={unlimitedStock ? "Unlimited" : "50"}
                    aria-invalid={Boolean(errors.stockQuantity)}
                    {...register("stockQuantity")}
                  />
                  <FieldError message={errors.stockQuantity?.message} />
                </div>

                <div>
                  <Label className="mb-2 font-bold text-cyprus">Stock Status</Label>
                  <Controller
                    control={control}
                    name="stockStatus"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <Controller
                control={control}
                name="unlimitedStock"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Switch
                      id="unlimitedStock"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        // Clearing avoids posting a quantity the API would
                        // ignore, and matches the field going disabled.
                        if (checked) setValue("stockQuantity", "", { shouldValidate: true });
                      }}
                    />
                    <Label htmlFor="unlimitedStock" className="text-base">
                      Unlimited
                    </Label>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-base text-grey">
                      Highlight this product in a featured section.
                    </span>
                  </label>
                )}
              />

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={submitAs(ProductStatus.DRAFT)}
                >
                  <SaveIcon className="size-5" />
                  Save to draft
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={submitAs(ProductStatus.PUBLISHED)}
                >
                  {pending ? <Loader2Icon className="animate-spin" /> : null}
                  Publish Product
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeading>Upload Product Image</SectionHeading>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader
                  images={(field.value ?? []) as ProductImageInput[]}
                  onChange={field.onChange}
                />
              )}
            />
          </Card>

          <Card>
            <SectionHeading>Categories</SectionHeading>

            <div className="space-y-5">
              <div>
                <Label className="mb-2 font-bold text-cyprus">Product Categories</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your product" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categoriesQuery.data?.data ?? []).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.categoryId?.message} />
              </div>

              <div>
                <Label className="mb-2 font-bold text-cyprus">Product Tag</Label>
                <Controller
                  control={control}
                  name="tagIds"
                  render={({ field }) => (
                    <TagSelect
                      tags={tagsQuery.data?.data ?? []}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div>
                <Label className="mb-2 font-bold text-cyprus">Select your color</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {COLOR_SWATCHES.map((color) => {
                    const active = colors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Colour ${color}`}
                        aria-pressed={active}
                        onClick={() => toggleColor(color)}
                        style={{ backgroundColor: color }}
                        className={cn(
                          "size-12 rounded-lg border-2 transition-all",
                          active
                            ? "border-primary ring-3 ring-ring/25"
                            : "border-transparent hover:border-hairline",
                        )}
                      />
                    );
                  })}
                </div>
                <FieldError message={errors.colors?.message} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
