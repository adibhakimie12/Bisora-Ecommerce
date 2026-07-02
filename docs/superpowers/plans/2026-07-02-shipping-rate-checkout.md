# Shipping Rate Checkout Plan

## Scope

Wire flat Malaysia shipping rates into the storefront checkout and local order fallback.

## Steps

1. Add a shipping-rate helper for matching buyer address to Semenanjung or Sabah/Sarawak rates.
2. Add tests for Semenanjung, East Malaysia, and free-shipping thresholds.
3. Extend the public checkout payload with optional shipping method data.
4. Update storefront checkout summary and submission payload.
5. Update local checkout order creation so seller orders include shipping in total and courier context.
6. Expose public-safe `settings.shipping` in the public storefront API.
7. Make checkout prefer saved tenant shipping zones and fall back to seed zones.
8. Make backend public checkout store selected shipping fee/method in the order total and shipment metadata.
9. Update tests, memory, and run lint/test/build.

## Acceptance Checks

- Checkout displays subtotal, shipping, and final total.
- Local fallback order total includes product total plus shipping fee.
- Seller order uses selected shipping method/courier context.
- Existing public checkout API payload remains backward compatible.
- Backend checkout total matches frontend checkout total when shipping method is submitted.
- Public storefront only exposes safe shipping settings, not private integration credentials.
