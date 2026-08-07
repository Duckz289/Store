import { moduleIntegrationTestRunner } from "@medusajs/test-utils"

import { CATALOG_MODULE } from ".."
import CatalogModuleService from "../service"

moduleIntegrationTestRunner<CatalogModuleService>({
  moduleName: CATALOG_MODULE,
  resolve: "./src/modules/catalog",
  testSuite: ({ service }) => {
    it("persists a stable brand, model, and structured product profile", async () => {
      const brand = await service.createCatalogBrands({
        name: "Module Brand",
        handle: "module-brand",
      })
      const profile = await service.createCatalogProductProfiles({
        brand_id: brand.id,
        model: "Model 14",
        specifications: {
          items: [
            {
              key: "ram",
              label: "RAM",
              value: "16",
              unit: "GB",
              group: "memory",
              position: 0,
            },
          ],
        },
        media_alt_text: {},
        merchandising: {
          categories: { pcat_module: 1 },
          collections: { pcol_module: 4 },
          homepage: {},
        },
      })
      const persisted = await service.retrieveCatalogProductProfile(
        profile.id,
        { relations: ["brand"] }
      )

      expect(persisted.model).toBe("Model 14")
      expect(persisted.brand.id).toBe(brand.id)
      expect((persisted.specifications as any).items[0].key).toBe("ram")
      expect((persisted.merchandising as any).categories.pcat_module).toBe(1)
    })

    it("rejects duplicate active brand handles", async () => {
      await service.createCatalogBrands({ name: "First", handle: "same-handle" })
      await expect(
        service.createCatalogBrands({ name: "Second", handle: "same-handle" })
      ).rejects.toThrow()
    })
  },
})
