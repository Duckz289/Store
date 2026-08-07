import { HttpTypes } from "@medusajs/types"

export const getProductImage = (product?: HttpTypes.StoreProduct) =>
  product?.thumbnail || product?.images?.[0]?.url
