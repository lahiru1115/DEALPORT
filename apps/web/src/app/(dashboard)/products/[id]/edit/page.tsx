import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductForm } from "@/components/products/product-form";
import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Edit Product",
};

/**
 * Fetched on the server so the form renders already populated — no empty
 * fields flashing while a client query resolves.
 */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const product = await serverApi.products.get(id);
    return <ProductForm product={product} />;
  } catch (error) {
    if (isApiError(error) && error.isNotFound) notFound();
    throw error;
  }
}
