import type { Link } from "@medusajs/framework/modules-sdk"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import { CATALOG_MODULE } from "../../modules/catalog"
import CatalogModuleService from "../../modules/catalog/service"
import { normalizeCatalogProfile } from "../../utils/catalog-schema"

export type UpsertProductCatalogInput = {
  product_id: string
  brand_id?: string | null
  model?: string | null
  specifications?: unknown
  media_alt_text?: unknown
  merchandising?: unknown
  data_source?: "real" | "demo_fixture"
  internal_note?: string | null
}

const upsertProductCatalogStep = createStep(
  "upsert-product-catalog",
  async (input: UpsertProductCatalogInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "catalog.*", "catalog.brand.*"],
      filters: { id: input.product_id },
    })
    const product = products[0]

    if (!product) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
    }

    if (input.brand_id) {
      const brands = await catalogService.listCatalogBrands({ id: input.brand_id })
      if (!brands.length) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Brand not found")
      }
    }

    const normalized = normalizeCatalogProfile(input)
    const existing = product.catalog
    const provenance = {
      data_source: input.data_source ?? existing?.data_source ?? "real",
      internal_note: input.internal_note?.trim() || null,
    }
    let profile

    if (existing?.id) {
      profile = await catalogService.updateCatalogProductProfiles({
        id: existing.id,
        ...normalized,
        ...provenance,
        brand_id: input.brand_id ?? null,
      })
    } else {
      profile = await catalogService.createCatalogProductProfiles({
        ...normalized,
        ...provenance,
        brand_id: input.brand_id ?? null,
      })
      try {
        await link.create({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [CATALOG_MODULE]: { catalog_product_profile_id: profile.id },
        })
      } catch (error) {
        await catalogService.deleteCatalogProductProfiles(profile.id)
        throw error
      }
    }

    return new StepResponse(profile)
  }
)

export const upsertProductCatalogWorkflow = createWorkflow(
  "upsert-product-catalog",
  (input: UpsertProductCatalogInput) => {
    const profile = upsertProductCatalogStep(input)
    return new WorkflowResponse(profile)
  }
)

export type BrandKind = "manufacturer" | "store_label" | "unspecified"

export type CreateBrandInput = {
  name: string
  handle: string
  kind?: BrandKind
  logo_url?: string | null
  logo_alt?: string | null
}

const createBrandStep = createStep(
  "create-brand",
  async (input: CreateBrandInput, { container }) => {
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    const name = input.name.trim()
    const handle = input.handle.trim().toLowerCase()
    const [byHandle, byName] = await Promise.all([
      catalogService.listCatalogBrands({ handle }),
      catalogService.listCatalogBrands({ name }),
    ])

    if (byHandle.length || byName.length) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "A brand with this name or handle already exists"
      )
    }

    const logoUrl = input.logo_url?.trim() || null
    const brand = await catalogService.createCatalogBrands({
      name,
      handle,
      kind: input.kind ?? "manufacturer",
      logo_url: logoUrl,
      logo_alt: logoUrl ? input.logo_alt?.trim() || `Logo ${name}` : null,
    })
    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    if (!brandId) {
      return
    }
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    await catalogService.deleteCatalogBrands(brandId)
  }
)

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  (input: CreateBrandInput) => {
    const brand = createBrandStep(input)
    return new WorkflowResponse(brand)
  }
)

export type UpdateBrandInput = {
  id: string
  name: string
  handle: string
  kind?: BrandKind
  logo_url?: string | null
  logo_alt?: string | null
}

const updateBrandStep = createStep(
  "update-brand",
  async (input: UpdateBrandInput, { container }) => {
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    const name = input.name.trim()
    const handle = input.handle.trim().toLowerCase()
    const [current, byHandle, byName] = await Promise.all([
      catalogService.listCatalogBrands({ id: input.id }),
      catalogService.listCatalogBrands({ handle }),
      catalogService.listCatalogBrands({ name }),
    ])

    if (!current.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Brand not found")
    }

    if (
      byHandle.some((brand) => brand.id !== input.id) ||
      byName.some((brand) => brand.id !== input.id)
    ) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "A brand with this name or handle already exists"
      )
    }

    const previous = current[0]
    const logoUrl = input.logo_url?.trim() || null
    const brand = await catalogService.updateCatalogBrands({
      id: input.id,
      name,
      handle,
      kind: input.kind ?? previous.kind ?? "manufacturer",
      logo_url: logoUrl,
      logo_alt: logoUrl ? input.logo_alt?.trim() || `Logo ${name}` : null,
    })

    return new StepResponse(brand, {
      id: previous.id,
      name: previous.name,
      handle: previous.handle,
      kind: previous.kind,
      logo_url: previous.logo_url,
      logo_alt: previous.logo_alt,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    await catalogService.updateCatalogBrands(previous)
  }
)

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  (input: UpdateBrandInput) => {
    const brand = updateBrandStep(input)
    return new WorkflowResponse(brand)
  }
)

const deleteBrandStep = createStep(
  "delete-brand",
  async (id: string, { container }) => {
    const catalogService = container.resolve<CatalogModuleService>(
      CATALOG_MODULE
    )
    const brands = await catalogService.listCatalogBrands({ id })
    if (!brands.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Brand not found")
    }

    const linkedProfiles = await catalogService.listCatalogProductProfiles({
      brand_id: id,
    })
    if (linkedProfiles.length) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Brand is assigned to products and cannot be deleted"
      )
    }

    await catalogService.deleteCatalogBrands(id)
    return new StepResponse({ id })
  }
)

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  (id: string) => {
    const result = deleteBrandStep(id)
    return new WorkflowResponse(result)
  }
)
