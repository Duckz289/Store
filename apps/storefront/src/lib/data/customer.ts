"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { FetchError } from "@medusajs/js-sdk"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  getPendingCustomer,
  removeAuthToken,
  removeCartId,
  removePendingCustomer,
  setAuthToken,
  setPendingCustomer,
} from "./cookies"

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

export type CustomerRecoveryState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

export type CustomerAddressState = {
  success: boolean
  error: string | null
}

export type CustomerProfileState = CustomerAddressState

const AUTH_FAILURE_MESSAGE = "Không thể xác thực thông tin đăng nhập. Vui lòng thử lại."
const ACCOUNT_UPDATE_FAILURE_MESSAGE = "Không thể cập nhật thông tin. Vui lòng thử lại."

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

const getEmail = (formData: FormData) => getText(formData, "email").toLowerCase()

const validatePassword = (password: string) => {
  if (password.length < 12) {
    return "Mật khẩu cần có ít nhất 12 ký tự."
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Mật khẩu cần có ít nhất một chữ cái và một chữ số."
  }

  return null
}

const validateAccountDetails = ({
  email,
  firstName,
  lastName,
  password,
}: {
  email: string
  firstName?: string
  lastName?: string
  password?: string
}) => {
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return "Vui lòng nhập email hợp lệ."
  }

  if (firstName !== undefined && (firstName.length < 1 || firstName.length > 80)) {
    return "Vui lòng nhập tên hợp lệ."
  }

  if (lastName !== undefined && (lastName.length < 1 || lastName.length > 80)) {
    return "Vui lòng nhập họ hợp lệ."
  }

  if (password !== undefined) {
    return validatePassword(password)
  }

  return null
}

const validatePhone = (phone: string) => {
  if (!phone) return null

  if (!/^[+0-9()\s.-]{9,24}$/.test(phone)) {
    return "Vui lòng nhập số điện thoại hợp lệ."
  }

  return null
}

const toAddressPayload = (formData: FormData) => {
  const firstName = getText(formData, "first_name")
  const lastName = getText(formData, "last_name")
  const address1 = getText(formData, "address_1")
  const city = getText(formData, "city")
  const province = getText(formData, "province")
  const phone = getText(formData, "phone")
  const postalCode = getText(formData, "postal_code")

  const validationError =
    validateAccountDetails({
      email: "address@validation.local",
      firstName,
      lastName,
    }) ??
    (!address1 || address1.length > 255
      ? "Vui lòng nhập địa chỉ hợp lệ."
      : null) ??
    (!city || city.length > 120 ? "Vui lòng nhập tỉnh/thành phố." : null) ??
    (!province || province.length > 120
      ? "Vui lòng nhập tỉnh/thành phố."
      : null) ??
    (postalCode.length > 24 ? "Mã bưu chính không hợp lệ." : null) ??
    validatePhone(phone)

  if (validationError) {
    return { error: validationError, address: null }
  }

  return {
    error: null,
    address: {
      first_name: firstName,
      last_name: lastName,
      company: getText(formData, "company") || undefined,
      address_1: address1,
      address_2: getText(formData, "address_2") || undefined,
      city,
      postal_code: postalCode || undefined,
      province,
      country_code: "vn",
      phone: phone || undefined,
      is_default_billing: formData.get("is_default_billing") === "on",
      is_default_shipping: formData.get("is_default_shipping") === "on",
    },
  }
}

// Requests a verification email for the given customer. The request must be
// authenticated with a token tied to the auth identity (the token returned by
// register or by a login that requires verification).
async function requestVerificationEmail(email: string, token: string) {
  await sdk.auth.verification.request(
    {
      entity_id: email,
      entity_type: "email",
    },
    {
      authorization: `Bearer ${token}`,
    }
  )
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function updateCustomerProfile(
  _currentState: CustomerProfileState,
  formData: FormData
): Promise<CustomerProfileState> {
  const firstName = formData.has("first_name")
    ? getText(formData, "first_name")
    : undefined
  const lastName = formData.has("last_name")
    ? getText(formData, "last_name")
    : undefined
  const phone = formData.has("phone") ? getText(formData, "phone") : undefined

  if (firstName !== undefined || lastName !== undefined) {
    const validationError = validateAccountDetails({
      email: "profile@validation.local",
      firstName,
      lastName,
    })
    if (validationError) return { success: false, error: validationError }
  }

  const phoneError = phone === undefined ? null : validatePhone(phone)
  if (phoneError) return { success: false, error: phoneError }

  const body: HttpTypes.StoreUpdateCustomer = {
    ...(firstName !== undefined ? { first_name: firstName } : {}),
    ...(lastName !== undefined ? { last_name: lastName } : {}),
    ...(phone !== undefined ? { phone: phone || null } : {}),
  }

  try {
    await updateCustomer(body)
  } catch {
    return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
  }

  return { success: true, error: null }
}

export async function signup(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  const passwordValue = formData.get("password")
  const password = typeof passwordValue === "string" ? passwordValue : ""
  const passwordConfirmation = formData.get("password_confirmation")
  const customerForm = {
    email: getEmail(formData),
    first_name: getText(formData, "first_name"),
    last_name: getText(formData, "last_name"),
    phone: getText(formData, "phone"),
  }

  const validationError =
    validateAccountDetails({
      email: customerForm.email,
      firstName: customerForm.first_name,
      lastName: customerForm.last_name,
      password,
    }) ?? validatePhone(customerForm.phone)

  if (validationError) {
    return { state: "error", error: validationError }
  }

  if (password !== passwordConfirmation) {
    return { state: "error", error: "Xác nhận mật khẩu chưa khớp." }
  }

  try {
    await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password,
    })
  } catch (error) {
    const fetchError = error as FetchError
    // An existing identity (for example, an admin user with the same email) is
    // expected and handled: the customer can still log in to link a customer
    // record. Any other error is surfaced.
    if (
      fetchError.statusText !== "Unauthorized" ||
      fetchError.message !== "Identity with email already exists"
    ) {
      return { state: "error", error: AUTH_FAILURE_MESSAGE }
    }
  }

  // Persist the extra signup fields. The customer record is created during
  // login, which is deferred until after email verification when the backend
  // requires it.
  await setPendingCustomer(customerForm)

  // Continue by logging in. The login response tells us whether the backend
  // requires email verification — we don't need a storefront-side flag.
  return completeLogin(customerForm.email, password)
}

export async function login(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  const email = getEmail(formData)
  const password = formData.get("password")

  const validationError = validateAccountDetails({ email })
  if (validationError) {
    return { state: "error", error: validationError }
  }

  if (typeof password !== "string" || !password) {
    return { state: "error", error: "Vui lòng nhập mật khẩu." }
  }

  return completeLogin(email, password)
}

// Logs the customer in and reconciles the customer record. The behavior is
// driven entirely by the backend's login response, so it works whether or not
// email verification is enabled.
async function completeLogin(
  email: string,
  password: string
): Promise<CustomerAuthState> {
  let result: Awaited<ReturnType<typeof sdk.auth.login>>

  try {
    result = await sdk.auth.login("customer", "emailpass", { email, password })
  } catch {
    return { state: "error", error: AUTH_FAILURE_MESSAGE }
  }

  // A `location` is returned by third-party auth providers, which this flow
  // doesn't support.
  if (typeof result === "object" && "location" in result) {
    return {
      state: "error",
      error: AUTH_FAILURE_MESSAGE,
    }
  }

  // The backend requires email verification and the customer hasn't verified
  // yet. Send the verification email and ask them to check their inbox.
  if (
    typeof result === "object" &&
    "verification_required" in result &&
    result.verification_required
  ) {
    try {
      await requestVerificationEmail(email, result.token)
    } catch {
      // Ignore: the customer can resend from the verification page.
    }
    return { state: "verification_required", email }
  }

  if (typeof result !== "string") {
    return {
      state: "error",
      error: AUTH_FAILURE_MESSAGE,
    }
  }

  let token = result

  // The token may not be tied to a customer record yet — right after
  // registration, or after verifying a brand-new account. Ask the backend:
  // `/store/customers/me` rejects tokens without a registered actor, so a
  // failed retrieve means we still need to create the customer, then log in
  // again to obtain a customer-bound token.
  const customerExists = await sdk.store.customer
    .retrieve({}, { authorization: `Bearer ${token}` })
    .then(() => true)
    .catch(() => false)

  if (!customerExists) {
    const pending = await getPendingCustomer()

    try {
      await sdk.store.customer.create(
        {
          email,
          first_name: pending?.first_name,
          last_name: pending?.last_name,
          phone: pending?.phone,
        },
        {},
        { authorization: `Bearer ${token}` }
      )

      token = (await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      })) as string
    } catch {
      return { state: "error", error: AUTH_FAILURE_MESSAGE }
    }

  }

  await removePendingCustomer()

  await setAuthToken(token)

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  try {
    await transferCart()
  } catch {
    return { state: "error", error: AUTH_FAILURE_MESSAGE }
  }

  return { state: "success" }
}

// Confirms a customer's email using the token from the verification link.
//
// The confirm route doesn't require authentication, so this works even when the
// customer opens the link on a different device than the one they signed up on.
export async function confirmEmailVerification(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sdk.auth.verification.confirm({ code: token })
    return { success: true }
  } catch {
    return { success: false, error: "Không thể xác minh liên kết. Vui lòng thử lại." }
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerRecoveryState> {
  const email = getEmail(formData)

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return { state: "error", error: "Vui lòng nhập email hợp lệ." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch {
    // The reset endpoint is intentionally non-enumerating. Keep this response
    // identical for transport and provider errors as well.
  }

  return { state: "success" }
}

export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerRecoveryState> {
  const email = getEmail(formData)
  const token = getText(formData, "token")
  const password = formData.get("password")
  const passwordConfirmation = formData.get("password_confirmation")

  if (typeof password !== "string" || typeof passwordConfirmation !== "string") {
    return { state: "error", error: "Vui lòng nhập mật khẩu mới." }
  }

  const validationError = validateAccountDetails({ email, password })
  if (validationError) {
    return { state: "error", error: validationError }
  }

  if (password !== passwordConfirmation) {
    return { state: "error", error: "Xác nhận mật khẩu chưa khớp." }
  }

  if (!token || token.length > 2048) {
    return { state: "error", error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )
  } catch {
    return {
      state: "error",
      error: "Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được dùng.",
    }
  }

  await removeAuthToken()
  await removePendingCustomer()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  return { state: "success" }
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  _currentState: Record<string, unknown>,
  formData: FormData
): Promise<CustomerAddressState> => {
  const { address, error } = toAddressPayload(formData)
  if (!address || error) return { success: false, error }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch(() => {
      return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<CustomerAddressState> => {
  if (!addressId || addressId.length > 128) {
    return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
  }
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch(() => {
      return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
    })
}

export const updateCustomerAddress = async (
  _currentState: Record<string, unknown>,
  formData: FormData
): Promise<CustomerAddressState> => {
  const addressId =
    getText(formData, "addressId")

  if (!addressId || addressId.length > 128) {
    return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
  }

  const { address: payload, error } = toAddressPayload(formData)
  if (!payload || error) return { success: false, error }

  const address = payload as HttpTypes.StoreUpdateCustomerAddress

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch(() => {
      return { success: false, error: ACCOUNT_UPDATE_FAILURE_MESSAGE }
    })
}
