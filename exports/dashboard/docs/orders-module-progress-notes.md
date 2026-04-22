# Orders Module Progress Notes

Updated: 2026-04-21

## What Has Been Implemented

1. Added product thumbnail previews in `All Orders` table (`Products` column).
2. Added item thumbnail previews in `Draft Orders` table (`Items Preview` column).
3. Added product images in `Draft Orders > Product Selection` line items.
4. Added cart preview thumbnails in `Abandoned Checkouts` table (`Cart Items` column), with lightweight rendering:
   - small thumbnails
   - capped preview count
   - lazy-loaded images
5. Improved selection action flow in `All Orders`:
   - if 1 order selected: primary button now shows `Generate Shipment` (not `Bulk`)
   - if >1 selected: primary button shows `Bulk Generate Shipment`
   - `Print Waybill` for 1 selected order now checks tracking number:
     - if missing, prompts user to open Shipment Processing
     - if present, opens print-ready dialog
6. Implemented settings-driven courier assignment mock:
   - added shared courier settings source in `src/modules/orders/shippingSettings.ts`
   - `Shipment Processing > Courier Assignment` now uses dropdowns powered by active couriers only
   - `Service type` options now depend on selected courier
   - empty-state message shown when no courier is active
7. Synced `Bulk Shipment` modal with same courier settings source:
   - courier dropdown shows active couriers only
   - shipping method options are dynamic per selected courier
   - generate button is disabled when no active courier is available

## Current UX Intent

- Single-order actions should feel direct and predictable.
- Bulk actions should only appear/behave as true bulk.
- Shipment/waybill status is visible in admin order detail and shipment processing views.
