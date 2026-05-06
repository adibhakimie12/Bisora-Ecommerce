# MODULE: WEBSITE BUILDER

## PURPOSE

Website Builder is the core feature that allows sellers to design, customize, and manage their storefront without coding.

This module must be:

* Beginner-friendly
* Flexible (drag & edit)
* Conversion-focused
* Performance-optimized

---

## CORE STRUCTURE

### 1. Builder Studio (Main Editor)

Layout:

* Left Panel → Sections / Elements
* Center → Live Preview Canvas
* Right Panel → Properties / Settings
* Top Bar → Preview / Device Switch / Publish

Features:

* Drag & drop sections
* Click-to-edit elements
* Real-time preview
* Device preview (desktop / tablet / mobile)

---

### 2. Section System

Default Sections:

* Hero Banner
* Categories
* Featured Products
* Promotion Banner
* Testimonials
* Footer

Each section supports:

* Add / Remove
* Reorder (drag)
* Show / Hide
* Duplicate

---

## SECTION EDITOR (IMPORTANT)

Each section must have editable fields:

### Content

* Image upload
* Heading
* Description
* Button text

### Layout

* Alignment (left / center / right)
* Spacing
* Width
* Section height

### Style

* Background color
* Overlay
* Typography

---

## IMAGE OPTIMIZATION GUIDELINES (IMPORTANT)

Show guideline to user inside builder:

* Hero Banner: 1920 x 1080 (Max 300KB)
* Product Image: 1000 x 1000 (Max 200KB)
* Category Image: 800 x 800
* Thumbnail: 500 x 500

System behavior:

* Auto compress image
* Warn if file too large
* Lazy load images

---

## HEADER & NAVIGATION BUILDER

Features:

* Logo upload
* Menu builder
* Mega menu support
* Search icon toggle
* Cart icon toggle
* Announcement bar

Announcement bar:

* Text
* Optional link
* Multiple lines

---

## FOOTER BUILDER

Editable:

* Columns (About / Links / Contact)
* Social icons
* Newsletter form
* Copyright text

---

## THEME SYSTEM

### Theme Library

* List of storefront template cards
* Card shows theme image, name, mood/description, editable field chips, Demo, Install Theme, Customize
* Theme card must not contain the full website preview

### Theme Preview

* Demo opens a website-style storefront preview
* Demo can open in a new tab or Frontstore Preview route
* Demo is not live buyer storefront until published

### Theme Management

* Install Theme saves the selected theme as an installed draft
* Installed draft is editable but not buyer-live
* Publish makes the installed draft live in Frontstore Preview / buyer storefront
* Publish is a theme/storefront-level action, not a per-section action
* Installed Themes shows installed draft, live status, View Website, Customize, and Publish

---

## TEMPLATE-FIRST FLOW (CURRENT DECISION)

New themes should be built as complete storefront templates first.
After the design feels right, extract editable fields and section controls into Customize.
This avoids a generic builder that feels empty or confusing.

Template flow:

1. Create full website template from prompt/design.
2. Review it as a real storefront.
3. Add it as a theme card.
4. Install Theme saves draft.
5. Customize edits draft with auto-save.
6. Publish sends draft live.

Current first template:

* Maison Noor Editorial
* Luxury editorial Muslimah/feminine commerce
* Supports fashion, beauty, perfume, cosmetics, lifestyle products

Current template library:

* Maison Noor Editorial (`luxury-muslimah-editorial`)
* Aurelia Muse (`soft-feminine-luxe`)
* Lumiere Momentum (`modern-conversion-luxe`)

Lumiere Momentum is the third template direction:

* Modern luxury ecommerce optimized for conversion
* Warm white, soft beige, elegant black accents, champagne nude
* Includes urgency, stock cues, trust blocks, quick add, cart upsells, bundle prompts, mobile-first checkout, thank-you order confirmation, and customer dashboard surfaces
* Built for Muslimah fashion, tudung, beauty, perfume, cosmetics, accessories, and lifestyle products

---

## CUSTOMIZE FLOW (IMPORTANT)

Customize uses a hybrid editor:

* Left Panel -> section list
* Center -> live preview canvas
* Right Panel -> settings for selected section

Section list:

* Theme Settings
* Header
* Announcement Bar
* Homepage
* Collections
* Product Page
* Cart Drawer
* Checkout
* Thank You
* Account
* Footer

Editing rules:

* Header edits logo text and logo upload
* Announcement Bar edits announcement text
* Homepage edits hero heading, hero subtitle, hero image
* Collections edits category names/tiles
* Product Page switches center preview to product page
* Cart Drawer switches center preview and opens cart drawer
* Checkout switches center preview to checkout
* Thank You switches center preview to thank-you page
* Account switches center preview to customer account
* Changes auto-save as draft
* User publishes only from theme/storefront level

---

## CUSTOMER ACCOUNT IN THEMES

Customer account is part of the buyer-facing frontstore, not the admin dashboard.
Each storefront theme must provide a themed customer account experience.

Required buyer-facing account routes:

* Login
* Register
* Account dashboard
* Orders / order tracking
* Wishlist
* Saved addresses

Current route pattern:

* `#/frontend/account-login/[themeId]`
* `#/frontend/account-register/[themeId]`
* `#/frontend/account/[themeId]`
* `#/frontend/account-orders/[themeId]`
* `#/frontend/account-wishlist/[themeId]`
* `#/frontend/account-addresses/[themeId]`

Theme behavior:

* Account icon in storefront links to the theme's login route
* Checkout `Already have account? Login` links to the theme's login route
* Account screens inherit the active theme's visual tone
* Theme 1, Theme 2, and Theme 3 support account mock screens
* Backend later should replace mock state with real customer session, orders, wishlist, addresses, points, and returns

Future note:

* Affiliate/referral can later connect into this customer account area
* Do not build affiliate until explicitly prioritized

---

## BRANDING SETTINGS (INSIDE BUILDER)

* Logo
* Colors
* Typography
* Button style
* Global spacing

---

## RESPONSIVE PREVIEW

* Desktop view
* Tablet view
* Mobile view
* Current labels are Desktop, iPad, Mobile
* Device buttons live in the preview header
* Device mode changes canvas width/scale inside the builder
* Do not rely on browser zoom for preview correctness
* At Chrome 100% zoom, the desktop canvas should still look like a usable storefront preview

User can:

* Adjust layout per device
* Preview before publish

---

## QUICK EDIT MODE

User can click directly on preview:

* Edit text
* Replace image
* Adjust button

---

## ADVANCED FEATURES

### Mega Menu Builder

* Multi-column menu
* Category grouping
* Featured image

### Section Library

* Prebuilt blocks
* Add instantly

---

## PERFORMANCE RULES

* Auto image compression
* Lazy loading
* Limit heavy animations
* Optimize DOM structure

---

## PUBLISH FLOW

Steps:

1. Save draft
2. Preview
3. Publish

---

## FUTURE SUPPORT

* AI Section Generator
* Template import/export
* A/B testing sections
* Personalization

---

## NOTES

* This module connects to Products, Categories, and Marketing

* All buttons must support:

  * Go to product
  * Go to collection
  * External link
  * Scroll to section

* Builder must feel simple, not overwhelming
