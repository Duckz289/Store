import { Module } from "@medusajs/framework/utils"

import VietQrModuleService from "./service"

export const VIETQR_MODULE = "vietqr"

export default Module(VIETQR_MODULE, {
  service: VietQrModuleService,
})
