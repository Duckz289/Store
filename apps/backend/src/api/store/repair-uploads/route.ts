import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { createHash, randomUUID } from "crypto"

import { UploadStoreRepairImageSchema } from "../../repair-validators"

type UploadStoreRepairImageBody = z.infer<typeof UploadStoreRepairImageSchema>

export const POST = async (
  req: MedusaRequest<UploadStoreRepairImageBody>,
  res: MedusaResponse,
) => {
  const content = Buffer.from(req.validatedBody.content, "base64")
  if (!content.length || content.length > 8 * 1024 * 1024) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_IMAGE_SIZE_INVALID",
    )
  }

  const safeFilename = req.validatedBody.filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-120)
  const filename = `${randomUUID()}-${safeFilename || "repair-image"}`
  const checksum = createHash("sha256").update(content).digest("hex")
  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename,
          mimeType: req.validatedBody.mime_type,
          content: content.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  return res.status(201).json({
    file: {
      file_id: result[0].id,
      file_reference: result[0].url,
      mime_type: req.validatedBody.mime_type,
      size_bytes: content.length,
      checksum,
    },
  })
}
