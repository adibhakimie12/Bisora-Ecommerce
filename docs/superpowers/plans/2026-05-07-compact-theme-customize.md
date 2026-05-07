# Compact Theme Customize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clean section placement controls to Website Builder Customize without making the editor feel crowded.

**Architecture:** Store section order, visibility, and layout presets inside `ThemeDraftContent`. Keep the behavior testable in `themeBuilderModel.ts`, then wire compact icon controls into the existing customize panel.

**Tech Stack:** React, TypeScript, Vite, Node assert tests through `tsx`.

---

### Task 1: Section Settings Model

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/themeBuilderModel.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 1: Write failing tests**

Assert default section order, default visibility, layout updates, visibility toggle, and up/down movement.

- [ ] **Step 2: Implement model helpers**

Add `ThemeSectionSetting`, `createDefaultSectionSettings`, `setSectionLayout`, `toggleSectionVisibility`, and `moveSectionSetting`.

### Task 2: Compact Customize UI

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Wire state controls**

Add compact section rows with select, show/hide, move up, move down, and layout preset select.

- [ ] **Step 2: Save draft on every section setting change**

Call existing `onChangeDraft` with the updated draft and keep auto-save behavior.

### Task 3: Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused test**

Run: `cd exports/dashboard; npx tsx src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 2: Run type-check**

Run: `cd exports/dashboard; npm run lint`

- [ ] **Step 3: Run build**

Run: `cd exports/dashboard; npm run build`
