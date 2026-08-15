"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react"

import {
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { slugifyCatalogValue } from "@/lib/catalog-presets"
import { sdk } from "@/lib/sdk"
import {
  CATALOG_BRAND_KIND_LABELS,
  type CatalogBrand,
  type CatalogBrandKind,
  type ProductCategory,
} from "@/lib/types"

const LOGO_MIME_TYPES = ["image/svg+xml", "image/png", "image/webp"]
const LOGO_MAX_BYTES = 512 * 1024

export default function CatalogPage() {
  const queryClient = useQueryClient()
  const [brandName, setBrandName] = useState("")
  const [brandHandle, setBrandHandle] = useState("")
  const [brandKind, setBrandKind] = useState<CatalogBrandKind>("manufacturer")
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [brandLogoAlt, setBrandLogoAlt] = useState("")
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false)
  const [brandLogoError, setBrandLogoError] = useState<string | null>(null)
  const newBrandLogoInputRef = useRef<HTMLInputElement>(null)
  const editBrandLogoInputRef = useRef<HTMLInputElement>(null)
  const [editingBrand, setEditingBrand] = useState<CatalogBrand | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryHandle, setCategoryHandle] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState("")

  const brands = useQuery({
    queryKey: ["catalog-brands"],
    queryFn: () =>
      adminFetch<{ brands: CatalogBrand[] }>("/admin/catalog/brands"),
  })
  const categories = useQuery({
    queryKey: ["product-categories"],
    queryFn: () =>
      adminFetch<{ product_categories: ProductCategory[] }>(
        "/admin/product-categories?limit=100&fields=id,name,handle,is_active,rank,parent_category_id,parent_category.*",
      ),
  })

  const createBrand = useMutation({
    mutationFn: () =>
      adminFetch("/admin/catalog/brands", {
        method: "POST",
        body: {
          name: brandName.trim(),
          handle: brandHandle.trim() || slugifyCatalogValue(brandName.trim()),
          kind: brandKind,
          logo_url: brandLogoUrl.trim() || null,
          logo_alt: brandLogoAlt.trim() || null,
        },
      }),
    onSuccess: async () => {
      setBrandName("")
      setBrandHandle("")
      setBrandKind("manufacturer")
      setBrandLogoUrl("")
      setBrandLogoAlt("")
      await queryClient.invalidateQueries({ queryKey: ["catalog-brands"] })
    },
  })

  const updateBrand = useMutation({
    mutationFn: (brand: CatalogBrand) =>
      adminFetch(`/admin/catalog/brands/${brand.id}`, {
        method: "POST",
        body: {
          name: brand.name.trim(),
          handle: brand.handle.trim(),
          kind: brand.kind ?? "manufacturer",
          logo_url: brand.logo_url?.trim() || null,
          logo_alt: brand.logo_alt?.trim() || null,
        },
      }),
    onSuccess: async () => {
      setEditingBrand(null)
      await queryClient.invalidateQueries({ queryKey: ["catalog-brands"] })
    },
  })

  const deleteBrand = useMutation({
    mutationFn: (brand: CatalogBrand) =>
      adminFetch(`/admin/catalog/brands/${brand.id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["catalog-brands"] }),
  })

  const createCategory = useMutation({
    mutationFn: () =>
      adminFetch("/admin/product-categories", {
        method: "POST",
        body: {
          name: categoryName.trim(),
          handle:
            categoryHandle.trim() || slugifyCatalogValue(categoryName.trim()),
          is_active: true,
          ...(parentCategoryId
            ? { parent_category_id: parentCategoryId }
            : {}),
        },
      }),
    onSuccess: async () => {
      setCategoryName("")
      setCategoryHandle("")
      setParentCategoryId("")
      await queryClient.invalidateQueries({ queryKey: ["product-categories"] })
    },
  })

  const topLevelCategories = useMemo(
    () =>
      (categories.data?.product_categories ?? []).filter(
        (category) => !category.parent_category_id,
      ),
    [categories.data?.product_categories],
  )

  const submitBrand = (event: FormEvent) => {
    event.preventDefault()
    if (brandName.trim()) createBrand.mutate()
  }

  const submitCategory = (event: FormEvent) => {
    event.preventDefault()
    if (categoryName.trim()) createCategory.mutate()
  }

  const uploadBrandLogo = async (
    event: ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setBrandLogoError(null)

    if (!LOGO_MIME_TYPES.includes(file.type)) {
      setBrandLogoError(
        "Logo phải là SVG, PNG hoặc WebP nền trong suốt hoặc nền trắng.",
      )
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setBrandLogoError(
        `Logo tối đa ${Math.round(LOGO_MAX_BYTES / 1024)} KB. File đang chọn ${Math.round(
          file.size / 1024,
        )} KB.`,
      )
      return
    }

    setIsUploadingBrandLogo(true)
    try {
      const response = await sdk.admin.upload.create({ files: [file] })
      const url = response.files[0]?.url
      if (!url) throw new Error("Không nhận được URL logo từ Medusa.")
      onUploaded(url)
    } catch (error) {
      setBrandLogoError(
        error instanceof Error ? error.message : "Không thể tải logo lên.",
      )
    } finally {
      setIsUploadingBrandLogo(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Catalog"
        title="Danh mục và thương hiệu"
        description="Một nguồn dữ liệu dùng chung cho menu, tìm kiếm, bộ lọc và form sản phẩm."
      />

      <Panel
        title="Thương hiệu"
        description="Chỉ những thương hiệu có sản phẩm đang bán mới xuất hiện trên Storefront."
      >
        <form className="panel-body form-grid" onSubmit={submitBrand}>
          <label className="field">
            <span>Tên hãng</span>
            <input
              required
              value={brandName}
              onChange={(event) => {
                setBrandName(event.target.value)
                if (!brandHandle)
                  setBrandHandle(slugifyCatalogValue(event.target.value))
              }}
              placeholder="Ví dụ: Panasonic"
            />
          </label>
          <label className="field">
            <span>Handle</span>
            <input
              required
              value={brandHandle}
              onChange={(event) => setBrandHandle(event.target.value)}
              placeholder="panasonic"
            />
          </label>
          <label className="field">
            <span>Loại thương hiệu</span>
            <select
              value={brandKind}
              onChange={(event) =>
                setBrandKind(event.target.value as CatalogBrandKind)
              }
            >
              {Object.entries(CATALOG_BRAND_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <small>
              Nhãn cửa hàng dùng cho hàng bán dưới tên Hưng Phát. Không rõ thương
              hiệu chỉ chọn khi thật sự không xác định được hãng.
            </small>
          </label>
          <BrandLogoField
            value={brandLogoUrl}
            onChange={setBrandLogoUrl}
            altValue={brandLogoAlt}
            onAltChange={setBrandLogoAlt}
            brandName={brandName}
            inputRef={newBrandLogoInputRef}
            isUploading={isUploadingBrandLogo}
            onUpload={(event) => uploadBrandLogo(event, setBrandLogoUrl)}
          />
          <div className="field-span-2 form-actions form-actions-inline">
            <button className="button" disabled={createBrand.isPending}>
              {createBrand.isPending ? "Đang thêm..." : "Thêm thương hiệu"}
            </button>
          </div>
        </form>
        {createBrand.isError ? (
          <div className="form-error">{createBrand.error.message}</div>
        ) : null}
        {brandLogoError ? <div className="form-error">{brandLogoError}</div> : null}
        {brands.isLoading ? (
          <LoadingState />
        ) : brands.isError ? (
          <ErrorState error={brands.error} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Tên hãng</th>
                  <th>Logo</th>
                  <th>Loại</th>
                  <th>Handle</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.data?.brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>{brand.name}</td>
                    <td>
                      <div className="brand-logo-cell">
                        <BrandLogoPreview brand={brand} />
                        {brand.logo_url ? null : (
                          <span className="badge badge-warning">Chưa có logo</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {CATALOG_BRAND_KIND_LABELS[
                        (brand.kind ?? "manufacturer") as CatalogBrandKind
                      ]}
                    </td>
                    <td>/{brand.handle}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setEditingBrand({ ...brand })}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="text-button text-button-danger"
                          onClick={() => {
                            if (window.confirm(`Xóa thương hiệu ${brand.name}?`))
                              deleteBrand.mutate(brand)
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        {deleteBrand.isError ? (
          <div className="form-error">
            Không thể xóa hãng đang được gắn với sản phẩm.
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Danh mục sản phẩm"
        description="Có thể tạo danh mục cha và danh mục con cho đồ gia dụng, điện lạnh và thiết bị điện."
      >
        <form className="panel-body form-grid" onSubmit={submitCategory}>
          <label className="field">
            <span>Tên danh mục</span>
            <input
              required
              value={categoryName}
              onChange={(event) => {
                setCategoryName(event.target.value)
                if (!categoryHandle)
                  setCategoryHandle(slugifyCatalogValue(event.target.value))
              }}
              placeholder="Ví dụ: Nồi cơm điện"
            />
          </label>
          <label className="field">
            <span>Danh mục cha</span>
            <select
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
            >
              <option value="">Danh mục cấp cao nhất</option>
              {topLevelCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Handle</span>
            <input
              required
              value={categoryHandle}
              onChange={(event) => setCategoryHandle(event.target.value)}
              placeholder="noi-com-dien"
            />
          </label>
          <div className="field form-submit-field">
            <button className="button" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Đang thêm..." : "Thêm danh mục"}
            </button>
          </div>
        </form>
        {createCategory.isError ? (
          <div className="form-error">{createCategory.error.message}</div>
        ) : null}
        {categories.isLoading ? (
          <LoadingState />
        ) : categories.isError ? (
          <ErrorState error={categories.error} />
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th>Cấp cha</th>
                  <th>Handle</th>
                </tr>
              </thead>
              <tbody>
                {categories.data?.product_categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.parent_category?.name ?? "Cấp cao nhất"}</td>
                    <td>/{category.handle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {editingBrand ? (
        <div className="dialog-backdrop" role="presentation">
          <form
            className="dialog-card"
            onSubmit={(event) => {
              event.preventDefault()
              updateBrand.mutate(editingBrand)
            }}
          >
            <h2>Sửa thương hiệu</h2>
            <label className="field">
              <span>Tên hãng</span>
              <input
                value={editingBrand.name}
                onChange={(event) =>
                  setEditingBrand({ ...editingBrand, name: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Handle</span>
              <input
                value={editingBrand.handle}
                onChange={(event) =>
                  setEditingBrand({
                    ...editingBrand,
                    handle: event.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Loại thương hiệu</span>
              <select
                value={editingBrand.kind ?? "manufacturer"}
                onChange={(event) =>
                  setEditingBrand({
                    ...editingBrand,
                    kind: event.target.value as CatalogBrandKind,
                  })
                }
              >
                {Object.entries(CATALOG_BRAND_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <BrandLogoField
              value={editingBrand.logo_url ?? ""}
              onChange={(logo_url) =>
                setEditingBrand({ ...editingBrand, logo_url })
              }
              altValue={editingBrand.logo_alt ?? ""}
              onAltChange={(logo_alt) =>
                setEditingBrand((current) =>
                  current ? { ...current, logo_alt } : current,
                )
              }
              brandName={editingBrand.name}
              inputRef={editBrandLogoInputRef}
              isUploading={isUploadingBrandLogo}
              onUpload={(event) =>
                uploadBrandLogo(event, (logo_url) =>
                  setEditingBrand((current) =>
                    current ? { ...current, logo_url } : current,
                  ),
                )
              }
            />
            {brandLogoError ? (
              <div className="form-error">{brandLogoError}</div>
            ) : null}
            {updateBrand.isError ? (
              <div className="form-error">{updateBrand.error.message}</div>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditingBrand(null)}
              >
                Hủy
              </button>
              <button className="button" disabled={updateBrand.isPending}>
                Lưu thương hiệu
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function BrandLogoField({
  value,
  onChange,
  altValue,
  onAltChange,
  brandName,
  inputRef,
  isUploading,
  onUpload,
}: {
  value: string
  onChange: (value: string) => void
  altValue: string
  onAltChange: (value: string) => void
  brandName: string
  inputRef: React.RefObject<HTMLInputElement | null>
  isUploading: boolean
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const isValidUrl = !value.trim() || /^https?:\/\//i.test(value.trim())

  return (
    <div className="field field-span-2">
      <span className="field-label">Logo thương hiệu</span>
      <div className="brand-logo-field">
        <BrandLogoPreview
          brand={{
            id: "preview",
            name: brandName || "Logo",
            handle: "logo",
            logo_url: value,
          }}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Dán URL ảnh logo hoặc tải ảnh lên"
          aria-invalid={!isValidUrl}
        />
        <input
          className="sr-only"
          ref={inputRef}
          type="file"
          accept="image/svg+xml,image/png,image/webp"
          onChange={onUpload}
        />
        <button
          type="button"
          className="button button-secondary button-small"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Đang tải..." : value ? "Thay logo" : "Tải logo"}
        </button>
        {value ? (
          <button
            type="button"
            className="text-button text-button-danger"
            onClick={() => {
              onChange("")
              onAltChange("")
            }}
          >
            Xóa logo
          </button>
        ) : null}
      </div>
      {!isValidUrl ? (
        <small className="field-error">URL logo phải bắt đầu bằng http hoặc https.</small>
      ) : (
        <small>
          SVG, PNG hoặc WebP, tối đa {Math.round(LOGO_MAX_BYTES / 1024)} KB, nền
          trong suốt hoặc nền trắng. Hiển thị trong menu danh mục và bộ lọc.
        </small>
      )}
      {value ? (
        <label className="field">
          <span>Mô tả ảnh (alt)</span>
          <input
            value={altValue}
            onChange={(event) => onAltChange(event.target.value)}
            placeholder={brandName ? `Logo ${brandName}` : "Logo thương hiệu"}
            maxLength={300}
          />
        </label>
      ) : null}
    </div>
  )
}

function BrandLogoPreview({ brand }: { brand: CatalogBrand }) {
  // Deliberately no initials fallback: a monogram would read as a brand identity
  // the shop has not actually got. An empty frame is the honest state.
  return (
    <span className="brand-logo-preview">
      {brand.logo_url ? (
        <Image
          src={brand.logo_url}
          alt={brand.logo_alt?.trim() || `Logo ${brand.name}`}
          width={34}
          height={34}
          unoptimized
        />
      ) : (
        <span className="brand-logo-empty" aria-hidden="true" />
      )}
    </span>
  )
}
