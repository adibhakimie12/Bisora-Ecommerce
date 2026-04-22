# Button Status Audit

## Purpose

Simple owner view of interactive readiness across the admin system.

Status meanings:

* `Ready` = core visible buttons already do something useful in UI
* `Partial` = many buttons work, but some actions are still mock/demo behavior
* `Needs Audit` = module likely has many interactions, but not yet fully reviewed in detail

---

## Current Best Read

| Module | Status | Notes |
|---|---|---|
| Reports | Ready | Analytics + Finance buttons reviewed and wired. Buttons now trigger UI state, navigation, filters, drawers, or feedback flows. |
| Orders | Ready | Core visible buttons now do something useful in UI, including search/filter behavior, draft helper actions, bulk actions, detail flows, and shipment processing. |
| Products | Ready | Core visible buttons now trigger useful UI behavior across all products, inventory, categories, edit studio, and category detail flows. |
| Customers | Ready | Core visible buttons now trigger useful UI behavior across customer list, CRM profile, notes, reviews, moderation, and customer create/edit flows. |
| Marketing | Ready | Core visible buttons now trigger useful UI behavior across overview, discounts, upsells, recovery, broadcasts, funnels, and automation flows. |
| Settings | Needs Audit | High-risk module because actions affect real configuration logic later. Should be reviewed carefully. |
| Website Builder | Needs Audit | Very interaction-heavy. Needs dedicated audit after current TypeScript/build stability work. |
| Frontend | Needs Audit | Not enough reviewed yet. |

---

## What We Already Confirmed

### Reports

`Reports` is the strongest reviewed module right now.

Covered:

* Analytics top tabs
* Finance section switcher
* `Basic / Advanced` mode switch
* Filters and toggles
* Export buttons
* AI action buttons
* Reconciliation action buttons
* Table row drawer/detail interactions

Result:

* visible buttons in Reports now have working in-module behavior
* current behavior is still mock/demo in some places, but not dead

### Orders

`Orders` now behaves like a proper UI-ready operational module.

Covered:

* order list search and filtering
* advanced filter expansion
* bulk action bar
* order detail actions
* draft order helper actions
* abandoned checkout reminders and analytics entry points
* shipment processing and finalize flow
* settlement visibility inside the main orders table

Result:

* visible core buttons in Orders now trigger real UI flow or feedback
* still not backend-live, but no longer feels like a static shell

### Products

`Products` now behaves like a proper UI-ready catalog workspace.

Covered:

* all products filters and row actions
* inventory bulk actions and row menus
* edit product studio helper actions
* category creation and analytics entry points
* category detail actions
* category products search, sort, add, and remove actions

Result:

* visible core buttons in Products now trigger real UI flow, state change, navigation, or feedback
* still not backend-live, but no longer has obvious dead category-detail actions

### Marketing

`Marketing` now behaves like a proper UI-ready growth workspace.

Covered:

* overview quick actions and exports
* discounts list, toggles, create flow, and preview shortcuts
* upsell list and offer builder actions
* recovery dashboard, flow builder, and template builder
* broadcasts list, duplicate/create flow, and launch flow
* funnel builder, wizard, automation rules, and rule builder

Result:

* visible core buttons in Marketing now trigger real UI flow, state change, navigation, or feedback
* still not backend-live, but no longer has obvious dead quick-action buttons inside the current builders

### Customers

`Customers` now behaves like a proper UI-ready CRM workspace.

Covered:

* all customers search and status filtering
* customer row menu actions
* create and edit customer modal flows
* internal notes from list and profile
* customer profile quick actions
* reviews filters, export, moderation, and moderation actions

Result:

* visible core buttons in Customers now trigger real UI flow, state change, navigation, or feedback
* empty states and basic input guards now prevent fake-success interactions during owner testing

---

## What "Function" Means Right Now

Important:

Right now many buttons are **UI-functional**, not yet **backend-live**.

That means a button may:

* open a drawer
* change filters
* switch state
* navigate
* show a success banner
* simulate an export

But not yet:

* save to real database
* call live gateway API
* sync real external integrations

For owner testing, this is still useful because we can separate:

* dead button
* working UI flow
* real production integration

---

## Best Priority Order

For business value, this is the best next sequence:

1. `Settings`
Reason: fewer daily clicks, but high impact, so review after the main operating modules are now stable.

2. `Website Builder`
Reason: very big surface area, needs focused pass.

3. `Frontend`
Reason: customer-facing flows are important, but should come after admin-side control surfaces are stable enough.

---

## Recommendation

Best next move:

* do a careful `Settings` button audit next

Why:

* Reports, Orders, Products, Marketing, and Customers are already in strong UI-ready shape
* Settings is the next high-risk area because later backend wiring will affect real business configuration
* auditing it now will reduce expensive logic mistakes before integration work starts

---

## Owner Summary

If you ask "what is best for me now?" the answer is:

* `Reports` already in good shape
* `Orders` is now in good UI-ready shape too
* `Products` is now in good UI-ready shape too
* `Marketing` is now in good UI-ready shape too
* `Customers` is now in good UI-ready shape too
* next smartest module to audit is `Settings`

That gives the biggest confidence boost for real daily use before backend connection starts.
