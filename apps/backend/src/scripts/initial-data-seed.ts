import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  batchLinkProductsToCollectionWorkflow,
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductTypesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  CATALOG_CATEGORIES,
  CATALOG_COLLECTIONS,
  CATALOG_PRODUCTS,
  CATALOG_PRODUCT_TYPES,
  COLLECTION_PRODUCT_HANDLES,
  assertUniqueCatalogSkus,
} from "./catalog"
import {
  VIETNAM_FREE_SHIPPING_THRESHOLD,
  VIETNAM_STANDARD_SHIPPING_FEE,
} from "../utils/vietnam-shipping"

const SALES_CHANNEL_NAME = "Kênh bán hàng Việt Nam"
const REGION_NAME = "Việt Nam"
const STOCK_LOCATION_NAME = "Kho chính Hưng Phát"
const FULFILLMENT_SET_NAME = "Giao hàng từ kho chính"
const SHIPPING_OPTION_NAME = "Giao hàng tiêu chuẩn"
const DEFAULT_STOCK_QUANTITY = 25
const PRIMARY_COLLECTION_HANDLE = "flash-deal"

type QueryRecord = Record<string, any>

function throwCatalogConflict(message: string): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, `Catalog seed conflict: ${message}`)
}

function expectAtMostOne(records: QueryRecord[], label: string) {
  if (records.length > 1) {
    throwCatalogConflict(`multiple ${label} records match the expected identity`)
  }

  return records[0]
}

function findNamedRecord(
  records: QueryRecord[],
  name: string,
  label: string,
  field = "name"
) {
  return expectAtMostOne(
    records.filter((record) => record[field] === name),
    `${label} "${name}"`
  )
}

async function ensureOperationalData(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  const [{ data: salesChannels }, { data: regions }, { data: stores }] =
    await Promise.all([
      query.graph({
        entity: "sales_channel",
        fields: ["id", "name", "products_link.product_id"],
      }),
      query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code", "countries.iso_2"],
      }),
      query.graph({ entity: "store", fields: ["id", "name"] }),
    ])

  const matchingSalesChannels = salesChannels.filter(
    (channel) => channel.name === SALES_CHANNEL_NAME
  )
  let salesChannel: QueryRecord | undefined
  if (matchingSalesChannels.length > 1) {
    const referencedSalesChannels = matchingSalesChannels.filter(
      (channel) => channel.products_link?.length
    )
    if (referencedSalesChannels.length === 1) {
      const referencedSalesChannel = referencedSalesChannels[0]
      salesChannel = referencedSalesChannel
      logger.warn(
        `Catalog seed conflict reported: duplicate sales channel name "${SALES_CHANNEL_NAME}" exists. Using referenced record ${referencedSalesChannel.id}; unused duplicate records are preserved.`
      )
    } else {
      salesChannel = expectAtMostOne(
        matchingSalesChannels,
        `sales channel "${SALES_CHANNEL_NAME}"`
      )
    }
  } else {
    salesChannel = matchingSalesChannels[0]
  }
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: SALES_CHANNEL_NAME,
            description: "Storefront chính của Điện Tử Hưng Phát",
          },
        ],
      },
    })
    salesChannel = result[0]
  }

  if (!salesChannel) {
    throwCatalogConflict(`unable to resolve sales channel "${SALES_CHANNEL_NAME}"`)
  }

  let region = expectAtMostOne(
    regions.filter(
      (item) => item.name === REGION_NAME || item.currency_code === "vnd"
    ),
    "Vietnam VND region"
  )
  if (region && (region.name !== REGION_NAME || region.currency_code !== "vnd")) {
    throwCatalogConflict(
      `region ${region.id} must be named ${REGION_NAME} and use VND`
    )
  }
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: "vnd",
            countries: ["vn"],
            payment_providers: [
              "pp_system_default",
              ...(process.env.VIETQR_ENABLED === "true"
                ? ["pp_vietqr_vietqr"]
                : []),
            ],
          },
        ],
      },
    })
    region = result[0]
  }

  if (!stores.length) {
    await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "Điện Tử Hưng Phát",
            supported_currencies: [{ currency_code: "vnd", is_default: true }],
            default_sales_channel_id: salesChannel.id,
          },
        ],
      },
    })
  }

  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  if (!taxRegions.some((taxRegion) => taxRegion.country_code === "vn")) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "vn", provider_id: "tp_system" }],
    })
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: [
      "id",
      "name",
      "sales_channels.id",
      "fulfillment_providers.id",
      "fulfillment_sets.id",
    ],
  })
  let stockLocation = findNamedRecord(
    stockLocations,
    STOCK_LOCATION_NAME,
    "stock location"
  )
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: {
              city: "Thành phố Hồ Chí Minh",
              country_code: "VN",
              address_1: "",
            },
          },
        ],
      },
    })
    stockLocation = result[0]
  }

  if (
    !stockLocation.sales_channels?.some(
      (channel: QueryRecord) => channel.id === salesChannel.id
    )
  ) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    })
  }

  if (!stockLocation.fulfillment_providers?.length) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    throwCatalogConflict("no shipping profile is available for the catalog")
  }

  const { data: fulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "type", "service_zones.id"],
  })
  let fulfillmentSet = findNamedRecord(
    fulfillmentSets,
    FULFILLMENT_SET_NAME,
    "fulfillment set"
  )
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [
        {
          name: "Toàn quốc Việt Nam",
          geo_zones: [{ country_code: "vn", type: "country" }],
        },
      ],
    })
  }

  if (
    !stockLocation.fulfillment_sets?.some(
      (set: QueryRecord) => set.id === fulfillmentSet.id
    )
  ) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
  }

  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })
  if (!findNamedRecord(shippingOptions, SHIPPING_OPTION_NAME, "shipping option")) {
    const serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
    if (!serviceZoneId) {
      throwCatalogConflict("the primary fulfillment set has no Vietnam service zone")
    }
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Tiêu chuẩn",
            description: "Dự kiến giao trong 2–5 ngày làm việc",
            code: "standard-vn",
          },
          prices: [
            { currency_code: "vnd", amount: VIETNAM_STANDARD_SHIPPING_FEE },
            {
              currency_code: "vnd",
              amount: 0,
              rules: [
                {
                  attribute: "item_total",
                  operator: "gte",
                  value: VIETNAM_FREE_SHIPPING_THRESHOLD,
                },
              ],
            },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
  }

  return { region, salesChannel, stockLocation }
}

async function ensureCatalogEntities(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data: existingTypes }, { data: existingCategories }, { data: existingCollections }] =
    await Promise.all([
      query.graph({ entity: "product_type", fields: ["id", "value"] }),
      query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle", "rank", "is_active", "parent_category_id"],
      }),
      query.graph({ entity: "product_collection", fields: ["id", "title", "handle"] }),
    ])

  const productTypes = new Map<string, QueryRecord>()
  for (const value of CATALOG_PRODUCT_TYPES) {
    const matches = existingTypes.filter((type) => type.value === value)
    const type = expectAtMostOne(matches, `product type "${value}"`)
    if (type) productTypes.set(value, type)
  }

  const missingTypes = CATALOG_PRODUCT_TYPES.filter((value) => !productTypes.has(value))
  if (missingTypes.length) {
    const { result } = await createProductTypesWorkflow(container).run({
      input: { product_types: missingTypes.map((value) => ({ value })) },
    })
    result.forEach((type) => productTypes.set(type.value, type))
  }

  const categories = new Map<string, QueryRecord>()
  for (const expected of CATALOG_CATEGORIES) {
    const byHandle = existingCategories.filter(
      (category) => category.handle === expected.handle
    )
    const byName = existingCategories.filter(
      (category) => category.name === expected.name
    )
    const categoryByHandle = expectAtMostOne(
      byHandle,
      `product category handle "${expected.handle}"`
    )
    const categoryByName = expectAtMostOne(
      byName,
      `product category "${expected.name}"`
    )
    if (categoryByHandle && categoryByName && categoryByHandle.id !== categoryByName.id) {
      throwCatalogConflict(
        `category name "${expected.name}" and handle "${expected.handle}" refer to different records`
      )
    }
    if (categoryByHandle || categoryByName) {
      const category = categoryByHandle || categoryByName
      if (!category.is_active || category.parent_category_id) {
        throwCatalogConflict(
          `top-level category "${expected.name}" is inactive or has an unexpected parent`
        )
      }
      categories.set(expected.name, category)
    }
  }

  const missingCategories = CATALOG_CATEGORIES.filter(
    (category) => !categories.has(category.name)
  )
  if (missingCategories.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((category) => ({
          name: category.name,
          handle: category.handle,
          rank: category.rank,
          is_active: true,
        })),
      },
    })
    result.forEach((category) => categories.set(category.name, category))
  }

  const collections = new Map<string, QueryRecord>()
  for (const expected of CATALOG_COLLECTIONS) {
    const matches = existingCollections.filter(
      (collection) =>
        collection.handle === expected.handle || collection.title === expected.title
    )
    const collection = expectAtMostOne(
      matches,
      `collection "${expected.title}" or handle "${expected.handle}"`
    )
    if (collection) collections.set(expected.handle, collection)
  }

  const missingCollections = CATALOG_COLLECTIONS.filter(
    (collection) => !collections.has(collection.handle)
  )
  if (missingCollections.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: missingCollections.map((collection) => ({
          title: collection.title,
          handle: collection.handle,
        })),
      },
    })
    result.forEach((collection) => collections.set(collection.handle, collection))
  }

  return { categories, collections, productTypes }
}

async function ensureProducts(
  container: MedusaContainer,
  operationalData: QueryRecord,
  entities: {
    categories: Map<string, QueryRecord>
    collections: Map<string, QueryRecord>
    productTypes: Map<string, QueryRecord>
  }
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existingOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "values.value"],
  })
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "title",
      "status",
      "type_id",
      "collection_id",
      "categories.id",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.manage_inventory",
      "variants.inventory_items.inventory.id",
      "variants.inventory_items.inventory.sku",
    ],
  })

  const productsByHandle = new Map<string, QueryRecord>()
  for (const product of existingProducts) {
    if (productsByHandle.has(product.handle)) {
      throwCatalogConflict(`duplicate product handle "${product.handle}" exists`)
    }
    productsByHandle.set(product.handle, product)
  }

  const optionsByTitle = new Map<string, QueryRecord>()
  for (const option of existingOptions) {
    if (optionsByTitle.has(option.title)) {
      throwCatalogConflict(`duplicate product option "${option.title}" exists`)
    }
    optionsByTitle.set(option.title, option)
  }

  const missingOptions = CATALOG_PRODUCTS.map((product) => product.options).filter(
    (option, index, options) =>
      !optionsByTitle.has(option.title) &&
      options.findIndex((candidate) => candidate.title === option.title) === index
  )
  if (missingOptions.length) {
    const { result } = await createProductOptionsWorkflow(container).run({
      input: {
        product_options: missingOptions.map((option) => ({
          title: option.title,
          values: [...option.values],
        })),
      },
    })
    result.forEach((option) => optionsByTitle.set(option.title, option))
  }

  const productsToCreate = CATALOG_PRODUCTS.filter(
    (product) => !productsByHandle.has(product.handle)
  ).map((product) => {
    const option = optionsByTitle.get(product.options.title)
    const category = entities.categories.get(product.category)
    const type = entities.productTypes.get(product.type)
    const collection = entities.collections.get(PRIMARY_COLLECTION_HANDLE)
    if (!option || !category || !type || !collection) {
      throwCatalogConflict(`missing catalog entity for product "${product.handle}"`)
    }

    return {
      title: product.title,
      handle: product.handle,
      description: product.description,
      category_ids: [category.id],
      type_id: type.id,
      collection_id: collection.id,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: operationalData.shippingProfileId,
      weight: product.handle.startsWith("dien-thoai")
        ? 190
        : product.handle.startsWith("laptop")
        ? 1350
        : product.handle.startsWith("sac-")
        ? 120
        : 420,
      options: [{ id: option.id }],
      variants: product.variants.map((variant) => ({
        title: variant.title,
        sku: variant.sku,
        manage_inventory: true,
        requires_shipping: true,
        options: { [product.options.title]: variant.option },
        prices: [{ amount: variant.price, currency_code: "vnd" }],
      })),
      sales_channels: [{ id: operationalData.salesChannelId }],
    }
  })

  if (productsToCreate.length) {
    const { result } = await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    })
    result.forEach((product) => productsByHandle.set(product.handle, product))
  }

  const productsToUpdate: QueryRecord[] = []
  for (const expected of CATALOG_PRODUCTS) {
    const product = productsByHandle.get(expected.handle)
    const category = entities.categories.get(expected.category)
    const type = entities.productTypes.get(expected.type)
    const collection = entities.collections.get(PRIMARY_COLLECTION_HANDLE)
    if (!product || !category || !type || !collection) {
      throwCatalogConflict(`expected product "${expected.handle}" was not created or found`)
    }
    if (product.status !== ProductStatus.PUBLISHED) {
      throwCatalogConflict(
        `expected product "${expected.handle}" is ${product.status}; publish it explicitly before rerunning the seed`
      )
    }
    if (product.title !== expected.title) {
      throwCatalogConflict(
        `product handle "${expected.handle}" has title "${product.title}" instead of "${expected.title}"`
      )
    }
    if (product.type_id && product.type_id !== type.id) {
      throwCatalogConflict(
        `product "${expected.handle}" is assigned to a different Product Type`
      )
    }
    const knownSeedCollectionIds = new Set(
      CATALOG_COLLECTIONS.map(
        (catalogCollection) =>
          entities.collections.get(catalogCollection.handle)?.id
      ).filter(Boolean)
    )
    if (
      product.collection_id &&
      product.collection_id !== collection.id &&
      !knownSeedCollectionIds.has(product.collection_id)
    ) {
      throwCatalogConflict(
        `product "${expected.handle}" is assigned to a different primary Collection`
      )
    }
    const categoryIds = new Set(
      (product.categories ?? []).map((productCategory: QueryRecord) => productCategory.id)
    )
    if (
      product.type_id !== type.id ||
      product.collection_id !== collection.id ||
      (Array.isArray(product.categories) && !categoryIds.has(category.id))
    ) {
      productsToUpdate.push({
        id: product.id,
        type_id: type.id,
        collection_id: collection.id,
        categories: [{ id: category.id }],
      })
    }
  }

  if (productsToUpdate.length) {
    await updateProductsWorkflow(container).run({ input: { products: productsToUpdate } })
  }

  const allProducts = Array.from(productsByHandle.values())
  const allVariants = allProducts.flatMap((product) =>
    (product.variants ?? []).map((variant: QueryRecord) => ({
      ...variant,
      productHandle: product.handle,
    }))
  )
  const skuOwners = new Map<string, string>()
  for (const variant of allVariants) {
    const sku = variant.sku?.trim()
    if (!sku) {
      throwCatalogConflict(
        `sellable variant ${variant.productHandle}/${variant.title} has an empty SKU`
      )
    }
    const owner = skuOwners.get(sku)
    if (owner) {
      throwCatalogConflict(`SKU ${sku} is used by ${owner} and ${variant.productHandle}/${variant.title}`)
    }
    skuOwners.set(sku, `${variant.productHandle}/${variant.title}`)
  }

  const inventoryService = container.resolve<any>(Modules.INVENTORY)
  const variantsToUpdate = allVariants
    .filter((variant) => !variant.manage_inventory)
    .map((variant) => ({ id: variant.id, manage_inventory: true }))
  if (variantsToUpdate.length) {
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: variantsToUpdate },
    })
  }

  const inventoryItemsById = new Map<string, QueryRecord>()
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "title", "location_levels.id", "location_levels.location_id"],
  })
  inventoryItems.forEach((item) => inventoryItemsById.set(item.id, item))

  for (const variant of allVariants) {
    let inventoryItemId = variant.inventory_items?.[0]?.inventory?.id
    let inventoryItem = inventoryItemId ? inventoryItemsById.get(inventoryItemId) : undefined
    if (inventoryItem && inventoryItem.sku && inventoryItem.sku !== variant.sku) {
      throwCatalogConflict(
        `inventory item ${inventoryItem.id} SKU ${inventoryItem.sku} does not match variant ${variant.id} SKU ${variant.sku}`
      )
    }
    if (!inventoryItem) {
      const createdInventoryItem = await inventoryService.createInventoryItems({
        sku: variant.sku,
        title: variant.title,
        requires_shipping: true,
      })
      inventoryItem = createdInventoryItem
      inventoryItemsById.set(createdInventoryItem.id, createdInventoryItem)
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.INVENTORY]: { inventory_item_id: createdInventoryItem.id },
        data: { required_quantity: 1 },
      })
      inventoryItemId = createdInventoryItem.id
    }

    if (!inventoryItem || !inventoryItemId) {
      throwCatalogConflict(`variant ${variant.id} has no inventory item`)
    }

    const hasStockLevel = inventoryItem.location_levels?.some(
      (level: QueryRecord) => level.location_id === operationalData.stockLocationId
    )
    if (!hasStockLevel) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              location_id: operationalData.stockLocationId,
              stocked_quantity: DEFAULT_STOCK_QUANTITY,
              inventory_item_id: inventoryItemId,
            },
          ],
        },
      })
    }
  }

  for (const collection of CATALOG_COLLECTIONS.filter(
    (catalogCollection) => catalogCollection.handle === PRIMARY_COLLECTION_HANDLE
  )) {
    const collectionRecord = entities.collections.get(collection.handle)
    if (!collectionRecord) continue
    const desiredProductIds = COLLECTION_PRODUCT_HANDLES[collection.handle]
      .map((handle) => productsByHandle.get(handle)?.id)
      .filter(Boolean)
    const { data: linkedProducts } = await query.graph({
      entity: "product_collection",
      fields: ["id", "products.id"],
      filters: { id: collectionRecord.id },
    })
    const linkedProductIds = new Set(
      (linkedProducts[0]?.products ?? [])
        .map((product) => product?.id)
        .filter(Boolean)
    )
    const add = desiredProductIds.filter((id) => !linkedProductIds.has(id))
    if (add.length) {
      await batchLinkProductsToCollectionWorkflow(container).run({
        input: { id: collectionRecord.id, add },
      })
    }
  }

  return { productCount: allProducts.length, variantCount: allVariants.length }
}

export default async function initialDataSeed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  assertUniqueCatalogSkus()
  logger.info("Đang chuẩn hóa catalog Medusa cho cửa hàng Việt Nam...")

  const operationalData = await ensureOperationalData(container)
  const entities = await ensureCatalogEntities(container)
  const result = await ensureProducts(container, {
    salesChannelId: operationalData.salesChannel.id,
    shippingProfileId: (await container.resolve(ContainerRegistrationKeys.QUERY).graph({
      entity: "shipping_profile",
      fields: ["id"],
    })).data[0]?.id,
    stockLocationId: operationalData.stockLocation.id,
  }, entities)

  const publishableKeyQuery = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: publishableKeys } = await publishableKeyQuery.graph({
    entity: "api_key",
    fields: ["id", "token", "type", "title"],
    filters: { type: "publishable" },
  })
  if (!publishableKeys.length) {
    const { result: createdKeys } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Storefront Việt Nam",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: createdKeys[0].id, add: [operationalData.salesChannel.id] },
    })
    logger.info(`STOREFRONT_PUBLISHABLE_KEY=${createdKeys[0].token}`)
  }

  logger.info(
    `Đã chuẩn hóa ${result.productCount} sản phẩm và ${result.variantCount} biến thể; seed an toàn để chạy lại.`
  )
}
