import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  VIETNAM_FREE_SHIPPING_THRESHOLD,
  VIETNAM_STANDARD_SHIPPING_FEE,
} from "../utils/vietnam-shipping"

export default async function initialDataSeed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  logger.info("Đang tạo seed data cho cửa hàng Việt Nam...")

  // The seed command is intentionally safe to re-run. A complete catalog is
  // treated as the marker that this seed has already run; creating another
  // sales channel, API key, store, or product set would make the local data
  // drift on every deploy/restart. A partially-seeded database is stopped so
  // an operator can repair it explicitly instead of silently duplicating data.
  const expectedProductHandles = [
    "dien-thoai-nova-x1",
    "laptop-workpro-14",
    "sac-nhanh-usb-c-65w",
    "router-wifi-6-ax1800",
  ]
  const seededSalesChannelName = "Kênh bán hàng Việt Nam"
  const [{ data: existingProducts }, { data: existingRegions }, { data: existingSalesChannels }] =
    await Promise.all([
      query.graph({ entity: "product", fields: ["handle"] }),
      query.graph({ entity: "region", fields: ["currency_code", "name"] }),
      query.graph({ entity: "sales_channel", fields: ["name"] }),
    ])
  const existingHandles = new Set(
    existingProducts.map((product) => product.handle)
  )
  const hasVndRegion = existingRegions.some(
    (region) => region.currency_code === "vnd"
  )
  const hasSeededSalesChannel = existingSalesChannels.some(
    (channel) => channel.name === seededSalesChannelName
  )
  const hasCompleteSeed =
    hasVndRegion &&
    hasSeededSalesChannel &&
    expectedProductHandles.every((handle) => existingHandles.has(handle))

  if (hasCompleteSeed) {
    logger.info("Seed data đã tồn tại; bỏ qua để giữ dữ liệu idempotent.")
    return
  }

  if (hasVndRegion || hasSeededSalesChannel || existingProducts.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Seed data đang ở trạng thái một phần; dừng để tránh tạo dữ liệu trùng. Hãy kiểm tra và sửa dữ liệu trước khi seed lại."
    )
  }

  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Kênh bán hàng Việt Nam",
          description: "Storefront chính của Điện Tử Hưng Phát",
        },
      ],
    },
  })

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
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
    input: {
      id: publishableApiKey.id,
      add: [salesChannel.id],
    },
  })

  logger.info(`STOREFRONT_PUBLISHABLE_KEY=${publishableApiKey.token}`)

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Điện Tử Hưng Phát",
          supported_currencies: [
            {
              currency_code: "vnd",
              is_default: true,
            },
          ],
          default_sales_channel_id: salesChannel.id,
        },
      ],
    },
  })

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Việt Nam",
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

  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "vn",
        provider_id: "tp_system",
      },
    ],
  })

  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Kho chính Hưng Phát",
          address: {
            city: "Thành phố Hồ Chí Minh",
            country_code: "VN",
            address_1: "",
          },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Giao hàng từ kho chính",
    type: "shipping",
    service_zones: [
      {
        name: "Toàn quốc Việt Nam",
        geo_zones: [
          {
            country_code: "vn",
            type: "country",
          },
        ],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Giao hàng tiêu chuẩn",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Tiêu chuẩn",
          description: "Dự kiến giao trong 2–5 ngày làm việc",
          code: "standard-vn",
        },
        prices: [
          {
            currency_code: "vnd",
            amount: VIETNAM_STANDARD_SHIPPING_FEE,
          },
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
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  })

  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Điện thoại", is_active: true },
        { name: "Laptop", is_active: true },
        { name: "Phụ kiện", is_active: true },
        { name: "Thiết bị mạng", is_active: true },
      ],
    },
  })

  const { result: productOptions } = await createProductOptionsWorkflow(
    container
  ).run({
    input: {
      product_options: [
        {
          title: "Cấu hình điện thoại",
          values: ["6 GB / 128 GB", "8 GB / 256 GB"],
        },
        {
          title: "Cấu hình laptop",
          values: ["16 GB / 512 GB", "32 GB / 1 TB"],
        },
        {
          title: "Công suất",
          values: ["65 W"],
        },
        {
          title: "Chuẩn Wi-Fi",
          values: ["Wi-Fi 6 AX1800"],
        },
      ],
    },
  })

  const categoryId = (name: string) =>
    categories.find((category) => category.name === name)!.id
  const option = (title: string) =>
    productOptions.find((productOption) => productOption.title === title)!

  const phoneOption = option("Cấu hình điện thoại")
  const laptopOption = option("Cấu hình laptop")
  const chargerOption = option("Công suất")
  const routerOption = option("Chuẩn Wi-Fi")

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Điện thoại Nova X1",
          handle: "dien-thoai-nova-x1",
          description:
            "Điện thoại 5G màn hình OLED, pin dung lượng lớn và bảo hành 12 tháng.",
          category_ids: [categoryId("Điện thoại")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          weight: 190,
          options: [{ id: phoneOption.id }],
          variants: [
            {
              title: "6 GB / 128 GB",
              sku: "HP-NOVA-X1-6-128",
              options: { "Cấu hình điện thoại": "6 GB / 128 GB" },
              prices: [{ amount: 6990000, currency_code: "vnd" }],
            },
            {
              title: "8 GB / 256 GB",
              sku: "HP-NOVA-X1-8-256",
              options: { "Cấu hình điện thoại": "8 GB / 256 GB" },
              prices: [{ amount: 7990000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
        {
          title: "Laptop WorkPro 14",
          handle: "laptop-workpro-14",
          description:
            "Laptop 14 inch dành cho công việc, vỏ kim loại và bảo hành 24 tháng.",
          category_ids: [categoryId("Laptop")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          weight: 1350,
          options: [{ id: laptopOption.id }],
          variants: [
            {
              title: "16 GB / 512 GB",
              sku: "HP-WORKPRO14-16-512",
              options: { "Cấu hình laptop": "16 GB / 512 GB" },
              prices: [{ amount: 18990000, currency_code: "vnd" }],
            },
            {
              title: "32 GB / 1 TB",
              sku: "HP-WORKPRO14-32-1TB",
              options: { "Cấu hình laptop": "32 GB / 1 TB" },
              prices: [{ amount: 22990000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
        {
          title: "Sạc nhanh USB-C 65 W",
          handle: "sac-nhanh-usb-c-65w",
          description:
            "Củ sạc USB-C Power Delivery nhỏ gọn, phù hợp điện thoại và laptop.",
          category_ids: [categoryId("Phụ kiện")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          weight: 120,
          options: [{ id: chargerOption.id }],
          variants: [
            {
              title: "65 W",
              sku: "HP-CHARGER-USBC-65W",
              options: { "Công suất": "65 W" },
              prices: [{ amount: 690000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
        {
          title: "Router Wi-Fi 6 AX1800",
          handle: "router-wifi-6-ax1800",
          description:
            "Router Wi-Fi 6 băng tần kép cho gia đình và văn phòng nhỏ.",
          category_ids: [categoryId("Thiết bị mạng")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          weight: 420,
          options: [{ id: routerOption.id }],
          variants: [
            {
              title: "Wi-Fi 6 AX1800",
              sku: "HP-ROUTER-AX1800",
              options: { "Chuẩn Wi-Fi": "Wi-Fi 6 AX1800" },
              prices: [{ amount: 1290000, currency_code: "vnd" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
      ],
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 25,
        inventory_item_id: item.id,
      })),
    },
  })

  logger.info("Đã tạo xong dữ liệu nền cho cửa hàng Việt Nam.")
}
