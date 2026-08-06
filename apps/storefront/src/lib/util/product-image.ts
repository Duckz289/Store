import { HttpTypes } from "@medusajs/types"

const localProductImages: Record<string, string> = {
  "router-wifi-6-ax1800": "/images/products/router-wifi-6-ax1800.webp",
  "dien-thoai-nova-x1": "/images/products/dien-thoai-nova-x1.webp",
  "sac-nhanh-usb-c-65w": "/images/products/sac-nhanh-usb-c-65w.webp",
  "laptop-workpro-14": "/images/products/laptop-workpro-14.webp",
}

export const getProductImage = (product?: HttpTypes.StoreProduct) =>
  product?.thumbnail ||
  product?.images?.[0]?.url ||
  (product?.handle ? localProductImages[product.handle] : undefined)
