# Shipping Rate Checkout Design

## Goal

Connect the existing Shipping & Logistics setup to buyer checkout so a storefront order can carry a shipping method, shipping fee, and final total before full courier API automation is connected.

## Current State

- Storefront checkout submits product subtotal only.
- Local checkout fallback creates seller-visible orders and deducts stock.
- Settings already has shipping zone seed data for Semenanjung and Sabah/Sarawak, and tenant stores can persist edited shipping zones in `settings.shipping.zones`.
- Courier booking, waybill generation, and live tracking webhooks are still later integration work.

## Target Flow

1. Buyer adds product to cart.
2. Buyer enters shipping city/postcode/country.
3. Checkout shows the best matching shipping option from the tenant's saved Shipping & Logistics zones.
4. Summary shows subtotal, shipping, and total.
5. Checkout payload carries selected shipping method/rate.
6. Local fallback order stores total including shipping and assigns the selected courier/method context.

## Rules

- Use Malaysia-first flat shipping for now:
  - Prefer tenant-saved `settings.shipping.zones`.
  - Fall back to Semenanjung and Sabah/Sarawak seed rates when no saved zones exist.
  - Free shipping when subtotal matches the configured price-rate threshold.
- If address cannot be confidently matched, fall back to the Semenanjung default rate.
- This is checkout rate quoting only. It does not auto-create courier shipments yet.
- Public storefront payload may expose safe shipping settings only; do not expose payment keys, provider secrets, or owner-only settings.
- Public checkout API must persist the selected shipping method and fee into order total/shipment metadata so frontend fallback and backend orders match.
- Buyer tracking remains based on seller fulfillment stage and manual/provider tracking number.

## Later

- Connect courier provider rate APIs, shipment creation, waybill labels, and webhook-driven delivered status.
