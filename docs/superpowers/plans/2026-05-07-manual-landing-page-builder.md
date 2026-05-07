# Manual Landing Page Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Website Builder Pages into a manual landing page/CMS builder where admins can add, place, and edit text, box, image, video, CTA, FAQ, and form blocks.

**Architecture:** Add a small page builder model for block data and actions, then render a clean three-column builder inside the existing Pages tab. Avoid drag-and-drop for the first version; use explicit add, move, duplicate, delete, and settings controls.

**Tech Stack:** React, TypeScript, Vite, Node assert tests through `tsx`.

---

### Task 1: Page Builder Model

**Files:**
- Create: `exports/dashboard/src/modules/websiteBuilder/pageBuilderModel.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 1: Write failing tests**

Assert default page creation, add block, move block, duplicate block, delete block, and update block content.

- [ ] **Step 2: Implement model helpers**

Add block templates and pure functions for stable page editing.

### Task 2: Pages Builder UI

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Replace Pages placeholder**

Render a manual landing page builder when the active Website Builder tab is `pages`.

- [ ] **Step 2: Add block library and canvas controls**

Allow manual add, select, move up/down, duplicate, delete, and preview of each block.

- [ ] **Step 3: Add selected block settings**

Let admin edit text, image file name, video URL, button link, FAQ/form copy, alignment, and background tone depending on block type.

### Task 3: Verification

**Files:**
- Verify only.

- [ ] **Step 1:** `cd exports/dashboard; npx tsx src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`
- [ ] **Step 2:** `cd exports/dashboard; npm run lint`
- [ ] **Step 3:** `cd exports/dashboard; npm run build`
