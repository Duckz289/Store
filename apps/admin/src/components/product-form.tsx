"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

import { Field, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { CatalogBrand, Product, ProductCatalog } from "@/lib/types"

type ProductFormProps = { product?: Product; catalog?: ProductCatalog }

export function ProductForm({ product, catalog }: ProductFormProps) {
  const router = useRouter()
  const variant = product?.variants?.[0]
  const [title, setTitle] = useState(product?.title ?? "")
  const [handle, setHandle] = useState(product?.handle ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [status, setStatus] = useState(product?.status ?? "draft")
  const [sku, setSku] = useState(variant?.sku ?? "")
  const [price, setPrice] = useState(String(variant?.prices?.[0]?.amount ?? ""))
  const [brandId, setBrandId] = useState(catalog?.brand?.id ?? "")
  const [model, setModel] = useState(catalog?.model ?? "")
  const [specs, setSpecs] = useState(serializeSpecs(catalog))
  const [images, setImages] = useState((product?.images ?? []).map((image) => image.url).join("\n"))
  const [altText, setAltText] = useState(serializeAltText(catalog))

  useEffect(() => {
    if (!product) return
    setTitle(product.title)
    setHandle(product.handle ?? "")
    setDescription(product.description ?? "")
    setStatus(product.status ?? "draft")
    setSku(product.variants?.[0]?.sku ?? "")
    setPrice(String(product.variants?.[0]?.prices?.[0]?.amount ?? ""))
    setImages((product.images ?? []).map((image) => image.url).join("\n"))
    setBrandId(catalog?.brand?.id ?? "")
    setModel(catalog?.model ?? "")
    setSpecs(serializeSpecs(catalog))
    setAltText(serializeAltText(catalog))
  }, [product, catalog])

  const brands = useQuery({ queryKey: ["catalog-brands"], queryFn: () => adminFetch<{ brands: CatalogBrand[] }>("/admin/catalog/brands") })
  const save = useMutation({
    mutationFn: async () => {
      let savedProduct = product
      const imageList = images.split("\n").map((value) => value.trim()).filter(Boolean).map((url) => ({ url }))
      if (product) {
        const response = await adminFetch<{ product: Product }>(`/admin/products/${product.id}`, { method: "POST", body: { title, handle: handle || undefined, description, status, images: imageList } })
        savedProduct = response.product
        if (variant) await adminFetch(`/admin/products/${product.id}/variants/${variant.id}`, { method: "POST", body: { sku: sku || null, prices: price ? [{ amount: Number(price), currency_code: "vnd" }] : [] } })
      } else {
        const response = await adminFetch<{ product: Product }>("/admin/products", { method: "POST", body: { title, handle: handle || undefined, description, status, images: imageList, options: [{ title: "Tùy chọn", values: ["Mặc định"] }], variants: [{ title: "Mặc định", sku: sku || undefined, options: { "Tùy chọn": "Mặc định" }, prices: price ? [{ amount: Number(price), currency_code: "vnd" }] : [] }] } })
        savedProduct = response.product
      }
      if (!savedProduct) throw new Error("Không nhận được sản phẩm sau khi lưu.")
      await adminFetch(`/admin/products/${savedProduct.id}/catalog`, { method: "POST", body: { brand_id: brandId || null, model: model || null, specifications: parseSpecs(specs), media_alt_text: parseAltText(altText) } })
      return savedProduct
    },
    onSuccess: (saved) => router.push(`/products/${saved.id}`),
  })

  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate() }

  return <form className="stack" onSubmit={submit}>
    <Panel title="Thông tin bán hàng" description="Nội dung chính được lưu qua Medusa Admin API"><div className="panel-body form-grid">
      <Field label="Tên sản phẩm"><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="Handle"><input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="tu-dong-neu-bo-trong" /></Field>
      <Field label="Trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="proposed">Chờ duyệt</option><option value="rejected">Từ chối</option></select></Field>
      <Field label="SKU"><input value={sku} onChange={(event) => setSku(event.target.value)} /></Field>
      <Field label="Giá VND"><input min="0" step="1" type="number" value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
      <Field label="Mô tả"><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
    </div></Panel>
    <Panel title="Thông tin thiết bị" description="Brand, model và specs được lưu qua custom catalog API"><div className="panel-body form-grid">
      <Field label="Thương hiệu"><select value={brandId} onChange={(event) => setBrandId(event.target.value)}><option value="">Chưa chọn</option>{brands.data?.brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></Field>
      <Field label="Model"><input value={model} onChange={(event) => setModel(event.target.value)} /></Field>
      <Field label="Thông số" hint="Mỗi dòng: key | nhãn | giá trị | đơn vị" ><textarea value={specs} onChange={(event) => setSpecs(event.target.value)} placeholder="screen | Màn hình | 6.7 | inch" /></Field>
      <Field label="Media" hint="Mỗi dòng một URL ảnh"><textarea value={images} onChange={(event) => setImages(event.target.value)} /></Field>
      <div className="field-span-2"><Field label="Alt text media" hint="Mỗi dòng: URL | mô tả ảnh"><textarea value={altText} onChange={(event) => setAltText(event.target.value)} /></Field></div>
    </div></Panel>
    {save.isError ? <div className="form-error">{save.error.message} Nếu hệ thống yêu cầu xác thực nâng cao, hãy vào Nhân viên & bảo mật để tạo phiên MFA.</div> : null}
    <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => router.back()}>Hủy</button><button className="button" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu sản phẩm"}</button></div>
  </form>
}

function serializeSpecs(catalog?: ProductCatalog) {
  return catalog?.specifications?.items?.map((item) => [item.key, item.label, item.value, item.unit].join(" | ")).join("\n") ?? ""
}

function parseSpecs(value: string) {
  return value.split("\n").map((line, position) => { const [key, label, itemValue, unit = ""] = line.split("|").map((part) => part.trim()); return { key, label: label || key, value: itemValue, unit, group: "Thông số", position } }).filter((item) => item.key && item.value)
}

function serializeAltText(catalog?: ProductCatalog) {
  return Object.entries(catalog?.media_alt_text ?? {}).map(([url, text]) => `${url} | ${text}`).join("\n")
}

function parseAltText(value: string) {
  return Object.fromEntries(value.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter(([url, text]) => url && text).map(([url, text]) => [url, text]))
}
