"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import { Field, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import {
  CATALOG_SPECIFICATION_GROUPS,
  getSpecificationPreset,
  slugifyCatalogValue,
} from "@/lib/catalog-presets"
import { sdk } from "@/lib/sdk"
import {
  CATALOG_BRAND_KIND_LABELS,
  type CatalogBrand,
  type CatalogBrandKind,
  type CatalogSpecification,
  type Product,
  type ProductCatalog,
  type ProductCategory,
} from "@/lib/types"

type ProductFormProps = { product?: Product; catalog?: ProductCatalog }
type ProductMedia = { url: string; alt: string }

export function ProductForm({ product, catalog }: ProductFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const variant = product?.variants?.[0]
  const [title, setTitle] = useState(product?.title ?? "")
  const [handle, setHandle] = useState(product?.handle ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [status, setStatus] = useState(product?.status ?? "draft")
  const [sku, setSku] = useState(variant?.sku ?? "")
  const [price, setPrice] = useState(
    formatVndInput(variant?.prices?.[0]?.amount),
  )
  const [brandId, setBrandId] = useState(catalog?.brand?.id ?? "")
  const [categoryId, setCategoryId] = useState(product?.categories?.[0]?.id ?? "")
  const [model, setModel] = useState(catalog?.model ?? "")
  const [specifications, setSpecifications] = useState(
    readSpecifications(catalog),
  )
  const [media, setMedia] = useState(readMedia(product, catalog))
  const [imageUrl, setImageUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!product) return
    setTitle(product.title)
    setHandle(product.handle ?? "")
    setDescription(product.description ?? "")
    setStatus(product.status ?? "draft")
    setSku(product.variants?.[0]?.sku ?? "")
    setPrice(formatVndInput(product.variants?.[0]?.prices?.[0]?.amount))
    setBrandId(catalog?.brand?.id ?? "")
    setCategoryId(product.categories?.[0]?.id ?? "")
    setModel(catalog?.model ?? "")
    setSpecifications(readSpecifications(catalog))
    setMedia(readMedia(product, catalog))
  }, [product, catalog])

  const brands = useQuery({
    queryKey: ["catalog-brands"],
    queryFn: () =>
      adminFetch<{ brands: CatalogBrand[] }>("/admin/catalog/brands"),
  })

  const categories = useQuery({
    queryKey: ["product-categories"],
    queryFn: () =>
      adminFetch<{ product_categories: ProductCategory[] }>(
        "/admin/product-categories?limit=100&fields=id,name,handle,parent_category_id,parent_category.*",
      ),
  })

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const response = await sdk.admin.upload.create({ files })
      return response.files.map((file) => ({ url: file.url, alt: "" }))
    },
    onSuccess: (uploaded) => setMedia((current) => [...current, ...uploaded]),
  })

  const save = useMutation({
    mutationFn: async () => {
      const amount = parseVndInput(price)
      const images = media.map(({ url }) => ({ url }))
      let savedProduct = product

      if (product) {
        const response = await adminFetch<{ product: Product }>(
          `/admin/products/${product.id}`,
          {
            method: "POST",
            body: {
              title,
              handle: handle || undefined,
              description,
              status,
              images,
              categories: categoryId ? [{ id: categoryId }] : [],
            },
          },
        )
        savedProduct = response.product
        if (variant) {
          await adminFetch(
            `/admin/products/${product.id}/variants/${variant.id}`,
            {
              method: "POST",
              body: {
                sku: sku || null,
                prices:
                  amount === null ? [] : [{ amount, currency_code: "vnd" }],
              },
            },
          )
        }
      } else {
        const response = await adminFetch<{ product: Product }>(
          "/admin/products",
          {
            method: "POST",
            body: {
              title,
              handle: handle || undefined,
              description,
              status,
              images,
              categories: categoryId ? [{ id: categoryId }] : [],
              options: [{ title: "Tùy chọn", values: ["Mặc định"] }],
              variants: [
                {
                  title: "Mặc định",
                  sku: sku || undefined,
                  options: { "Tùy chọn": "Mặc định" },
                  prices:
                    amount === null ? [] : [{ amount, currency_code: "vnd" }],
                },
              ],
            },
          },
        )
        savedProduct = response.product
      }

      if (!savedProduct)
        throw new Error("Không nhận được sản phẩm sau khi lưu.")
      await adminFetch(`/admin/products/${savedProduct.id}/catalog`, {
        method: "POST",
        body: {
          brand_id: brandId || null,
          model: model || null,
          specifications: specifications
            .filter((item) => item.key.trim() && item.value.trim())
            .map((item, position) => ({ ...item, position })),
          media_alt_text: Object.fromEntries(
            media
              .filter((item) => item.url && item.alt.trim())
              .map((item) => [item.url, item.alt.trim()]),
          ),
          // Saving from Admin is the moment a human vouches for the row, so a
          // seeded sample stops being flagged as unverified.
          data_source: "real",
          internal_note: null,
        },
      })
      return savedProduct
    },
    onSuccess: (saved) => router.push(`/products/${saved.id}`),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    )
    if (files.length) upload.mutate(files)
    event.target.value = ""
  }

  const dropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    )
    if (files.length) upload.mutate(files)
  }

  const addImageUrl = () => {
    const url = imageUrl.trim()
    if (!url || media.some((item) => item.url === url)) return
    setMedia((current) => [...current, { url, alt: "" }])
    setImageUrl("")
  }

  const updateSpecification = (
    index: number,
    key: keyof Omit<CatalogSpecification, "position">,
    value: string | boolean,
  ) => {
    setSpecifications((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
              ...(key === "label" && !item.key
                ? { key: slugifyCatalogValue(String(value), "_") }
                : {}),
            }
          : item,
      ),
    )
  }

  const applySpecificationPreset = () => {
    const selectedCategory = categories.data?.product_categories.find(
      (category) => category.id === categoryId,
    )
    const handle =
      selectedCategory?.parent_category?.handle ?? selectedCategory?.handle
    const existingKeys = new Set(specifications.map((item) => item.key))
    const additions = getSpecificationPreset(handle)
      .filter((item) => !existingKeys.has(item.key))
      .map((item, index) => ({
        ...item,
        value: "",
        position: specifications.length + index,
      }))
    setSpecifications((current) => [...current, ...additions])
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Panel
        title="Thông tin bán hàng"
        description="Nội dung chính được lưu qua Medusa Admin API"
      >
        <div className="panel-body form-grid">
          <Field label="Tên sản phẩm">
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="Handle">
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="tu-dong-neu-bo-trong"
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đang bán</option>
              <option value="proposed">Chờ duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </Field>
          <Field label="SKU">
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
            />
          </Field>
          <Field label="Giá bán">
            <MoneyInput value={price} onChange={setPrice} />
          </Field>
          <Field label="Mô tả">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </div>
      </Panel>
      <Panel
        title="Thông tin thiết bị"
        description="Nhập theo từng trường, không cần gõ cú pháp"
      >
        {catalog?.data_source === "demo_fixture" ? (
          <div className="panel-body">
            <div className="notice notice-warning" role="status">
              <strong>Dữ liệu mẫu chưa kiểm chứng.</strong>{" "}
              {catalog.internal_note ??
                "Giá và tồn kho do seed tạo, cần đối chiếu hàng thực tế."}{" "}
              Sau khi xác nhận, lưu lại sản phẩm để chuyển sang dữ liệu thật.
            </div>
          </div>
        ) : null}
        <div className="panel-body form-grid">
          <Field
            label="Thương hiệu"
            hint="Để trống nếu chưa xác định. Chỉ chọn Không rõ thương hiệu khi thật sự không có hãng."
          >
            <select
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
            >
              <option value="">Chưa chọn</option>
              {(
                Object.keys(CATALOG_BRAND_KIND_LABELS) as CatalogBrandKind[]
              ).map((kind) => {
                const group = (brands.data?.brands ?? []).filter(
                  (brand) => (brand.kind ?? "manufacturer") === kind,
                )
                if (!group.length) return null
                return (
                  <optgroup
                    key={kind}
                    label={CATALOG_BRAND_KIND_LABELS[kind]}
                  >
                    {group.map((brand) => (
                      <option value={brand.id} key={brand.id}>
                        {brand.name}
                        {brand.logo_url ? "" : " (chưa có logo)"}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </Field>
          <Field
            label="Danh mục chính"
            hint="Danh mục quyết định menu, bộ lọc và mẫu thông số trên website."
          >
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Chưa chọn danh mục</option>
              {categories.data?.product_categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.parent_category
                    ? `${category.parent_category.name} / `
                    : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Model">
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </Field>
          <div className="field-span-2">
            <SpecificationsInput
              values={specifications}
              canApplyPreset={Boolean(categoryId)}
              onApplyPreset={applySpecificationPreset}
              onAdd={() =>
                setSpecifications((current) => [
                  ...current,
                  blankSpecification(current.length),
                ])
              }
              onChange={updateSpecification}
              onRemove={(index) =>
                setSpecifications((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            />
          </div>
          <div className="field-span-2">
            <MediaInput
              media={media}
              url={imageUrl}
              isDragging={isDragging}
              isUploading={upload.isPending}
              uploadError={upload.error}
              inputRef={fileInputRef}
              onFiles={selectFiles}
              onDrop={dropFiles}
              onDragChange={setIsDragging}
              onUrlChange={setImageUrl}
              onAddUrl={addImageUrl}
              onAltChange={(index, alt) =>
                setMedia((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, alt } : item,
                  ),
                )
              }
              onRemove={(index) =>
                setMedia((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            />
          </div>
        </div>
      </Panel>
      {save.isError ? (
        <div className="form-error">
          {save.error.message} Nếu hệ thống yêu cầu xác thực nâng cao, hãy vào
          Nhân viên & bảo mật để tạo phiên MFA.
        </div>
      ) : null}
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => router.back()}
        >
          Hủy
        </button>
        <button
          className="button"
          disabled={save.isPending || upload.isPending}
        >
          {save.isPending ? "Đang lưu..." : "Lưu sản phẩm"}
        </button>
      </div>
    </form>
  )
}

function MoneyInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const add = (amount: number) =>
    onChange(formatVndInput((parseVndInput(value) ?? 0) + amount))

  return (
    <div className="money-input">
      <div className="money-control">
        <span>₫</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(formatVndInput(event.target.value))}
          placeholder="0"
          aria-label="Giá VND"
        />
      </div>
      <div className="money-shortcuts">
        <button type="button" onClick={() => add(100_000)}>
          +100k
        </button>
        <button type="button" onClick={() => add(500_000)}>
          +500k
        </button>
        <button type="button" onClick={() => add(1_000_000)}>
          +1tr
        </button>
      </div>
    </div>
  )
}

function SpecificationsInput({
  values,
  canApplyPreset,
  onApplyPreset,
  onAdd,
  onChange,
  onRemove,
}: {
  values: CatalogSpecification[]
  canApplyPreset: boolean
  onApplyPreset: () => void
  onAdd: () => void
  onChange: (
    index: number,
    key: keyof Omit<CatalogSpecification, "position">,
    value: string | boolean,
  ) => void
  onRemove: (index: number) => void
}) {
  return (
    <section className="editor-section">
      <div className="editor-heading">
        <div>
          <strong>Thông số</strong>
          <span>Thêm từng dòng, dễ sửa và kiểm tra trước khi lưu.</span>
        </div>
        <div className="editor-actions">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={onApplyPreset}
            disabled={!canApplyPreset}
          >
            Điền mẫu theo danh mục
          </button>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={onAdd}
          >
            Thêm thông số
          </button>
        </div>
      </div>
      {groupSpecifications(values).map((section) => (
        <div className="specification-group" key={section.group}>
          <h4 className="specification-group-title">{section.group}</h4>
          <div className="specification-list">
            {section.rows.map(({ item, index }) => (
              <div className="specification-row" key={`${item.key}-${index}`}>
                <input
                  value={item.label}
                  onChange={(event) => onChange(index, "label", event.target.value)}
                  placeholder="Tên hiển thị"
                  aria-label="Tên hiển thị"
                />
                <input
                  value={item.value}
                  onChange={(event) => onChange(index, "value", event.target.value)}
                  placeholder={
                    item.multi ? "Giá trị 1, giá trị 2" : "Giá trị"
                  }
                  aria-label="Giá trị"
                />
                <input
                  value={item.unit}
                  onChange={(event) => onChange(index, "unit", event.target.value)}
                  placeholder="Đơn vị"
                  aria-label="Đơn vị"
                />
                <select
                  value={item.group}
                  onChange={(event) => onChange(index, "group", event.target.value)}
                  aria-label="Nhóm thông số"
                >
                  {CATALOG_SPECIFICATION_GROUPS.includes(
                    item.group as (typeof CATALOG_SPECIFICATION_GROUPS)[number],
                  ) ? null : (
                    <option value={item.group}>{item.group || "Chưa phân nhóm"}</option>
                  )}
                  {CATALOG_SPECIFICATION_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <input
                  value={item.key}
                  onChange={(event) => onChange(index, "key", event.target.value)}
                  placeholder="Mã"
                  aria-label="Mã thông số"
                />
                <label className="specification-flag">
                  <input
                    type="checkbox"
                    checked={item.filterable !== false}
                    onChange={(event) =>
                      onChange(index, "filterable", event.target.checked)
                    }
                  />
                  Dùng lọc
                </label>
                <label className="specification-flag">
                  <input
                    type="checkbox"
                    checked={item.featured === true}
                    onChange={(event) =>
                      onChange(index, "featured", event.target.checked)
                    }
                  />
                  Nổi bật
                </label>
                <label className="specification-flag">
                  <input
                    type="checkbox"
                    checked={item.multi === true}
                    onChange={(event) =>
                      onChange(index, "multi", event.target.checked)
                    }
                  />
                  Nhiều giá trị
                </label>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Xóa thông số"
                  onClick={() => onRemove(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!values.length ? (
        <button type="button" className="text-button" onClick={onAdd}>
          + Thêm thông số đầu tiên
        </button>
      ) : null}
    </section>
  )
}

/**
 * Buckets rows by their group for display while keeping each row's original index,
 * so edits still address the right entry in the flat specifications array.
 */
function groupSpecifications(values: CatalogSpecification[]) {
  const sections = new Map<
    string,
    { group: string; rows: { item: CatalogSpecification; index: number }[] }
  >()

  values.forEach((item, index) => {
    const group = item.group?.trim() || "Chưa phân nhóm"
    const section = sections.get(group) ?? { group, rows: [] }
    section.rows.push({ item, index })
    sections.set(group, section)
  })

  const order = [...CATALOG_SPECIFICATION_GROUPS] as string[]
  return Array.from(sections.values()).sort((left, right) => {
    const leftRank = order.indexOf(left.group)
    const rightRank = order.indexOf(right.group)
    return (
      (leftRank === -1 ? order.length : leftRank) -
      (rightRank === -1 ? order.length : rightRank)
    )
  })
}

function MediaInput({
  media,
  url,
  isDragging,
  isUploading,
  uploadError,
  inputRef,
  onFiles,
  onDrop,
  onDragChange,
  onUrlChange,
  onAddUrl,
  onAltChange,
  onRemove,
}: {
  media: ProductMedia[]
  url: string
  isDragging: boolean
  isUploading: boolean
  uploadError: Error | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onFiles: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onDragChange: (value: boolean) => void
  onUrlChange: (value: string) => void
  onAddUrl: () => void
  onAltChange: (index: number, alt: string) => void
  onRemove: (index: number) => void
}) {
  return (
    <section className="editor-section">
      <div className="editor-heading">
        <div>
          <strong>Media</strong>
          <span>Chọn hoặc kéo thả ảnh để tải trực tiếp lên Medusa.</span>
        </div>
      </div>
      <input
        className="sr-only"
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
      />
      <div
        className={`media-dropzone${isDragging ? " media-dropzone-active" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          onDragChange(true)
        }}
        onDragLeave={() => onDragChange(false)}
        onDrop={onDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            inputRef.current?.click()
        }}
      >
        <strong>
          {isUploading ? "Đang tải ảnh..." : "Kéo thả ảnh vào đây"}
        </strong>
        <span>hoặc bấm để chọn nhiều ảnh</span>
      </div>
      <div className="media-url">
        <input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onAddUrl()
            }
          }}
          placeholder="Dán URL ảnh nếu cần"
        />
        <button
          type="button"
          className="button button-secondary button-small"
          onClick={onAddUrl}
        >
          Thêm URL
        </button>
      </div>
      {uploadError ? (
        <div className="form-error">{uploadError.message}</div>
      ) : null}
      <div className="media-grid">
        {media.map((item, index) => (
          <article className="media-card" key={item.url}>
            <Image
              unoptimized
              width={180}
              height={136}
              src={item.url}
              alt={item.alt || "Ảnh sản phẩm"}
            />
            <div>
              <input
                value={item.alt}
                onChange={(event) => onAltChange(index, event.target.value)}
                placeholder="Mô tả ảnh (không bắt buộc)"
              />
              <button
                type="button"
                className="text-button"
                onClick={() => onRemove(index)}
              >
                Xóa ảnh
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function formatVndInput(value?: number | string) {
  const amount = parseVndInput(String(value ?? ""))
  return amount === null
    ? ""
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
        amount,
      )
}

function parseVndInput(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return null
  const amount = Number(digits)
  return Number.isSafeInteger(amount) ? amount : null
}

function blankSpecification(position: number): CatalogSpecification {
  return {
    key: "",
    label: "",
    value: "",
    unit: "",
    group: "Cấu hình",
    filterable: true,
    featured: false,
    multi: false,
    position,
  }
}

function readSpecifications(catalog?: ProductCatalog) {
  return (
    catalog?.specifications?.items?.map((item, position) => ({
      ...item,
      position,
    })) ?? []
  )
}

function readMedia(product?: Product, catalog?: ProductCatalog) {
  return (product?.images ?? []).map((image) => ({
    url: image.url,
    alt: catalog?.media_alt_text?.[image.url] ?? "",
  }))
}
