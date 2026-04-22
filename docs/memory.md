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
