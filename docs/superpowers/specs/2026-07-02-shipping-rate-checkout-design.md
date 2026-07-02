# Shipping Rate Checkout Design

## Goal

Connect the existing Shipping & Logistics setup to buyer checkout so a storefront order can carry a shipping method, shipping fee, and final total before full courier API automation is connected.

## Current State

- Storefront checkout submits product subtotal only.
- Local checkout fallback creates seller-visible orders and deducts stock.
- Settings already has shipping zone seed data for Semenanjung and Sabah/Sarawak.
- Courier booking, waybill generation, and live tracking webhooks are still later integration work.

## Target Flow

1. Buyer adds product to cart.
2. Buyer enters shipping city/postcode/country.
3. Checkout shows the best matching shipping option from the active Malaysia zones.
4. Summary shows subtotal, shipping, and total.
5. Checkout payload carries selected shipping method/rate.
6. Local fallback order stores total including shipping and assigns the selected courier/method context.

## Rules

- Use Malaysia-first flat shipping for now:
  - Semenanjung: first weight rate from settings seed.
  - Sabah/Sarawak/Labuan: first East Malaysia weight rate from settings seed.
  - Free shipping when subtotal matches the configured price-rate threshold.
- If address cannot be confidently matched, fall back to the Semenanjung default rate.
- This is checkout rate quoting only. It does not auto-create courier shipments yet.
- Buyer tracking remains based on seller fulfillment stage and manual/provider tracking number.

## Later

- Replace seed-backed rates with tenant-saved Shipping settings from backend.
- Connect courier provider rate APIs, shipment creation, waybill labels, and webhook-driven delivered status.
