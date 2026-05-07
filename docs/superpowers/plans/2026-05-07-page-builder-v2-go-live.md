# Page Builder V2 Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Website Builder > Pages behave like a real sales page / lead page builder with functional controls, responsive preview, CTA actions, form capture blocks, and go-live validation.

**Architecture:** Extend the pure page builder model with block-level style/action/responsive fields and validation helpers, then bind those fields to the Pages UI so every visible control changes the canvas or page readiness state.

**Tech Stack:** React, TypeScript, Vite, Node assert tests through `tsx`.

---

### Task 1: Model Capability

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/pageBuilderModel.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 1: Add failing tests**

Assert block types include `form`, button action can be set, style fields update, responsive visibility can be toggled, and go-live validation catches empty CTA/form targets.

- [ ] **Step 2: Implement model fields and helpers**

Add `buttonAction`, `buttonTarget`, `widthPercent`, `paddingY`, `backgroundColor`, `textColor`, `hideDesktop`, `hideMobile`, `formFields`, `validateLandingPageForPublish`, and update helpers.

### Task 2: UI Controls

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Add functional preview controls**

Add desktop/mobile canvas mode and render responsive visibility.

- [ ] **Step 2: Add working settings controls**

Bind width, padding, background color, text color, visibility, CTA action, target, form fields, HTML, image, video, timer, and columns to selected blocks.

- [ ] **Step 3: Add publish readiness feedback**

Show validation results and prevent fake success when required CTA/form details are missing.

### Task 3: Memory And Verification

**Files:**
- Modify: `docs/memory.md`

- [ ] **Step 1:** Update memory with the Page Builder V2 rules.
- [ ] **Step 2:** Run focused test, lint, and build.
