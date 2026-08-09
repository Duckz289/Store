import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import { rememberCurrentAdminPath } from "../lib/mfa-return-path"
import { sdk } from "../lib/sdk"
import type {
  CatalogBrand,
  CatalogSpecification,
  ProductCatalogResponse,
} from "../types/catalog"

type CatalogForm = {
  brandId: string
  model: string
  specifications: CatalogSpecification[]
  mediaAltText: Record<string, string>
  categoryPositions: Record<string, string>
  collectionPositions: Record<string, string>
  homepagePosition: string
}

const emptyForm: CatalogForm = {
  brandId: "",
  model: "",
  specifications: [],
  mediaAltText: {},
  categoryPositions: {},
  collectionPositions: {},
  homepagePosition: "",
}

const parsePositions = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, Number(value)])
  )

const toHandle = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const ProductCatalogWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CatalogForm>(emptyForm)
  const [newBrandName, setNewBrandName] = useState("")

  useEffect(() => {
    rememberCurrentAdminPath()
  }, [])

  const catalogQuery = useQuery({
    queryKey: ["product-catalog", data.id],
    queryFn: () =>
      sdk.client.fetch<ProductCatalogResponse>(
        `/admin/products/${data.id}/catalog`
      ),
  })
  const brandsQuery = useQuery({
    queryKey: ["catalog-brands"],
    queryFn: () =>
      sdk.client.fetch<{ brands: CatalogBrand[] }>("/admin/catalog/brands"),
  })

  useEffect(() => {
    const response = catalogQuery.data
    if (!response) {
      return
    }
    const catalog = response.catalog
    setForm({
      brandId: catalog?.brand?.id ?? "",
      model: catalog?.model ?? "",
      specifications: catalog?.specifications?.items ?? [],
      mediaAltText: catalog?.media_alt_text ?? {},
      categoryPositions: Object.fromEntries(
        Object.entries(catalog?.merchandising?.categories ?? {}).map(
          ([key, value]) => [key, String(value)]
        )
      ),
      collectionPositions: Object.fromEntries(
        Object.entries(catalog?.merchandising?.collections ?? {}).map(
          ([key, value]) => [key, String(value)]
        )
      ),
      homepagePosition:
        catalog?.merchandising?.homepage?.["flash-deal"]?.toString() ?? "",
    })
  }, [catalogQuery.data])

  const images = useMemo(() => {
    const urls = new Set<string>()
    if (catalogQuery.data?.product.thumbnail) {
      urls.add(catalogQuery.data.product.thumbnail)
    }
    for (const image of catalogQuery.data?.product.images ?? []) {
      urls.add(image.url)
    }
    return [...urls]
  }, [catalogQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<ProductCatalogResponse>(
        `/admin/products/${data.id}/catalog`,
        {
          method: "POST",
          body: {
            brand_id: form.brandId || null,
            model: form.model || null,
            specifications: form.specifications.map((specification, index) => ({
              ...specification,
              position: index,
            })),
            media_alt_text: form.mediaAltText,
            merchandising: {
              categories: parsePositions(form.categoryPositions),
              collections: parsePositions(form.collectionPositions),
              homepage:
                form.homepagePosition === ""
                  ? {}
                  : { "flash-deal": Number(form.homepagePosition) },
            },
          },
        }
      ),
    onSuccess: () => {
      toast.success("Catalog details saved")
      queryClient.invalidateQueries({
        queryKey: ["product-catalog", data.id],
      })
    },
    onError: (error) =>
      toast.error("Catalog details could not be saved", {
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const createBrandMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ brand: CatalogBrand }>("/admin/catalog/brands", {
        method: "POST",
        body: { name: newBrandName, handle: toHandle(newBrandName) },
      }),
    onSuccess: ({ brand }) => {
      setForm((current) => ({ ...current, brandId: brand.id }))
      setNewBrandName("")
      queryClient.invalidateQueries({ queryKey: ["catalog-brands"] })
      toast.success("Brand created")
    },
    onError: (error) =>
      toast.error("Brand could not be created", {
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const previewMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ url: string }>(
        `/admin/products/${data.id}/preview`,
        { method: "POST" }
      ),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (error) =>
      toast.error("Preview could not be opened", {
        description: error instanceof Error ? error.message : undefined,
      }),
  })

  const updateSpecification = (
    index: number,
    field: keyof CatalogSpecification,
    value: string
  ) =>
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((specification, itemIndex) =>
        itemIndex === index
          ? {
              ...specification,
              [field]: field === "position" ? Number(value) : value,
            }
          : specification
      ),
    }))

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Brand, model and specifications</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Structured catalog data consumed by the storefront.
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => previewMutation.mutate()}
          isLoading={previewMutation.isPending}
        >
          Preview storefront
        </Button>
      </div>

      {catalogQuery.isLoading ? (
        <Text className="px-6 py-4">Loading catalog details...</Text>
      ) : catalogQuery.error ? (
        <Text className="px-6 py-4 text-ui-fg-error">
          Catalog details could not be loaded.
        </Text>
      ) : (
        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catalog-brand">Brand</Label>
              <select
                id="catalog-brand"
                value={form.brandId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
                className="bg-ui-bg-field border-ui-border-base h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="">No brand</option>
                {(brandsQuery.data?.brands ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-model">Model</Label>
              <Input
                id="catalog-model"
                value={form.model}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                placeholder="Model or family identifier"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={newBrandName}
              onChange={(event) => setNewBrandName(event.target.value)}
              placeholder="New brand name"
            />
            <Button
              size="small"
              variant="secondary"
              disabled={!newBrandName.trim() || !toHandle(newBrandName)}
              isLoading={createBrandMutation.isPending}
              onClick={() => createBrandMutation.mutate()}
            >
              Create brand
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Heading level="h3">Specifications</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Keys are stable snake_case identifiers used by future filters.
                </Text>
              </div>
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    specifications: [
                      ...current.specifications,
                      {
                        key: "",
                        label: "",
                        value: "",
                        unit: "",
                        group: "general",
                        position: current.specifications.length,
                      },
                    ],
                  }))
                }
              >
                Add field
              </Button>
            </div>
            {form.specifications.map((specification, index) => (
              <div
                key={`${specification.key}-${index}`}
                className="border-ui-border-base grid gap-2 rounded-lg border p-3 md:grid-cols-5"
              >
                <Input
                  value={specification.key}
                  onChange={(event) =>
                    updateSpecification(index, "key", event.target.value)
                  }
                  placeholder="key"
                />
                <Input
                  value={specification.label}
                  onChange={(event) =>
                    updateSpecification(index, "label", event.target.value)
                  }
                  placeholder="Label"
                />
                <Input
                  value={specification.value}
                  onChange={(event) =>
                    updateSpecification(index, "value", event.target.value)
                  }
                  placeholder="Value"
                />
                <Input
                  value={specification.unit}
                  onChange={(event) =>
                    updateSpecification(index, "unit", event.target.value)
                  }
                  placeholder="Unit"
                />
                <Button
                  size="small"
                  variant="danger"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      specifications: current.specifications.filter(
                        (_, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {images.length ? (
            <div className="space-y-3">
              <Heading level="h3">Image alt text</Heading>
              {images.map((url) => (
                <div key={url} className="grid gap-2 md:grid-cols-[1fr_2fr]">
                  <Text size="xsmall" className="truncate text-ui-fg-subtle">
                    {url}
                  </Text>
                  <Input
                    value={form.mediaAltText[url] ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mediaAltText: {
                          ...current.mediaAltText,
                          [url]: event.target.value,
                        },
                      }))
                    }
                    placeholder="Accessible image description"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <Heading level="h3">Merchandising positions</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Lower values appear first. Each context remains independent.
              </Text>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {(catalogQuery.data?.product.categories ?? []).map((category) => (
                <div key={category.id} className="space-y-2">
                  <Label>{category.name}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.categoryPositions[category.id] ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        categoryPositions: {
                          ...current.categoryPositions,
                          [category.id]: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ))}
              {catalogQuery.data?.product.collection ? (
                <div className="space-y-2">
                  <Label>{catalogQuery.data.product.collection.title}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={
                      form.collectionPositions[
                        catalogQuery.data.product.collection.id
                      ] ?? ""
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        collectionPositions: {
                          ...current.collectionPositions,
                          [catalogQuery.data!.product.collection!.id]:
                            event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Homepage Flash Deal</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.homepagePosition}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      homepagePosition: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="small"
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
            >
              Save catalog details
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})

export default ProductCatalogWidget
