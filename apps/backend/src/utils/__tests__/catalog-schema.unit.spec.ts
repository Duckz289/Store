import {
  catalogSpecificationsSchema,
  normalizeCatalogProfile,
} from "../catalog-schema"

describe("catalog schema", () => {
  it("normalizes model and deterministically orders specification rows", () => {
    const profile = normalizeCatalogProfile({
      model: "  AX1800  ",
      specifications: [
        { key: "bands", label: "Bands", value: "Dual", position: 2 },
        { key: "wifi_standard", label: "Wi-Fi", value: "6", position: 0 },
      ],
      media_alt_text: {
        "https://cdn.example.test/router.webp": "Router front view",
      },
      merchandising: {
        categories: { pcat_network: 4 },
        collections: { pcol_featured: 1 },
        homepage: { "flash-deal": 2 },
      },
    })

    expect(profile.model).toBe("AX1800")
    expect(profile.specifications.items.map((item) => item.key)).toEqual([
      "wifi_standard",
      "bands",
    ])
    expect(profile.merchandising.categories.pcat_network).toBe(4)
    expect(profile.merchandising.collections.pcol_featured).toBe(1)
  })

  it("rejects duplicate or non-deterministic specification keys", () => {
    expect(() =>
      catalogSpecificationsSchema.parse([
        { key: "ram", label: "RAM", value: "16 GB", position: 0 },
        { key: "ram", label: "Memory", value: "16 GB", position: 1 },
      ])
    ).toThrow(/Duplicate specification key/)

    expect(() =>
      catalogSpecificationsSchema.parse([
        { key: "RAM size", label: "RAM", value: "16 GB", position: 0 },
      ])
    ).toThrow()
  })

  it("rejects non-URL media keys and invalid merchandising positions", () => {
    expect(() =>
      normalizeCatalogProfile({ media_alt_text: { relative: "Image" } })
    ).toThrow()
    expect(() =>
      normalizeCatalogProfile({
        merchandising: { categories: { pcat_laptop: -1 } },
      })
    ).toThrow()
  })
})
