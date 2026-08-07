import { MedusaError } from "@medusajs/framework/utils"

const vnd = (value: string) => Number(value)

export const CATALOG_PRODUCT_TYPES = [
  "Điện thoại",
  "Laptop",
  "Phụ kiện",
  "Thiết bị mạng",
] as const

export const CATALOG_CATEGORIES = [
  { name: "Điện thoại", handle: "điện-thoại", rank: 0 },
  { name: "Laptop", handle: "laptop", rank: 1 },
  { name: "Phụ kiện", handle: "phụ-kiện", rank: 2 },
  { name: "Thiết bị mạng", handle: "thiết-bị-mạng", rank: 3 },
] as const

export const CATALOG_COLLECTIONS = [
  { title: "Flash Deal", handle: "flash-deal" },
  { title: "Hàng mới", handle: "hang-moi" },
  { title: "Ưu đãi nổi bật", handle: "uu-dai-noi-bat" },
] as const

export const CATALOG_PRODUCTS = [
  {
    title: "Điện thoại Nova X1",
    handle: "dien-thoai-nova-x1",
    description:
      "Điện thoại 5G màn hình OLED, pin dung lượng lớn và bảo hành 12 tháng.",
    category: "Điện thoại",
    type: "Điện thoại",
    options: {
      title: "Cấu hình điện thoại",
      values: ["6 GB / 128 GB", "8 GB / 256 GB"],
    },
    variants: [
      {
        title: "6 GB / 128 GB",
        sku: "HP-NOVA-X1-6-128",
        option: "6 GB / 128 GB",
        price: vnd("6990000"),
      },
      {
        title: "8 GB / 256 GB",
        sku: "HP-NOVA-X1-8-256",
        option: "8 GB / 256 GB",
        price: vnd("7990000"),
      },
    ],
  },
  {
    title: "Laptop WorkPro 14",
    handle: "laptop-workpro-14",
    description:
      "Laptop 14 inch dành cho công việc, vỏ kim loại và bảo hành 24 tháng.",
    category: "Laptop",
    type: "Laptop",
    options: {
      title: "Cấu hình laptop",
      values: ["16 GB / 512 GB", "32 GB / 1 TB"],
    },
    variants: [
      {
        title: "16 GB / 512 GB",
        sku: "HP-WORKPRO14-16-512",
        option: "16 GB / 512 GB",
        price: vnd("18990000"),
      },
      {
        title: "32 GB / 1 TB",
        sku: "HP-WORKPRO14-32-1TB",
        option: "32 GB / 1 TB",
        price: vnd("22990000"),
      },
    ],
  },
  {
    title: "Sạc nhanh USB-C 65 W",
    handle: "sac-nhanh-usb-c-65w",
    description:
      "Củ sạc USB-C Power Delivery nhỏ gọn, phù hợp điện thoại và laptop.",
    category: "Phụ kiện",
    type: "Phụ kiện",
    options: {
      title: "Công suất",
      values: ["65 W"],
    },
    variants: [
      {
        title: "65 W",
        sku: "HP-CHARGER-USBC-65W",
        option: "65 W",
        price: vnd("690000"),
      },
    ],
  },
  {
    title: "Router Wi-Fi 6 AX1800",
    handle: "router-wifi-6-ax1800",
    description:
      "Router Wi-Fi 6 băng tần kép cho gia đình và văn phòng nhỏ.",
    category: "Thiết bị mạng",
    type: "Thiết bị mạng",
    options: {
      title: "Chuẩn Wi-Fi",
      values: ["Wi-Fi 6 AX1800"],
    },
    variants: [
      {
        title: "Wi-Fi 6 AX1800",
        sku: "HP-ROUTER-AX1800",
        option: "Wi-Fi 6 AX1800",
        price: vnd("1290000"),
      },
    ],
  },
] as const

export const COLLECTION_PRODUCT_HANDLES: Record<string, string[]> = {
  "flash-deal": CATALOG_PRODUCTS.map((product) => product.handle),
  "hang-moi": [],
  "uu-dai-noi-bat": [],
}

export const SKU_CONVENTION =
  "Use a stable uppercase SKU: BRAND-PRODUCT-VARIANT, with hyphens and no spaces. Preserve an existing valid SKU when a product or variant is migrated."

export function assertUniqueCatalogSkus() {
  const seen = new Map<string, string>()

  for (const product of CATALOG_PRODUCTS) {
    for (const variant of product.variants) {
      const sku = variant.sku.trim()
      const previousProduct = seen.get(sku)

      if (!sku) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Catalog seed conflict: variant ${product.handle}/${variant.title} has an empty SKU.`
        )
      }

      if (previousProduct) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Catalog seed conflict: SKU ${sku} is used by ${previousProduct} and ${product.handle}/${variant.title}.`
        )
      }

      seen.set(sku, `${product.handle}/${variant.title}`)
    }
  }
}
