# Project Memory Log

Date: April 21, 2026

## Completed Modules

1. Orders
- Shipment processing flow
- Bulk shipment behavior updates
- Product/cart image previews
- Abandoned checkout reminders with channel selection
- Courier dropdown based on enabled settings

2. Products
- All Products actions functional (edit/duplicate/archive/delete/menu)
- Inventory controls functional (row + bulk actions)
- Grouped inventory mode with collapse/expand
- Create Category modal + functional category flow
- Variant-level stock editing and sync

3. Customers
- All Customers list + row actions
- Customer Profile page
- Reviews page
- Review moderation modal

4. Marketing
- Overview, Discounts, Upsells, Recovery, Broadcasts, Funnels
- Create Discount / Create Upsell / Create Broadcast studios
- Recovery Flow Builder + Template Builder
- Funnel Builder + Funnel Wizard + Automations + Rule Builder
- Discount eligibility/distribution enhancements
- Bump vs OTO behavior clarification

5. Reports
- Overview
- Sales by Date
- Sales by Product
- Sales by Variant
- AI Insights

6. Settings
- Central Settings Hub + full module sections
- General, Checkout, Domain & Branding
- Payments (overview/gateway/manual/rules + gateway detail pages)
- Shipping & Logistics (overview/zones/methods/courier/api/routing + courier modal)
- Notifications (shipment/email/sms/whatsapp/ai optimization)
- Integrations hub + integration detail pages
- Staff & Roles
- Developer (API Keys, Webhooks, test console)

## Planning (Not Implemented Yet)

1. AI intelligence backend architecture blueprint
- Document created:
  - `docs/ai-intelligence-technical-flow.md`
- Scope includes:
  - OpenAI orchestration
  - webhook/event pipeline
  - action queue lifecycle
  - rollout phases
## 2026-04-21 15:02:50 - Settings Hub UX Cleanup

- Refined the Settings landing page to remove the duplicated navigation feeling between the top tab bar and the hub body.
- Converted the hub into a more premium operational control center with:
  - elevated pill-style top navigation
  - hero summary for readiness and system control
  - priority workspace cards
  - quick control shortcuts
  - compact section status cards with health/snapshot context
- Kept the top tab bar as the main way to switch sections; the hub now supports orientation and prioritization instead of repeating the same menu structure.

## 2026-04-21 15:16:45 - Settings General Section Pass

- Completed a deeper functional pass on `General` inside Settings.
- Upgraded the section from a simple form into a fuller operational settings workflow:
  - controlled identity/contact/regional/default/system fields
  - unsaved changes detection
  - discard changes action
  - apply recommended defaults action
  - send test contact action
  - quick link to Domain & Branding
  - live snapshot summary in the sidebar
- Verified with `npm run lint`.

## 2026-04-21 15:41:05 - Settings Checkout Section Pass

- Completed a deeper functional pass on `Checkout` inside Settings.
- Upgraded the section from simple toggles into a fuller checkout settings workflow:
  - customer information structure controls including marketing opt-in
  - shipping and payment method toggles with preferred default selectors
  - order summary behavior controls
  - configurable optional protection add-on area
  - unsaved changes detection
  - discard changes action
  - apply recommended checkout profile action
  - preview sync action
- seller-facing live preview that reflects enabled fields, methods, summary options, and add-on state
- checkout status tiles for quick QA
- Verified with `npm run lint`.

## 2026-04-21 15:45:50 - Settings Domain & Branding Section Pass

- Completed a deeper functional pass on `Domain & Branding` inside Settings.
- Upgraded the section from basic fields into a fuller brand center workflow:
  - domain + subdomain controls
  - domain verification action
  - richer brand identity controls
  - theme preset, color system, and button shape controls
  - storefront component toggles
  - unsaved changes detection
  - discard changes action
  - apply recommended brand profile action
  - generate brand variant action
- live seller-facing storefront preview that reacts to brand and theme changes
- brand status sidebar
- Verified with `npm run lint`.

## 2026-04-21 16:16:23 - Settings Payments Section Pass

- Completed a deeper functional pass on `Payments` inside Settings.
- Upgraded the section from basic lists into a more operational payments workspace:
  - overview metrics with operational snapshot
  - recommended action panel
  - richer gateway list with status context and positioning notes
  - manual methods with fallback guidance
  - rules engine with named rule creation flow
  - SecurePay / Stripe detail pages with editable credentials, environment switching, webhook copy action, and test connection trigger
- PayPal placeholder upgraded with planned support checklist
- Verified with `npm run lint`.

## 2026-04-21 16:33:58 - Payments Gateway Route + Wallet Expansion

- Fixed the `Configure` action in Settings > Payments so gateway detail pages open by gateway route slug instead of internal id.
- Added `GrabPay` and `Atome` into the configurable gateway list for more realistic payment coverage.
- Added `Touch n Go eWallet` and `FPX` into the configurable gateway list.
- Added onboarding + payment confirmation logic notes inside gateway detail pages for live integration planning.
- Verified with `npm run lint`.

## 2026-04-21 16:54:47 - Payments Guide + Rules UX Pass

- Added delete action into `Payment Rules Engine` so rules are not limited to status toggle only.
- Added explanatory copy to clarify that payment rules control checkout behavior, not direct payment receipt.
- Added in-app `Payment Setup Guide` modal for seller-facing onboarding help.
- Created dedicated file: `docs/payments-guideline.md`
- This payments guide should be referenced by any future global guideline/help center work to avoid duplicating payment integration explanations.
- Verified with `npm run lint`.

## 2026-04-21 17:12:30 - Payments Guide Scroll + QR Guidance Pass

- Fixed the in-app payment guide modal so content can scroll correctly on constrained viewports.
- Added official-source links inside the payment guide cards for SecurePay, FPX, GrabPay, Atome, Touch n Go eWallet, and DuitNow QR.
- Added `DuitNow QR` into the payment gateway list and gateway detail explanations.
- Expanded payment guidance to explain:
  - merchant/company settlement account linkage
  - static QR vs dynamic QR
  - why callback/webhook or reconciliation is needed before marking an order as paid
- Updated `docs/payments-guideline.md` so future global guideline/help center work can reference this instead of rewriting payment/QR setup logic.
- Verified with `npm run lint`.

## 2026-04-21 17:21:10 - Payments Gateway Detail Clarity Pass

- Expanded gateway detail pages so sellers can see what is actually required before going live instead of only seeing credentials fields.
- Added a `Requirements before going live` checklist to payment gateway detail pages.
- Added `DuitNow QR`-specific configuration for:
  - `Static QR` vs `Dynamic QR`
  - settlement account context
- Added a mock `payment confirmation flow` panel so sellers can simulate how callback/webhook confirmation should move an order into paid state.
- This improves future guideline work because the in-product explanation now aligns with the dedicated payment guide instead of duplicating inconsistent logic.
- Verified with `npm run lint`.

## 2026-04-21 17:30:45 - Payments Seller-First UX Pass

- Reworked payment gateway detail pages from technical-first to seller-first.
- Added seller-facing structure:
  - `Who this is for`
  - `What you need first`
  - `Setup progress`
  - `Apply / Register` link
  - `Official info` link
- Moved advanced technical fields such as credentials and webhook handling behind `Show Advanced Setup` so non-technical sellers are not overwhelmed too early.
- Added inline explanation for what webhook URL is used for via advanced field hint.
- This should reduce seller confusion and should be preserved when writing future global guideline/help center content.
- Verified with `npm run lint`.

## 2026-04-21 17:38:10 - Payments Terminology Clarification Pass

- Clarified that `Setup progress` is only a manual tracker for seller / ops workflow and does not auto-connect any gateway.
- Added helper text under:
  - `Your setup progress tracker`
  - `Open ... Setup`
  - `Read Official Info`
  - `Webhook URL`
- Updated `docs/payments-guideline.md` with a new section explaining how sellers should interpret these controls on the gateway page.
- This clarification should be reused later in global guideline/help center work so payment onboarding wording stays consistent.
- Verified with `npm run lint`.

## 2026-04-21 17:45:20 - Payments Gateway List Status Logic Pass

- Fixed gateway list action labels so they no longer look inconsistent or random to sellers.
- New behavior:
  - `Manage` for connected gateways
  - `Continue Setup` for pending gateways
  - `Start Setup` for disconnected gateways
- Added clearer descriptive text to explain the meaning of:
  - connected + live
  - connected + test
  - pending
  - disconnected
- This should reduce confusion before future guideline/help center work and should remain aligned with the payment onboarding wording already documented.
- Verified with `npm run lint`.
## 2026-04-21 18:02:10 - Payments Enable-vs-Setup Logic Pass

- Separated payment gateway setup state from seller checkout activation state.
- Added `enabledAtCheckout` and `setupStage` into payment gateway state so gateway availability is no longer confused with technical connection mode.
- `Start Setup` now moves a gateway into seller-facing onboarding progress (`Applied` / pending) instead of pretending the gateway is already connected.
- Gateway detail pages now allow sellers to:
  - save `Test` vs `Live` environment independently
  - track onboarding progress manually
  - turn a gateway on/off for checkout separately
- Checkout enable toggle is intentionally locked until setup reaches `Ready to Connect` or `Live`.
- Gateway list now shows `On at Checkout` vs `Off at Checkout` so seller can understand why a connected gateway may still be hidden from customers.
- This logic should be preserved for future global guideline/help-center writing because it reflects the intended seller mental model: setup first, then decide checkout visibility.

## 2026-04-21 18:28:40 - Payments Manual Methods Operational Clarity Pass

- Expanded `Manual Methods` from simple toggles into seller-facing operational cards.
- Added explanation that enabling a manual method only affects checkout visibility and does not confirm payment receipt.
- Defined separate tracking expectations for:
  - `Cash on Delivery`
  - `Bank Transfer`
- Added operational flow steps and proof / verification checklist for each manual method.
- Clarified recommended waiting states:
  - `Awaiting collection on delivery`
  - `Awaiting transfer proof / verification`
- Updated `docs/payments-guideline.md` so future help-center or ops guidance can reuse the same manual-method wording.

## 2026-04-21 18:41:15 - Payments Manual Methods UI Simplification Pass

- Simplified `Manual Methods` surface so the main page stays cleaner and less crowded.
- Kept only high-signal summary on each card:
  - checkout visibility state
  - payment waiting-state badge
  - short caution
- Moved deeper operational flow and proof checklist into expandable `View Details` content instead of showing everything by default.
- Updated `Open Payment Guide` modal so manual methods are explained as seller-facing guidance, not only gateway/provider setup notes.

## 2026-04-21 18:54:10 - Payments Rules Editing Pass

- Upgraded `Payment Rules Engine` so rules are no longer locked to toggle/delete only.
- Added inline `Edit` mode for each rule with editable:
  - rule name
  - condition
  - action
- Updated rule status action labels from generic `Toggle` into clearer seller-facing states:
  - `Activate`
  - `Move to Draft`
- `Create Rule` still auto-generates a draft suggestion, but now immediately opens the new rule in edit mode so seller can refine it without extra friction.

## 2026-04-21 19:02:25 - Payments Rules Guided Builder Pass

- Improved rule editing so `Condition` and `Action` are no longer fully blank free-text by default.
- Added guided dropdown templates for common payment-rule patterns, including:
  - cart value
  - VIP customer
  - checkout timing
  - shipping zone
  - risk level
  - manual payment review
- Added guided action templates for common outcomes such as:
  - force card / online banking
  - prioritize gateway
  - disable COD
  - show bank transfer only
  - hide manual methods
- Kept text inputs editable so seller can still override template wording when needed.

## 2026-04-21 19:09:40 - Payments Rules Quick-Start Pass

- Added `Recommended Templates` cards above the rules list so seller can start from common payment-rule patterns without typing from scratch.
- Added `Duplicate` action for existing rules so seller can clone a working rule and adjust it instead of rebuilding manually.
- Template creation and duplicate flow now both open the new draft directly in edit mode for faster refinement.

## 2026-04-21 19:16:05 - Payments Guide Rules Clarification Pass

- Updated `Open Payment Guide` so sellers can understand what `Payment Rules Engine` is actually for.
- Added seller-facing explanation that payment rules:
  - control checkout visibility / priority
  - do not collect money
  - do not mark orders as paid
  - do not replace webhook, callback, or reconciliation
- Added simple seller examples for high-value orders, VIP routing, and COD restriction logic.

## 2026-04-21 19:31:20 - Shipping Courier Connection Flow Pass

- Upgraded `Shipping & Logistics > Courier Integrations` from basic configure/toggle cards into seller-facing courier connection cards.
- Added clearer courier states so seller can understand the difference between:
  - disconnected
  - sandbox / setup in progress
  - connected
  - enabled for routing
- Expanded courier cards with:
  - seller fit guidance
  - setup stage
  - what seller should prepare first
  - routing on/off clarity
- Reworked the courier setup modal into a fuller onboarding workspace with:
  - setup progress tracker
  - official setup / info links
  - advanced API and pickup setup
  - mock shipment sync test
  - explanation of what happens after courier sync succeeds
- Separated courier connection state from `enabled for routing` so seller can test setup before allowing routing logic to use that courier.

## 2026-04-21 19:39:45 - Shipping Guide Pass

- Added `Open Shipping Guide` to the shipping workspace so seller can quickly understand logistics setup in plain language.
- Created in-app guide coverage for:
  - shipping zones
  - delivery methods
  - courier connection logic
  - routing rules
  - suggested setup flow
- Added dedicated file:
  - `docs/shipping-logistics-guideline.md`
- This shipping guide should be reused later in any global onboarding/help-center flow instead of rewriting courier setup explanations again.

## 2026-04-21 19:54:30 - Shipping Carriers + Providers Alignment Pass

- Expanded shipping carriers to better reflect the ShopeeGo-style operational list:
  - J&T
  - DHL eCommerce
  - DHL Express
  - Ninja Van
  - Ninja Van International
  - POS Malaysia
  - GDEX
  - Aramex
- Added shipping provider-style integrations under the API/provider area:
  - Easyparcel
  - Delyva (Matdispatch)
  - Sendparcel by Poslaju
  - NinjaVan Optimise
  - Pos Malaysia
  - ParcelDaily
- Upgraded shipping zones so seller can now see:
  - zone regions/states
  - weight based rates
  - price based rates
- Added provider setup modal flow so `Activate` / `Edit` now map to a clearer seller configuration experience instead of static buttons.

## 2026-04-21 20:06:35 - Shipping Routing Rules Builder Pass

- Upgraded `Routing Rules & Simulation` from static example cards into a fuller routing-rule builder.
- Added:
  - recommended routing templates
  - create rule flow
  - inline edit mode
  - duplicate action
  - activate / move to draft controls
  - delete action
- Added guided condition and action templates so seller can create routing logic faster without starting from blank fields.

## 2026-04-21 20:34:10 - Shipping UX Stabilization Pass

- Fixed shipping modal structure so courier setup modal now scrolls correctly on smaller viewports instead of trapping content.
- Simplified `Courier Integrations` surface so seller now sees a cleaner summary row first:
  - courier name
  - connection status
  - test/live mode
  - routing on/off badge
  - single `Manage` / `Continue Setup` / `Open Setup` action
- Moved heavier courier setup logic inside the modal instead of forcing too much information onto the main shipping page.
- Simplified shipping provider surface with the same principle:
  - clean summary first
  - deeper setup only after opening the provider workspace
- `Add New Zone` now returns a real zone object and opens the editor against the actual saved zone id, so seller can create then immediately edit without broken draft mismatch.
- Added working `Shipping Zone` editor flow with save support against the actual shipping zone state.
- Added working `Delivery Method` editor modal so the `Edit Method` action now opens a real editable form instead of behaving like a dead action.
- Updated the in-app `Shipping & Logistics Guide` so it matches the current shipping structure:
  - simpler explanation of courier section vs provider section
  - no overloaded direct-carrier explanation cards on the main guide surface
  - wording now aligns better with the cleaner shipping UI

## 2026-04-21 20:42:40 - Shipping Zone Editor Completion Pass

- Upgraded `Edit Shipping Zone` so seller can now manage the zone more directly instead of editing only raw text blocks.
- Added region chips with add/remove actions for clearer destination management.
- Added explicit `Delivery Methods In This Zone` mapping so seller can decide which checkout-facing methods belong to the zone.
- Added `Add Rate` and `Remove` actions for both:
  - weight based rates
  - price based rates
- Shipping zone cards on the main page now also show attached delivery methods, so seller can scan zone coverage and checkout method mapping without opening the editor first.

## 2026-04-21 20:51:20 - Delivery Method + Simulation Clarification Pass

- Upgraded `Delivery Methods` cards so seller now sees:
  - active / inactive state
  - expected SLA
  - preferred courier guidance
- Expanded `Edit Delivery Method` modal so seller can update:
  - method status
  - seller-facing note
  - expected SLA
  - preferred courier
- Clarified `Execute Test Simulation` so it now behaves as a safe routing preview instead of feeling like a mysterious action button.
- Added a visible simulation result block showing:
  - winning routing rule
  - matched zone
  - selected delivery method
  - selected courier
- Updated in-app shipping guide and dedicated shipping guideline doc so seller understands that test simulation:
  - previews routing logic
  - does not create a shipment
  - does not call live courier APIs
  - does not change customer orders

## 2026-04-21 20:58:05 - Routing Simulation Input Pass

- Upgraded `Execute Test Simulation` from a simple one-click preview into a more controllable seller test tool.
- Seller can now choose:
  - sample zone
  - sample delivery method
  - sample scenario
- Simulation preview now feels closer to a real routing check because the result is derived from:
  - selected sample inputs
  - matching routing rule patterns
  - preferred courier path
  - courier readiness / routing availability fallback
- Updated guide wording so simulation is documented as a seller-facing routing preview input tool, not a live execution flow.

## 2026-04-21 21:07:25 - Notifications Seller-First Pass

- Upgraded `Settings > Notifications` from a basic toggle/template area into a more seller-facing notification workspace.
- `Shipment Notifications` now explains:
  - why shipment notifications exist
  - which shipment moments should trigger a send
  - that `Test` is only for channel/message preview, not real customer order delivery
- Added configurable trigger moments such as:
  - order packed
  - order shipped
  - out for delivery
  - delivered
  - delivery exception
- Added quiet-hours control so seller can understand non-urgent send behavior.
- Reworked channel pages (`Email`, `SMS`, `WhatsApp`) so seller can now manage:
  - channel enabled/disabled state
  - sender label
  - primary trigger
  - send timing
  - subject/body template
  - current delivery logic summary
- Reworked `AI Notification Optimization` with clearer seller wording around:
  - timing optimization
  - smart channel selection
  - frequency control
- Replaced the generic image preview with a more relevant notification-behavior summary card.

## 2026-04-21 21:15:10 - Notification Guide + Channel Matrix Pass

- Added in-app `Notification Guide` modal so seller can understand how payment, invoice, shipment, SMS, and WhatsApp should relate.
- Added a clear seller mental model:
  - payment confirmed / invoice ready -> usually `Email`
  - shipment summary / tracking link -> usually `Email`
  - out for delivery -> usually `SMS`
  - delivery exception or support-led follow-up -> often `WhatsApp`
- Added shipment-side `Suggested channel logic` matrix directly in the notifications workspace.
- Clarified an important rule for future product wording:
  - shipping updates should not automatically imply WhatsApp by default
  - WhatsApp should be a deliberate seller choice based on support style or exception handling

## 2026-04-21 21:24:50 - Notification Event Editor Pass

- Added a seller-facing `Customer notification events` list inside Notifications.
- Each event now has its own editable workspace instead of relying only on general channel panels.
- Added event templates for:
  - Order Confirmation
  - Payment Confirmed / Invoice Ready
  - Order Packed
  - Order Shipped
  - Out for Delivery
  - Delivery Exception
- Added per-event editor modal with:
  - Email / SMS / WhatsApp tabs
  - subject editing
  - body editing
  - per-channel enable toggle
  - preview action
  - notification variables helper
- This brings the Bisora notification workflow closer to a practical merchant-template system while still keeping the UX cleaner and more guided than the reference system.

## 2026-04-22 00:08:20 - Notifications Overlap Cleanup Pass

- Removed the confusing top-level `Email / SMS / WhatsApp` tab split and replaced it with a single `Channel Defaults` tab.
- Notifications now reads more clearly as:
  - `Shipment` = sending rules + event templates
  - `Channel Defaults` = channel-wide defaults only
  - `AI Optimization` = future-facing optimization surface
- Added wording so seller understands event message editing belongs under `Shipment / Event Templates`, not under channel defaults.
- Kept old `email|sms|whatsapp` routes backward-compatible by mapping them into the new `defaults` tab.

## 2026-04-22 00:16:40 - Integrations Seller-First Pass

- Upgraded `Settings > Integrations` from a basic connection grid into a clearer seller-facing integration workspace.
- Added `Integrations control center` intro so the page feels aligned with other settings modules.
- Added category summary cards for:
  - Tracking & Analytics
  - Messaging
  - Developer
- Expanded integration cards with:
  - seller-fit explanation
  - setup hint
  - clearer action labels (`Manage` / `Open Setup`)
- Upgraded integration detail page with:
  - `Who this is for`
  - `Primary use`
  - `Setup note`
  - existing credential / webhook save area
- This keeps the main list lighter while making detail pages more useful when seller opens a specific integration.

## 2026-04-22 00:25:30 - Analytics Tools + Domains UX Pass

- Upgraded tracking/analytics integration detail pages with a more practical analytics-tools setup area inspired by common seller needs:
  - Facebook Pixel ID
  - TikTok Pixel ID
  - Google Analytics ID
  - Google Tag Manager ID
  - Google Ads conversion tracking toggle
  - Google Ads labels for purchase / checkout / add-to-cart style events
- Kept the UI simpler and more guided than the reference instead of mirroring it directly.
- Reworked `Domain & Branding` domain area into a more seller-readable `Domains` section:
  - managed subdomain card
  - custom domain card
  - `Add Existing Domain` action
  - `Edit` action for custom domain
- Upgraded the domain modal into a clearer add/edit workspace with:
  - custom domain input
  - DNS records table
  - propagation note
  - connect/save action
- This domain flow is now closer to a real seller onboarding path while preserving the existing Bisora style and simpler mental model.
## 2026-04-22 08:10:54 - Tracking Integration Field Separation

- Fixed `Integrations` detail page so tracking providers no longer share one mixed analytics form.
- `Meta Pixel & CAPI` now only shows Meta-specific fields.
- `TikTok Pixel` now only shows TikTok-specific fields.
- `Google Ads`, `Google Analytics 4`, and `Google Tag Manager` now each show their own dedicated setup fields.
- This keeps seller-facing integration setup cleaner and avoids confusion from unrelated fields appearing in the wrong provider page.

## 2026-04-22 08:17:11 - Messaging Provider Hub Pass

- Reworked `Messaging` inside `Integrations` from generic `Email / SMS / WhatsApp Integration` cards into provider hubs.
- Main cards are now `WhatsApp Providers`, `Email Providers`, and `SMS Providers`.
- Each messaging detail page now shows seller-facing provider choices with cost cues like `Free start` or `Seller pays`.
- Added provider-specific setup workspaces for:
  - WhatsApp: `Meta Cloud API`, `Onesend`, `Wabot`
  - Email: `Brevo`, `MailerLite`, `Omnisend`, `Sender.net`
  - SMS: `Twilio`, `Klasik SMS`, `Adasms`
- Messaging overview cards now use `Open Providers` instead of generic connect/disconnect actions so seller flow is clearer.

## 2026-04-22 12:21:05 - Messaging Hub Surface Simplified

- Simplified messaging provider detail pages so seller sees one `Bisora Recommended` provider first.
- Moved the rest under `Other provider options` to reduce visual clutter and decision fatigue.
- Kept the setup workspace on the right side so seller can scan recommendation first, then configure only the provider they choose.

## 2026-04-22 12:26:43 - Google Tools Guidance Pass

- Clarified the real-world difference between `Google Analytics 4`, `Google Ads`, and `Google Tag Manager` inside `Integrations`.
- Added seller-first guidance in tracking overview:
  - start with `GA4`
  - add `Google Ads` only if seller is running ads
  - use `GTM` for advanced tag control
- Added `Start here`, `When to use this`, and `Best fit` guidance blocks inside `GA4`, `Google Ads`, and `GTM` detail pages.
- This helps both basic sellers and sellers with marketers/agency understand which Google setup path actually fits them.

## 2026-04-22 12:48:16 - Tracking Overview Guidance Rebalanced

- Reworked the top tracking guidance so it is no longer Google-heavy.
- Tracking overview now shows separate setup paths for:
  - `Meta ads`
  - `Google basic`
  - `TikTok test`
  - `Advanced tag control`
- This makes the overview more accurate for sellers who only use Meta ads or TikTok, not just Google tools.

## 2026-04-22 13:06:47 - Integration Guide Added

- Added `Open Integration Guide` to the `Integrations` section.
- New guide explains:
  - difference between `Tracking & Analytics`, `Messaging`, and `Developer`
  - recommended setup paths based on real seller situations
  - what each major tracking tool and messaging path actually means
- Guide keeps the same seller-first pattern already used in `Payments`, `Shipping`, and `Notifications`.

## 2026-04-22 13:12:36 - Payments Surface Simplified

- Simplified the front `Payments` experience so `Overview` no longer dumps gateway lists, manual methods, and rules all at once.
- `Overview` is now summary + quick access only.
- Detailed gateway setup, manual method details, and payment rules stay inside their own tabs.
- Gateway cards were also reduced to cleaner seller-facing summaries, with deeper operational detail kept in the inner setup pages.

## 2026-04-22 13:17:48 - Payment Detail + Shipping Overview Audit

- Added `Display name at checkout` into payment gateway detail so seller can control the customer-facing label directly inside gateway setup.
- Saved payment gateway display label into gateway state and surfaced it in gateway status sidebar.
- Simplified `Shipping Overview` so it now behaves like `Payments Overview`: summary + quick access only.
- Kept `Notifications` and `Integrations` structure as-is because they already separate their heavier details into clearer inner tabs / guide flows.

## 2026-04-22 13:20:21 - Developer Page Clarified

- Added a clearer top-level explanation to the `Developer` section so it no longer feels empty or ambiguous.
- Added simple summary cards for:
  - `API Keys`
  - `Webhooks`
  - `Logs & Test Console`
- Added seller-facing guidance for when this area should actually be used and when it can be ignored safely.

## 2026-04-22 13:23:06 - Integrations Developer Tab Filled

- Fixed `Integrations > Developer` tab being empty by adding actual developer-facing integration items.
- Added:
  - `API Keys & Access`
  - `Webhooks`
  - `Custom App / ERP Sync`
- Each item now has seller/dev-facing purpose and setup guidance so the tab no longer looks broken or meaningless.

## 2026-04-22 13:26:56 - Developer Discovery vs Workspace Split

- Clarified the difference between:
  - `Integrations > Developer` as the discovery / path-selection layer
  - `Settings > Developer` as the real technical workspace
- Updated developer integration cards and detail pages so they point users toward `Settings > Developer` for actual key, webhook, and test-event management.
- Removed the confusing impression that both sections do the exact same thing.

## 2026-04-22 13:39:19 - Marketing Discount Create Flow Updated

- Reworked `Marketing > Discounts > Create Discount` to be closer to a real seller promotion workflow.
- Added seller-facing controls for:
  - `Discount type`
  - `Applies to`
  - `Minimum requirements`
  - `Customer eligibility`
  - `Limit discount value`
  - `Usage limits`
  - optional `End date`
  - live `Active` toggle
- Kept the form simpler by not pushing advanced code distribution logic onto the main create surface.

## 2026-04-22 13:43:59 - Discount Create UI Polish Pass

- Polished the `Create Discount` UI so it no longer feels too plain after the data-model upgrade.
- Improved form hierarchy using clearer section cards:
  - `Core Setup`
  - `Scope & Eligibility`
  - `Usage & Schedule`
- Added a stronger top summary block and a more useful live preview so the screen feels more intentional and premium instead of basic.

## 2026-04-22 14:03:07 - Staff & Roles Seller-First Pass

- Reworked `Settings > Staff & Roles` so the page no longer feels like a placeholder.
- Added a clearer control-center surface with summary cards for:
  - `Active Members`
  - `Pending Invites`
  - `Role Presets`
- Upgraded the team member list so each member now shows:
  - status badge
  - assigned role chip
  - contextual action like `Resend Invite` or `Edit Role`
- Added a real `Invite Member` modal flow that captures:
  - full name
  - email
  - role
- New invites now append into the team member state as `Invited` entries instead of relying on a dummy button.
- Replaced the old generic permission table with a more realistic `Role Access Matrix` for:
  - `Owner`
  - `Store Manager`
  - `Fulfillment`
  - `Support`
- Added the missing `Support` preset into the role cards seed so the default role model now matches real store operations better.

## 2026-04-22 14:10:00 - Staff & Roles Actions Wired Up

- Connected the previously static `Edit Role` and `Resend Invite` actions so they now do real work.
- `Resend Invite` now triggers a proper confirmation banner instead of behaving like a dead button.
- `Edit Role` now opens a dedicated modal where the selected member's role can be updated and saved back into state.
- This closes the main usability gap where the seller could see actions in the team list but nothing happened on click.

## 2026-04-22 14:17:45 - Staff & Roles Clarity Pass

- Clarified that `Edit Role` only changes which preset a team member uses.
- Made it explicit that `Role Access Matrix` is a default access reference, not a custom per-cell permission editor.
- Expanded each role preset card so seller can now understand:
  - what that role is for
  - which areas of the admin it can use
  - what that role should not control
- Added a simple meaning legend for:
  - `Full`
  - `Manage`
  - `View`
  - `Limited`
  - `No`
- This reduces confusion for non-technical sellers who need to assign staff access without reading the matrix like a dev permission table.

## 2026-04-22 14:23:00 - Edit Role Access Preview

- Extended the `Edit Role` modal with a live access preview so seller can see what changes before saving.
- Each selected role now previews:
  - access summary
  - module-level access shorthand
  - major limits
- Kept `Role Access Matrix` non-editable on purpose so it remains the stable default permission reference instead of turning into a complex custom RBAC editor.

## 2026-04-22 14:34:48 - General Seller Order Alerts

- Added a dedicated `Seller Order Alerts` panel inside `Settings > General`.
- This flow is intentionally separate from customer notifications so seller can configure internal ops alerts without confusing them with buyer-facing messages.
- Added seller-facing controls for:
  - `Seller Alert Email`
  - `Seller Alert WhatsApp`
  - `Send seller alert by email`
  - `Send seller alert by WhatsApp`
  - `Only alert seller after payment is verified`
- Added a recommended explanation that most stores should alert ops after payment is confirmed, so packing and shipping starts only when the order is truly ready.
- Updated the right-side snapshot and quick actions so seller can now see and test internal order alert behavior from the General settings page.

## 2026-04-22 14:42:13 - Seller Alert Recipient Roles

- Extended `Seller Order Alerts` so seller can choose which role presets should receive internal order alerts.
- Added role-based recipient selection for:
  - `Owner`
  - `Store Manager`
  - `Fulfillment`
  - `Support`
- This prepares the product for backend mapping later, where each selected role can resolve to real recipient destinations such as merchant email or WhatsApp.
- Updated the test alert copy and right-side snapshot so current recipient roles are visible in the General settings surface.

## 2026-04-22 14:45:52 - Seller Alert Cost Guidance

- Added clearer guidance inside `General > Seller Order Alerts` so seller understands the difference between `Email` and `WhatsApp` alert paths.
- Added inline notes explaining that:
  - email is usually the easier and lower-cost default for internal seller alerts
  - WhatsApp usually needs a connected provider and may create messaging cost
- This reduces confusion around whether internal seller alerts are automatically free inside Bisora or tied to messaging-provider delivery costs.

## 2026-04-22 14:54:36 - Seller Alert Integration Helper

- Added an inline helper inside `General > Seller Order Alerts` explaining that real email or WhatsApp delivery depends on a connected provider in `Integrations > Messaging`.
- Added a direct CTA button to open the messaging integrations area from the General settings page.
- This closes the mental-model gap between:
  - `General` as the alert logic layer
  - `Integrations` as the actual delivery-provider layer

## 2026-04-22 14:59:04 - Developer Workspace Clarity Pass

- Improved `Settings > Developer` so it reads more like a guided technical workspace instead of just a few raw tables.
- Added a `quick start` sequence for:
  - generating an API key
  - connecting a webhook
  - sending a test event
- Added explanation blocks for:
  - what API keys do
  - what webhooks do
  - what happens when a test event is sent
- Fixed the API-key generation flow so the selected scope is now actually used when creating the new key, instead of defaulting to a static scope.
- Added a simple `recent test expectation` note so the user knows what successful external receipt should look like after a test event.

## 2026-04-22 15:06:58 - Settings Final Sweep Polish

- Removed some of the most obvious random visual placeholder blocks from the Settings module sidebars.
- Replaced those generic image areas with more useful operator-facing summary cards in:
  - `Settings Hub`
  - `General`
  - `Domain & Branding`
- This makes the Settings area feel less like a mockup and more like a real control center with practical reminders instead of filler visuals.

## 2026-04-22 15:14:41 - Settings Assistant Launcher

- Turned the old `Contact Assistant` button in the Settings hub into a real guided launcher instead of leaving it as a dead CTA.
- Added a `Settings Assistant` modal with quick paths for:
  - `Payments setup help`
  - `Shipping and courier help`
  - `Integrations and technical help`
- Added a simple recommended setup order inside the modal so sellers know where to start first.
- This keeps the product honest: it behaves like a guided help launcher, not a fake live support chat.

## 2026-04-22 18:12:09 - Website Builder Builder-Studio Foundation

- Replaced the old `Website Builder` placeholder route with a real module inside the dashboard shell.
- Added a seller-friendly `Website Builder` hub with tabs for:
  - `Overview`
  - `Installed Themes`
  - `Themes`
  - `Menus`
  - `Pages`
  - `Metafields`
  - `Preferences`
- Clarified the mental model of the online-store area:
  - `Installed Themes` = what is live or ready to customize
  - `Themes` = library of templates seller can browse and install
  - `Menus` = navigation structure
  - `Pages` = storefront content pages
  - `Metafields` = advanced custom data, not a beginner-first tab
  - `Preferences` = storewide website behavior
- Added the first `Builder Studio` implementation reachable from `Customize` with:
  - section list
  - add / reorder / hide / duplicate / delete section actions
  - center live preview canvas
  - right-side section editor for `content`, `layout`, and `style`
  - device preview modes for desktop, tablet, and mobile
  - inline image guideline panel
- Seeded the theme library using the current product direction and the user's storefront references:
  - `Lumiere Noor`
  - `Al-Nisa Atelier`
  - `Tampin`
  - `Jugra`
  - `Linggi`
  - `Hartamas`
  - `Solaris`
- This pass intentionally keeps the experience visual and beginner-friendly instead of exposing advanced technical controls too early.

## 2026-04-22 18:34:27 - Website Builder Section/Chrome Editing Pass

- Upgraded `Builder Studio` so the editor is no longer limited to homepage sections only.
- Added first-class editable builder surfaces for:
  - `Header & Navigation`
  - `Branding`
  - `Footer Builder`
  - individual homepage sections
- Added live preview rendering for:
  - theme-based header variants
  - homepage sections
  - footer area
- Added editable header controls for:
  - logo text
  - announcement bar
  - announcement link
  - menu items
  - search/cart toggles
  - sticky header toggle
- Added editable footer controls for:
  - brand line
  - newsletter block
  - footer columns and links
  - copyright line
- Added seller-facing branding controls for:
  - primary accent color
  - surface color
  - heading direction / visual tone
  - button shape
- Added section-specific guidance inside the editor panel so seller understands what each block is actually for.
- Started making theme differences feel more real by assigning header layout DNA per theme:
  - `center-brand`
  - `left-brand`
  - `split-nav`

## 2026-04-22 18:40:11 - Reports Module Restore

- Restored a missing `ReportsModule.tsx` file so dashboard routing and TypeScript linting work again.
- Added a lightweight reports shell using the existing reports data and types so the route is no longer broken while website-builder work continues.

## 2026-04-22 18:52:44 - Website Builder Theme Rendering + Quick Edit Pass

- Strengthened theme rendering so the storefront preview no longer feels like the same homepage under different names.
- Added separate default homepage structures for:
  - `Lumiere Noor`
  - `Al-Nisa Atelier`
  - `Tampin`
- Added theme-specific hero rendering modes:
  - `split-editorial`
  - `airy-story`
  - `campaign-banner`
- Added theme-sensitive category, featured-product, and testimonial preview content so:
  - `Lumiere Noor` reads more like luxury editorial commerce
  - `Al-Nisa Atelier` reads calmer and more premium-minimal
  - `Tampin` reads more campaign/fashion-first
- Added responsive behavior into the live preview layer so header and section structures adapt more visibly for:
  - `desktop`
  - `tablet`
  - `mobile`
- Added `Quick Edit` pills directly on preview surfaces for:
  - `Header`
  - `Section`
  - `Footer`
- Quick edit now jumps seller straight into:
  - `Content`
  - `Layout`
  - `Style`
- This makes Builder Studio feel less like a static preview and more like a real visual editing workspace.

## 2026-04-22 19:03:21 - Website Builder Theme System Flow

- Added real theme-state handling inside the `Website Builder` module instead of relying only on static cards.
- Theme system now supports clearer seller-facing flow for:
  - `Install`
  - `Customize`
  - `Publish Live`
- Added a `Theme System Status` banner to explain which theme is currently live and what just changed.
- Added live-theme management rules:
  - only one theme is `Published` at a time
  - publishing a new theme automatically moves the previous live theme back into the installed library
- Upgraded `Installed Themes` so seller can:
  - see the current live theme
  - customize installed themes
  - publish another installed theme live
- Upgraded `Themes` library so seller can:
  - install draft themes
  - see whether a theme is draft / installed / live
  - publish an installed theme live from the library
- This makes the theme layer feel much closer to a real ecommerce storefront theme workflow instead of a read-only showcase.

## 2026-04-22 19:15:02 - Website Builder Menus / Pages / Preferences / Metafields Pass

- Turned `Menus` from a static explanation panel into a working menu editor flow.
- Seller can now:
  - switch between menu groups
  - edit menu item labels
  - add links
  - remove links
- Turned `Pages` into a working page-management panel.
- Seller can now edit:
  - page title
  - purpose / summary
  - SEO title
  - page slug
  - publish / move-to-draft state
- Kept `Homepage` separate as the page that still belongs inside `Builder Studio`.
- Kept `Metafields` in the module because it is still needed, but framed it correctly as an advanced custom-data layer instead of a beginner-first page.
- Added a lightweight custom-field registry so the tab does not feel dead.
- Turned `Preferences` into a usable storewide-behavior panel with controls for:
  - featured category
  - recent sales popup
  - popup privacy mode
  - search-engine visibility
  - maintenance mode
- This closes the biggest gap in the online-store area: the seller can now understand and manage the surrounding storefront system, not just the theme canvas.

## 2026-04-22 19:27:18 - Frontend Module + Blog Architecture

- Added a new `Frontend` module into the dashboard routing and sidebar so the buyer-facing runtime has its own clear layer beside `Website Builder`.
- This separates the product model cleanly:
  - `Website Builder` = seller editing layer
  - `Frontend` = buyer-facing runtime layer
- Added frontend tabs for:
  - `Overview`
  - `Homepage`
  - `Collection`
  - `Product`
  - `Cart`
  - `Checkout`
  - `Thank You`
  - `Blog / Journal`
- Added a `Blog / Journal` path inside the frontend architecture because SEO content should live on the actual frontstore, not only inside admin notes.
- Added a lightweight article-management panel for blog so the route does not feel dead and the SEO purpose is explicit:
  - article title
  - publish / draft state
  - primary keyword
  - summary
- Added explicit product guidance in the frontend layer:
  - blog helps organic search entry paths
  - it does not guarantee first-place ranking
  - its best role is educational / styling / buying-guide content that links back to products and collections
- This gives the online-store system a much clearer structure before deeper runtime implementation starts.

## 2026-04-22 19:46:11 - Website Builder Clarity + Media Upload Pass

- Reduced seller confusion between `Website Builder` and `Frontend` by reframing the buyer-facing module as `Frontstore Preview` in navigation and guidance copy.
- Updated `Website Builder` messaging so seller path is clearer:
  - choose theme
  - build inside Builder Studio
  - use Frontstore Preview only to review the buyer-facing result
- Added stronger overview guidance inside `Website Builder` so seller can understand what `Menus`, `Pages`, `Metafields`, and `Preferences` are for without feeling like these tabs are duplicate store builders.
- Updated the `Frontend` module copy so it reads as a preview/runtime layer instead of a second place to build the website.
- Added real image upload support inside `Builder Studio` for section media:
  - seller can upload section images
  - preview image appears immediately in the editor
  - uploaded hero images now appear inside the live preview canvas
  - non-hero section images now render as preview media blocks
- Added logo upload support inside `Header & Navigation` editing:
  - seller can upload a logo image
  - header preview switches from text logo to uploaded logo instantly
- This makes the builder feel more practical for real seller use instead of text-only mock editing.

## 2026-04-22 19:58:34 - Product-Driven Preview Mapping Pass

- Clarified the product logic inside `Website Builder` image editing:
  - uploaded section images are custom visuals for hero / banner / editorial sections
  - product-driven sections should still use real catalog product images
- Updated builder guidance so `Featured Products` no longer feels like it should manually replace every product image with one uploaded file.
- Connected builder preview blocks to actual catalog data from the Products module:
  - `Categories` sections now render real category cover images and descriptions
  - `Featured Products` sections now render real product thumbnails, names, categories, and prices
- Upgraded the `Frontstore Preview` module from architecture-only shells into more concrete buyer-facing runtime previews for:
  - Homepage
  - Collection
  - Product
  - Cart
  - Checkout
  - Thank You
- These runtime previews now use actual product and category data so the frontstore layer feels closer to a real storefront instead of a planning-only placeholder.

## 2026-04-22 20:05:11 - Builder Image Guidance Clarification

- Added seller-facing image guidance inside `Builder Studio` so image editing rules are easier to understand.
- `Featured Products` sections now show a clear helper that product photos should be managed in `Products`.
- `Categories` sections now show a clear helper that collection cover images should be managed in `Categories`.
- Added direct CTA links from the section editor into:
  - `Products`
  - `Products > Categories`
- Added a persistent editor note that separates:
  - builder visuals
  - product photos
  - category cover images
- This reduces one of the biggest storefront-builder confusion points for sellers: where different image types are supposed to be maintained.

## 2026-04-22 20:11:42 - Blog Cover Image Pass

- Upgraded `Frontend > Blog / Journal` so articles no longer feel text-only.
- Added blog cover-image support:
  - seller can upload a blog cover image
  - cover preview appears instantly inside the article editor
  - article list cards now show image thumbnails
- Added a `Published Blog Preview` area so seller can immediately see how published blog entries would feel on the frontstore with image + keyword + summary.
- This gives the blog path a stronger SEO-content feel and makes the future frontstore journal route feel more realistic and brand-ready.

## 2026-04-22 20:21:09 - Shared Blog Editing Flow

- Split blog responsibilities more cleanly between seller editing and buyer-facing preview.
- Added a shared storefront blog store so blog content can be reused across modules instead of living as two separate local versions.
- Added a new `Blog` tab inside `Website Builder` where seller now manages:
  - article title
  - keyword
  - summary
  - cover image upload
  - publish / draft state
- Updated `Frontstore Preview > Blog / Journal` so it no longer behaves like a second editor.
- `Frontstore Preview` now acts as the buyer-facing review layer for published articles only, with CTA back into the builder editor.
- This aligns blog with the same product model already used elsewhere:
  - builder/editor side = where seller works
  - preview/runtime side = where seller reviews what buyers will see

## 2026-04-22 23:46:14 - Orders Manual Tracking + Timeline Pass

- Upgraded order-detail operations so manual tracking behaves like a real fallback fulfillment flow instead of a loose helper modal.
- Added a seller-facing activity timeline on each order detail page so ops can see what has already happened without relying on memory.
- Timeline now records important order actions such as:
  - invoice emailed
  - invoice PDF prepared
  - fulfillment stage updates
  - order marked as shipped
  - manual tracking saved
  - tracking update sent to customer
- Added `Send tracking to customer` action in the order-detail flow:
  - available from the manual tracking card
  - available from the `More` dropdown when tracking exists
- This makes manual tracking feel more complete for stores that have not connected courier providers yet:
  - seller can still key in tracking
  - seller can still move order to shipped
  - seller can still notify customer
  - seller can still review a clean operational timeline inside the order itself

## 2026-04-22 23:50:43 - Orders Shipping Logic Clarification Pass

- Cleaned up order-detail shipping flow so it reflects the intended live behavior more honestly:
  - auto shipment flow should be the default
  - manual tracking is the fallback when courier integration is not connected
- Reduced duplicate action wording:
  - primary order action now reads as opening shipment setup
  - fulfillment panel action now also points to shipment setup instead of pretending it is a separate step
- Reframed package and weight display:
  - seller should not manually type parcel size/weight on the order page in the long-term flow
  - order page now shows these as auto-read shipping values instead of editable fields
  - current mock derives them from line-item quantity until product-level shipping attributes are added
- Upgraded shipment-setup copy so seller can understand:
  - when courier assignment was auto-selected from live shipping setup
  - when seller is only overriding
  - when no provider is connected and manual fallback is required
- Clarified provider waybill logic:
  - live connected couriers should return the provider waybill into the shipment setup flow
  - manual mode should not imply provider-generated waybills
- Clarified notification logic:
  - after payment is verified or seller marks manual payment as paid, invoice and order notifications should come from the notification system automatically

## 2026-04-23 00:11:50 - Orders Invoice Modal + Shipment Creation Modal Pass

- Upgraded the order-detail invoice action so `Email invoice` now behaves more like a real manual-send flow instead of a blind instant banner:
  - seller opens a `Send invoice` modal
  - seller can confirm or adjust the recipient email
  - invoice send is only recorded after explicit submit
- Upgraded shipment setup so the route behaves closer to a live ops workspace:
  - page heading now reads as `Arrange shipments`
  - added a clear `Create shipment` CTA in the header and footer area
  - added a shipment-creation modal with:
    - shipment provider
    - service
    - optional custom weight override
    - shipment method (`Dropoff` / `Pickup`)
- Connected shipment creation into the existing mock flow:
  - create-shipment submit now generates a mock shipment record
  - shipment record appears back in the shipment setup view
  - provider waybill action stays disabled until shipment exists
- This makes the order flow feel closer to the pattern seller already understands from live systems:
  - manual invoice send modal
  - arrange shipments page
  - create shipment modal

## 2026-04-23 00:15:00 - Shipment Modal Logic Clarification Pass

- Refined the `Create shipment` modal so it matches the intended Bisora logic more closely.
- Clarified that connected-courier flow should mostly be a confirmation/request step, not a heavy manual setup form.
- Added a stronger distinction between:
  - `live provider mode`
  - `manual fallback mode`
- Updated modal helper copy so seller understands:
  - if courier provider is already connected, the shipment path should already be mostly prepared
  - custom weight is an exception override, not the default working mode
  - if no provider is connected, manual tracking remains the better fallback after courier dropoff
- Improved the field layout:
  - `Method` now has better spacing and separation from the rest of the form
  - added an `Effective shipment payload` summary block so seller can quickly review provider, service, and weight before submit

## 2026-04-23 00:28:00 - Product Studio Shipping and Variant Pass

- Upgraded `Products > Edit Product Studio` so seller can prepare more realistic catalog data for later order and courier flow.
- Added product-level commercial and logistics fields:
  - `compare at` now respects seeded compare-at pricing
  - `Charge tax on this product`
  - `Manage stock`
  - `This product has a SKU`
  - `This is a physical product`
  - `Weight (kg)`
  - `Package profile` (`Pouch`, `Box`, `Large Box`)
- Added a dedicated `Shipping` panel in the product editor so seller understands weight and packaging belong at product setup, not later in order handling.
- Improved the `Variants` panel:
  - added a seller-facing variant option builder
  - supports adding/removing option groups
  - supports adding/removing option values
  - hides the SKU column when SKU mode is turned off
  - disables stock steppers when stock management is turned off
- Improved `Live Preview`:
  - now hides SKU when SKU mode is disabled
  - now shows shipping summary when product is physical
- Updated seeded product records and empty-product draft so product data is ready to feed future shipping and fulfillment logic more accurately.

## 2026-04-23 00:34:00 - Variant Combination Table Fix

- Fixed the product editor so variant rows below the builder now respond to the option/value setup seller adds above.
- Variant stock table no longer stays stuck on the old default variant row after seller adds new options like:
  - `Color`
  - `Size`
- The editor now builds visible variant combinations from the current option values and lets seller update stock per generated variant row directly.
- SKU generation now follows the current base SKU more sensibly for generated combinations, while existing seeded variants still preserve their stored SKU where available.
- Color/media mapping now also follows the visible variant rows instead of the old static variant list.

## 2026-04-23 00:44:00 - Product Editor Tabs and Variant Detail Pass

- Upgraded `Products > Edit Product Studio` so it feels closer to a real multi-section product workspace instead of one long mixed form.
- Added top editor tabs:
  - `Item`
  - `Options`
  - `Variants`
  - `Images`
  - `Shipping`
  - `Categories`
  - `SEO`
- Improved description editing:
  - added a richer description toolbar with seller-facing shortcuts for:
    - bold
    - italic
    - superscript
    - subscript
    - table
    - link
    - HTML
    - image
    - video
    - alignment
    - text color
    - text size
  - toolbar currently injects starter snippets into the description field so the mock flow feels more realistic
- Added a proper `Variant Detail` workspace:
  - selectable variant list on the left
  - image area
  - option summary
  - variant pricing
  - variant inventory
  - SKU
  - variant weight
  - package profile
- This makes the product editor feel much closer to the intended seller workflow for:
  - variant-by-variant stock updates
  - per-variant image handling
  - shipping prep at the catalog level

## 2026-04-23 00:56:00 - Create Product Flow Rollback and Description Toolbar Behavior Pass

- Corrected the split between `Create Product` and `Edit Product`.
- `Create Product` is now simple again and no longer shows the full top-tab workspace immediately.
- Full top tabs remain as the deeper editing experience only after product already exists and seller enters edit mode.
- Upgraded the description toolbar in product form so it behaves more like a real editor instead of decorative buttons only.
- Added working toolbar interactions for:
  - bold
  - italic
  - strikethrough
  - format dropdown
  - line divider
  - underline
  - numbered list
  - bullet list
  - superscript
  - subscript
  - image modal
  - video modal
  - table menu
  - link menu
  - HTML mode
  - alignment
  - text color
  - text size
- Current mock implementation uses insertion/wrap snippets inside the description textarea so seller can feel the interaction now without waiting for a full rich-text package integration.

## 2026-04-23 01:08:00 - Product Description WYSIWYG Behavior Fix

- Reworked the product description area so formatting now behaves visually inside the editor instead of printing raw HTML tags into the text area.
- Switched the non-HTML description mode to a content-editable WYSIWYG surface and kept HTML mode as a raw-code editing fallback.
- Updated toolbar behavior so these actions now apply directly to selected text/content:
  - bold
  - italic
  - strikethrough
  - underline
  - ordered list
  - unordered list
  - superscript
  - subscript
  - format block
  - alignment
  - text color
  - text size
  - link / unlink
  - image insert
  - video embed insert
- Added a more functional table tool path:
  - insert table
  - insert row above / below
  - insert column left / right
  - add head
  - delete head
  - delete column
  - delete row
  - delete table
- Improved toolbar labels so they are clearer and less visually broken than the earlier placeholder characters.

## 2026-04-23 01:18:00 - Product Toolbar Icon and Popover Polish Pass

- Updated the description toolbar so it feels closer to the compact icon treatment used in live ecommerce editors.
- Replaced the earlier text-heavy button labels with icon-style controls for:
  - bold
  - italic
  - strikethrough
  - format
  - line
  - underline
  - ordered list
  - unordered list
  - superscript
  - subscript
  - image
  - video
  - table
  - link
  - HTML
  - align
  - text color
  - size
- Refactored toolbar menus so popovers now open under the related button instead of far off to the side.
- Improved color handling:
  - text color popover now appears directly under the color tool
  - added swatch choices plus a color picker input
  - added RGB numeric controls so seller has finer control over selected text color
- Added better divider logic:
  - line tool inserts a divider
  - if selection is already on/near a divider, the same tool removes it

## 2026-04-23 01:24:00 - Product Editor Readiness Clarification Pass

- Added a clearer readiness note in the product editor so seller can immediately distinguish:
  - what already works in the current mock/editor layer
  - what still depends on backend/storage integration
- Clarified that these already work at UI/editor level:
  - rich text editing behavior
  - variant row generation
  - stock-by-variant flow
  - shipping field setup
- Clarified that these still need backend/storage to become fully real:
  - permanent media upload
  - optimized asset storage
  - provider delivery
  - persistent save and inventory logging

## 2026-04-23 02:05:00 - Unified SEO Workspace + Crawl Infrastructure

- Website Builder now has a dedicated `SEO` tab instead of hiding SEO inside `Pages`.
- `SEO` tab now uses mode switching:
  - `Pages`
  - `Products`
- `SEO > Products` was unified with the same storefront product state path used by the Products module.
- Added a shared subscribed product store so both Products module and SEO workspace use the same state pattern and persistence flow.
- Added a shared storefront pages store for Website Builder pages so page SEO and future Website Builder changes stay connected to one page record source.
- Added sitemap generation:
  - emits `/sitemap.xml`
  - includes homepage, products, collections, and Website Builder pages
  - tracks `lastmod`
  - refresh snapshot path added for product/page updates
- Added robots generation:
  - emits `/robots.txt`
  - allows public SEO-relevant routes
  - disallows admin, cart, checkout, and internal system paths
  - references sitemap URL
- Important maintenance note:
  - any future Website Builder page structure/content changes should be checked against:
    - `SEO` tab page mode
    - shared pages store
    - sitemap generation
    - robots allow/disallow assumptions

## 2026-04-23 13:03:08 - Canonical URL Support

- Added a shared canonical URL helper for storefront SEO paths.
- Canonical URLs now normalize:
  - query parameters
  - hash fragments
  - trailing slash noise
- Public canonical routing now resolves from shared SEO data sources:
  - product slug from storefront product store
  - website page slug from storefront pages store
  - collection slug from category data
- `FrontendModule` now applies canonical tags using the shared resolver so product and collection previews point to clean public URLs.
- Website Builder SEO head sync now uses the shared canonical helper instead of its own direct canonical tag write.
- App-level fallback canonical handling now covers the rest of the admin shell without overriding Website Builder SEO or Frontstore preview canonical behavior.
