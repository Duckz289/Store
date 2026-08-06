# Storefront design system

Status: Phase UI-0 specification

## Brand direction

Điện Tử Hưng Phát should feel dependable, local, and technically competent. The system uses a deep vermilion accent with ink and cool paper surfaces. It does not reproduce the CellphoneS logo, campaign graphics, copy, color values, or layout.

## Tokens

The canonical tokens live in `apps/storefront/src/styles/globals.css` as CSS custom properties. Components should use these variables or the semantic utility classes built on them.

| Token | Value | Use |
| --- | --- | --- |
| `--hp-ink` | `#111827` | body text, headings |
| `--hp-muted` | `#667085` | supporting text |
| `--hp-paper` | `#f5f7fa` | page background |
| `--hp-surface` | `#ffffff` | cards and panels |
| `--hp-line` | `#e4e7ec` | borders and dividers |
| `--hp-accent` | `#b4233a` | primary action, active navigation |
| `--hp-accent-strong` | `#8f1d2f` | hover and pressed action |
| `--hp-accent-soft` | `#fbeaec` | soft accent panels |
| `--hp-success` | `#15803d` | confirmed and in-stock states |
| `--hp-warning` | `#b54708` | pending, low-stock, review states |
| `--hp-danger` | `#b42318` | invalid, rejected, failed states |
| `--hp-radius-card` | `12px` | product and content cards |
| `--hp-radius-control` | `10px` | buttons, inputs, select controls |
| `--hp-radius-pill` | `999px` | tags, filters, status chips only |
| `--hp-shadow-card` | `0 8px 24px rgba(16, 24, 40, .08)` | elevated card on hover or focus |

Status colors are semantic and never replace text labels. Do not add gradients, glass blur, or a second decorative accent.

## Typography

Use the existing system sans stack: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. No new font package is required.

- Display: 36/44 px, weight 700, used once per page section.
- Page heading: 28/36 px, weight 700.
- Section heading: 20/28 px, weight 700.
- Product title: 15/22 px, weight 600, maximum three lines in a card.
- Body: 14/22 px, weight 400.
- Meta: 12/18 px, weight 500.
- Price: 20/28 px, weight 700; original price is 12/18 px with strike-through.

Vietnamese diacritics must remain intact. Avoid all-caps for long labels.

## Layout and density

- Global content width: existing `content-container`, capped at 1440 px.
- Page gutters: 16 px at 360 px, 24 px at 768 px, 32 px at 1440 px.
- Grid gaps: 12 px on mobile, 16 px on tablet, 20 px on desktop.
- Product cards keep a stable image ratio and title block height so grids do not jump.
- Use one primary CTA per card or panel. Secondary actions are text or outline controls.

## Core components

### Header

Two rows on desktop: compact service strip and main navigation. The main row contains brand, category trigger, search, order/repair links, account, and cart count. Mobile collapses to brand, menu, search trigger, and cart. Category data comes from Medusa.

### Button

Primary uses `--hp-accent` with white text. Hover uses `--hp-accent-strong`. Disabled reduces contrast but retains a visible border. Every button has a pressed and loading state.

### Input and search

10 px radius, 1 px `--hp-line` border, 2 px focus ring using `--hp-accent`. Search supports keyboard navigation, debounced requests, no-result, error, and clear states.

### Card

White surface, one border, 12 px radius. Image background is `--hp-paper`. On hover, use a small shadow and no scale jump. Focus state must be visible around the entire link.

### Status chip

Pill shape, short text plus an icon only when it improves comprehension. Pending, expired, manual review, confirmed, and rejected always include text.

### Trust block

Four compact items: giao hàng, COD/VietQR, bảo hành, đổi trả. Claims must match current policy and backend capabilities.

## Motion and interaction

Motion intensity is 3. Use 150 to 220 ms opacity/color transitions and short drawer movement. Never animate prices or inventory as if they were client-authoritative. Respect `prefers-reduced-motion: reduce` by removing transforms and duration.

## Accessibility checklist

- Use semantic `header`, `nav`, `main`, `section`, `footer`, and heading order.
- Use `aria-expanded`, `aria-controls`, and `aria-current` for menus and filters.
- Keep a 44 px minimum target for mobile controls.
- Do not communicate stock, payment, or repair state by color alone.
- Preserve existing form field names and validation order when restyling checkout.
