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
    let profile

    if (existing?.id) {
      profile = await catalogService.updateCatalogProductProfiles({
        id: existing.id,
        ...normalized,
        brand_id: input.brand_id ?? null,
      })
    } else {
      profile = await catalogService.createCatalogProductProfiles({
        ...normalized,
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

export type CreateBrandInput = {
  name: string
  handle: string
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

    const brand = await catalogService.createCatalogBrands({ name, handle })
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
