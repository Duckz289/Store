[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$storefrontEnvPath = Join-Path $workspaceRoot "apps\storefront\.env.local"

if (-not (Test-Path -LiteralPath $storefrontEnvPath)) {
  throw "Storefront local environment is missing. Run setup-local.ps1 first."
}

$publishableKey = (Get-Content -LiteralPath $storefrontEnvPath | Where-Object {
    $_ -like "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=*"
  }) -replace "^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=", ""

if ([string]::IsNullOrWhiteSpace($publishableKey)) {
  throw "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is empty."
}

$baseHeaders = @{
  "x-publishable-api-key" = $publishableKey
  "Content-Type" = "application/json"
}

function Invoke-StoreApi(
  [string]$method,
  [string]$path,
  [object]$body = $null,
  [hashtable]$requestHeaders = $baseHeaders
) {
  $request = @{
    Method = $method
    Uri = "http://127.0.0.1:9000$path"
    Headers = $requestHeaders
    UseBasicParsing = $true
  }

  if ($null -ne $body) {
    $request.Body = $body | ConvertTo-Json -Depth 12
  }

  return Invoke-RestMethod @request
}

function Copy-AuthHeaders([string]$token) {
  $headers = @{}
  foreach ($entry in $baseHeaders.GetEnumerator()) {
    $headers[$entry.Key] = $entry.Value
  }
  $headers.Authorization = "Bearer $token"
  return $headers
}

function New-CheckoutCart(
  [hashtable]$requestHeaders,
  [string]$email
) {
  $cart = (Invoke-StoreApi "Post" "/store/carts" @{ region_id = $region.id } $requestHeaders).cart
  $cart = (Invoke-StoreApi "Post" "/store/carts/$($cart.id)/line-items" @{
      variant_id = $product.variants[0].id
      quantity = 1
    } $requestHeaders).cart
  $address = @{
    first_name = "An"
    last_name = "Nguyen"
    address_1 = "1 Nguyen Hue"
    city = "Ben Nghe"
    province = "Ho Chi Minh City"
    country_code = "vn"
    phone = "0912345678"
  }
  $cart = (Invoke-StoreApi "Post" "/store/carts/$($cart.id)" @{
      email = $email
      shipping_address = $address
      billing_address = $address
    } $requestHeaders).cart
  $option = (Invoke-StoreApi "Get" "/store/shipping-options?cart_id=$($cart.id)" $null $requestHeaders).shipping_options |
    Select-Object -First 1

  if (-not $option) {
    throw "No shipping option is available for checkout smoke."
  }

  return (Invoke-StoreApi "Post" "/store/carts/$($cart.id)/shipping-methods" @{
      option_id = $option.id
    } $requestHeaders).cart
}

function Initialize-PaymentSession(
  [object]$cart,
  [string]$providerId,
  [hashtable]$requestHeaders
) {
  $collection = (Invoke-StoreApi "Post" "/store/payment-collections" @{
      cart_id = $cart.id
    } $requestHeaders).payment_collection
  return (Invoke-StoreApi "Post" "/store/payment-collections/$($collection.id)/payment-sessions" @{
      provider_id = $providerId
    } $requestHeaders).payment_collection
}

$regions = (Invoke-StoreApi "Get" "/store/regions").regions
$region = $regions | Where-Object {
  $_.countries.iso_2 -contains "vn"
} | Select-Object -First 1

if (-not $region -or $region.currency_code -ne "vnd") {
  throw "Vietnam VND region was not found."
}

$product = (Invoke-StoreApi "Get" "/store/products?region_id=$($region.id)&limit=100").products |
  Where-Object { $_.handle -eq "sac-nhanh-usb-c-65w" } |
  Select-Object -First 1

if (-not $product) {
  throw "Seed checkout product was not found."
}

$providers = (Invoke-StoreApi "Get" "/store/payment-providers?region_id=$($region.id)").payment_providers
$cod = $providers | Where-Object { $_.id -eq "pp_system_default" } | Select-Object -First 1

if (-not $cod) {
  throw "COD provider is not available."
}

$guestEmail = "checkout-guest-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.local"
$guestCart = New-CheckoutCart $baseHeaders $guestEmail
$guestSession = Initialize-PaymentSession $guestCart $cod.id $baseHeaders
$guestResult = Invoke-StoreApi "Post" "/store/carts/$($guestCart.id)/complete" $null $baseHeaders
$duplicateResult = Invoke-StoreApi "Post" "/store/carts/$($guestCart.id)/complete" $null $baseHeaders

if ($guestResult.type -ne "order" -or $duplicateResult.type -ne "order") {
  throw "Guest COD checkout did not create an order."
}

if ($guestResult.order.id -ne $duplicateResult.order.id) {
  throw "Duplicate checkout created a second order."
}

$payment = @($guestResult.order.payment_collections)[0]
$capturedPayment = $false
if ($payment) {
  $capturedPayment = @($payment.payments) | Where-Object {
    $_.status -in @("captured", "succeeded", "paid")
  } | Select-Object -First 1
  $capturedPayment = $null -ne $capturedPayment
}

if ($capturedPayment) {
  throw "COD checkout unexpectedly returned a captured payment."
}

$inventoryCart = (Invoke-StoreApi "Post" "/store/carts" @{ region_id = $region.id }).cart
$inventoryCart = (Invoke-StoreApi "Post" "/store/carts/$($inventoryCart.id)/line-items" @{
    variant_id = $product.variants[0].id
    quantity = 1
  }).cart
$inventoryRaceStatus = "unexpected-success"
try {
  Invoke-StoreApi "Post" "/store/carts/$($inventoryCart.id)/line-items" @{
    variant_id = $product.variants[0].id
    quantity = 100000
  } | Out-Null
} catch {
  $inventoryRaceStatus = $_.Exception.Response.StatusCode.value__
}

if ($inventoryRaceStatus -notin @(400, 409)) {
  throw "Inventory race guard returned unexpected status: $inventoryRaceStatus"
}

$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$customerEmail = "checkout-auth-$suffix@example.local"
$customerPassword = "Checkout-test-password-42!"
$registration = Invoke-StoreApi "Post" "/auth/customer/emailpass/register" @{
  email = $customerEmail
  password = $customerPassword
}
$registrationHeaders = Copy-AuthHeaders $registration.token
Invoke-StoreApi "Post" "/store/customers" @{
  email = $customerEmail
  first_name = "Auth"
  last_name = "Checkout"
} $registrationHeaders | Out-Null
$login = Invoke-StoreApi "Post" "/auth/customer/emailpass" @{
  email = $customerEmail
  password = $customerPassword
}
$customerHeaders = Copy-AuthHeaders $login.token
$authenticatedCart = New-CheckoutCart $customerHeaders $customerEmail
Initialize-PaymentSession $authenticatedCart $cod.id $customerHeaders | Out-Null
$authenticatedResult = Invoke-StoreApi "Post" "/store/carts/$($authenticatedCart.id)/complete" $null $customerHeaders

if ($authenticatedResult.type -ne "order") {
  throw "Authenticated checkout did not create an order."
}

$vietQr = $providers | Where-Object { $_.id -eq "pp_vietqr_vietqr" } | Select-Object -First 1
$vietQrStatus = "skipped-provider-disabled"
if ($vietQr) {
  $qrCart = New-CheckoutCart $baseHeaders "checkout-vietqr@example.local"
  $qrSession = Initialize-PaymentSession $qrCart $vietQr.id $baseHeaders
  $qrResult = Invoke-StoreApi "Post" "/store/carts/$($qrCart.id)/complete" $null $baseHeaders
  if ($qrResult.type -ne "order") {
    throw "VietQR checkout did not create an order."
  }
  $vietQrStatus = "pending-or-manual-review"
}

[pscustomobject]@{
  GuestOrderCreated = $true
  DuplicateUsesSameOrder = $true
  CodPaymentCaptured = $capturedPayment
  InventoryRaceStatus = $inventoryRaceStatus
  AuthenticatedOrderCreated = $true
  VietQr = $vietQrStatus
}
