# Marketing Module Progress Notes

Date: April 21, 2026

## Implemented

1. Added full Marketing module with clean top navigation:
- Overview
- Discounts
- Upsells
- Recovery
- Broadcasts
- Funnels

2. Built core pages and flows (structure + logic first):
- Overview dashboard with KPI cards, performance chart, top campaigns, and quick actions.
- Discounts list with KPI, actions, status toggle, delete, export.
- Create Discount form with live preview and save flow.
- Upsells list with KPI, strategy action, status toggle, and edit/create routing.
- Upsell Offer Studio (create offer) with pricing logic and preview.
- Recovery dashboard with KPI, abandoned checkout table, send reminder, mark recovered.
- Recovery Flow Builder (node-style flow + save/publish actions).
- Message Template Builder (template editor + preview panel).
- Broadcasts dashboard with KPI, campaign table, duplicate/export.
- Create Broadcast studio with channel/audience/schedule flow and live preview.

3. Built advanced Funnels experience last:
- Funnel Builder canvas (step library, canvas cards, step settings).
- 3-step Create Funnel wizard modal (objective, template, summary).
- Funnel Automations view (rule library + automation canvas + performance panel).
- AI Automation Rule Builder modal (conditions/actions/priority/save).

4. Added real routing integration:
- `#/marketing`
- `#/marketing/discounts`
- `#/marketing/discounts/new`
- `#/marketing/upsells`
- `#/marketing/upsells/new`
- `#/marketing/recovery`
- `#/marketing/recovery/flow-builder`
- `#/marketing/recovery/templates`
- `#/marketing/broadcasts`
- `#/marketing/broadcasts/new`
- `#/marketing/funnels`
- `#/marketing/funnels/automations`

5. Added preview images across marketing pages for visual context.

## Files Added

- `src/modules/marketing/MarketingModule.tsx`
- `src/modules/marketing/data.ts`
- `src/modules/marketing/types.ts`
- `docs/marketing-module-progress-notes.md`

## Files Updated

- `src/App.tsx` (route + module integration)

## Verification

- `npm run lint` passed (`tsc --noEmit`).

## Follow-up QA Pass (Button Audit)

Date: April 21, 2026

- Performed button-level scan in `MarketingModule.tsx` to ensure all `<button>` elements have active handlers.
- Fixed non-functional template list buttons in Recovery > Template Builder:
  - Template cards are now selectable.
  - Selected template highlights visually.
  - Editor fields sync to selected template.
  - Live mobile preview updates based on selected template.
- Re-validated module with `npm run lint` after fixes.

## Follow-up Function Pass (Status + Logic Clarity)

Date: April 21, 2026

1. Discounts enhancements:
- Added date-time scheduling fields (`Start Date & Time`, `End Date & Time`) in Create Discount.
- Added manual power state (`ON/OFF`) to control whether discount is live.
- Added live discount state logic:
  - Active
  - Scheduled
  - Expired
  - Off (manual)
  - Auto Off (usage cap reached)
- Added `Use +1` action in discount table to simulate redemption and test auto-off behavior.

2. Upsells clarity improvements:
- `Bump Offer` and `One-Time Offer` now change behavior:
  - Different default triggers
  - Different trigger options
  - Different contextual preview copy to explain placement (pre-payment vs post-payment)

3. Recovery Flow Builder interactivity:
- Flow components are now clickable to add nodes.
- Flow canvas nodes are selectable and highlighted.
- Selected node is editable from Node Configuration.
- Delay minutes can be edited.
- Channel nodes support editable template + message.
- Added remove node action.

4. Added documentation base for future in-app tutorial:
- `docs/guideline.md` created with functional explanation for Discounts, Upsells, Recovery, and Funnels.

## Follow-up Function Pass (Eligibility + Distribution)

Date: April 21, 2026

1. Create Discount upgraded with audience and delivery logic:
- Added `Customer Eligibility`:
  - All Customers
  - First-Time Purchase
  - Returning Customers
- Added `Code Distribution`:
  - Public
  - Direct Code
- Added `Delivery Channels` for Direct Code:
  - WhatsApp
  - Email
  - SMS
- Save button now requires at least one channel if `Direct Code` is selected.

2. Discount data model and list table expanded:
- Discount now stores:
  - audience
  - codeAccess
  - deliveryChannels
  - isEnabled
  - startsAt / endsAt (date-time)
- Discount list now displays:
  - Eligibility
  - Distribution

3. Upsell create flow clarity:
- Added explicit behavior hint:
  - Bump Offer = pre-payment checkout placement
  - One-Time Offer = post-purchase placement
