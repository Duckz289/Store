import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"

export const catalogSpecificationSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
  unit: z.string().trim().max(40).optional().default(""),
  group: z.string().trim().max(80).optional().default("general"),
  filterable: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  position: z.number().int().min(0).max(10_000),
})

export const catalogSpecificationsSchema = z
  .array(catalogSpecificationSchema)
  .max(100)
  .superRefine((specifications, context) => {
    const keys = new Set<string>()

    for (const [index, specification] of specifications.entries()) {
      if (keys.has(specification.key)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate specification key: ${specification.key}`,
          path: [index, "key"],
        })
      }
      keys.add(specification.key)
    }
  })
  .transform((specifications) =>
    [...specifications].sort(
      (left, right) =>
        left.position - right.position || left.key.localeCompare(right.key)
    )
  )

const positionMapSchema = z.record(
  z.string().min(1).max(120),
  z.number().int().min(0).max(1_000_000)
)

export const catalogMerchandisingSchema = z.object({
  categories: positionMapSchema.default({}),
  collections: positionMapSchema.default({}),
  homepage: positionMapSchema.default({}),
})

export const catalogMediaAltTextSchema = z.record(
  z.string().url().max(2_000),
  z.string().trim().max(300)
)

export type CatalogSpecification = z.infer<
  typeof catalogSpecificationSchema
>
export type CatalogMerchandising = z.infer<
  typeof catalogMerchandisingSchema
>

export function normalizeCatalogProfile(input: {
  model?: string | null
  specifications?: unknown
  media_alt_text?: unknown
  merchandising?: unknown
}) {
  const model = input.model?.trim() || null

  if (model && model.length > 160) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Model must be 160 characters or fewer"
    )
  }

  return {
    model,
    specifications: {
      items: catalogSpecificationsSchema.parse(input.specifications ?? []),
    },
    media_alt_text: catalogMediaAltTextSchema.parse(
      input.media_alt_text ?? {}
    ),
    merchandising: catalogMerchandisingSchema.parse(
      input.merchandising ?? {}
    ),
  }
}
