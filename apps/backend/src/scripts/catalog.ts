import { MedusaError } from "@medusajs/framework/utils"

const vnd = (value: string) => Number(value)

export const CATALOG_PRODUCT_TYPES = [
  "Laptop",
  "Phụ kiện",
  "Thiết bị mạng",
  "Đồ gia dụng",
  "Điện lạnh",
  "Thiết bị điện",
  "Âm thanh & TV",
] as const

type CatalogCategorySeed = {
  name: string
  handle: string
  rank: number
  parent?: string
}

export const CATALOG_CATEGORIES: CatalogCategorySeed[] = [
  { name: "Laptop", handle: "laptop", rank: 0 },
  { name: "Phụ kiện", handle: "phụ-kiện", rank: 1 },
  { name: "Thiết bị mạng", handle: "thiết-bị-mạng", rank: 2 },
  { name: "Đồ gia dụng", handle: "do-gia-dung", rank: 3 },
  { name: "Điện lạnh", handle: "dien-lanh", rank: 4 },
  { name: "Thiết bị điện", handle: "thiet-bi-dien", rank: 5 },
  { name: "Âm thanh & TV", handle: "am-thanh-tv", rank: 6 },
  { name: "Sạc và cáp", handle: "sac-va-cap", rank: 0, parent: "Phụ kiện" },
  { name: "Tai nghe", handle: "tai-nghe", rank: 1, parent: "Phụ kiện" },
  { name: "Router Wi-Fi", handle: "router-wifi", rank: 0, parent: "Thiết bị mạng" },
  { name: "Switch và bộ chia mạng", handle: "switch-bo-chia-mang", rank: 1, parent: "Thiết bị mạng" },
  { name: "Camera", handle: "camera", rank: 2, parent: "Thiết bị mạng" },
  { name: "Nồi cơm điện", handle: "noi-com-dien", rank: 0, parent: "Đồ gia dụng" },
  { name: "Bếp điện và bếp từ", handle: "bep-dien-bep-tu", rank: 1, parent: "Đồ gia dụng" },
  { name: "Quạt điện", handle: "quat-dien", rank: 2, parent: "Đồ gia dụng" },
  { name: "Ấm siêu tốc", handle: "am-sieu-toc", rank: 3, parent: "Đồ gia dụng" },
  { name: "Máy xay và máy ép", handle: "may-xay-may-ep", rank: 4, parent: "Đồ gia dụng" },
  { name: "Lò vi sóng và lò nướng", handle: "lo-vi-song-lo-nuong", rank: 5, parent: "Đồ gia dụng" },
  { name: "Bàn ủi và chăm sóc quần áo", handle: "ban-ui-cham-soc-quan-ao", rank: 6, parent: "Đồ gia dụng" },
  { name: "Máy hút bụi và vệ sinh", handle: "may-hut-bui-ve-sinh", rank: 7, parent: "Đồ gia dụng" },
  { name: "Tủ lạnh", handle: "tu-lanh", rank: 0, parent: "Điện lạnh" },
  { name: "Máy giặt và máy sấy", handle: "may-giat-may-say", rank: 1, parent: "Điện lạnh" },
  { name: "Máy lạnh", handle: "may-lanh", rank: 2, parent: "Điện lạnh" },
  { name: "Tủ đông và tủ mát", handle: "tu-dong-tu-mat", rank: 3, parent: "Điện lạnh" },
  { name: "Ổ cắm và dây điện", handle: "o-cam-day-dien", rank: 0, parent: "Thiết bị điện" },
  { name: "Đèn và chiếu sáng", handle: "den-chieu-sang", rank: 1, parent: "Thiết bị điện" },
  { name: "Quạt thông gió", handle: "quat-thong-gio", rank: 2, parent: "Thiết bị điện" },
  { name: "Máy bơm nước", handle: "may-bom-nuoc", rank: 3, parent: "Thiết bị điện" },
  { name: "TV", handle: "tv", rank: 0, parent: "Âm thanh & TV" },
  { name: "Loa", handle: "loa", rank: 1, parent: "Âm thanh & TV" },
  { name: "Thiết bị âm thanh", handle: "thiet-bi-am-thanh", rank: 2, parent: "Âm thanh & TV" },
]

export const CATALOG_COLLECTIONS = [
  { title: "Flash Deal", handle: "flash-deal" },
  { title: "Hàng mới", handle: "hang-moi" },
  { title: "Ưu đãi nổi bật", handle: "uu-dai-noi-bat" },
] as const

export const CATALOG_BRANDS = [
  { name: "WorkPro", handle: "workpro" },
  { name: "Hưng Phát", handle: "hung-phat" },
  { name: "NetWave", handle: "netwave" },
  { name: "Samsung", handle: "samsung" },
  { name: "Panasonic", handle: "panasonic" },
  { name: "Toshiba", handle: "toshiba" },
  { name: "Sharp", handle: "sharp" },
  { name: "Philips", handle: "philips" },
  { name: "Electrolux", handle: "electrolux" },
  { name: "Sunhouse", handle: "sunhouse" },
  { name: "Kangaroo", handle: "kangaroo" },
  { name: "Aqua", handle: "aqua" },
  { name: "LG", handle: "lg" },
  { name: "Casper", handle: "casper" },
  { name: "Midea", handle: "midea" },
  { name: "Bosch", handle: "bosch" },
] as const

const CATALOG_PRODUCT_FIXTURES = [
  {
    title: "Điện thoại Nova X1",
    handle: "dien-thoai-nova-x1",
    description:
      "Điện thoại 5G màn hình OLED, pin dung lượng lớn và bảo hành 12 tháng.",
    category: "Điện thoại",
    type: "Điện thoại",
    brand: "nova",
    model: "Nova X1",
    image: "dien-thoai-nova-x1.webp",
    specifications: [
      { key: "chipset", label: "Chipset", value: "5G Octa-core", position: 0 },
      { key: "ram", label: "RAM", value: "6 GB / 8 GB", position: 1 },
      { key: "storage", label: "Bộ nhớ", value: "128 GB / 256 GB", position: 2 },
      { key: "display", label: "Màn hình", value: "OLED", position: 3 },
      { key: "battery", label: "Pin", value: "Dung lượng lớn", position: 4 },
    ],
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
    brand: "workpro",
    model: "WorkPro 14",
    image: "laptop-workpro-14.webp",
    specifications: [
      { key: "cpu", label: "CPU", value: "Bộ xử lý hiệu năng cao", position: 0 },
      { key: "ram", label: "RAM", value: "16 GB / 32 GB", position: 1 },
      { key: "ssd", label: "SSD", value: "512 GB / 1 TB", position: 2 },
      { key: "display_size", label: "Kích thước màn hình", value: "14", unit: "inch", position: 3 },
    ],
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
    brand: "hung-phat",
    model: "HP-C65",
    image: "sac-nhanh-usb-c-65w.webp",
    specifications: [
      { key: "connector", label: "Cổng kết nối", value: "USB-C", position: 0 },
      { key: "power", label: "Công suất", value: "65", unit: "W", position: 1 },
      { key: "compatibility", label: "Tương thích", value: "Điện thoại và laptop USB-C PD", position: 2 },
    ],
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
    brand: "netwave",
    model: "AX1800",
    image: "router-wifi-6-ax1800.webp",
    specifications: [
      { key: "wifi_standard", label: "Chuẩn Wi-Fi", value: "Wi-Fi 6", position: 0 },
      { key: "speed_class", label: "Cấp tốc độ", value: "AX1800", position: 1 },
      { key: "bands", label: "Băng tần", value: "2.4 GHz / 5 GHz", position: 2 },
    ],
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

export const CATALOG_PRODUCTS = CATALOG_PRODUCT_FIXTURES.filter(
  (product) => product.handle !== "dien-thoai-nova-x1"
)

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
