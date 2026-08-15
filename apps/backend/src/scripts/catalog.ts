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
  { name: "Phụ kiện", handle: "phu-kien", rank: 1 },
  { name: "Thiết bị mạng", handle: "thiet-bi-mang", rank: 2 },
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

// Two categories were seeded with percent-encoded Vietnamese handles. Storefront
// URLs read badly that way, so the seed renames them in place, matched by name.
export const CATALOG_CATEGORY_HANDLE_FIXES: { name: string; from: string; to: string }[] = [
  { name: "Phụ kiện", from: "phụ-kiện", to: "phu-kien" },
  { name: "Thiết bị mạng", from: "thiết-bị-mạng", to: "thiet-bi-mang" },
]

export const CATALOG_COLLECTIONS = [
  { title: "Flash Deal", handle: "flash-deal" },
  { title: "Hàng mới", handle: "hang-moi" },
  { title: "Ưu đãi nổi bật", handle: "uu-dai-noi-bat" },
] as const

export type CatalogBrandKind = "manufacturer" | "store_label" | "unspecified"

type CatalogBrandSeed = {
  name: string
  handle: string
  kind: CatalogBrandKind
  // File under apps/storefront/public/images/brands, uploaded via the Medusa File
  // Module on seed. Brands without a real logo stay logo-less on purpose.
  logo?: string
  logoAlt?: string
}

export const CATALOG_BRANDS: CatalogBrandSeed[] = [
  brand("Samsung", "samsung", "samsung.svg"),
  brand("LG", "lg", "lg.svg"),
  brand("Panasonic", "panasonic", "panasonic.svg"),
  brand("Toshiba", "toshiba", "toshiba.svg"),
  brand("Sharp", "sharp", "sharp.svg"),
  brand("Philips", "philips", "philips.svg"),
  brand("Electrolux", "electrolux", "electrolux.svg"),
  brand("Aqua", "aqua", "aqua.svg"),
  brand("Midea", "midea", "midea.svg"),
  brand("Bosch", "bosch", "bosch.svg"),
  brand("Hitachi", "hitachi", "hitachi.svg"),
  brand("Sony", "sony", "sony.svg"),
  brand("Asus", "asus", "asus.svg"),
  brand("Acer", "acer", "acer.svg"),
  brand("Lenovo", "lenovo", "lenovo.svg"),
  brand("Dell", "dell", "dell.svg"),
  brand("HP", "hp", "hp.svg"),
  brand("TP-Link", "tp-link", "tp-link.svg"),
  brand("Xiaomi", "xiaomi", "xiaomi.svg"),
  brand("Logitech", "logitech", "logitech.svg"),
  // Vietnamese brands the shop stocks. No freely licensed logo was available, so
  // they ship without one; Admin flags them and the logo rows skip them.
  brand("Sunhouse", "sunhouse"),
  brand("Kangaroo", "kangaroo"),
  brand("Casper", "casper"),
  {
    name: "Phụ kiện Hưng Phát",
    handle: "hung-phat",
    kind: "store_label",
  },
  {
    name: "Không rõ thương hiệu",
    handle: "khong-ro-thuong-hieu",
    kind: "unspecified",
  },
]

function brand(name: string, handle: string, logo?: string): CatalogBrandSeed {
  return {
    name,
    handle,
    kind: "manufacturer",
    logo,
    logoAlt: logo ? `Logo ${name}` : undefined,
  }
}

// "Hưng Phát" was seeded as if it were a manufacturer. It is the shop's own name, so
// the row is renamed to read as a store label instead of a hardware maker.
export const CATALOG_BRAND_RENAMES: {
  handle: string
  from: string
  to: string
  kind: CatalogBrandKind
}[] = [
  {
    handle: "hung-phat",
    from: "Hưng Phát",
    to: "Phụ kiện Hưng Phát",
    kind: "store_label",
  },
]

// Fabricated brands from the starter fixture. They are not real manufacturers and
// are retired (products unpublished, brand rows removed once unreferenced).
export const RETIRED_DEMO_BRAND_HANDLES = ["workpro", "netwave", "chargepro", "nova"]

export const RETIRED_DEMO_PRODUCT_HANDLES = [
  "laptop-workpro-14",
  "router-wifi-6-ax1800",
]

export const DEMO_FIXTURE_NOTE =
  "Dữ liệu mẫu do seed tạo. Giá và tồn kho là số tham khảo, cần nhân viên xác nhận theo hàng thực tế trước khi bán."

type CatalogSpecSeed = {
  key: string
  label: string
  value: string
  unit?: string
  group?: string
  filterable?: boolean
  featured?: boolean
  multi?: boolean
}

type CatalogProductSeed = {
  title: string
  handle: string
  description: string
  category: string
  type: (typeof CATALOG_PRODUCT_TYPES)[number]
  brand: string
  model: string
  weight: number
  image?: string
  dataSource?: "real" | "demo_fixture"
  specifications: CatalogSpecSeed[]
  options: { title: string; values: string[] }
  variants: { title: string; sku: string; option: string; price: number }[]
}

const purpose = (value: string): CatalogSpecSeed => ({
  key: "purpose",
  label: "Nhu cầu sử dụng",
  value,
  group: "Nhu cầu sử dụng",
  filterable: true,
  featured: true,
  multi: true,
})

const warranty = (months: string): CatalogSpecSeed => ({
  key: "warranty",
  label: "Bảo hành",
  value: months,
  unit: "tháng",
  group: "Bảo hành",
  filterable: false,
})

/** Single-variant product: one option value, one SKU, one price. */
function simple(
  seed: Omit<CatalogProductSeed, "options" | "variants"> & {
    optionTitle: string
    optionValue: string
    sku: string
    price: string
  }
): CatalogProductSeed {
  const { optionTitle, optionValue, sku, price, ...rest } = seed
  return {
    ...rest,
    options: { title: optionTitle, values: [optionValue] },
    variants: [{ title: optionValue, sku, option: optionValue, price: vnd(price) }],
  }
}

const LAPTOPS: CatalogProductSeed[] = [
  simple({
    title: "Laptop Asus Vivobook 15 X1504VA",
    handle: "laptop-asus-vivobook-15-x1504va",
    description:
      "Laptop 15.6 inch cho công việc văn phòng và học tập, bàn phím số đầy đủ, máy mỏng nhẹ dễ mang theo.",
    category: "Laptop",
    type: "Laptop",
    brand: "asus",
    model: "Vivobook 15 X1504VA",
    weight: 1700,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i5-1335U", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "16", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "Intel Iris Xe", group: "Cấu hình" },
      purpose("Văn phòng, Học tập, Mỏng nhẹ"),
      warranty("24"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "16 GB / 512 GB",
    sku: "ASUS-VIVOBOOK15-X1504VA-16-512",
    price: "13990000",
  }),
  simple({
    title: "Laptop Acer Aspire 5 A515-58",
    handle: "laptop-acer-aspire-5-a515-58",
    description:
      "Laptop phổ thông 15.6 inch, hiệu năng ổn định cho học tập và các tác vụ văn phòng hằng ngày.",
    category: "Laptop",
    type: "Laptop",
    brand: "acer",
    model: "Aspire 5 A515-58",
    weight: 1800,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i5-13420H", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "16", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "Intel UHD Graphics", group: "Cấu hình" },
      purpose("Văn phòng, Học tập"),
      warranty("12"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "16 GB / 512 GB",
    sku: "ACER-ASPIRE5-A51558-16-512",
    price: "14490000",
  }),
  simple({
    title: "Laptop Lenovo IdeaPad Slim 3 15IRH8",
    handle: "laptop-lenovo-ideapad-slim-3-15irh8",
    description:
      "Máy mỏng nhẹ, pin dùng cả buổi, phù hợp sinh viên và nhân viên văn phòng di chuyển nhiều.",
    category: "Laptop",
    type: "Laptop",
    brand: "lenovo",
    model: "IdeaPad Slim 3 15IRH8",
    weight: 1620,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i5-13420H", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "8", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "Intel UHD Graphics", group: "Cấu hình" },
      purpose("Học tập, Mỏng nhẹ"),
      warranty("24"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "8 GB / 512 GB",
    sku: "LENOVO-IDEAPADSLIM3-15IRH8-8-512",
    price: "12990000",
  }),
  simple({
    title: "Laptop Dell Inspiron 15 3530",
    handle: "laptop-dell-inspiron-15-3530",
    description:
      "Laptop văn phòng bền bỉ, đầy đủ cổng kết nối, phù hợp doanh nghiệp nhỏ và hộ kinh doanh.",
    category: "Laptop",
    type: "Laptop",
    brand: "dell",
    model: "Inspiron 15 3530",
    weight: 1860,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i5-1334U", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "16", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "Intel Iris Xe", group: "Cấu hình" },
      purpose("Văn phòng"),
      warranty("12"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "16 GB / 512 GB",
    sku: "DELL-INSPIRON15-3530-16-512",
    price: "16490000",
  }),
  simple({
    title: "Laptop HP Pavilion 15-eg3097TU",
    handle: "laptop-hp-pavilion-15-eg3097tu",
    description:
      "Máy 15.6 inch cân đối giữa hiệu năng và giá, dùng tốt cho văn phòng và học online.",
    category: "Laptop",
    type: "Laptop",
    brand: "hp",
    model: "Pavilion 15-eg3097TU",
    weight: 1750,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i5-1335U", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "16", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "Intel Iris Xe", group: "Cấu hình" },
      purpose("Văn phòng, Học tập"),
      warranty("12"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "16 GB / 512 GB",
    sku: "HP-PAVILION15-EG3097TU-16-512",
    price: "17990000",
  }),
  simple({
    title: "Laptop Asus TUF Gaming F15 FX507",
    handle: "laptop-asus-tuf-gaming-f15-fx507",
    description:
      "Laptop gaming màn hình 144 Hz, card rời RTX, tản nhiệt tốt cho chơi game và dựng đồ họa.",
    category: "Laptop",
    type: "Laptop",
    brand: "asus",
    model: "TUF Gaming F15 FX507",
    weight: 2200,
    specifications: [
      { key: "cpu", label: "CPU", value: "Intel Core i7-13620H", group: "Cấu hình", featured: true },
      { key: "ram", label: "RAM", value: "16", unit: "GB", group: "Cấu hình", featured: true },
      { key: "storage", label: "Ổ cứng", value: "512", unit: "GB SSD", group: "Cấu hình", featured: true },
      { key: "screen_size", label: "Màn hình", value: "15.6", unit: "inch", group: "Màn hình" },
      { key: "graphics", label: "Card đồ họa", value: "NVIDIA RTX 4050", group: "Cấu hình", featured: true },
      purpose("Gaming, Đồ họa"),
      warranty("24"),
    ],
    optionTitle: "Cấu hình",
    optionValue: "16 GB / 512 GB / RTX 4050",
    sku: "ASUS-TUFF15-FX507-16-512-RTX4050",
    price: "24990000",
  }),
]

const ACCESSORIES: CatalogProductSeed[] = [
  {
    title: "Sạc nhanh USB-C 65 W",
    handle: "sac-nhanh-usb-c-65w",
    description:
      "Củ sạc USB-C Power Delivery nhỏ gọn, phù hợp điện thoại và laptop.",
    category: "Sạc và cáp",
    type: "Phụ kiện",
    brand: "hung-phat",
    model: "HP-C65",
    weight: 120,
    image: "sac-nhanh-usb-c-65w.webp",
    dataSource: "real",
    specifications: [
      { key: "connector", label: "Cổng kết nối", value: "USB-C", group: "Kết nối", featured: true },
      { key: "power", label: "Công suất", value: "65", unit: "W", group: "Vận hành", featured: true },
      { key: "compatibility", label: "Tương thích", value: "Điện thoại và laptop USB-C PD", group: "Tương thích" },
      purpose("Gia đình, Văn phòng"),
      warranty("12"),
    ],
    options: { title: "Công suất", values: ["65 W"] },
    variants: [
      {
        title: "65 W",
        sku: "HP-CHARGER-USBC-65W",
        option: "65 W",
        price: vnd("690000"),
      },
    ],
  },
  simple({
    title: "Củ sạc Samsung 25W USB-C",
    handle: "cu-sac-samsung-25w-usb-c",
    description: "Củ sạc nhanh chính hãng Samsung, chuẩn USB-C Power Delivery 25 W.",
    category: "Sạc và cáp",
    type: "Phụ kiện",
    brand: "samsung",
    model: "EP-TA800",
    weight: 90,
    specifications: [
      { key: "connector", label: "Cổng kết nối", value: "USB-C", group: "Kết nối", featured: true },
      { key: "power", label: "Công suất", value: "25", unit: "W", group: "Vận hành", featured: true },
      { key: "compatibility", label: "Tương thích", value: "Thiết bị USB-C PD", group: "Tương thích" },
      purpose("Gia đình"),
      warranty("12"),
    ],
    optionTitle: "Công suất",
    optionValue: "25 W",
    sku: "SAMSUNG-EPTA800-25W",
    price: "349000",
  }),
  simple({
    title: "Cáp Xiaomi USB-C to USB-C 100 W 1 m",
    handle: "cap-xiaomi-usb-c-100w-1m",
    description: "Cáp sạc nhanh 100 W, lõi bện chắc chắn, dài 1 m dùng cho laptop và điện thoại.",
    category: "Sạc và cáp",
    type: "Phụ kiện",
    brand: "xiaomi",
    model: "Mi USB-C 100W",
    weight: 60,
    specifications: [
      { key: "connector", label: "Cổng kết nối", value: "USB-C sang USB-C", group: "Kết nối", featured: true },
      { key: "power", label: "Công suất", value: "100", unit: "W", group: "Vận hành", featured: true },
      { key: "cable_length", label: "Chiều dài", value: "1", unit: "m", group: "Kích thước" },
      purpose("Gia đình, Văn phòng"),
      warranty("12"),
    ],
    optionTitle: "Chiều dài",
    optionValue: "1 m",
    sku: "XIAOMI-CABLE-USBC-100W-1M",
    price: "199000",
  }),
  simple({
    title: "Tai nghe Sony WH-CH520",
    handle: "tai-nghe-sony-wh-ch520",
    description: "Tai nghe chụp tai không dây, pin đến 50 giờ, gấp gọn tiện mang theo.",
    category: "Tai nghe",
    type: "Phụ kiện",
    brand: "sony",
    model: "WH-CH520",
    weight: 190,
    specifications: [
      { key: "accessory_type", label: "Loại tai nghe", value: "Chụp tai không dây", group: "Sản phẩm", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Bluetooth 5.2", group: "Kết nối", featured: true },
      { key: "battery_life", label: "Thời lượng pin", value: "50", unit: "giờ", group: "Vận hành" },
      purpose("Học tập, Văn phòng"),
      warranty("12"),
    ],
    optionTitle: "Màu sắc",
    optionValue: "Đen",
    sku: "SONY-WHCH520-BLACK",
    price: "1190000",
  }),
  simple({
    title: "Tai nghe Logitech H390 USB",
    handle: "tai-nghe-logitech-h390-usb",
    description: "Tai nghe có dây kèm micro khử ồn, cắm USB dùng ngay cho họp online và học trực tuyến.",
    category: "Tai nghe",
    type: "Phụ kiện",
    brand: "logitech",
    model: "H390",
    weight: 240,
    specifications: [
      { key: "accessory_type", label: "Loại tai nghe", value: "Chụp tai có dây", group: "Sản phẩm", featured: true },
      { key: "connectivity", label: "Kết nối", value: "USB-A", group: "Kết nối", featured: true },
      { key: "microphone", label: "Micro", value: "Có, khử ồn", group: "Tính năng" },
      purpose("Văn phòng, Học tập"),
      warranty("24"),
    ],
    optionTitle: "Kết nối",
    optionValue: "USB-A",
    sku: "LOGITECH-H390-USB",
    price: "590000",
  }),
  simple({
    title: "Tai nghe Xiaomi Redmi Buds 5",
    handle: "tai-nghe-xiaomi-redmi-buds-5",
    description: "Tai nghe true wireless có chống ồn chủ động, hộp sạc nhỏ gọn.",
    category: "Tai nghe",
    type: "Phụ kiện",
    brand: "xiaomi",
    model: "Redmi Buds 5",
    weight: 45,
    specifications: [
      { key: "accessory_type", label: "Loại tai nghe", value: "True wireless", group: "Sản phẩm", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Bluetooth 5.3", group: "Kết nối", featured: true },
      { key: "noise_cancelling", label: "Chống ồn", value: "Chủ động ANC", group: "Tính năng", featured: true },
      purpose("Học tập, Gia đình"),
      warranty("12"),
    ],
    optionTitle: "Màu sắc",
    optionValue: "Trắng",
    sku: "XIAOMI-REDMIBUDS5-WHITE",
    price: "690000",
  }),
]

const NETWORK: CatalogProductSeed[] = [
  simple({
    title: "Router TP-Link Archer C64 AC1200",
    handle: "router-tp-link-archer-c64",
    description: "Router Wi-Fi băng tần kép AC1200, 4 ăng-ten, đủ dùng cho căn hộ và nhà nhỏ.",
    category: "Router Wi-Fi",
    type: "Thiết bị mạng",
    brand: "tp-link",
    model: "Archer C64",
    weight: 320,
    specifications: [
      { key: "network_type", label: "Loại thiết bị", value: "Router Wi-Fi", group: "Sản phẩm", featured: true },
      { key: "wifi_standard", label: "Chuẩn Wi-Fi", value: "Wi-Fi 5", group: "Kết nối", featured: true },
      { key: "speed_class", label: "Cấp tốc độ", value: "AC1200", group: "Kết nối", featured: true },
      { key: "bands", label: "Băng tần", value: "2.4 GHz / 5 GHz", group: "Kết nối" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Cấp tốc độ",
    optionValue: "AC1200",
    sku: "TPLINK-ARCHER-C64-AC1200",
    price: "690000",
  }),
  simple({
    title: "Router TP-Link Archer AX23 Wi-Fi 6",
    handle: "router-tp-link-archer-ax23",
    description: "Router Wi-Fi 6 AX1800 cho nhà nhiều thiết bị, hỗ trợ OFDMA và MU-MIMO.",
    category: "Router Wi-Fi",
    type: "Thiết bị mạng",
    brand: "tp-link",
    model: "Archer AX23",
    weight: 380,
    specifications: [
      { key: "network_type", label: "Loại thiết bị", value: "Router Wi-Fi", group: "Sản phẩm", featured: true },
      { key: "wifi_standard", label: "Chuẩn Wi-Fi", value: "Wi-Fi 6", group: "Kết nối", featured: true },
      { key: "speed_class", label: "Cấp tốc độ", value: "AX1800", group: "Kết nối", featured: true },
      { key: "bands", label: "Băng tần", value: "2.4 GHz / 5 GHz", group: "Kết nối" },
      purpose("Gia đình, Văn phòng"),
      warranty("24"),
    ],
    optionTitle: "Cấp tốc độ",
    optionValue: "AX1800",
    sku: "TPLINK-ARCHER-AX23-AX1800",
    price: "1190000",
  }),
  simple({
    title: "Router Xiaomi AX3000T Wi-Fi 6",
    handle: "router-xiaomi-ax3000t",
    description: "Router Wi-Fi 6 AX3000 giá tốt, 4 ăng-ten khuếch đại, cấu hình qua ứng dụng điện thoại.",
    category: "Router Wi-Fi",
    type: "Thiết bị mạng",
    brand: "xiaomi",
    model: "Router AX3000T",
    weight: 360,
    specifications: [
      { key: "network_type", label: "Loại thiết bị", value: "Router Wi-Fi", group: "Sản phẩm", featured: true },
      { key: "wifi_standard", label: "Chuẩn Wi-Fi", value: "Wi-Fi 6", group: "Kết nối", featured: true },
      { key: "speed_class", label: "Cấp tốc độ", value: "AX3000", group: "Kết nối", featured: true },
      { key: "bands", label: "Băng tần", value: "2.4 GHz / 5 GHz", group: "Kết nối" },
      purpose("Gia đình"),
      warranty("12"),
    ],
    optionTitle: "Cấp tốc độ",
    optionValue: "AX3000",
    sku: "XIAOMI-ROUTER-AX3000T",
    price: "990000",
  }),
  simple({
    title: "Switch TP-Link TL-SG1008D 8 cổng Gigabit",
    handle: "switch-tp-link-tl-sg1008d",
    description: "Bộ chia mạng 8 cổng Gigabit, vỏ kim loại, cắm là chạy không cần cấu hình.",
    category: "Switch và bộ chia mạng",
    type: "Thiết bị mạng",
    brand: "tp-link",
    model: "TL-SG1008D",
    weight: 520,
    specifications: [
      { key: "network_type", label: "Loại thiết bị", value: "Switch chia mạng", group: "Sản phẩm", featured: true },
      { key: "ports", label: "Số cổng", value: "8", unit: "cổng", group: "Kết nối", featured: true },
      { key: "speed_class", label: "Tốc độ cổng", value: "Gigabit 1000 Mbps", group: "Kết nối" },
      purpose("Văn phòng, Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Số cổng",
    optionValue: "8 cổng",
    sku: "TPLINK-TLSG1008D-8P",
    price: "490000",
  }),
]

const HOME_APPLIANCES: CatalogProductSeed[] = [
  simple({
    title: "Nồi cơm điện Panasonic SR-CN188 1.8 L",
    handle: "noi-com-dien-panasonic-sr-cn188",
    description: "Nồi cơm nắp rời 1.8 L, lòng nồi chống dính, phù hợp gia đình 4 đến 6 người.",
    category: "Nồi cơm điện",
    type: "Đồ gia dụng",
    brand: "panasonic",
    model: "SR-CN188",
    weight: 3100,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Nồi cơm nắp rời", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "1.8", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "750", unit: "W", group: "Vận hành" },
      { key: "control", label: "Điều khiển", value: "Cơ", group: "Tính năng" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Dung tích",
    optionValue: "1.8 L",
    sku: "PANASONIC-SRCN188-18L",
    price: "1290000",
  }),
  simple({
    title: "Nồi cơm điện tử Toshiba RC-10DR2PV 1 L",
    handle: "noi-com-dien-tu-toshiba-rc-10dr2pv",
    description: "Nồi cơm điện tử 1 L nhiều chế độ nấu, giữ ấm tự động, hợp gia đình 2 đến 4 người.",
    category: "Nồi cơm điện",
    type: "Đồ gia dụng",
    brand: "toshiba",
    model: "RC-10DR2PV",
    weight: 3600,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Nồi cơm điện tử", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "1", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "570", unit: "W", group: "Vận hành" },
      { key: "control", label: "Điều khiển", value: "Điện tử", group: "Tính năng", featured: true },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Dung tích",
    optionValue: "1 L",
    sku: "TOSHIBA-RC10DR2PV-1L",
    price: "1890000",
  }),
  simple({
    title: "Nồi cơm điện Sunhouse SHD8602 1.8 L",
    handle: "noi-com-dien-sunhouse-shd8602",
    description: "Nồi cơm nắp gài 1.8 L, giá tốt, dùng bền cho bữa cơm hằng ngày.",
    category: "Nồi cơm điện",
    type: "Đồ gia dụng",
    brand: "sunhouse",
    model: "SHD8602",
    weight: 3000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Nồi cơm nắp gài", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "1.8", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "700", unit: "W", group: "Vận hành" },
      { key: "control", label: "Điều khiển", value: "Cơ", group: "Tính năng" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Dung tích",
    optionValue: "1.8 L",
    sku: "SUNHOUSE-SHD8602-18L",
    price: "690000",
  }),
  simple({
    title: "Bếp từ đơn Midea MI-B2015DC",
    handle: "bep-tu-don-midea-mi-b2015dc",
    description: "Bếp từ đơn 2000 W, mặt kính chịu nhiệt, nhiều mức công suất nấu.",
    category: "Bếp điện và bếp từ",
    type: "Đồ gia dụng",
    brand: "midea",
    model: "MI-B2015DC",
    weight: 2400,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Bếp từ đơn", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "2000", unit: "W", group: "Vận hành", featured: true },
      { key: "material", label: "Mặt bếp", value: "Kính chịu nhiệt", group: "Sản phẩm" },
      { key: "control", label: "Điều khiển", value: "Cảm ứng", group: "Tính năng" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Công suất",
    optionValue: "2000 W",
    sku: "MIDEA-MIB2015DC-2000W",
    price: "1090000",
  }),
  simple({
    title: "Bếp từ đôi Sunhouse SHB9105MT",
    handle: "bep-tu-doi-sunhouse-shb9105mt",
    description: "Bếp từ đôi âm, mặt kính Schott, hẹn giờ và khóa an toàn trẻ em.",
    category: "Bếp điện và bếp từ",
    type: "Đồ gia dụng",
    brand: "sunhouse",
    model: "SHB9105MT",
    weight: 9500,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Bếp từ đôi", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "4000", unit: "W", group: "Vận hành", featured: true },
      { key: "material", label: "Mặt bếp", value: "Kính Schott Ceran", group: "Sản phẩm" },
      { key: "control", label: "Điều khiển", value: "Cảm ứng trượt", group: "Tính năng" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("24"),
    ],
    optionTitle: "Số vùng nấu",
    optionValue: "2 vùng nấu",
    sku: "SUNHOUSE-SHB9105MT-2Z",
    price: "3290000",
  }),
  simple({
    title: "Bếp hồng ngoại Kangaroo KG20IH",
    handle: "bep-hong-ngoai-kangaroo-kg20ih",
    description: "Bếp hồng ngoại dùng được mọi loại nồi, làm nóng nhanh, dễ vệ sinh.",
    category: "Bếp điện và bếp từ",
    type: "Đồ gia dụng",
    brand: "kangaroo",
    model: "KG20IH",
    weight: 2600,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Bếp hồng ngoại", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "2000", unit: "W", group: "Vận hành", featured: true },
      { key: "material", label: "Mặt bếp", value: "Kính chịu nhiệt", group: "Sản phẩm" },
      { key: "control", label: "Điều khiển", value: "Cảm ứng", group: "Tính năng" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Công suất",
    optionValue: "2000 W",
    sku: "KANGAROO-KG20IH-2000W",
    price: "890000",
  }),
  simple({
    title: "Quạt đứng Panasonic F-409U",
    handle: "quat-dung-panasonic-f-409u",
    description: "Quạt cây 3 cánh, 3 mức gió, hẹn giờ, chạy êm phù hợp phòng ngủ và phòng khách.",
    category: "Quạt điện",
    type: "Đồ gia dụng",
    brand: "panasonic",
    model: "F-409U",
    weight: 5200,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Quạt đứng", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "50", unit: "W", group: "Vận hành", featured: true },
      { key: "speed_levels", label: "Mức gió", value: "3", unit: "mức", group: "Tính năng" },
      { key: "control", label: "Điều khiển", value: "Cơ, có hẹn giờ", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("12"),
    ],
    optionTitle: "Loại quạt",
    optionValue: "Quạt đứng",
    sku: "PANASONIC-F409U-STAND",
    price: "1590000",
  }),
  simple({
    title: "Quạt lửng Sunhouse SHD7817",
    handle: "quat-lung-sunhouse-shd7817",
    description: "Quạt lửng gọn nhẹ, 3 mức gió, tiết kiệm điện, hợp phòng nhỏ và phòng trọ.",
    category: "Quạt điện",
    type: "Đồ gia dụng",
    brand: "sunhouse",
    model: "SHD7817",
    weight: 4100,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Quạt lửng", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "45", unit: "W", group: "Vận hành", featured: true },
      { key: "speed_levels", label: "Mức gió", value: "3", unit: "mức", group: "Tính năng" },
      { key: "control", label: "Điều khiển", value: "Cơ", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("12"),
    ],
    optionTitle: "Loại quạt",
    optionValue: "Quạt lửng",
    sku: "SUNHOUSE-SHD7817-MID",
    price: "690000",
  }),
  simple({
    title: "Ấm siêu tốc Philips HD9350 1.7 L",
    handle: "am-sieu-toc-philips-hd9350",
    description: "Ấm đun nước 1.7 L ruột inox, tự ngắt khi sôi, đun nhanh và an toàn.",
    category: "Ấm siêu tốc",
    type: "Đồ gia dụng",
    brand: "philips",
    model: "HD9350",
    weight: 1200,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Ấm siêu tốc", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "1.7", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "2200", unit: "W", group: "Vận hành" },
      { key: "material", label: "Chất liệu", value: "Inox 304", group: "Sản phẩm", featured: true },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("24"),
    ],
    optionTitle: "Dung tích",
    optionValue: "1.7 L",
    sku: "PHILIPS-HD9350-17L",
    price: "890000",
  }),
  simple({
    title: "Ấm siêu tốc Sunhouse SHD1183 1.8 L",
    handle: "am-sieu-toc-sunhouse-shd1183",
    description: "Ấm đun siêu tốc 1.8 L, thân inox, giá tốt cho gia đình và văn phòng.",
    category: "Ấm siêu tốc",
    type: "Đồ gia dụng",
    brand: "sunhouse",
    model: "SHD1183",
    weight: 1000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Ấm siêu tốc", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "1.8", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "1500", unit: "W", group: "Vận hành" },
      { key: "material", label: "Chất liệu", value: "Inox", group: "Sản phẩm" },
      purpose("Gia đình, Văn phòng"),
      warranty("12"),
    ],
    optionTitle: "Dung tích",
    optionValue: "1.8 L",
    sku: "SUNHOUSE-SHD1183-18L",
    price: "320000",
  }),
  simple({
    title: "Máy xay sinh tố Philips HR2118 2 L",
    handle: "may-xay-sinh-to-philips-hr2118",
    description: "Máy xay cối thủy tinh 2 L, công nghệ ProBlend, xay đá và làm sinh tố tốt.",
    category: "Máy xay và máy ép",
    type: "Đồ gia dụng",
    brand: "philips",
    model: "HR2118",
    weight: 3300,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy xay sinh tố", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích cối", value: "2", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "600", unit: "W", group: "Vận hành" },
      { key: "material", label: "Chất liệu cối", value: "Thủy tinh", group: "Sản phẩm", featured: true },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("24"),
    ],
    optionTitle: "Dung tích cối",
    optionValue: "2 L",
    sku: "PHILIPS-HR2118-2L",
    price: "1290000",
  }),
  simple({
    title: "Máy xay đa năng Sunhouse SHD5321",
    handle: "may-xay-da-nang-sunhouse-shd5321",
    description: "Máy xay 3 cối, xay thịt, xay khô và xay sinh tố, phù hợp bếp gia đình.",
    category: "Máy xay và máy ép",
    type: "Đồ gia dụng",
    brand: "sunhouse",
    model: "SHD5321",
    weight: 2800,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy xay đa năng", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích cối", value: "1.5", unit: "lít", group: "Vận hành", featured: true },
      { key: "power", label: "Công suất", value: "400", unit: "W", group: "Vận hành" },
      { key: "material", label: "Chất liệu cối", value: "Nhựa và inox", group: "Sản phẩm" },
      purpose("Gia đình, Nấu ăn hằng ngày"),
      warranty("12"),
    ],
    optionTitle: "Số cối",
    optionValue: "3 cối",
    sku: "SUNHOUSE-SHD5321-3J",
    price: "590000",
  }),
]

const COOLING: CatalogProductSeed[] = [
  simple({
    title: "Tủ lạnh Samsung Inverter RT22M4033S8 236 L",
    handle: "tu-lanh-samsung-rt22m4033s8",
    description: "Tủ lạnh 2 cánh ngăn đá trên 236 L, công nghệ Inverter tiết kiệm điện.",
    category: "Tủ lạnh",
    type: "Điện lạnh",
    brand: "samsung",
    model: "RT22M4033S8",
    weight: 52000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Tủ lạnh ngăn đá trên", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "236", unit: "lít", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "5 sao", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Dung tích",
    optionValue: "236 L",
    sku: "SAMSUNG-RT22M4033S8-236L",
    price: "6990000",
  }),
  simple({
    title: "Tủ lạnh LG Inverter GN-D392PSA 394 L",
    handle: "tu-lanh-lg-gn-d392psa",
    description: "Tủ lạnh 2 cánh 394 L, ngăn đá trên, làm lạnh đa chiều, chạy êm.",
    category: "Tủ lạnh",
    type: "Điện lạnh",
    brand: "lg",
    model: "GN-D392PSA",
    weight: 63000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Tủ lạnh ngăn đá trên", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "394", unit: "lít", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "5 sao", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Dung tích",
    optionValue: "394 L",
    sku: "LG-GND392PSA-394L",
    price: "12490000",
  }),
  simple({
    title: "Tủ lạnh Aqua AQR-T239FA 235 L",
    handle: "tu-lanh-aqua-aqr-t239fa",
    description: "Tủ lạnh 235 L gọn gàng, phù hợp căn hộ nhỏ và gia đình 2 đến 3 người.",
    category: "Tủ lạnh",
    type: "Điện lạnh",
    brand: "aqua",
    model: "AQR-T239FA",
    weight: 48000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Tủ lạnh ngăn đá trên", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Dung tích", value: "235", unit: "lít", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "4 sao", group: "Tính năng" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Dung tích",
    optionValue: "235 L",
    sku: "AQUA-AQRT239FA-235L",
    price: "5990000",
  }),
  simple({
    title: "Máy giặt Electrolux EWF9024D3WB 9 kg",
    handle: "may-giat-electrolux-ewf9024d3wb",
    description: "Máy giặt cửa trước 9 kg, công nghệ UltraMix, giặt sạch và giữ form vải.",
    category: "Máy giặt và máy sấy",
    type: "Điện lạnh",
    brand: "electrolux",
    model: "EWF9024D3WB",
    weight: 66000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy giặt cửa trước", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Khối lượng giặt", value: "9", unit: "kg", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "5 sao", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Khối lượng giặt",
    optionValue: "9 kg",
    sku: "ELECTROLUX-EWF9024D3WB-9KG",
    price: "8990000",
  }),
  simple({
    title: "Máy giặt LG Inverter FV1409S2W 9 kg",
    handle: "may-giat-lg-fv1409s2w",
    description: "Máy giặt lồng ngang 9 kg, động cơ Inverter Direct Drive, giặt hơi nước.",
    category: "Máy giặt và máy sấy",
    type: "Điện lạnh",
    brand: "lg",
    model: "FV1409S2W",
    weight: 68000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy giặt cửa trước", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Khối lượng giặt", value: "9", unit: "kg", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "5 sao", group: "Tính năng" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Khối lượng giặt",
    optionValue: "9 kg",
    sku: "LG-FV1409S2W-9KG",
    price: "9990000",
  }),
  simple({
    title: "Máy giặt Toshiba AW-M905BV 8 kg",
    handle: "may-giat-toshiba-aw-m905bv",
    description: "Máy giặt cửa trên 8 kg, lồng giặt inox, nhiều chương trình giặt cơ bản.",
    category: "Máy giặt và máy sấy",
    type: "Điện lạnh",
    brand: "toshiba",
    model: "AW-M905BV",
    weight: 34000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy giặt cửa trên", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Khối lượng giặt", value: "8", unit: "kg", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Không", group: "Tính năng" },
      { key: "energy_rating", label: "Nhãn năng lượng", value: "4 sao", group: "Tính năng" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Khối lượng giặt",
    optionValue: "8 kg",
    sku: "TOSHIBA-AWM905BV-8KG",
    price: "5790000",
  }),
  simple({
    title: "Máy lạnh Casper Inverter GC-09IS35 1 HP",
    handle: "may-lanh-casper-gc-09is35",
    description: "Điều hòa 1 chiều Inverter 9000 BTU, hợp phòng 15 m2, tiết kiệm điện.",
    category: "Máy lạnh",
    type: "Điện lạnh",
    brand: "casper",
    model: "GC-09IS35",
    weight: 32000,
    image: "casper-gc-09is35.jpg",
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy lạnh 1 chiều", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Công suất làm lạnh", value: "9000", unit: "BTU", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "room_size", label: "Diện tích phòng", value: "Dưới 15 m2", group: "Vận hành" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("36"),
    ],
    optionTitle: "Công suất",
    optionValue: "1 HP",
    sku: "CASPER-GC09IS35-1HP",
    price: "7490000",
  }),
  simple({
    title: "Máy lạnh LG Inverter V10API1 1 HP",
    handle: "may-lanh-lg-v10api1",
    description: "Điều hòa Inverter 9000 BTU, lọc khí, vận hành êm, bảo hành máy nén dài.",
    category: "Máy lạnh",
    type: "Điện lạnh",
    brand: "lg",
    model: "V10API1",
    weight: 33000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy lạnh 1 chiều", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Công suất làm lạnh", value: "9000", unit: "BTU", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "room_size", label: "Diện tích phòng", value: "Dưới 15 m2", group: "Vận hành" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Công suất",
    optionValue: "1 HP",
    sku: "LG-V10API1-1HP",
    price: "8490000",
  }),
  simple({
    title: "Máy lạnh Midea Inverter MSAGII-10CRDN8 1 HP",
    handle: "may-lanh-midea-msagii-10crdn8",
    description: "Điều hòa Inverter 9000 BTU giá tốt, làm lạnh nhanh, hợp phòng ngủ nhỏ.",
    category: "Máy lạnh",
    type: "Điện lạnh",
    brand: "midea",
    model: "MSAGII-10CRDN8",
    weight: 31000,
    specifications: [
      { key: "appliance_type", label: "Loại thiết bị", value: "Máy lạnh 1 chiều", group: "Sản phẩm", featured: true },
      { key: "capacity", label: "Công suất làm lạnh", value: "9000", unit: "BTU", group: "Vận hành", featured: true },
      { key: "inverter", label: "Công nghệ Inverter", value: "Có", group: "Tính năng", featured: true },
      { key: "room_size", label: "Diện tích phòng", value: "Dưới 15 m2", group: "Vận hành" },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Công suất",
    optionValue: "1 HP",
    sku: "MIDEA-MSAGII10CRDN8-1HP",
    price: "6990000",
  }),
]

const AV: CatalogProductSeed[] = [
  simple({
    title: "Smart TV Samsung 43 inch UA43CU8000",
    handle: "smart-tv-samsung-43-ua43cu8000",
    description: "Smart TV 4K 43 inch, hệ điều hành Tizen, hỗ trợ HDR và điều khiển giọng nói.",
    category: "TV",
    type: "Âm thanh & TV",
    brand: "samsung",
    model: "UA43CU8000",
    weight: 8500,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Smart TV", group: "Sản phẩm", featured: true },
      { key: "screen_size", label: "Kích thước màn hình", value: "43", unit: "inch", group: "Hiển thị", featured: true },
      { key: "resolution", label: "Độ phân giải", value: "4K UHD", group: "Hiển thị", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Wi-Fi, HDMI, USB", group: "Kết nối" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Kích thước",
    optionValue: "43 inch",
    sku: "SAMSUNG-UA43CU8000-43IN",
    price: "8490000",
  }),
  simple({
    title: "Smart TV LG 50 inch 50UR8050",
    handle: "smart-tv-lg-50-50ur8050",
    description: "Smart TV 4K 50 inch nền tảng webOS, hình ảnh sắc nét, nhiều ứng dụng giải trí.",
    category: "TV",
    type: "Âm thanh & TV",
    brand: "lg",
    model: "50UR8050",
    weight: 11500,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Smart TV", group: "Sản phẩm", featured: true },
      { key: "screen_size", label: "Kích thước màn hình", value: "50", unit: "inch", group: "Hiển thị", featured: true },
      { key: "resolution", label: "Độ phân giải", value: "4K UHD", group: "Hiển thị", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Wi-Fi, HDMI, USB", group: "Kết nối" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Kích thước",
    optionValue: "50 inch",
    sku: "LG-50UR8050-50IN",
    price: "9990000",
  }),
  simple({
    title: "Google TV Sony 43 inch KD-43X75K",
    handle: "google-tv-sony-43-kd-43x75k",
    description: "Google TV 4K 43 inch, bộ xử lý X1, âm thanh rõ, kho ứng dụng phong phú.",
    category: "TV",
    type: "Âm thanh & TV",
    brand: "sony",
    model: "KD-43X75K",
    weight: 9200,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Smart TV", group: "Sản phẩm", featured: true },
      { key: "screen_size", label: "Kích thước màn hình", value: "43", unit: "inch", group: "Hiển thị", featured: true },
      { key: "resolution", label: "Độ phân giải", value: "4K UHD", group: "Hiển thị", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Wi-Fi, HDMI, USB", group: "Kết nối" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Kích thước",
    optionValue: "43 inch",
    sku: "SONY-KD43X75K-43IN",
    price: "11990000",
  }),
  simple({
    title: "Loa Bluetooth Sony SRS-XB100",
    handle: "loa-bluetooth-sony-srs-xb100",
    description: "Loa di động chống nước IP67, pin 16 giờ, âm bass chắc so với kích thước.",
    category: "Loa",
    type: "Âm thanh & TV",
    brand: "sony",
    model: "SRS-XB100",
    weight: 280,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Loa Bluetooth di động", group: "Sản phẩm", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Bluetooth 5.3", group: "Kết nối", featured: true },
      { key: "battery_life", label: "Thời lượng pin", value: "16", unit: "giờ", group: "Vận hành" },
      { key: "water_resistance", label: "Chống nước", value: "IP67", group: "Tính năng", featured: true },
      purpose("Gia đình"),
      warranty("12"),
    ],
    optionTitle: "Màu sắc",
    optionValue: "Đen",
    sku: "SONY-SRSXB100-BLACK",
    price: "1090000",
  }),
  simple({
    title: "Loa vi tính Logitech Z150",
    handle: "loa-vi-tinh-logitech-z150",
    description: "Loa 2.0 cho máy tính, công suất 6 W, núm chỉnh âm lượng tiện dùng.",
    category: "Loa",
    type: "Âm thanh & TV",
    brand: "logitech",
    model: "Z150",
    weight: 600,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Loa vi tính 2.0", group: "Sản phẩm", featured: true },
      { key: "connectivity", label: "Kết nối", value: "Jack 3.5 mm", group: "Kết nối", featured: true },
      { key: "power", label: "Công suất", value: "6", unit: "W", group: "Vận hành" },
      purpose("Văn phòng, Học tập"),
      warranty("24"),
    ],
    optionTitle: "Màu sắc",
    optionValue: "Đen",
    sku: "LOGITECH-Z150-BLACK",
    price: "490000",
  }),
]

const ELECTRICAL: CatalogProductSeed[] = [
  simple({
    title: "Đèn LED downlight Philips 9 W",
    handle: "den-led-downlight-philips-9w",
    description: "Đèn âm trần 9 W ánh sáng trắng, tuổi thọ cao, lắp cho trần thạch cao.",
    category: "Đèn và chiếu sáng",
    type: "Thiết bị điện",
    brand: "philips",
    model: "DN027B 9W",
    weight: 180,
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Đèn LED âm trần", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "9", unit: "W", group: "Vận hành", featured: true },
      { key: "voltage", label: "Điện áp", value: "220", unit: "V", group: "Vận hành" },
      { key: "installation", label: "Kiểu lắp đặt", value: "Âm trần", group: "Lắp đặt", featured: true },
      purpose("Gia đình, Tiết kiệm điện"),
      warranty("24"),
    ],
    optionTitle: "Công suất",
    optionValue: "9 W",
    sku: "PHILIPS-DN027B-9W",
    price: "89000",
  }),
  simple({
    title: "Quạt thông gió Panasonic FV-20CUT1",
    handle: "quat-thong-gio-panasonic-fv-20cut1",
    description: "Quạt hút gắn tường cho nhà tắm và nhà bếp, chạy êm, hút mùi hiệu quả.",
    category: "Quạt thông gió",
    type: "Thiết bị điện",
    brand: "panasonic",
    model: "FV-20CUT1",
    weight: 1900,
    image: "panasonic-fv-20cut1.jpg",
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Quạt hút gắn tường", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "30", unit: "W", group: "Vận hành", featured: true },
      { key: "voltage", label: "Điện áp", value: "220", unit: "V", group: "Vận hành" },
      { key: "installation", label: "Kiểu lắp đặt", value: "Gắn tường", group: "Lắp đặt", featured: true },
      purpose("Gia đình"),
      warranty("12"),
    ],
    optionTitle: "Kiểu lắp",
    optionValue: "Gắn tường",
    sku: "PANASONIC-FV20CUT1-WALL",
    price: "890000",
  }),
  simple({
    title: "Máy bơm nước Panasonic GP-129JXK 125 W",
    handle: "may-bom-nuoc-panasonic-gp-129jxk",
    description: "Máy bơm đẩy cao 125 W, tự động ngắt khi thiếu nước, dùng cho nhà 2 đến 3 tầng.",
    category: "Máy bơm nước",
    type: "Thiết bị điện",
    brand: "panasonic",
    model: "GP-129JXK",
    weight: 7800,
    image: "panasonic-gp-129jxk.jpg",
    specifications: [
      { key: "device_type", label: "Loại thiết bị", value: "Máy bơm đẩy cao", group: "Sản phẩm", featured: true },
      { key: "power", label: "Công suất", value: "125", unit: "W", group: "Vận hành", featured: true },
      { key: "voltage", label: "Điện áp", value: "220", unit: "V", group: "Vận hành" },
      { key: "installation", label: "Kiểu lắp đặt", value: "Đặt sàn", group: "Lắp đặt" },
      purpose("Gia đình"),
      warranty("24"),
    ],
    optionTitle: "Công suất",
    optionValue: "125 W",
    sku: "PANASONIC-GP129JXK-125W",
    price: "1890000",
  }),
]

const CATALOG_PRODUCT_FIXTURES: CatalogProductSeed[] = [
  ...LAPTOPS,
  ...ACCESSORIES,
  ...NETWORK,
  ...HOME_APPLIANCES,
  ...COOLING,
  ...AV,
  ...ELECTRICAL,
]

// These are local, model-matched product photos. Keeping the mapping next to the
// catalog prevents seed data from silently falling back to an invented placeholder.
const CATALOG_PRODUCT_IMAGES: Record<string, string> = {
  "laptop-asus-vivobook-15-x1504va": "asus-vivobook-15-x1504va.jpg",
  "laptop-acer-aspire-5-a515-58": "acer-aspire-5-a515-58.jpg",
  "laptop-lenovo-ideapad-slim-3-15irh8": "lenovo-ideapad-slim-3-15irh8.jpg",
  "laptop-dell-inspiron-15-3530": "dell-inspiron-15-3530.jpg",
  "laptop-hp-pavilion-15-eg3097tu": "hp-pavilion-15-eg3097tu.jpg",
  "laptop-asus-tuf-gaming-f15-fx507": "asus-tuf-gaming-f15-fx507.jpg",
  "sac-nhanh-usb-c-65w": "sac-nhanh-usb-c-65w.jpg",
  "cu-sac-samsung-25w-usb-c": "cu-sac-samsung-25w-usb-c.jpg",
  "cap-xiaomi-usb-c-100w-1m": "cap-xiaomi-usb-c-100w-1m.jpg",
  "tai-nghe-sony-wh-ch520": "tai-nghe-sony-wh-ch520.jpg",
  "tai-nghe-logitech-h390-usb": "tai-nghe-logitech-h390-usb.jpg",
  "tai-nghe-xiaomi-redmi-buds-5": "tai-nghe-xiaomi-redmi-buds-5.jpg",
  "router-tp-link-archer-c64": "router-tp-link-archer-c64.jpg",
  "router-tp-link-archer-ax23": "router-tp-link-archer-ax23.jpg",
  "router-xiaomi-ax3000t": "router-xiaomi-ax3000t.jpg",
  "switch-tp-link-tl-sg1008d": "switch-tp-link-tl-sg1008d.jpg",
  "noi-com-dien-panasonic-sr-cn188": "noi-com-dien-panasonic-sr-cn188.jpg",
  "noi-com-dien-tu-toshiba-rc-10dr2pv": "noi-com-dien-tu-toshiba-rc-10dr2pv.jpg",
  "noi-com-dien-sunhouse-shd8602": "noi-com-dien-sunhouse-shd8602.jpg",
  "bep-tu-don-midea-mi-b2015dc": "bep-tu-don-midea-mi-b2015dc.jpg",
  "bep-tu-doi-sunhouse-shb9105mt": "bep-tu-doi-sunhouse-shb9105mt.jpg",
  "bep-hong-ngoai-kangaroo-kg20ih": "bep-hong-ngoai-kangaroo-kg20ih.jpg",
  "quat-dung-panasonic-f-409u": "quat-dung-panasonic-f-409u.jpg",
  "quat-lung-sunhouse-shd7817": "quat-lung-sunhouse-shd7817.jpg",
  "am-sieu-toc-philips-hd9350": "am-sieu-toc-philips-hd9350.jpg",
  "am-sieu-toc-sunhouse-shd1183": "am-sieu-toc-sunhouse-shd1183.jpg",
  "may-xay-sinh-to-philips-hr2118": "may-xay-sinh-to-philips-hr2118.jpg",
  "may-xay-da-nang-sunhouse-shd5321": "may-xay-da-nang-sunhouse-shd5321.jpg",
  "tu-lanh-samsung-rt22m4033s8": "tu-lanh-samsung-rt22m4033s8.jpg",
  "tu-lanh-lg-gn-d392psa": "tu-lanh-lg-gn-d392psa.jpg",
  "tu-lanh-aqua-aqr-t239fa": "tu-lanh-aqua-aqr-t239fa.jpg",
  "may-giat-electrolux-ewf9024d3wb": "may-giat-electrolux-ewf9024d3wb.jpg",
  "may-giat-lg-fv1409s2w": "may-giat-lg-fv1409s2w.jpg",
  "may-giat-toshiba-aw-m905bv": "may-giat-toshiba-aw-m905bv.jpg",
  "may-lanh-casper-gc-09is35": "casper-gc-09is35.jpg",
  "may-lanh-lg-v10api1": "may-lanh-lg-v10api1.jpg",
  "may-lanh-midea-msagii-10crdn8": "may-lanh-midea-msagii-10crdn8.jpg",
  "smart-tv-samsung-43-ua43cu8000": "smart-tv-samsung-43-ua43cu8000.jpg",
  "smart-tv-lg-50-50ur8050": "smart-tv-lg-50-50ur8050.jpg",
  "google-tv-sony-43-kd-43x75k": "google-tv-sony-43-kd-43x75k.jpg",
  "loa-bluetooth-sony-srs-xb100": "loa-bluetooth-sony-srs-xb100.jpg",
  "loa-vi-tinh-logitech-z150": "loa-vi-tinh-logitech-z150.jpg",
  "den-led-downlight-philips-9w": "den-led-downlight-philips-9w.jpg",
  "quat-thong-gio-panasonic-fv-20cut1": "panasonic-fv-20cut1.jpg",
  "may-bom-nuoc-panasonic-gp-129jxk": "panasonic-gp-129jxk.jpg",
}

export const CATALOG_PRODUCTS = CATALOG_PRODUCT_FIXTURES.map((product) => ({
  ...product,
  image: CATALOG_PRODUCT_IMAGES[product.handle] ?? product.image,
  dataSource: product.dataSource ?? ("demo_fixture" as const),
  // Position is the display order inside the spec table; declaration order is it.
  specifications: product.specifications.map((specification, position) => ({
    ...specification,
    position,
  })),
}))

export const COLLECTION_PRODUCT_HANDLES: Record<string, string[]> = {
  "flash-deal": CATALOG_PRODUCTS.map((product) => product.handle),
  "hang-moi": [],
  "uu-dai-noi-bat": [],
}

export const SKU_CONVENTION =
  "Use a stable uppercase SKU: BRAND-PRODUCT-VARIANT, with hyphens and no spaces. Preserve an existing valid SKU when a product or variant is migrated."

export function assertUniqueCatalogSkus() {
  const seen = new Map<string, string>()
  const handles = new Set<string>()

  for (const product of CATALOG_PRODUCTS) {
    if (handles.has(product.handle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Catalog seed conflict: duplicate product handle ${product.handle}.`
      )
    }
    handles.add(product.handle)

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

export function assertCatalogBrandReferences() {
  const brandHandles = new Set(CATALOG_BRANDS.map((brand) => brand.handle))

  for (const product of CATALOG_PRODUCTS) {
    if (!brandHandles.has(product.brand)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Catalog seed conflict: product ${product.handle} references unknown brand ${product.brand}.`
      )
    }
  }

  const categoryHandles = new Set(CATALOG_CATEGORIES.map((category) => category.name))
  for (const product of CATALOG_PRODUCTS) {
    if (!categoryHandles.has(product.category)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Catalog seed conflict: product ${product.handle} references unknown category ${product.category}.`
      )
    }
  }
}
