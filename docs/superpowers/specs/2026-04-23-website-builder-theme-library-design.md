# Website Builder Theme Library Design

Date: 2026-04-23
Project: Bisora Ecommerce SaaS System
Area: Website Builder / Theme Library / Frontstore Theme Selection
Status: Approved for planning

## Goal

Design a stronger Theme Library experience for the Website Builder so sellers do not feel that every theme looks the same. The library should help sellers quickly choose a starting storefront identity based on business fit and brand mood, then enter Builder Studio to customize colors, typography, spacing, and section content.

## Problem Statement

The current Theme Library cards feel too similar. Themes appear to differ mostly by name and small color changes instead of showing clearly distinct storefront identities. This weakens seller confidence, reduces perceived product quality, and makes theme choice feel shallow.

## Product Direction

The Theme Library should use a hybrid selection model:

1. Seller first understands the business fit or niche.
2. Seller then chooses a visual mood within that niche.

For the first wave, Bisora should not launch many unrelated niches at once. Instead, it should establish one strong family and prove the pattern before expanding.

## First-Wave Scope

The first wave focuses on:

- Women fashion
- Muslimah fashion
- Beauty

Future niches such as electronics, furniture, food and beverage, home living, and menswear can be added later as separate theme waves after the initial pattern is validated.

## Recommended Launch Model

Use a shared builder system with different layout rhythms.

This means:

- Themes share the same Builder schema and editable controls.
- Themes reuse the same core section types where possible.
- Themes differ through default section order, hero composition, spacing rhythm, card treatment, typography mood, and promotional behavior.

This approach is preferred over:

- Visual-only skin changes, which still feel repetitive.
- Fully unique theme systems, which would be too heavy to maintain and harder to support in Builder Studio.

## Core Theme Principles

Every first-wave theme must differ in more than color. Each theme should present a visibly different storefront identity through:

- Hero composition
- Typography personality
- Section rhythm
- CTA style and energy
- Card and container shape language
- Promotional treatment
- Default spacing density
- Image direction

Seller customization remains available after installation. Sellers can still adjust:

- Colors
- Typography
- Global spacing
- Button style
- Section order
- Section visibility
- Section content

The goal is to keep customization flexible while preserving a strong starting personality for each theme.

## First-Wave Theme Families

Launch four theme families in the first wave.

### 1. Luxe Atelier

Business fit:

- Premium Muslimah boutique
- Elegant women fashion
- Festive capsule launches

Role in library:

- Featured theme
- Default installed theme

Visual direction:

- Champagne, taupe, pearl surfaces
- Deep navy or near-black elegant text
- High-contrast serif headlines
- Clean sans-serif for support text
- Medium to large rounded radius
- Warm premium editorial imagery

Layout behavior:

- Elegant split hero
- Curated categories
- New arrivals with boutique density
- Festive campaign banner
- Collection highlights
- Testimonials or trust
- Gallery-style lifestyle strip

Design character:

- Refined
- Giftable
- Premium
- Feminine
- Polished

### 2. Editorial Veil

Business fit:

- Minimal story-led modestwear
- Perfume and elegant beauty brands
- Brands that prioritize image storytelling over heavy promotion

Role in library:

- Recommended alternative to Luxe Atelier

Visual direction:

- Ivory, stone, soft neutral backgrounds
- Dark coffee or black typography
- Fashion-editorial type pairing
- Low-radius or nearly square cards
- Largest whitespace among launch themes
- Large image crops with restrained UI chrome

Layout behavior:

- Thin top notice
- Full-bleed hero image
- Editor note or brand statement
- Featured collection
- Lookbook grid
- Selected products
- Journal or story block
- Minimal footer

Design character:

- Airy
- Quiet
- Curated
- Magazine-like
- Mature

### 3. Campaign Glow

Business fit:

- Sellers pushing launches, drops, seasonal promos, and bundles
- Fashion brands that need stronger CTA energy without losing feminine polish

Role in library:

- Growth or campaign-focused option

Visual direction:

- Warm nude, sand, amber accents
- Charcoal or dark neutral text
- Bold display type mixed with practical sans-serif
- More assertive banners and promo tiles
- Tighter rhythm than Editorial Veil

Layout behavior:

- Promo bar
- Bold hero with campaign CTA
- Category quick links
- Seasonal or flash-sale banner
- Featured product grid
- Bundle or promo tiles
- Social proof or urgency metrics
- Newsletter or reward banner

Design character:

- Energetic
- Promotional
- Commercial
- Seasonal
- Conversion-aware

### 4. Sage Ritual

Business fit:

- Skincare
- Cosmetics
- Clean beauty
- Ritual-led wellness products

Role in library:

- Beauty-specific option in the first wave

Visual direction:

- Sage, olive, cream, muted clay
- Soft serif and approachable sans-serif pairing
- Organic curves and calm contrast
- Trust-first visual system
- Ingredient and routine storytelling

Layout behavior:

- Benefit bar
- Clean beauty hero
- Shop-by-category bubbles
- Special care promo cards
- Ingredient or brand story
- Best sellers
- Routine bundles
- Trust metrics or outcome strip

Design character:

- Calm
- Natural
- Educational
- Trustworthy
- Soft luxury

## Theme Library Card Design Rules

Theme cards must behave like mini storefront identity previews, not generic placeholders.

Each card must clearly differentiate the theme through:

1. Hero composition
2. Typography personality
3. Card and section shape language
4. Section rhythm in the preview
5. Business-fit labeling

### Preview content rules

Do not compress an entire homepage into a tiny card.

Instead, show two or three signature moments that communicate the theme identity. For example:

- Luxe Atelier: elegant split hero, premium category row, festive campaign strip
- Editorial Veil: full-image hero, editorial note, lookbook row
- Campaign Glow: promo hero, offer tiles, featured product grid
- Sage Ritual: beauty hero, category bubbles, trust or results strip

### Required card content

Each card should include:

- Theme name
- One-line business-fit statement
- One primary badge or label
- Three quick descriptive tags
- Mini storefront preview
- Clear actions such as Preview, Install, and Customize when installed

### Badge guidance

Use clear business-fit badges such as:

- Featured
- Best for Muslimah Fashion
- Best for Beauty
- Promo-first
- Minimal
- New

Avoid excessive badge use. Use one primary badge and no more than two supporting tags.

### Naming and labeling

Theme naming should be brandable, but the fit statement should remain plain and helpful.

Examples:

- Luxe Atelier: Premium Muslimah Boutique
- Editorial Veil: Minimal Story-Led Modestwear
- Campaign Glow: Promo-Driven Fashion Launches
- Sage Ritual: Clean Beauty and Skincare

## Library Sorting Strategy

The initial ordering should be intentional, not random.

Recommended first row order:

1. Luxe Atelier
2. Editorial Veil
3. Campaign Glow
4. Sage Ritual

Reasoning:

- Luxe Atelier delivers the strongest premium first impression and best matches the initial target audience.
- Editorial Veil expands range into quieter, more refined storytelling.
- Campaign Glow covers performance-led sellers.
- Sage Ritual ensures the library does not feel fashion-only.

## Installation Strategy

Recommended default:

- Luxe Atelier is installed by default for new sellers.

Recommended optional installs:

- Editorial Veil
- Campaign Glow
- Sage Ritual

Reasoning:

- Reduces overwhelm for new sellers
- Gives every seller one strong starting point immediately
- Preserves the feeling of a rich theme library without forcing too many active installations

## Frontstore and Showcase Positioning

If these themes are also surfaced in a public showcase or theme discovery area, the recommended spotlight order is:

1. Luxe Atelier
2. Sage Ritual
3. Campaign Glow

This ordering presents premium fashion, beauty, and promo-driven breadth without making the library feel repetitive.

## Builder Implications

The builder should support these themes through shared section capabilities and theme-level presets.

Theme variation should come from:

- Default section order
- Default section visibility
- Default image ratio choices
- Default spacing scale
- Default card radius
- Default typography scale
- Default announcement and promo block styles

This keeps Builder Studio simple while allowing each theme to feel distinct before customization.

## Success Criteria

The redesign is successful if:

- Sellers can immediately tell themes apart while browsing the library.
- The first-wave themes clearly support women fashion, Muslimah fashion, and beauty.
- Theme cards communicate business fit, not just aesthetics.
- Sellers feel they are choosing a real storefront direction instead of a color variation.
- Builder customization remains simple and flexible after theme installation.

## Out of Scope for This Wave

The following are intentionally deferred:

- Electronics theme family
- Furniture and home living theme family
- Food and beverage theme family
- Menswear or unisex expansion
- Sci-fi or highly experimental streetwear direction
- Fully unique builder logic per theme

## Risks and Guardrails

### Risk: themes still look too similar

Guardrail:

- Do not reuse the same hero composition, card rhythm, and preview structure across every theme.

### Risk: too many launch themes dilute quality

Guardrail:

- Limit the first wave to four themes only.

### Risk: theme system becomes too difficult to maintain

Guardrail:

- Use shared section infrastructure and builder controls.

### Risk: sellers feel locked into one look

Guardrail:

- Preserve flexibility through customization tools after installation.

## Recommendation Summary

The recommended first-wave launch is:

- Luxe Atelier as featured and default
- Editorial Veil as minimal story-led alternative
- Campaign Glow as campaign-first commercial option
- Sage Ritual as beauty-specific option

This gives Bisora a focused but convincing Theme Library that feels curated, premium, and visibly differentiated while remaining practical to implement inside the current builder direction.
