import type { CatalogSpecification } from "@/lib/types"

type SpecificationPreset = Omit<CatalogSpecification, "position" | "value">

/**
 * Canonical specification groups. Storefront filters are ordered by this list, so
 * keeping staff on these names is what makes the filter panel read consistently
 * across categories instead of sprouting a new heading per product.
 */
export const CATALOG_SPECIFICATION_GROUPS = [
  "Nhu cầu sử dụng",
  "Cấu hình",
  "Sản phẩm",
  "Màn hình",
  "Hiển thị",
  "Kết nối",
  "Tính năng",
  "Vận hành",
  "Lắp đặt",
  "Tương thích",
  "Kích thước",
  "Bảo hành",
] as const

const spec = (
  key: string,
  label: string,
  group: string,
  extra: Partial<SpecificationPreset> = {}
): SpecificationPreset => ({
  key,
  label,
  unit: "",
  group,
  filterable: true,
  featured: false,
  multi: false,
  ...extra,
})

/** Applies to every category: what the item is for, and how long it is covered. */
const common: SpecificationPreset[] = [
  spec("purpose", "Nhu cầu sử dụng", "Nhu cầu sử dụng", {
    featured: true,
    multi: true,
  }),
  spec("warranty", "Bảo hành", "Bảo hành", {
    unit: "tháng",
    filterable: false,
  }),
]

const presets: Record<string, SpecificationPreset[]> = {
  laptop: [
    spec("cpu", "CPU", "Cấu hình", { featured: true }),
    spec("ram", "RAM", "Cấu hình", { unit: "GB", featured: true }),
    spec("storage", "Ổ cứng", "Cấu hình", { unit: "GB SSD", featured: true }),
    spec("graphics", "Card đồ họa", "Cấu hình", { featured: true }),
    spec("screen_size", "Kích thước màn hình", "Màn hình", { unit: "inch" }),
  ],
  "do-gia-dung": [
    spec("appliance_type", "Loại thiết bị", "Sản phẩm", { featured: true }),
    spec("capacity", "Dung tích", "Vận hành", { unit: "lít", featured: true }),
    spec("power", "Công suất", "Vận hành", { unit: "W" }),
    spec("material", "Chất liệu", "Sản phẩm"),
    spec("control", "Điều khiển", "Tính năng"),
  ],
  "dien-lanh": [
    spec("appliance_type", "Loại thiết bị", "Sản phẩm", { featured: true }),
    spec("capacity", "Dung tích hoặc tải trọng", "Vận hành", { featured: true }),
    spec("inverter", "Công nghệ Inverter", "Tính năng", { featured: true }),
    spec("energy_rating", "Nhãn năng lượng", "Tính năng"),
    spec("room_size", "Diện tích phòng", "Vận hành"),
    spec("dimensions", "Kích thước", "Kích thước", { filterable: false }),
  ],
  "thiet-bi-dien": [
    spec("device_type", "Loại thiết bị", "Sản phẩm", { featured: true }),
    spec("power", "Công suất", "Vận hành", { unit: "W", featured: true }),
    spec("voltage", "Điện áp", "Vận hành", { unit: "V" }),
    spec("installation", "Kiểu lắp đặt", "Lắp đặt", { featured: true }),
  ],
  "am-thanh-tv": [
    spec("device_type", "Loại thiết bị", "Sản phẩm", { featured: true }),
    spec("screen_size", "Kích thước màn hình", "Hiển thị", {
      unit: "inch",
      featured: true,
    }),
    spec("resolution", "Độ phân giải", "Hiển thị", { featured: true }),
    spec("connectivity", "Kết nối", "Kết nối"),
  ],
  "phu-kien": [
    spec("accessory_type", "Loại phụ kiện", "Sản phẩm", { featured: true }),
    spec("connector", "Cổng kết nối", "Kết nối", { featured: true }),
    spec("power", "Công suất", "Vận hành", { unit: "W" }),
    spec("compatibility", "Tương thích", "Tương thích"),
  ],
  "thiet-bi-mang": [
    spec("network_type", "Loại thiết bị", "Sản phẩm", { featured: true }),
    spec("wifi_standard", "Chuẩn Wi-Fi", "Kết nối", { featured: true }),
    spec("speed_class", "Cấp tốc độ", "Kết nối", { featured: true }),
    spec("bands", "Băng tần", "Kết nối"),
    spec("ports", "Số cổng", "Kết nối", { unit: "cổng" }),
  ],
}

export function getSpecificationPreset(categoryHandle?: string) {
  const normalized = normalizeHandle(categoryHandle ?? "")
  const exact = presets[normalized]
  const matched =
    exact ??
    Object.entries(presets).find(([handle]) => normalized.includes(handle))?.[1] ??
    []

  return [...matched, ...common]
}

export function slugifyCatalogValue(value: string, separator = "-") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "")
}

function normalizeHandle(value: string) {
  return slugifyCatalogValue(value)
}
