# Shipping & Logistics Guide (Draft v1)

Date: April 21, 2026

This guide explains how sellers should understand Shipping & Logistics setup inside Bisora.

## 1. Shipping Zones

Shipping zones group destinations so shipping logic stays clean.

Examples:
- `Malaysia`
- `East Malaysia`
- `Singapore`
- `International`

Seller should use zones to:
- separate domestic and international logic
- control where each delivery method is available
- prepare routing rules that match real courier coverage

## 2. Delivery Methods

Delivery methods are customer-facing checkout options.
They are not the same as courier accounts.

Examples:
- `Standard Delivery`
- `Express Delivery`
- `Same-Day Delivery`

Seller should read them like this:
- a delivery method is what customer chooses
- a courier connection is what operations uses behind the scenes
- one delivery method may later map to one or more possible couriers

## 3. Courier Connection Logic

Connecting a courier means Bisora can prepare shipment sync flow with that courier.

It can include:
- shipment creation
- label generation
- tracking reference return
- fulfillment timeline updates

It does NOT mean:
- every order will automatically use that courier
- routing is already enabled
- test mode is finished
- live shipping sync is already safe

Common carrier examples now represented in the workspace:
- `J&T`
- `DHL eCommerce`
- `DHL Express`
- `Ninja Van`
- `Ninja Van International`
- `POS Malaysia`
- `GDEX`
- `Aramex`

## 4. Shipping Providers / Aggregators

Shipping providers are not always the same as direct courier accounts.
Some sellers may connect through an aggregator or shipping platform first.

Examples now represented in the workspace:
- `Easyparcel`
- `Delyva (Matdispatch)`
- `Sendparcel by Poslaju`
- `NinjaVan Optimise`
- `Pos Malaysia`
- `ParcelDaily`

Seller should read them like this:
- direct courier = seller connects the courier service itself
- shipping provider = seller connects a platform or aggregator that helps coordinate courier options, booking, or tracking flow

## 5. What seller should prepare before connecting courier

Typical setup needs:
- approved courier shipper or merchant account
- API or account credentials
- pickup contact and phone number
- warehouse or pickup origin details
- tracking / label sync readiness

## 6. Courier Setup Status

Suggested meaning inside Bisora:
- `Not Started`: seller has not begun courier onboarding
- `Applied`: seller has started account setup or onboarding request
- `Ready to Connect`: seller already has enough details to begin API or dashboard connection
- `Live`: courier is approved, configured, and ready for production use

## 7. Routing vs Connection

Connection and routing are separate.

Seller should understand it like this:
- connected courier = available to the system
- enabled for routing = allowed to be used in courier assignment logic

A courier can be connected but still kept out of routing until seller is confident with test results.

## 8. Shipping Zones and Rate Logic

Zones can now carry both:
- `weight based rates`
- `price based rates`

Seller should use them like this:
- weight-based rates when shipping fee depends on parcel weight
- price-based rates when shipping fee or free shipping depends on cart value

Example:
- `0.10kg - 5.00kg = MYR6.00`
- `MYR160.00 - MYR2,000.00 = FREE`

## 9. Routing Rules

Routing rules decide which courier should be assigned after checkout.

Examples:
- Malaysia orders use Ninja Van first
- express orders prioritize a faster courier
- if primary courier API is delayed, switch to fallback courier

Routing rules should consider:
- shipping zone
- service level
- courier readiness
- fallback behavior
- operational cost or seller preference

Current seller actions in frontend:
- `Create Rule`: quickly add a routing rule draft
- `Use Template`: start from a recommended routing pattern
- `Edit`: update routing rule name, condition, and action
- `Duplicate`: clone a working routing rule and refine it
- `Activate` / `Move to Draft`: control whether the rule is live
- `Delete`: remove the rule from the routing stack
- `Execute Test Simulation`: run a safe preview to see which rule would win and which courier would likely be selected for a sample order

Test simulation does:
- let seller choose a sample zone, delivery method, and scenario
- preview routing logic outcome
- help seller spot bad fallback logic before going live
- show likely rule/method/courier decision in a safe way

Test simulation does not:
- create a real shipment
- call courier APIs for a live order
- change customer order status
- replace real courier sync testing

## 10. UX Principle For Seller Surface

Main shipping surfaces should stay simple.

Seller should first see:
- summary status
- whether setup is not started, in progress, or live
- whether routing is on or off
- one clear action to open setup

Seller should only see deeper setup details after clicking into the modal or detail workspace.

This means:
- courier list should not show too many operational cards at once
- provider list should stay lightweight on the main page
- setup stage, test mode, sync testing, and advanced credentials belong inside the setup workspace

## 11. Suggested Seller Setup Flow

1. Create shipping zones.
2. Define which delivery methods should appear in each zone.
3. Open courier account and complete onboarding.
4. Connect courier in test mode first.
5. Verify shipment request, label flow, and tracking update behavior.
6. Enable courier for routing only after testing is stable.

## 12. Future Guideline Note

This file exists as a dedicated Shipping & Logistics guide so future help-center or onboarding pages should reference it instead of rewriting the same courier setup logic again.
