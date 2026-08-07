import { MedusaService } from "@medusajs/framework/utils"

import Brand from "./models/brand"
import ProductCatalogProfile from "./models/product-catalog-profile"

class CatalogModuleService extends MedusaService({
  CatalogBrand: Brand,
  CatalogProductProfile: ProductCatalogProfile,
}) {}

export default CatalogModuleService
