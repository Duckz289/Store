# Storefront audit

Status: Phase UI-0, design and implementation baseline
Date: 2026-08-06
Baseline commit: `5c634d0e400f2b5f87f09e5e462b56ae261e2e7e`

## Reading and design dials

This is a trust-first Vietnamese consumer-electronics storefront. The supplied CellphoneS screenshots are used only to study information hierarchy, discovery density, and commerce flows. The visual identity, copy, assets, and implementation remain specific to Điện Tử Hưng Phát.

- `DESIGN_VARIANCE`: 5 - recognizable but practical redesign
- `MOTION_INTENSITY`: 3 - short state transitions only
- `VISUAL_DENSITY`: 6 - compact product information without crowding

The UI must not change Medusa pricing, inventory, checkout, payment, fulfillment, repair state, or authorization boundaries.

## Route and surface inventory

| Surface | Current route | Current implementation | UI-0 finding | Planned treatment |
| --- | --- | --- | --- | --- |
| Home | `/{countryCode}` | Hero plus collection rails | Starter hero, no category discovery or trust modules | Replace hero, add backend-driven category shortcuts, keep product rails |
| Store listing | `/store` | Sort, option picker, product grid, pagination | English labels, desktop-only refinement rhythm, no count/breadcrumb/mobile drawer | Refactor listing shell and filter controls; preserve URL query contract |
| Category | `/categories/[...category]` | Category data plus shared listing | Metadata and hierarchy need review | Add breadcrumb, category context, structured metadata |
| Collection | `/collections/[handle]` | Collection data plus shared listing | Shared listing can be retained | Reuse listing shell and improve empty/loading states |
| Product | `/products/[handle]` | Gallery, options, price, add to cart, related products | Card and PDP do not expose enough trust, stock, SKU, shipping, warranty | Refactor presentation only; keep variant and add-to-cart actions |
| Cart | `/cart` | Items, discount code, totals, checkout link | English summary and weak mobile summary affordance | Improve hierarchy, stale state messaging, mobile CTA |
| Checkout | `/checkout` | Address, shipping, payment, review | Vietnamese guest-first hierarchy is incomplete | Restyle labels and states; no payment workflow changes |
| Order | `/order/[id]` and account orders | Confirmation, transfer token, account history | Existing order/payment screens are the source for payment state | Add clear pending/expired/manual-review language only |
| Account | `/account` | Login and customer dashboard | Existing auth boundary must stay | Improve labels/focus states; no RBAC change |
| Repair | No storefront route | Backend repair module exists | Customer repair journey is absent | Add an independent repair surface in a later UI phase |

## Data and API audit

| UI need | Existing source | Decision |
| --- | --- | --- |
| Region and currency | `listRegions`, `getRegion` | Keep server-side; never derive price in client |
| Product price and stock | `listProducts`, calculated price and inventory fields | Keep backend response as source of truth; add display states only |
| Product categories | `listCategories`, `getCategoryByHandle` | Use for navigation and category shortcuts; no hardcoded catalog taxonomy |
| Collections | `listCollections` | Keep for rails and footer, cap presentation count |
| Product options | `OptionsPicker` and product options | Keep query key `option_value_id`; add loading/error treatment |
| Search | No storefront search flow | Add a thin query adapter only after verifying Medusa 2.18 store filter types; do not invent a client-side catalog |
| Cart and checkout | server actions in `lib/data` | Preserve actions and backend totals; presentation can change |
| VietQR | checkout payment components and order payment detail | Preserve pending, expiry, manual review, reconciliation semantics |
| Repair | backend repair module and API contract | New UI references repair IDs and status only; it does not write the database directly |

## Keep, refactor, and add

### Keep as-is at the boundary

- Medusa SDK calls and server actions in `src/lib/data`.
- Product variant selection, `v_id` URL behavior, inventory checks, and `addToCart`.
- Cart totals, checkout workflow, VietQR payment transitions, and repair API/state machine.
- Country, locale, account, and customer-session routing.

### Refactor presentation

- `modules/layout/templates/nav` and `modules/layout/components/side-menu`.
- `modules/home/components/hero` and collection rail presentation.
- `modules/products/components/product-preview`, `product-info`, and product actions labels.
- `modules/store/templates`, refinement list, option picker, and pagination framing.
- Cart summary, checkout headings, and footer copy.
- Root metadata and language declaration.

### Add in UI phases

- Shared design tokens and focus/reduced-motion utilities.
- Backend-driven category navigation and mobile drawer.
- Search input shell with debounced query and explicit no-result/error states.
- Trust blocks for delivery, COD/VietQR, warranty, and return policy.
- Repair landing, intake, tracking, and quote status views that consume the existing repair contract.

## Responsive and accessibility criteria

Test widths: 360, 390, 768, 1024, and 1440 px. The 1024 px breakpoint remains the existing `small` desktop boundary unless a component has a documented reason to differ.

- Every interactive element has a visible `:focus-visible` treatment and an accessible name.
- Mobile navigation and filter controls are keyboard reachable and trap focus while open.
- Product images have product-specific alt text; decorative imagery is marked decorative.
- Loading, empty, error, out-of-stock, pending, expired, and manual-review states are explicit.
- Text remains readable at 200% zoom and does not depend on color alone.
- Reduced-motion users receive no transform-heavy transitions.

## SEO, performance, and privacy criteria

- `html[lang]` matches the storefront locale and titles/descriptions are Vietnamese by default.
- Category, collection, and product pages keep stable canonical URL structure and use server metadata.
- Product structured data is added only from server-confirmed price, currency, availability, and URL.
- Images use existing Next configuration and safe remote patterns. Do not enable the Sharp optimizer while its accepted advisory remains open.
- No receipt images, secrets, or unnecessary PII are introduced into client state, analytics, or UI audit events.
- Search and navigation do not leak customer or repair information.

## Phase UI-0 exit criteria

- This audit, design system, user flows, and component map are committed as documentation.
- No commerce boundary or API contract is changed by the documentation phase.
- UI-1 is limited to design tokens, root metadata, navigation shell, hero, and shared states. Larger listing, PDP, cart, checkout, and repair work stays in separate commits.
