# Settings Module Progress Notes

Date: April 21, 2026

## Implemented Structure

Settings module built as a centralized operational hub with documented sections:

1. Settings Hub
2. General
3. Checkout
4. Domain & Branding
5. Payments
6. Shipping & Logistics
7. Notifications
8. Integrations
9. Staff & Roles
10. Developer

## Routing

- `#/settings`
- `#/settings/general`
- `#/settings/checkout`
- `#/settings/domain-branding`
- `#/settings/payments`
- `#/settings/payments/overview|gateway|manual|rules`
- `#/settings/payments/securepay|stripe|paypal`
- `#/settings/shipping-logistics`
- `#/settings/shipping-logistics/overview|zones|methods|courier|api|routing`
- `#/settings/notifications`
- `#/settings/notifications/shipment|email|sms|whatsapp|ai`
- `#/settings/integrations`
- `#/settings/integrations/overview|tracking|messaging|developer`
- `#/settings/integrations/<integration-id>`
- `#/settings/staff-roles`
- `#/settings/developer`

## Functional Coverage

1. Hub
- Grouped cards by functional domain and quick links to each section.

2. General
- Store identity, contact information, regional settings, order defaults, system preferences.
- Save action connected.
- Expanded into a fuller operational form:
  - controlled fields for identity, support contact, regional rules, order defaults, and admin preferences
  - dirty state tracking
  - discard changes action
  - apply recommended defaults action
  - test contact action
  - quick link into Domain & Branding
  - live snapshot panel for current store identity/support output

3. Checkout
- Expanded into a fuller checkout configuration flow:
  - customer form structure toggles including marketing opt-in
  - shipping/payment method toggles with preferred default selectors
  - order summary behavior controls
  - configurable optional protection area
  - dirty state tracking
  - discard changes action
  - apply recommended checkout profile action
  - preview sync action
  - live seller-facing preview that updates from enabled fields, methods, summary behavior, and add-on state
  - checkout status tiles for fast QA

4. Domain & Branding
- Expanded into a fuller brand center workflow:
  - controlled domain and subdomain fields
  - domain verification action
  - richer brand identity controls including tagline, logo label, and logo style
  - theme preset, color system, and button shape controls
  - storefront component toggles for announcement bar and floating help
  - dirty state tracking
  - discard changes action
  - apply recommended brand profile action
  - generate brand variant action
  - live seller-facing storefront preview that responds to brand inputs and theme controls
  - brand status / readiness sidebar
  - domains UX upgraded with:
    - managed subdomain card
    - custom domain card
    - add/edit domain modal
    - DNS records guidance

5. Payments (local tabs)
- Expanded into a fuller payments control workflow:
  - overview metrics plus operational snapshot and recommended action panel
  - richer gateway list with status context and gateway positioning notes
  - manual methods with fallback usage guidance
  - rules engine with named rule creation input, toggle, and delete action
  - gateway detail pages for SecurePay/Stripe with editable environment, credentials, webhook URL, copy action, and test connection action
  - PayPal placeholder upgraded with planned support checklist
  - added GrabPay and Atome as configurable payment gateways
  - added Touch n Go eWallet and FPX as configurable payment gateways
  - added DuitNow QR as a configurable payment gateway / QR payment path
  - fixed gateway configure navigation to open detail pages by route slug instead of internal id
  - gateway detail pages now explain merchant onboarding and payment confirmation flow for live integration planning
  - added in-app payment setup guide modal for seller education
  - payment setup guide modal now supports scrolling on smaller viewports
  - payment guide now includes official-source links and practical QR/company-account guidance
  - gateway detail pages now include a clear "requirements before going live" checklist
  - `DuitNow QR` detail page now supports `Static QR` vs `Dynamic QR` configuration with settlement account context
  - added mock payment confirmation flow testing panel so seller can understand callback/webhook-driven paid status
  - payment gateway detail pages were redesigned to be seller-first:
    - `Who this is for`
    - `What you need first`
    - `Setup progress`
    - `Apply / Register` link
    - `Official info` link
  - advanced technical fields like webhook/credentials are now hidden behind `Show Advanced Setup`
  - gateway list action labels now match status logic:
    - `Manage` for connected gateways
    - `Continue Setup` for pending gateways
    - `Start Setup` for disconnected gateways
  - gateway cards now explain the meaning of `Connected`, `Pending`, and `Test Mode` more clearly
  - manual methods now include operational guidance for:
    - what enabling the method changes in checkout
    - what payment state the order should remain in
    - how COD collection vs bank transfer proof should be tracked
    - proof / verification checklist before marking payment received

6. Shipping & Logistics (local tabs)
- Zones and methods views.
- Courier integrations with configure/toggle.
- Routing rules and simulation action.
- Configure courier modal implemented.
- courier integrations now separate:
  - courier connection/setup progress
  - test/live environment
  - enabled-for-routing state
- carrier list now expanded to reflect a more ShopeeGo-style operational setup:
  - J&T
  - DHL eCommerce
  - DHL Express
  - Ninja Van
  - Ninja Van International
  - POS Malaysia
  - GDEX
  - Aramex
- courier cards now explain:
  - who the courier is best for
  - what seller should prepare first
  - whether the courier is connected, still in setup, or kept out of routing
- courier setup modal now explains:
  - setup progress tracker
  - seller-first onboarding steps
  - advanced API / pickup configuration
  - mock shipment sync behavior
  - what happens after courier connection succeeds
- added in-app `Shipping & Logistics Guide` modal for seller education
- created dedicated file:
  - `docs/shipping-logistics-guideline.md`
- `API Integrations` now behaves more like shipping provider setup with platform-style entries such as:
  - Easyparcel
  - Delyva (Matdispatch)
  - Sendparcel by Poslaju
  - NinjaVan Optimise
  - Pos Malaysia
  - ParcelDaily
- shipping zones now show:
  - regions/states coverage
  - weight based rates
  - price based rates
- routing rules are now upgraded from static examples into a fuller builder with:
  - recommended templates
  - create rule flow
  - edit / duplicate / delete
  - draft vs active state control
  - guided condition and action templates
- shipping UX was stabilized after review:
  - courier setup modal now scrolls correctly
  - courier/provider main surfaces are simplified so seller sees less info upfront
  - seller now clicks into setup workspace for deeper courier/provider configuration
  - `Add New Zone` now opens a real editable zone flow
  - `Edit Method` now opens a working delivery-method editor
  - shipping zone editor now supports:
    - add/remove regions
    - explicit delivery-method mapping by zone
    - add/remove weight and price rate bands
  - delivery method editor now supports:
    - active/inactive state
    - expected SLA
    - preferred courier guidance
  - routing test simulation now explains that it is a safe preview, not a live shipment execution
  - routing test simulation now also supports sample inputs:
    - zone
    - delivery method
    - scenario

7. Notifications (local tabs)
- Upgraded into a more seller-facing notification workflow:
  - shipment notification explanation + trigger moments
  - quiet-hours control
  - quick channel test explanation
  - suggested event/channel matrix
  - in-app notification guide modal
  - customer notification events list with editable event templates
  - top-level overlap cleanup:
    - `Email/SMS/WhatsApp` tabs replaced by a single `Channel Defaults` tab
    - event editing remains under shipment event templates
  - Email/SMS/WhatsApp config panels with:
    - sender label
    - trigger
    - send timing
    - editable template content
    - current delivery logic summary
  - event editor modal with:
    - Email / SMS / WhatsApp tabs
    - subject/body template editing
    - preview
    - per-channel enable toggle
    - notification variables helper
  - AI optimization section with clearer seller wording

8. Integrations (local tabs)
- Upgraded into a more seller-facing integration workspace:
  - control-center intro
  - category summary cards
  - richer integration cards with seller-fit and setup-hint context
  - clearer `Manage` / `Open Setup` actions
  - detail page now includes:
    - who this is for
    - primary use
    - setup note
    - credential / webhook save area
  - tracking/analytics detail pages now also include analytics-tools fields such as:
    - Meta Pixel
    - TikTok Pixel
    - Google Analytics
    - Google Ads conversion labels
    - Google Tag Manager

9. Staff & Roles
- Team members list and invite action.
- Role cards.
- Permission matrix.
- Activity snapshot panel.

10. Developer
- API keys table and create key flow.
- Webhook list and toggle.
- Test console event send action.

## Notes

- Architecture and grouping prioritized before final polish.
- UI patterns reused from existing modules (cards, tables, toggles, badges, modals).
- Ready for future backend wiring by replacing local state handlers with API calls.
- Settings Hub UI was refined after review to avoid duplicated navigation feel:
  - top navigation remains the primary section switcher
  - hub content now acts as an executive control center instead of repeating large menu cards
  - added operational hero summary, priority workspaces, quick control shortcuts, and compact section status cards
  - section cards now show health/snapshot context for a more premium and cleaner presentation

## Verification

- `npm run lint` passed (`tsc --noEmit`).
- payment gateway logic now separates:
  - onboarding/setup progress
  - test/live environment
  - enabled-at-checkout state
- seller can save `Live` mode without automatically showing the gateway to customers
- gateway checkout toggle is only available once setup reaches `Ready to Connect` or `Live`
- gateway list now surfaces `On at Checkout` / `Off at Checkout` badge for clearer seller understanding
- manual methods now clarify that visibility at checkout is separate from payment confirmation
- courier routing now clarifies that connection and routing availability are separate states
- shipping setup now follows a cleaner UX rule:
  - lightweight summary on main surface
  - deeper setup only after seller clicks into a modal workspace
