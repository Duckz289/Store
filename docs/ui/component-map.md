# Storefront component map

Status: Phase UI-0 specification

The map separates presentation components from server data and Medusa workflow boundaries. New UI components must not import database clients, module services, or core Medusa internals.

| Route or surface | Keep | Refactor | Add | Data and boundary |
| --- | --- | --- | --- | --- |
| Root layout | `getBaseURL`, global CSS | language and metadata | semantic body shell, tokens | `metadata` only; no commerce logic |
| Main layout | customer/cart/shipping fetches, mismatch banner | spacing and page chrome | optional trust strip | server data remains in layout |
| Navigation | `CartButton`, locale/country selectors, `LocalizedClientLink` | `Nav`, `SideMenu` | category mega menu, mobile drawer, search shell, order/repair links | `listCategories`, regions, locale; search adapter later |
| Home | collection fetch and product rails | `Hero`, rail headings/cards | hero, category shortcuts, trust block, repair teaser | `listCategories`, `listCollections`, `listProducts` |
| Listing | `PaginatedProducts`, pagination, URL query keys | `StoreTemplate`, `RefinementList`, option picker | breadcrumbs, count, mobile filter sheet, applied filters | server listing data; query is URL state |
| Product card | `Thumbnail`, `PreviewPrice`, product link | `ProductPreview` | stock, badge, SKU/spec summary, CTA affordance | server-confirmed product fields only |
| Product detail | `ImageGallery`, `ProductActions`, `ProductTabs`, related products | `ProductInfo`, product shell | breadcrumb, warranty/shipping/policy panel, quantity UI if contract supports | variant selection and add-to-cart remain existing client/server boundary |
| Cart | items, discount code, totals, server actions | summary and item layout | stale-state notice, mobile sticky summary | cart response and server actions |
| Checkout | addresses, shipping, payment, review, VietQR provider states | headings, labels, spacing | guest-first step header, policy notices | no payment transition changes |
| Order | confirmation and payment detail routes | copy and status hierarchy | tracking summary and safe next actions | existing order/payment data only |
| Repair | none in storefront | none | landing, intake, tracking, quote review | repair API/workflow contract; no direct DB writes |
| Footer | categories and collections fetch | Medusa starter links/copy | contact, policy, store and repair links | backend categories/collections, static approved policy copy |

## Server/client boundaries

- Server components fetch regions, categories, collections, products, cart, checkout, orders, and repair-safe views.
- Client components own disclosure, drawer, search input state, option selection, filter URL updates, and button pending states.
- All mutations call existing server actions or a workflow-backed API. Routes validate and authorize but do not write databases.
- Search suggestions must use a server adapter with a verified Medusa 2.18 query type. Until verified, render a navigational search shell without inventing a new endpoint.

## Shared states to standardize

`LoadingBlock`, `EmptyState`, `ErrorState`, `OutOfStockState`, `PendingPaymentState`, `ExpiredPaymentState`, `ManualReviewState`, and `FocusRing` are presentation primitives. They carry no payment or repair mutation behavior.

## Implementation sequence

1. UI-1: design tokens, root metadata, navigation shell, hero, category shortcuts, and shared states.
2. UI-2: product discovery, listing filters, cards, and PDP information hierarchy.
3. UI-3: cart and Vietnamese checkout presentation, including VietQR pending states.
4. UI-4: repair customer surfaces and order/tracking polish.

Each phase has its own lint, typecheck, build, smoke, and diff review before commit.
