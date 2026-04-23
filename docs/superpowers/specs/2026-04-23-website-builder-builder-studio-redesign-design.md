# Website Builder Builder Studio Redesign Design

Date: 2026-04-23
Project: Bisora Ecommerce SaaS System
Area: Website Builder / Builder Studio
Status: Approved for planning

## Goal

Redesign Builder Studio so it feels simpler and more guided for beginners while still exposing a powerful, Webflow-like editing panel for sellers who want more control over logo placement, image uploads, layout tuning, and theme styling.

## Problem Statement

The current Builder Studio is functional but feels messy. It exposes many controls at once, makes the editing hierarchy feel flat, and does not yet present a cleaner guided workflow for common seller actions such as:

- uploading a logo
- changing logo position
- replacing hero and section images
- editing section backgrounds
- adjusting layout rhythm and visual tone
- reordering sections without confusion

The current experience needs stronger structure, clearer editing modes, and better separation between page structure, live preview, and contextual controls.

## Product Direction

Builder Studio should follow a guided-shell plus powerful-panel model.

This means:

- the overall shell stays consistent across themes
- the visual preview and control hints adapt to the active theme
- the studio looks simple at first glance
- advanced control becomes available through contextual tabs and grouped controls

Builder Studio should not fully change its structure per theme. Themes should change:

- defaults
- suggestions
- visual presets
- section flow
- header style defaults
- recommended editing actions

The shell itself should stay stable so sellers do not get lost when they switch themes.

## Core UX Principles

Builder Studio must be:

- visually clean
- easy to scan
- click-driven
- context-aware
- theme-aware
- powerful without feeling overwhelming

The seller should feel like they are building a storefront visually, not filling a long admin form.

## Recommended Layout

Use a three-column studio with a compact top bar.

### 1. Top Bar

Purpose:

- primary workspace actions only

Content:

- back to installed themes
- active theme name
- page selector
- device toggle
- preview
- save
- publish

Rules:

- no secondary settings in this area
- no dense instructional text in this area
- keep it slim and always visible

## 2. Left Rail

Purpose:

- page structure and navigation

Content:

- Header
- ordered section list
- Footer
- Theme Settings
- Add Section entry point

Core actions:

- select block
- reorder block
- duplicate block
- hide or show block
- remove block
- add section from library

Rules:

- this rail should feel like a page outline, not a settings form
- active selection must be obvious
- drag and reorder should be controlled, not freeform chaos

## 3. Center Canvas

Purpose:

- live storefront editing canvas

Content:

- rendered storefront preview
- hover states
- click-to-edit targets
- image placeholders
- selected block outline
- quick-edit entry points

Rules:

- this is the hero area of Builder Studio
- seller should immediately understand what the storefront looks like
- empty states should still feel premium and intentional
- device switching should resize this area cleanly

## 4. Right Panel

Purpose:

- contextual editing

Behavior:

- changes based on what is selected

Examples:

- Header selected -> header controls
- Hero selected -> hero controls
- Footer selected -> footer controls
- Theme Settings selected -> global branding and layout controls

Editing structure:

- Content
- Layout
- Style
- Advanced

Rules:

- do not show all controls at once
- keep basic actions first
- advanced options should be collapsible
- long forms should be split into grouped cards

## Editing Model

Builder Studio should be stable across themes but theme-aware in how it behaves.

### Stable Shell

The following should remain structurally consistent across themes:

- top bar
- left rail
- center canvas
- right panel tab system
- click-to-edit flow

### Theme-Aware Layer

The following should adapt per theme:

- default section order
- section labels
- guidance copy
- default header position
- button shape defaults
- page spacing defaults
- card radius defaults
- hero layout preset
- recommended actions in the right panel

## Header and Logo Controls

Header editing is a primary seller need and should feel complete.

When Header is selected, the right panel should expose:

- Upload Logo
- Remove Logo
- Use Text Logo
- Logo Width
- Logo Position
- Header Alignment
- Announcement Bar toggle
- Search toggle
- Cart toggle
- Sticky Header toggle

### Logo Position Options

Allow controlled positions:

- left
- center
- split

Defaults may vary by theme:

- Luxe Atelier -> center
- Editorial Veil -> left
- Campaign Glow -> split
- Sage Ritual -> left

The seller should still be able to override these defaults.

## Media Controls

Section editing must support media cleanly.

When a section with imagery is selected, the right panel should expose:

- Upload Image
- Replace Image
- Remove Image
- Image Fit
- Image Position
- Overlay Strength
- Image Shape

### Image Fit Options

- cover
- contain

### Image Position Options

- left
- center
- right

### Image Shape Options

- soft rounded
- rounded
- sharp

These controls should work for:

- hero blocks
- promo blocks
- editorial image blocks
- category image blocks where relevant

## Background Controls

Both section-level and global background styling should be available.

### Section-Level Background

Allow:

- background color
- background image upload
- background style mode
- overlay amount
- focal point

### Global Theme Background

Under Theme Settings, allow:

- canvas surface color
- default page background mood
- section spacing density
- page width
- default card radius

### Background Style Modes

- plain
- gradient
- image

### Focal Point Options

- top
- center
- bottom

## Layout Controls

Builder Studio should support layout flexibility, but in a controlled way.

Do not build a freeform absolute-position editor.

Instead, support:

- drag reorder for sections
- swap hero layout preset
- change text and image ratio
- adjust column count for compatible sections
- toggle section width behavior
- spacing density tuning

This keeps the builder powerful but beginner-safe.

## Global Theme Settings

Theme Settings should act as storewide defaults, not section-specific overrides.

Expose:

- primary accent color
- surface color
- heading direction or font mood
- button shape
- page width
- section spacing
- card radius
- default image mood

Rule:

- global settings affect the whole storefront
- section settings affect only the selected block

This distinction should be visually clear in the interface copy and grouping.

## Guided Editing Flow

The editing experience should feel progressive.

### Beginner Flow

1. Select theme
2. Open Builder Studio
3. Click Hero, Header, Footer, or any section
4. Edit from the right panel
5. Reorder sections from left rail
6. Save and preview

### Advanced Flow

1. Open Theme Settings
2. Tune layout rhythm and button feel
3. Adjust logo placement and header structure
4. Replace imagery and backgrounds
5. Tune block-level spacing and style

The interface should support both flows without forcing all advanced settings on a first-time seller.

## Visual Direction

Builder Studio itself should feel clean and premium rather than purely utilitarian.

Recommended visual language:

- soft neutrals
- clear active states
- strong but restrained hierarchy
- premium card surfaces
- minimal visual noise
- subtle contrast between structure rail, canvas, and editor panel

The center canvas should always feel like the most important zone.

## Quick Edit Behavior

Quick edit remains useful, but should reinforce clarity.

When hovering or selecting a block in preview:

- show clear selected state
- allow jump to Content, Layout, or Style
- avoid too many floating controls at once

Quick edit should accelerate navigation, not create extra clutter.

## Success Criteria

The redesign is successful if:

- sellers understand where to click first
- Builder Studio feels cleaner than the current version
- Header, logo, image, and background editing feel obvious
- the shell stays consistent across themes
- theme defaults still create distinct storefront personalities
- basic users can complete common edits without confusion
- more advanced users can still control layout and styling meaningfully

## Out of Scope

The following are not part of this redesign:

- full freeform page builder with arbitrary element dragging
- code editor or developer-facing customization layer
- per-device layout editing for every individual micro-element
- custom CSS injection in Builder Studio
- deeply nested design-token system

## Risks and Guardrails

### Risk: too many controls make the studio messy again

Guardrail:

- keep editing contextual
- group controls into cards and tabs
- hide advanced controls until needed

### Risk: theme switching changes the studio too much

Guardrail:

- preserve the same builder shell across all themes

### Risk: drag-and-drop becomes unpredictable

Guardrail:

- allow section-level drag only
- no freeform element-level dragging in this phase

### Risk: logo and media editing feel incomplete

Guardrail:

- prioritize upload, remove, replace, fit, position, and focal controls in the first implementation wave

## Recommendation Summary

Bisora should redesign Builder Studio into a stable three-column builder with:

- a slim top action bar
- a structural left rail
- a premium live canvas
- a contextual right panel

The studio should remain consistent across themes, while theme-aware defaults and guidance make each template feel purposeful. Priority controls for the implementation wave should include logo editing, logo placement, section image uploads, background image and overlay handling, controlled layout tuning, and stronger global theme settings.
