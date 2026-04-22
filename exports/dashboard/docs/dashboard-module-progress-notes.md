# Dashboard Module Progress Notes

Date: April 21, 2026

## What Was Implemented

1. Recent Transactions action (`...`) is now a real action menu (not direct redirect):
- View order details
- Open shipment flow
- Send invoice (mock action)
- Mark as shipped (updates status badge in table)
- Archive row (removes row from dashboard list for current session)

Additional transaction UX:
- Inline feedback banner for transaction actions
- Empty-state message when all transaction rows are archived
- Confirmation modal before archive
- Undo archive action from banner (time-limited)
- `Esc` shortcut to close open actions/modal

4. Dashboard KPI cards are now clickable shortcuts:
- Revenue -> Orders
- Total Orders -> Orders
- Conversion Rate -> Abandoned Checkouts
- Net Profit -> Reports

2. Promo card CTA (`Edit Collection`) now routes to the real collection editor:
- `#/products/categories/cat-evening`

3. Recent Activity items are now clickable and route to relevant module pages:
- Order detail
- Product category detail
- Customer reviews moderation page

## Why

- Improve dashboard usability and reduce accidental navigation.
- Ensure core dashboard CTAs lead to implemented module pages.
- Make activity feed actionable, not static text.

## Verification

- `npm run lint` (TypeScript noEmit) passed after changes.
