import { model } from "@medusajs/framework/utils"

const MfaAssurance = model
  .define("security_mfa_assurance", {
    id: model.id({ prefix: "mfaas" }).primaryKey(),
    auth_identity_id: model.text(),
    actor_id: model.text(),
    credential_hash: model.text(),
    verification_method: model.text(),
    verified_at: model.dateTime(),
    expires_at: model.dateTime(),
    revoked_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      on: ["credential_hash"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["auth_identity_id", "expires_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default MfaAssurance
