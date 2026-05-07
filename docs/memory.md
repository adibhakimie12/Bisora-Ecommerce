# System Memory

## Visual Rules
- Use premium minimal SaaS style
- Maintain the same sidebar and topbar shell
- Reuse consistent cards, tables, forms, status badges, and modal behavior

## Architecture Rules
- Simple settings pages do not need sub-navigation
- Complex modules can have internal tabs
- Orders detail is a child view of Orders > All Orders
- Products module is built inside the same Admin host as Dashboard and Orders
- Products > All Products > Edit Product Studio is a child view
- Products > Categories > Category Detail is a child view with Category, Category Products, and SEO tabs
- Courier API Integrations belongs under Settings > Shipping & Logistics
- AI Automation belongs under Marketing > Funnels > Automations
- Use one shared Admin host for connected module navigation; do not split active modules across separate localhost ports

## Build Rules
- Build module by module
- Dashboard and Orders are completed as first connected Admin modules
- Products is next priority after Dashboard and Orders
- Do not export every screen to AI Studio
- Use AI Studio for complex modules
- Use screenshots + prompts for simpler modules
- Every completed module must connect through the same global sidebar/topbar shell
- Buttons for future modules can route to placeholder pages until the target module is built

## Commerce Rules
- Checkout flow:
  Checkout -> Order Bump -> OTO -> Downsell -> Thank You
- Offers are managed in Marketing
- Checkout executes configured offers
- Shipment notifications are triggered after shipment generation

## Website Builder Template Flow
- Build storefront templates first, then extract editable fields into Customize.
- Themes page shows clean template cards only: image, theme name, mood, editable chips, Demo, Install Theme, Customize.
- Demo opens a website-style storefront preview, preferably new tab/live preview feel, not inside the card.
- Install Theme saves the theme as an installed draft; it must not become buyer-live immediately.
- Publish is a theme/storefront-level action that sends the installed draft to Frontstore Preview/live buyer storefront; publish must not appear as a per-section action.
- Customize uses a hybrid editor: left section list, center live preview canvas, right section settings.
- Customize sections: Theme Settings, Header, Announcement Bar, Homepage, Collections, Product Page, Cart Drawer, Checkout, Thank You, Account, Footer.
- Header supports logo text and logo upload.
- Announcement Bar supports editable announcement text.
- Homepage supports hero heading, hero subtitle, and hero image upload.
- Collections supports editing category names/tiles from the Collections section.
- Buyer flow sections switch preview context: Product Page opens product preview, Cart Drawer opens cart drawer, Checkout opens checkout, Thank You opens thank-you, Account opens account.
- Customize must auto-save draft changes; Publish is the only action that makes changes live.
- Center preview must have device modes: Mobile, iPad, Desktop. Device mode changes the preview canvas size, not the browser zoom.
- At normal Chrome 100% zoom, desktop preview should fit like a scaled canvas so sellers do not need to zoom the browser to 50%.
- Every new storefront theme template must include buyer-facing customer account surfaces, not admin-only placeholders.
- Customer account belongs inside the frontstore/website, not the admin system.
- Customer account routes follow the active theme style: login, register, account dashboard, orders, wishlist, and addresses.
- Current mock frontstore account routes use `#/frontend/account-login/[themeId]`, `#/frontend/account-register/[themeId]`, `#/frontend/account/[themeId]`, `#/frontend/account-orders/[themeId]`, `#/frontend/account-wishlist/[themeId]`, and `#/frontend/account-addresses/[themeId]`.
- Theme account icon links to the theme's frontstore login route.
- Checkout `Already have account? Login` links to the theme's frontstore login route.
- After backend later, logged-in customer checkout should autofill email, phone, name, and saved addresses; orders should appear in the customer account.
- Future affiliate/customer referral features may connect into the customer account area, but do not build affiliate yet.
- Current storefront template library has 3 themes:
  - `luxury-muslimah-editorial` / Maison Noor Editorial: luxury editorial Muslimah/feminine commerce.
  - `soft-feminine-luxe` / Aurelia Muse: soft feminine emotional luxury commerce.
  - `modern-conversion-luxe` / Lumiere Momentum: modern minimal luxury, urgency, trust, and conversion-focused ecommerce.

## Website Builder Pages Flow
- Pages is a manual landing page builder for sales pages and lead pages, inspired by Shoppegram-style drag/drop builders.
- Pages must feel like a CMS/page canvas, not a theme template placeholder.
- Core layout: left vertical tabs for Blocks, Body, and Images; center canvas with drop zones; selected block settings panel in the left workspace.
- Supported manual blocks: Columns, Button, Divider, Heading, HTML, Image, Menu, Text, Timer, Video, and Lead Form.
- Admin can add blocks by click or drag/drop, insert between blocks, reorder, duplicate, delete, and edit block copy/settings.
- Body settings must control real preview output: title/body, HTML/embed code, column count, video URL, countdown end time, button action, form fields, alignment, tone, width, vertical padding, colors, and desktop/mobile visibility.
- Image settings must include upload-style file picker, image URL/name, alignment, and alternate text.
- Upload controls in the landing page builder must render the selected image in the canvas/runtime preview, not only show the file name.
- Columns are container blocks with editable column items; each column item can be text, image, or button content and must render inside the column slot.
- Button actions must support URL, checkout target, WhatsApp, Telegram, and lead form anchor.
- Pages must include desktop/mobile preview modes inside the canvas; device mode changes canvas width and honors hide-on-device toggles.
- Publish must validate readiness before marking a page live: title, slug, required CTA targets, image values, video URLs, and lead form fields.
- Preview opens the current draft landing page in a new tab through `#/frontend/landing-page-preview/[slug]`, even before publish.
- Published landing pages open through `#/frontend/landing-page/[slug]`; this live route should only render when the saved page status is Published and validation passes.
- Current Pages draft is saved in localStorage until backend persistence/upload is connected.

## Current Admin Routes Implemented
- /dashboard
- /orders
- /orders/[id]
- /orders/[id]/shipment-processing
- /orders/drafts
- /orders/abandoned
- /orders/new
- /products
- /products/edit/[id]
- /products/inventory
- /products/categories
- /products/categories/[id]
- /products/categories/[id]/category-products
- /products/categories/[id]/seo

## Current Functional Flows Implemented
- Dashboard sidebar can navigate to Orders in the same localhost host
- Dashboard recent transactions can open Orders detail routes
- Orders list supports KPI cards, row selection, bulk action bar, order detail navigation, and bulk shipment modal
- Orders list search and filter controls now actively filter the table and show a clear empty state when nothing matches
- Orders tab navigation supports All Orders, Draft Orders, and Abandoned Checkouts in the same host
- Orders create new order flow has a connected manual order screen for customer, line items, pricing, and draft actions
- Orders `Create New Order` and `Draft Orders` helper actions have been checked: `Add Product`, `Save as Draft`, `Send Invoice`, and `Create New Client` all trigger working UI flows or feedback
- Orders detail supports print, mark shipped, fulfillment section, and shipment processing child route
- Orders secondary actions now provide visible mocked flow feedback through banners, dialogs, and child views instead of dead buttons
- Orders bulk shipment flow supports configure -> processing -> completion with generated tracking numbers
- Orders draft helper buttons now trigger visible client/invoice/save flows instead of dead UI
- Products list supports KPI cards, filters, product table, and Edit Product Studio navigation
- Products inventory supports variant stock table and quick quantity edits
- Products categories supports category cards, category detail, category products arrangement, and category SEO preview
- Products actions now give visible mocked feedback for duplicate, archive, delete, preview, media upload, category analytics, and inventory bulk actions
- Products category detail actions now give visible mocked flow for change cover image, add product, remove product, and category-product search/sort interactions
- Products UX hierarchy is aligned to the current Stitch direction: All Products table-first, Inventory operational, Categories editorial, and Edit Product Studio with right-side summary cards
- Marketing visible buttons now trigger working UI flows across overview, discounts, upsells, recovery, broadcasts, funnels, and automation builders
- Customers visible buttons now trigger working UI flows across customer list, customer profile, notes, reviews, and moderation actions
- Customers CRM now includes empty states and input guards so owner testing does not produce false-success note/save flows
- Reports module now has a secondary Finance layer under Reports with `Transactions`, `Settlements`, `Payouts`, and `Reconciliation`
- Reports Finance now supports `Basic / Advanced` view mode so sellers can start with calmer summary-first screens and open denser operations only when needed
- Reports visible buttons now trigger working UI flows across analytics and finance, including filters, toggles, exports, drawers, AI actions, and reconciliation actions
- Orders, Reports, Products, Marketing, and Customers are now the strongest UI-ready modules for later backend connection planning


## Future Modules (Not Now)
- Customers
- Marketing advanced
- Reports advanced
- Website Builder
- Superadmin
- Customer Account
- Loyalty / Points
- Affiliate
- AI Chatbot
