"use server"

import { sdk } from "@lib/config"
import type { CatalogProduct } from "types/catalog"

export const retrieveProductPreview = async ({
  id,
  token,
}: {
  id: string
  token: string
}) =>
  sdk.client.fetch<{ product: CatalogProduct }>(
    `/store/catalog/products/${id}/preview`,
    {
      method: "GET",
      query: { token },
      cache: "no-store",
    }
  )
