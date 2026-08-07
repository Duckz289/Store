import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import NotificationSandboxService from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [NotificationSandboxService],
})
