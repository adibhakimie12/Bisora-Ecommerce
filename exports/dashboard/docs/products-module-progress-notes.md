# Products Module Progress Notes

Updated: 2026-04-21

## Completed Frontend Functionality

1. Categories create flow is functional:
   - `Create Category` opens modal form
   - submit adds category to categories table
   - new category appears in product category dropdown

2. All Products table actions are functional:
   - `Duplicate` now creates a real duplicate row (draft copy with unique id/sku/slug)
   - `Archive` now changes product status to `Hidden`
   - `Delete` now removes product from table
   - `...` (more) button now opens quick action menu

3. All Products filters are functional:
   - status chips: `All`, `Active`, `Unpublished`, `Hidden`
   - stock chips: `All Stock`, `Low Stock`, `Out of Stock`, `High Stock`
   - category dropdown filter
   - search input filters by product title, SKU, and category

4. Inventory page actions are functional:
   - top filters now work: `Stock`, `Status`, `Category`
   - per-row `...` menu now works with actions:
     - `Open Product`
     - `Set Out of Stock`
     - `Add +5 Quantity`
   - status badge now reflects current edited quantity

5. Variant-first inventory clarity improvements:
   - inventory table now renders grouped by product (header row per product)
   - each product group shows `Product Total Stock`
   - variant rows remain editable (`- / input / +`) under the product group

6. Edit Product stock workflow improvements:
   - variant stock in `Variants` table is now editable directly (`- / input / +`)
   - right-side `Quantity Available` is now auto-calculated from variant totals
   - helper note clarifies that overall quantity comes from variant-level stock
   - `Quantity Available` field is read-only to avoid manual mismatch

7. Inventory view mode toggle:
   - added `Grouped` / `Flat` toggle in Inventory
   - default is `Grouped` for clarity at scale
   - users can switch to `Flat` when they prefer dense scanning

8. Grouped inventory collapsible sections:
   - each product group in `Grouped` mode can be collapsed/expanded
   - added chevron control on each product header row
   - added `Collapse All` / `Expand All` quick control

9. Inventory bulk action bar is now functional (selected variants):
   - `Update Stock`: increments selected variants by +1
   - `Mark In Stock`: ensures selected variants have at least quantity `1`
   - `Mark Out of Stock`: sets selected variants quantity to `0`
   - `Delete`: removes selected variants from current inventory workspace view
   - `Save Inventory Changes`: saves in frontend mock workspace and shows confirmation banner
   - variant `Last Updated` is refreshed to today on stock-changing actions

10. All Products filter UI polish:
   - status and stock filters reorganized into labeled compact rows
   - filter chips resized to smaller, cleaner visual weight
   - category selector aligned in a cleaner compact layout
   - search field tightened for less visual clutter

## Notes

- This is frontend-state implementation (mock mode).
- Backend integration can map these actions to API calls later without changing UX structure.
