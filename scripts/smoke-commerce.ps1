[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$storefrontEnvPath = Join-Path $workspaceRoot "apps\storefront\.env.local"

if (-not (Test-Path -LiteralPath $storefrontEnvPath)) {
  throw "Storefront local environment is missing. Run setup-local.ps1 first."
}

$key = (Get-Content -LiteralPath $storefrontEnvPath | Where-Object {
    $_ -like "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=*"
  }) -replace "^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=", ""

if ([string]::IsNullOrWhiteSpace($key)) {
  throw "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is empty."
}

$headers = @{
  "x-publishable-api-key" = $key
  "Content-Type" = "application/json"
}

function Invoke-StoreApi(
  [string]$method,
  [string]$path,
  [object]$body = $null
) {
  $request = @{
    Method = $method
    Uri = "http://127.0.0.1:9000$path"
    Headers = $headers
  }
  if ($null -ne $body) {
    $request.Body = $body | ConvertTo-Json -Depth 8
  }
  return Invoke-RestMethod @request
}

$regions = (Invoke-StoreApi "Get" "/store/regions").regions
$region = $regions | Where-Object {
  $_.countries.iso_2 -contains "vn"
} | Select-Object -First 1

if (-not $region -or $region.currency_code -ne "vnd") {
  throw "Vietnam VND region was not found."
}

$products = (Invoke-StoreApi "Get" "/store/products?region_id=$($region.id)&limit=100").products
$charger = $products | Where-Object {
  $_.handle -eq "sac-nhanh-usb-c-65w"
}
$router = $products | Where-Object {
  $_.handle -eq "router-wifi-6-ax1800"
}

if ($products.Count -ne 4 -or -not $charger -or -not $router) {
  throw "Expected Vietnam seed catalog was not found."
}

$variantsWithoutSku = $products.variants | Where-Object {
  [string]::IsNullOrWhiteSpace($_.sku)
}
if ($variantsWithoutSku) {
  throw "At least one seeded variant is missing its SKU."
}

$cart = (Invoke-StoreApi "Post" "/store/carts" @{
    region_id = $region.id
  }).cart

$cart = (Invoke-StoreApi "Post" "/store/carts/$($cart.id)/line-items" @{
    variant_id = $charger.variants[0].id
    quantity = 1
  }).cart

$cart = (Invoke-StoreApi "Post" "/store/carts/$($cart.id)" @{
    email = "smoke-test@example.local"
    shipping_address = @{
      first_name = "An"
      last_name = "Nguyen"
      address_1 = "1 Nguyen Hue"
      address_2 = "Office hours"
      city = "Ben Nghe"
      province = "Ho Chi Minh City"
      country_code = "vn"
      phone = "0912345678"
    }
  }).cart

$paidOption = (Invoke-StoreApi "Get" "/store/shipping-options?cart_id=$($cart.id)").shipping_options | Select-Object -First 1

$cart = (Invoke-StoreApi "Post" "/store/carts/$($cart.id)/line-items" @{
    variant_id = $router.variants[0].id
    quantity = 1
  }).cart

$freeOption = (Invoke-StoreApi "Get" "/store/shipping-options?cart_id=$($cart.id)").shipping_options | Select-Object -First 1
$providers = (Invoke-StoreApi "Get" "/store/payment-providers?region_id=$($region.id)").payment_providers
$chargerLine = $cart.items | Where-Object {
  $_.variant_id -eq $charger.variants[0].id
}

if ($chargerLine.unit_price -ne 690000) {
  throw "Server-side VND price assertion failed."
}
if ($paidOption.amount -ne 30000) {
  throw "Standard shipping fee assertion failed."
}
if ($freeOption.amount -ne 0) {
  throw "Free-shipping threshold assertion failed."
}
if ($providers.id -notcontains "pp_system_default") {
  throw "COD payment provider assertion failed."
}

[pscustomobject]@{
  RegionCountry = "vn"
  Currency = $region.currency_code
  ProductCount = $products.Count
  AllVariantsHaveSku = $true
  ServerLinePrice = $chargerLine.unit_price
  PaidShippingAmount = $paidOption.amount
  FreeShippingAmount = $freeOption.amount
  PaymentProvider = "pp_system_default"
}
