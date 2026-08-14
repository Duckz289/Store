"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"

import {
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { slugifyCatalogValue } from "@/lib/catalog-presets"
import type { CatalogBrand, ProductCategory } from "@/lib/types"

export default function CatalogPage() {
  const queryClient = useQueryClient()
  const [brandName, setBrandName] = useState("")
  const [brandHandle, setBrandHandle] = useState("")
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
          handle:
            brandHandle.trim() || slugifyCatalogValue(brandName.trim()),
        },
      }),
    onSuccess: async () => {
      setBrandName("")
      setBrandHandle("")
      await queryClient.invalidateQueries({ queryKey: ["catalog-brands"] })
    },
  })

  const updateBrand = useMutation({
    mutationFn: (brand: CatalogBrand) =>
      adminFetch(`/admin/catalog/brands/${brand.id}`, {
        method: "POST",
        body: { name: brand.name.trim(), handle: brand.handle.trim() },
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
          <div className="field-span-2 form-actions form-actions-inline">
            <button className="button" disabled={createBrand.isPending}>
              {createBrand.isPending ? "Đang thêm..." : "Thêm thương hiệu"}
            </button>
          </div>
        </form>
        {createBrand.isError ? (
          <div className="form-error">{createBrand.error.message}</div>
        ) : null}
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
                  <th>Handle</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.data?.brands.map((brand) => (
                  <tr key={brand.id}>
                    <td>{brand.name}</td>
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
