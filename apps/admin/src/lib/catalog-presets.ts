import type { CatalogSpecification } from "@/lib/types"

type SpecificationPreset = Omit<CatalogSpecification, "position" | "value">

const common: SpecificationPreset[] = [
  {
    key: "warranty",
    label: "Bảo hành",
    unit: "tháng",
    group: "Bảo hành",
    filterable: false,
    featured: false,
  },
]

const presets: Record<string, SpecificationPreset[]> = {
  laptop: [
    preset("cpu", "CPU", "Cấu hình", true),
    preset("ram", "RAM", "GB", "Cấu hình", true, true),
    preset("storage", "Ổ cứng", "GB", "Cấu hình", true, true),
    preset("screen_size", "Kích thước màn hình", "inch", "Màn hình", true),
    preset("graphics", "Card đồ họa", "Cấu hình", true),
  ],
  "do-gia-dung": [
    preset("appliance_type", "Loại thiết bị", "Sản phẩm", true, true),
    preset("power", "Công suất", "W", "Vận hành", true, true),
    preset("capacity", "Dung tích", "lít", "Vận hành", true),
    preset("material", "Chất liệu", "Sản phẩm", true),
    preset("control", "Điều khiển", "Tính năng", true),
  ],
  "dien-lanh": [
    preset("appliance_type", "Loại thiết bị", "Sản phẩm", true, true),
    preset("capacity", "Dung tích hoặc tải trọng", "Sản phẩm", true, true),
    preset("inverter", "Công nghệ Inverter", "Tính năng", true),
    preset("energy_rating", "Nhãn năng lượng", "Tính năng", true),
    preset("dimensions", "Kích thước", "Kích thước", false),
  ],
  "thiet-bi-dien": [
    preset("device_type", "Loại thiết bị", "Sản phẩm", true, true),
    preset("power", "Công suất", "W", "Vận hành", true, true),
    preset("voltage", "Điện áp", "V", "Vận hành", true),
    preset("installation", "Kiểu lắp đặt", "Lắp đặt", true),
  ],
  "am-thanh-tv": [
    preset("device_type", "Loại thiết bị", "Sản phẩm", true, true),
    preset("screen_size", "Kích thước màn hình", "inch", "Hiển thị", true),
    preset("resolution", "Độ phân giải", "Hiển thị", true),
    preset("connectivity", "Kết nối", "Kết nối", true),
  ],
  "phu-kien": [
    preset("accessory_type", "Loại phụ kiện", "Sản phẩm", true, true),
    preset("compatibility", "Tương thích", "Tương thích", true),
    preset("power", "Công suất", "W", "Vận hành", true),
    preset("connector", "Cổng kết nối", "Kết nối", true),
  ],
  "thiet-bi-mang": [
    preset("network_type", "Loại thiết bị", "Sản phẩm", true, true),
    preset("wifi_standard", "Chuẩn Wi-Fi", "Kết nối", true, true),
    preset("speed_class", "Cấp tốc độ", "Kết nối", true),
    preset("bands", "Băng tần", "Kết nối", true),
  ],
  "dien-thoai": [
    preset("model_family", "Dòng máy", "Sản phẩm", true, true),
    preset("ram", "RAM", "GB", "Cấu hình", true),
    preset("storage", "Bộ nhớ", "GB", "Cấu hình", true),
    preset("display_size", "Kích thước màn hình", "inch", "Màn hình", true),
  ],
}

function preset(
  key: string,
  label: string,
  unitOrGroup: string,
  groupOrFilterable: string | boolean,
  filterableOrFeatured = true,
  featured = false,
): SpecificationPreset {
  const hasUnit = typeof groupOrFilterable === "string"
  return {
    key,
    label,
    unit: hasUnit ? unitOrGroup : "",
    group: hasUnit ? groupOrFilterable : unitOrGroup,
    filterable: hasUnit ? filterableOrFeatured : groupOrFilterable,
    featured: hasUnit ? featured : filterableOrFeatured,
  }
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
