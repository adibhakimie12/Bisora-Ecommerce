# Website Builder Builder Studio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Builder Studio into a cleaner guided shell with a theme-aware live canvas and a more powerful contextual editor for logo, media, background, and layout controls.

**Architecture:** Keep `WebsiteBuilderModule.tsx` as the top-level workspace entry, but extract Builder Studio configuration and view-model logic into focused helper files so the studio shell becomes easier to reason about. Add tests around builder defaults, contextual editing metadata, and media or layout control models first, then update the UI to consume those helpers without changing the broader Website Builder routing flow.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, `tsx`, Tailwind utility classes, existing Website Builder module patterns

---

## File Structure

### Files to create

- `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`
  - Own Builder Studio section presets, shell navigation metadata, theme-aware defaults, and option lists for media, logo, and background controls.
- `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts`
  - Verify Builder Studio theme defaults, header position defaults, and grouped control definitions.
- `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.ts`
  - Build helper functions that derive right-panel groups, selection labels, quick actions, and context-aware controls.
- `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts`
  - Verify contextual panel behavior for header, section, footer, and theme settings selections.

### Files to modify

- `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
  - Replace the current messy Builder Studio shell with the redesigned top bar, left rail, center canvas, and grouped right panel.
  - Add media, logo, background, and controlled layout controls.
- `exports/dashboard/package.json`
  - Reuse the existing `test` script added earlier; no additional script changes expected unless the command needs widening.

## Task 1: Add Builder Studio config tests and extract stable shell defaults

**Files:**
- Create: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`
- Create: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Write the failing config tests**

Create `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  builderStudioShellItems,
  builderStudioThemeDefaults,
  logoPositionOptions,
  backgroundStyleOptions,
} from './builderStudioConfig';

test('builder studio shell exposes the approved stable structure', () => {
  assert.deepEqual(
    builderStudioShellItems.map((item) => item.id),
    ['header', 'sections', 'footer', 'theme-settings'],
  );
});

test('theme defaults map logo position and button shape by first-wave theme', () => {
  assert.equal(builderStudioThemeDefaults['luxe-atelier'].logoPosition, 'center');
  assert.equal(builderStudioThemeDefaults['editorial-veil'].logoPosition, 'left');
  assert.equal(builderStudioThemeDefaults['campaign-glow'].logoPosition, 'split');
  assert.equal(builderStudioThemeDefaults['sage-ritual'].logoPosition, 'left');
});

test('background and logo option lists stay constrained for guided editing', () => {
  assert.deepEqual(logoPositionOptions, ['left', 'center', 'split']);
  assert.deepEqual(backgroundStyleOptions, ['plain', 'gradient', 'image']);
});
```

- [ ] **Step 2: Run the config tests to verify they fail**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- failure because `./builderStudioConfig` does not exist

- [ ] **Step 3: Add the minimal Builder Studio config module**

Create `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`:

```ts
export type BuilderShellItemId = 'header' | 'sections' | 'footer' | 'theme-settings';
export type LogoPosition = 'left' | 'center' | 'split';
export type BackgroundStyle = 'plain' | 'gradient' | 'image';
export type ImageFit = 'cover' | 'contain';
export type ImageFocus = 'top' | 'center' | 'bottom';
export type ImageShape = 'soft-rounded' | 'rounded' | 'sharp';

export const builderStudioShellItems = [
  { id: 'header' as const, title: 'Header', note: 'Logo, announcement, menu, and utility icons.' },
  { id: 'sections' as const, title: 'Sections', note: 'Reorder and manage homepage blocks.' },
  { id: 'footer' as const, title: 'Footer', note: 'Support links, newsletter, and trust.' },
  { id: 'theme-settings' as const, title: 'Theme Settings', note: 'Global storefront tone and layout defaults.' },
];

export const logoPositionOptions: LogoPosition[] = ['left', 'center', 'split'];
export const backgroundStyleOptions: BackgroundStyle[] = ['plain', 'gradient', 'image'];
export const imageFitOptions: ImageFit[] = ['cover', 'contain'];
export const imageFocusOptions: ImageFocus[] = ['top', 'center', 'bottom'];
export const imageShapeOptions: ImageShape[] = ['soft-rounded', 'rounded', 'sharp'];

export const builderStudioThemeDefaults: Record<
  string,
  {
    logoPosition: LogoPosition;
    buttonShape: 'pill' | 'rounded' | 'sharp';
    sectionSpacing: 'tight' | 'comfortable' | 'airy';
    pageWidth: 'contained' | 'wide';
  }
> = {
  'luxe-atelier': { logoPosition: 'center', buttonShape: 'pill', sectionSpacing: 'comfortable', pageWidth: 'contained' },
  'editorial-veil': { logoPosition: 'left', buttonShape: 'sharp', sectionSpacing: 'airy', pageWidth: 'wide' },
  'campaign-glow': { logoPosition: 'split', buttonShape: 'rounded', sectionSpacing: 'tight', pageWidth: 'contained' },
  'sage-ritual': { logoPosition: 'left', buttonShape: 'pill', sectionSpacing: 'comfortable', pageWidth: 'contained' },
};
```

- [ ] **Step 4: Import the config into `WebsiteBuilderModule.tsx`**

Add imports like:

```ts
import {
  backgroundStyleOptions,
  builderStudioThemeDefaults,
  imageFitOptions,
  imageFocusOptions,
  imageShapeOptions,
  logoPositionOptions,
} from './builderStudioConfig';
```

Then replace any inline theme-specific Builder Studio defaults with lookups against `builderStudioThemeDefaults`.

- [ ] **Step 5: Run tests to verify the config layer**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- all tests pass

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "refactor: add builder studio config helpers"
```

## Task 2: Add Builder Studio contextual panel view-model helpers

**Files:**
- Create: `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.ts`
- Create: `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Write the failing view-model tests**

Create `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBuilderPanelGroups, getBuilderSelectionLabel } from './builderStudioViewModel';

test('getBuilderSelectionLabel returns friendly labels for studio surfaces', () => {
  assert.equal(getBuilderSelectionLabel('section', 'Luxury Hero'), 'Luxury Hero');
  assert.equal(getBuilderSelectionLabel('header', 'ignored'), 'Header & Navigation');
  assert.equal(getBuilderSelectionLabel('footer', 'ignored'), 'Footer Builder');
  assert.equal(getBuilderSelectionLabel('branding', 'ignored'), 'Theme Settings');
});

test('buildBuilderPanelGroups returns grouped controls for section editing', () => {
  const groups = buildBuilderPanelGroups({
    activeSurface: 'section',
    editorTab: 'content',
    sectionKind: 'hero',
  });

  assert.deepEqual(groups.map((group) => group.id), ['content', 'media', 'links']);
});

test('buildBuilderPanelGroups returns media and behavior controls for header editing', () => {
  const groups = buildBuilderPanelGroups({
    activeSurface: 'header',
    editorTab: 'layout',
  });

  assert.equal(groups.some((group) => group.id === 'logo'), true);
  assert.equal(groups.some((group) => group.id === 'behavior'), true);
});
```

- [ ] **Step 2: Run the view-model test to verify it fails**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioViewModel.test.ts
```

Expected:

- failure because `./builderStudioViewModel` does not exist

- [ ] **Step 3: Add the minimal view-model module**

Create `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.ts`:

```ts
type ActiveSurface = 'header' | 'footer' | 'branding' | 'section';
type EditorTab = 'content' | 'layout' | 'style';
type SectionKind = 'hero' | 'categories' | 'featured-products' | 'promotion-banner' | 'testimonials' | 'footer';

export interface BuilderPanelGroup {
  id: string;
  title: string;
}

export function getBuilderSelectionLabel(activeSurface: ActiveSurface, sectionLabel: string) {
  if (activeSurface === 'header') return 'Header & Navigation';
  if (activeSurface === 'footer') return 'Footer Builder';
  if (activeSurface === 'branding') return 'Theme Settings';
  return sectionLabel;
}

export function buildBuilderPanelGroups(input: {
  activeSurface: ActiveSurface;
  editorTab: EditorTab;
  sectionKind?: SectionKind;
}): BuilderPanelGroup[] {
  if (input.activeSurface === 'header') {
    return [
      { id: 'logo', title: 'Logo' },
      { id: 'announcement', title: 'Announcement' },
      { id: 'behavior', title: 'Header Behavior' },
    ];
  }

  if (input.activeSurface === 'branding') {
    return [
      { id: 'theme', title: 'Theme Tokens' },
      { id: 'layout', title: 'Global Layout' },
      { id: 'background', title: 'Background Defaults' },
    ];
  }

  if (input.activeSurface === 'footer') {
    return [
      { id: 'content', title: 'Footer Content' },
      { id: 'columns', title: 'Columns' },
      { id: 'newsletter', title: 'Newsletter' },
    ];
  }

  if (input.editorTab === 'content') {
    return [
      { id: 'content', title: 'Content' },
      { id: 'media', title: 'Media' },
      { id: 'links', title: 'Links' },
    ];
  }

  if (input.editorTab === 'layout') {
    return [
      { id: 'layout', title: 'Layout' },
      { id: 'spacing', title: 'Spacing' },
      { id: 'width', title: 'Width' },
    ];
  }

  return [
    { id: 'style', title: 'Style' },
    { id: 'background', title: 'Background' },
    { id: 'advanced', title: 'Advanced' },
  ];
}
```

- [ ] **Step 4: Wire the helpers into `WebsiteBuilderModule.tsx`**

Import:

```ts
import {
  buildBuilderPanelGroups,
  getBuilderSelectionLabel,
} from './builderStudioViewModel';
```

Then replace the current inline `quickEditSectionLabel` logic with:

```ts
const quickEditSectionLabel = getBuilderSelectionLabel(activeSurface, activeSection.label);
const panelGroups = buildBuilderPanelGroups({
  activeSurface,
  editorTab,
  sectionKind: activeSection.kind,
});
```

Use `panelGroups` as grouped cards or headers in the right panel rather than one long undifferentiated stack.

- [ ] **Step 5: Run tests to verify the new helper layer**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioViewModel.test.ts src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- both test files pass

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.ts \
  exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "refactor: add builder studio panel view model"
```

## Task 3: Rebuild the Builder Studio shell into top bar, left rail, live canvas, and grouped right panel

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Write the failing shell expectation test**

Because `WebsiteBuilderModule.tsx` does not yet have direct component tests for Builder Studio layout, create a light structural test by expanding `builderStudioConfig.test.ts`:

```ts
test('builder studio shell keeps header sections footer and theme settings in the left structure rail', () => {
  assert.deepEqual(
    builderStudioShellItems.map((item) => item.title),
    ['Header', 'Sections', 'Footer', 'Theme Settings'],
  );
});
```

This test protects the shell navigation vocabulary while the UI is reorganized.

- [ ] **Step 2: Run tests to verify the shell contract**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- passing config tests
- Builder Studio UI still visually uses the old shell, which is the implementation gap for this task

- [ ] **Step 3: Rebuild the Builder Studio header area**

In `WebsiteBuilderModule.tsx`, replace the current Builder Studio top controls with a compact top bar containing:

```tsx
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
  <div>
    <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{theme.styleTag}</p>
    <h1 className="mt-1 text-3xl font-semibold text-on-surface">{theme.name} Builder Studio</h1>
  </div>

  <div className="flex flex-wrap items-center gap-3">
    <select /* page selector */ />
    <div className="flex items-center rounded-full border border-outline-variant/20 bg-surface-low p-1">{/* device buttons */}</div>
    <button>{/* preview */}</button>
    <button>{/* save */}</button>
    <button>{/* publish */}</button>
  </div>
</div>
```

Keep the back link above the shell, but do not add extra instructional banners inside the top bar itself.

- [ ] **Step 4: Rebuild the three-column body layout**

Update the main Builder Studio grid to reinforce the new shell:

```tsx
<div className="grid min-h-[780px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
  <aside>{/* left structure rail */}</aside>
  <div>{/* center canvas */}</div>
  <aside>{/* right contextual panel */}</aside>
</div>
```

Left rail requirements:

- group Header, Sections, Footer, Theme Settings visibly
- keep Add Section at the bottom of the structure area
- make the active item visually stronger than the rest

Center canvas requirements:

- keep preview card centered
- keep device width behavior
- make the canvas feel like the hero surface

Right panel requirements:

- render grouped cards using `panelGroups`
- separate Content, Media, Layout, Style, and Advanced groups visually

- [ ] **Step 5: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected:

- no TypeScript errors
- production build succeeds

- [ ] **Step 6: Commit**

```bash
git add exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "feat: redesign builder studio shell"
```

## Task 4: Add header logo upload, logo placement, and header behavior controls

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Modify: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`
- Test: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts`

- [ ] **Step 1: Write the failing logo default test**

Append to `builderStudioConfig.test.ts`:

```ts
test('logo position defaults remain theme-aware but constrained', () => {
  assert.equal(builderStudioThemeDefaults['luxe-atelier'].logoPosition, 'center');
  assert.equal(builderStudioThemeDefaults['campaign-glow'].logoPosition, 'split');
});
```

- [ ] **Step 2: Run the config tests**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- tests pass
- UI still needs the actual controls wired in

- [ ] **Step 3: Add logo position state and header controls**

Extend the local header state in `WebsiteBuilderModule.tsx` to include:

```ts
logoPosition: builderStudioThemeDefaults[theme.id]?.logoPosition ?? 'center',
logoWidth: 160,
useTextLogo: false,
```

Then add grouped controls under Header editing:

```tsx
<EditorField label="Logo Position">
  <select value={headerConfig.logoPosition} onChange={...}>
    {logoPositionOptions.map((option) => (
      <option key={option} value={option}>{capitalize(option)}</option>
    ))}
  </select>
</EditorField>

<EditorField label="Logo Width">
  <input type="range" min={96} max={240} value={headerConfig.logoWidth} onChange={...} />
</EditorField>

<ToggleRow
  label="Use Text Logo"
  description="Use the theme name as the logo mark when no image is needed."
  checked={headerConfig.useTextLogo}
  onToggle={...}
/>
```

- [ ] **Step 4: Update header preview rendering**

Update `HeaderLogoMark` and `PreviewHeader` so they respect:

- `logoPosition`
- `logoWidth`
- `useTextLogo`

For example:

```tsx
function HeaderLogoMark({ config }: { config: HeaderConfig }) {
  if (config.logoImage && !config.useTextLogo) {
    return (
      <img
        src={config.logoImage}
        alt={config.logoText || 'Store logo'}
        className="mx-auto h-12 w-auto object-contain"
        style={{ maxWidth: `${config.logoWidth}px` }}
      />
    );
  }

  return <div className="text-center text-2xl font-semibold">{config.logoText}</div>;
}
```

And branch the header layout on `config.logoPosition` before falling back to theme defaults.

- [ ] **Step 5: Run lint, build, and focused tests**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts src/modules/websiteBuilder/builderStudioViewModel.test.ts
npm run lint
npm run build
```

Expected:

- tests pass
- lint passes
- build succeeds

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts
git commit -m "feat: add builder studio logo and header controls"
```

## Task 5: Add section media and background editing controls

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Modify: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`
- Test: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts`

- [ ] **Step 1: Write the failing option-list test**

Append to `builderStudioConfig.test.ts`:

```ts
import { imageFitOptions, imageFocusOptions, imageShapeOptions } from './builderStudioConfig';

test('media control option lists stay constrained for guided editing', () => {
  assert.deepEqual(imageFitOptions, ['cover', 'contain']);
  assert.deepEqual(imageFocusOptions, ['top', 'center', 'bottom']);
  assert.deepEqual(imageShapeOptions, ['soft-rounded', 'rounded', 'sharp']);
});
```

- [ ] **Step 2: Run the config tests**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts
```

Expected:

- tests pass
- UI still lacks the actual control surfaces

- [ ] **Step 3: Extend section and branding state for media/background**

Extend `BuilderSectionItem['style']` in `WebsiteBuilderModule.tsx` to include:

```ts
imageFit?: 'cover' | 'contain';
imageFocus?: 'top' | 'center' | 'bottom';
imageShape?: 'soft-rounded' | 'rounded' | 'sharp';
backgroundStyle?: 'plain' | 'gradient' | 'image';
backgroundImage?: string;
```

And extend `BrandingConfig` with:

```ts
pageWidth: 'contained' | 'wide';
sectionSpacing: 'tight' | 'comfortable' | 'airy';
cardRadius: 'soft-rounded' | 'rounded' | 'sharp';
backgroundStyle: 'plain' | 'gradient' | 'image';
backgroundImage?: string;
```

- [ ] **Step 4: Add right-panel controls for section media and background**

In the section editor panel, add grouped controls such as:

```tsx
<EditorField label="Image Fit">
  <select value={activeSection.style.imageFit ?? 'cover'} onChange={...}>
    {imageFitOptions.map((option) => <option key={option} value={option}>{capitalize(option)}</option>)}
  </select>
</EditorField>

<EditorField label="Image Focus">
  <select value={activeSection.style.imageFocus ?? 'center'} onChange={...}>
    {imageFocusOptions.map((option) => <option key={option} value={option}>{capitalize(option)}</option>)}
  </select>
</EditorField>

<EditorField label="Background Style">
  <select value={activeSection.style.backgroundStyle ?? 'plain'} onChange={...}>
    {backgroundStyleOptions.map((option) => <option key={option} value={option}>{capitalize(option)}</option>)}
  </select>
</EditorField>
```

Add upload or replace UI for `backgroundImage` where the selected background style is `image`.

- [ ] **Step 5: Reflect the new media and background controls in preview rendering**

Update `PreviewSection` so it reads:

- `imageFit`
- `imageFocus`
- `imageShape`
- `backgroundStyle`
- `backgroundImage`

Use these values to change preview classes and inline backgrounds in a controlled way.

- [ ] **Step 6: Run tests, lint, and build**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioConfig.test.ts src/modules/websiteBuilder/builderStudioViewModel.test.ts
npm run lint
npm run build
```

Expected:

- tests pass
- lint passes
- build succeeds

- [ ] **Step 7: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.test.ts
git commit -m "feat: add builder studio media and background controls"
```

## Task 6: Add controlled layout tuning and theme settings groups

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Modify: `exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts`
- Test: `exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts`

- [ ] **Step 1: Write the failing theme-settings group test**

Append to `builderStudioViewModel.test.ts`:

```ts
test('branding selection returns theme token, layout, and background groups', () => {
  const groups = buildBuilderPanelGroups({
    activeSurface: 'branding',
    editorTab: 'style',
  });

  assert.deepEqual(groups.map((group) => group.id), ['theme', 'layout', 'background']);
});
```

- [ ] **Step 2: Run the view-model tests**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioViewModel.test.ts
```

Expected:

- tests pass
- UI still needs the grouped controls implemented

- [ ] **Step 3: Add controlled global layout controls**

Under Theme Settings editing, add:

```tsx
<EditorField label="Page Width">
  <select value={brandingConfig.pageWidth} onChange={...}>
    <option value="contained">Contained</option>
    <option value="wide">Wide</option>
  </select>
</EditorField>

<EditorField label="Section Spacing">
  <select value={brandingConfig.sectionSpacing} onChange={...}>
    <option value="tight">Tight</option>
    <option value="comfortable">Comfortable</option>
    <option value="airy">Airy</option>
  </select>
</EditorField>

<EditorField label="Card Radius">
  <select value={brandingConfig.cardRadius} onChange={...}>
    <option value="soft-rounded">Soft Rounded</option>
    <option value="rounded">Rounded</option>
    <option value="sharp">Sharp</option>
  </select>
</EditorField>
```

- [ ] **Step 4: Apply global layout controls to the canvas**

Update canvas sizing and preview card classes so:

- `pageWidth` changes the preview max width choice
- `sectionSpacing` changes section padding defaults
- `cardRadius` changes repeated card styles where a global default applies

Keep this controlled and token-like. Do not add arbitrary pixel inputs in this phase.

- [ ] **Step 5: Run lint, build, and focused tests**

Run:

```bash
npm run test -- src/modules/websiteBuilder/builderStudioViewModel.test.ts src/modules/websiteBuilder/builderStudioConfig.test.ts
npm run lint
npm run build
```

Expected:

- tests pass
- lint passes
- build succeeds

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx \
  exports/dashboard/src/modules/websiteBuilder/builderStudioConfig.ts \
  exports/dashboard/src/modules/websiteBuilder/builderStudioViewModel.test.ts
git commit -m "feat: add builder studio theme settings controls"
```

## Task 7: Final verification and manual Builder Studio review

**Files:**
- Modify: `docs/superpowers/specs/2026-04-23-website-builder-builder-studio-redesign-design.md` (only if implementation diverged)
- Modify: `docs/superpowers/plans/2026-04-23-website-builder-builder-studio-redesign-implementation.md` (checkbox updates only if desired)

- [ ] **Step 1: Run the focused Website Builder test slice**

Run:

```bash
npm run test -- \
  src/modules/websiteBuilder/themeLibrary.test.ts \
  src/modules/websiteBuilder/themeLibraryViewModel.test.ts \
  src/modules/websiteBuilder/builderStudioConfig.test.ts \
  src/modules/websiteBuilder/builderStudioViewModel.test.ts
```

Expected:

- all focused Website Builder tests pass

- [ ] **Step 2: Run full typecheck and build**

Run:

```bash
npm run lint
npm run build
```

Expected:

- no TypeScript errors
- production build succeeds

- [ ] **Step 3: Review Builder Studio manually in the dashboard**

Run:

```bash
npm run dev
```

Manual checks:

- top bar is slimmer and clearer than before
- left rail feels like structure, not settings clutter
- center canvas remains the visual focus
- right panel changes according to selection
- header controls include logo upload and logo position
- section controls include media and background editing
- Theme Settings include global layout and styling controls
- switching themes keeps the shell stable but changes defaults and suggestions

- [ ] **Step 4: Update the spec only if implementation diverged**

If the final UI or control naming changed slightly during implementation, update the spec with the exact final wording. If there was no meaningful drift, do not edit the spec.

- [ ] **Step 5: Commit final documentation sync if needed**

```bash
git add docs/superpowers/specs/2026-04-23-website-builder-builder-studio-redesign-design.md
git commit -m "docs: sync builder studio redesign spec after implementation"
```

Skip this commit if the spec file did not change.

---

## Self-Review

### Spec coverage

- Stable builder shell covered in Tasks 1 through 3.
- Header and logo controls covered in Task 4.
- Section media and background controls covered in Task 5.
- Global theme and layout controls covered in Task 6.
- Verification and manual UX review covered in Task 7.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task uses exact files and exact commands.
- Code-editing steps include concrete code shapes and field names.

### Type consistency

- `LogoPosition`, `BackgroundStyle`, and other option types are introduced in Task 1 and reused consistently.
- `buildBuilderPanelGroups` and `getBuilderSelectionLabel` are defined before later tasks rely on them.
- Theme IDs remain aligned with the first-wave theme library implementation.

