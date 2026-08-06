import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import VietQrPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [VietQrPaymentProviderService],
})
