# Theme Preview Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Website Builder theme preview show complete sample imagery and avoid blank white image boxes when sample images fail.

**Architecture:** Keep the fix local to the Website Builder theme system. Strengthen theme catalog/template tests, update sample image seeds, and add a small reusable preview image component with a themed fallback source.

**Tech Stack:** React, TypeScript, Vite, Node assert tests through `tsx`.

---

### Task 1: Theme Image Coverage Test

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that every theme has visible catalog, best-seller, and trending sample images, and that each theme has more than one sample image across product data.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd exports/dashboard; npx tsx src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

Expected: FAIL before implementation if any theme has repeated or missing sample image coverage.

### Task 2: Curated Image Seeds And Fallback Component

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/softFeminineTemplate.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/modernConversionTemplate.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/SoftFeminineTemplatePreview.tsx`

- [ ] **Step 1: Implement minimal code**

Update product image URLs to category-appropriate sample photos and replace key soft theme preview `<img>` tags with a fallback image component for hero card/category/product image surfaces.

- [ ] **Step 2: Run focused test**

Run: `cd exports/dashboard; npx tsx src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

Expected: PASS.

### Task 3: Verification

**Files:**
- Verify only.

- [ ] **Step 1: Type-check dashboard**

Run: `cd exports/dashboard; npm run lint`

Expected: PASS.

- [ ] **Step 2: Build dashboard**

Run: `cd exports/dashboard; npm run build`

Expected: PASS.
