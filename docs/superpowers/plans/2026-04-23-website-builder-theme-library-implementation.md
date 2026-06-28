# Website Builder Theme Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first-wave Theme Library redesign so the Website Builder presents four clearly differentiated themes for Muslimah fashion and beauty, with stronger preview cards, better business-fit messaging, and a safer shared-builder structure.

**Architecture:** Keep the existing Website Builder module as the top-level entry point, but extract theme-library data and theme-specific helper logic into focused files. Add tests around theme metadata and view-model logic first, then update the library card UI and builder defaults to consume the new structure without changing the broader navigation flow.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, `tsx`, Tailwind utility classes, existing Website Builder module patterns

---

## File Structure

### Files to create

- `exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts`
  - Own the theme metadata, preview tags, business-fit labels, section-flow presets, and theme ordering.
- `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`
  - Verify the first-wave theme set, featured/default rules, business-fit labels, and card preview signatures.
- `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.ts`
  - Build small helper functions for installed themes, featured ordering, badges, and card sections so the UI stays simpler.
- `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.test.ts`
  - Verify sorting, install/publish transitions, and card tag derivation independently from React rendering.

### Files to modify

- `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
  - Replace inline theme preset data with imports from `themeLibrary.ts`.
  - Update Theme Library cards to show fit statements, badges, tags, and differentiated preview layouts.
  - Update Builder Studio defaults to use the new theme metadata.
- `exports/dashboard/package.json`
  - Add a test script so the new plan steps can use a stable command instead of ad hoc local commands.
- `exports/dashboard/src/modules/websiteBuilder/websiteBuilderSections.test.ts`
  - Keep untouched unless import changes force a path update. No new behavior should be added here.

## Task 1: Add a repeatable dashboard test command

**Files:**
- Modify: `exports/dashboard/package.json`

- [ ] **Step 1: Write the failing test command expectation**

Document the command we want to exist before touching the package file:

```json
{
  "scripts": {
    "test": "tsx --test \"src/**/*.test.ts\" \"src/**/*.test.tsx\""
  }
}
```

The current file does not expose a `test` script, so later steps would rely on brittle direct commands.

- [ ] **Step 2: Run command to verify it fails today**

Run:

```bash
npm run test
```

Expected:

- `npm ERR! Missing script: "test"`

- [ ] **Step 3: Add the minimal script**

Update `exports/dashboard/package.json` so the scripts block includes:

```json
"scripts": {
  "dev": "vite --port=3000 --host=0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit",
  "test": "tsx --test \"src/**/*.test.ts\" \"src/**/*.test.tsx\""
}
```

- [ ] **Step 4: Run the new script to verify the command exists**

Run:

```bash
npm run test -- --test-name-pattern="websiteBuilderTabs includes the new SEO tab"
```

Expected:

- test runner starts
- the named test passes
- no missing-script error appears

- [ ] **Step 5: Commit**

```bash
git add exports/dashboard/package.json
git commit -m "chore: add dashboard test script"
```

## Task 2: Extract first-wave theme metadata into a dedicated module

**Files:**
- Create: `exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Test: `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`

- [ ] **Step 1: Write the failing metadata test**

Create `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  featuredThemeId,
  firstWaveThemeIds,
  themeLibraryPresets,
  themeOrder,
} from './themeLibrary';

test('themeLibraryPresets defines the approved first-wave lineup', () => {
  assert.deepEqual(firstWaveThemeIds, [
    'luxe-atelier',
    'editorial-veil',
    'campaign-glow',
    'sage-ritual',
  ]);
  assert.equal(featuredThemeId, 'luxe-atelier');
  assert.deepEqual(themeOrder, firstWaveThemeIds);
  assert.equal(themeLibraryPresets.length, 4);
});

test('featured Luxe Atelier is installed and published by default', () => {
  const featured = themeLibraryPresets.find((theme) => theme.id === featuredThemeId);
  assert.ok(featured);
  assert.equal(featured?.status, 'Published');
  assert.equal(featured?.fitLabel, 'Premium Muslimah Boutique');
  assert.equal(featured?.badge, 'Featured');
});

test('every first-wave theme exposes card tags and preview sections', () => {
  for (const theme of themeLibraryPresets) {
    assert.equal(theme.tags.length, 3);
    assert.equal(theme.previewSections.length >= 2, true);
    assert.equal(theme.previewSections.length <= 3, true);
  }
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts
```

Expected:

- failure that `./themeLibrary` cannot be resolved

- [ ] **Step 3: Add the theme metadata module**

Create `exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts`:

```ts
export type ThemeStatus = 'Published' | 'Installed' | 'Draft';
export type ThemeBadge = 'Featured' | 'Best for Muslimah Fashion' | 'Best for Beauty' | 'Promo-first' | 'Minimal';
export type ThemePreviewSection =
  | 'split-hero'
  | 'full-bleed-hero'
  | 'promo-tiles'
  | 'category-bubbles'
  | 'lookbook-row'
  | 'campaign-strip'
  | 'trust-strip';

export interface ThemeLibraryPreview {
  announcement: string;
  heading: string;
  productRow: string[];
}

export interface ThemeLibraryPreset {
  id: string;
  name: string;
  status: ThemeStatus;
  version: string;
  updatedAt: string;
  summary: string;
  styleTag: string;
  accent: string;
  fitLabel: string;
  badge: ThemeBadge;
  tags: [string, string, string];
  previewSections: ThemePreviewSection[];
  preview: ThemeLibraryPreview;
  headerStyle: 'center-brand' | 'left-brand' | 'split-nav';
  navTone: 'light' | 'dark' | 'soft';
  builderProfile: 'luxe' | 'editorial' | 'campaign' | 'beauty';
}

export const firstWaveThemeIds = [
  'luxe-atelier',
  'editorial-veil',
  'campaign-glow',
  'sage-ritual',
] as const;

export const featuredThemeId = 'luxe-atelier';
export const themeOrder = [...firstWaveThemeIds];

export const themeLibraryPresets: ThemeLibraryPreset[] = [
  {
    id: 'luxe-atelier',
    name: 'Luxe Atelier',
    status: 'Published',
    version: 'v1.0.0',
    updatedAt: 'Saved 23 Apr 2026, 7:00 PM',
    summary: 'Premium Muslimah storefront with polished campaign strips, graceful category cards, and a boutique luxury rhythm.',
    styleTag: 'Luxury Atelier',
    accent: '#8a7b6c',
    fitLabel: 'Premium Muslimah Boutique',
    badge: 'Featured',
    tags: ['Soft Taupe', 'Serif Hero', 'Festive Ready'],
    previewSections: ['split-hero', 'campaign-strip', 'lookbook-row'],
    preview: {
      announcement: 'Ramadan capsule now live',
      heading: 'Define Your Grace',
      productRow: ['Abaya', 'Silk Wrap', 'Sandstone Set'],
    },
    headerStyle: 'center-brand',
    navTone: 'soft',
    builderProfile: 'luxe',
  },
  {
    id: 'editorial-veil',
    name: 'Editorial Veil',
    status: 'Installed',
    version: 'v1.0.0',
    updatedAt: 'Saved 23 Apr 2026, 7:00 PM',
    summary: 'Minimal story-led modestwear theme with larger image crops, restrained CTAs, and airy editorial spacing.',
    styleTag: 'Editorial Minimal',
    accent: '#6f6257',
    fitLabel: 'Minimal Story-Led Modestwear',
    badge: 'Minimal',
    tags: ['Lookbook', 'Airy Layout', 'Refined'],
    previewSections: ['full-bleed-hero', 'lookbook-row', 'trust-strip'],
    preview: {
      announcement: 'New arrivals for Eid week',
      heading: 'The Spring Edit',
      productRow: ['Baju Kurung', 'Abaya', 'Hijab'],
    },
    headerStyle: 'left-brand',
    navTone: 'soft',
    builderProfile: 'editorial',
  },
  {
    id: 'campaign-glow',
    name: 'Campaign Glow',
    status: 'Installed',
    version: 'v1.0.0',
    updatedAt: 'Saved 23 Apr 2026, 7:00 PM',
    summary: 'Promo-first fashion template for launches, bundles, and seasonal drops with stronger CTA energy.',
    styleTag: 'Campaign Glow',
    accent: '#d49d4d',
    fitLabel: 'Promo-Driven Fashion Launches',
    badge: 'Promo-first',
    tags: ['Bold CTA', 'Drop Banner', 'Seasonal Sales'],
    previewSections: ['split-hero', 'promo-tiles', 'campaign-strip'],
    preview: {
      announcement: 'New arrival spotlight',
      heading: 'Collection',
      productRow: ['Nude Dress', 'Red Kaftan', 'Lilac Set'],
    },
    headerStyle: 'split-nav',
    navTone: 'light',
    builderProfile: 'campaign',
  },
  {
    id: 'sage-ritual',
    name: 'Sage Ritual',
    status: 'Installed',
    version: 'v1.0.0',
    updatedAt: 'Saved 23 Apr 2026, 7:00 PM',
    summary: 'Clean beauty and skincare storefront with category bubbles, ingredient storytelling, and soft trust-first blocks.',
    styleTag: 'Organic Beauty',
    accent: '#55604a',
    fitLabel: 'Clean Beauty & Skincare',
    badge: 'Best for Beauty',
    tags: ['Organic Palette', 'Trust Blocks', 'Routine Bundles'],
    previewSections: ['full-bleed-hero', 'category-bubbles', 'trust-strip'],
    preview: {
      announcement: 'Your little beauty & cosmetics hub',
      heading: 'Effortless Elegance',
      productRow: ['Night Serum', 'Brightening Oil', 'Starter Pack'],
    },
    headerStyle: 'left-brand',
    navTone: 'light',
    builderProfile: 'beauty',
  },
];
```

- [ ] **Step 4: Wire `WebsiteBuilderModule.tsx` to import the extracted presets**

Replace the current inline preset type/data with imports like:

```ts
import {
  themeLibraryPresets,
  type ThemeLibraryPreset,
} from './themeLibrary';

type ThemePreset = ThemeLibraryPreset;
```

And replace:

```ts
const [themes, setThemes] = useState<ThemePreset[]>(themePresets);
```

with:

```ts
const [themes, setThemes] = useState<ThemePreset[]>(themeLibraryPresets);
```

- [ ] **Step 5: Run tests to verify the extraction passes**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts
```

Expected:

- all tests in `themeLibrary.test.ts` pass

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts \
  exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "refactor: extract website builder theme library presets"
```

## Task 3: Add a view-model layer for theme ordering and status transitions

**Files:**
- Create: `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.ts`
- Create: `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.test.ts`
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`

- [ ] **Step 1: Write the failing view-model tests**

Create `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { themeLibraryPresets } from './themeLibrary';
import {
  buildThemeLibraryCards,
  installThemeById,
  publishThemeById,
} from './themeLibraryViewModel';

test('buildThemeLibraryCards keeps featured theme first', () => {
  const cards = buildThemeLibraryCards(themeLibraryPresets);
  assert.equal(cards[0]?.id, 'luxe-atelier');
  assert.equal(cards[0]?.badge, 'Featured');
});

test('installThemeById promotes draft themes to installed only', () => {
  const seed = themeLibraryPresets.map((theme) =>
    theme.id === 'campaign-glow' ? { ...theme, status: 'Draft' as const } : theme,
  );
  const result = installThemeById(seed, 'campaign-glow');
  assert.equal(result.find((theme) => theme.id === 'campaign-glow')?.status, 'Installed');
  assert.equal(result.find((theme) => theme.id === 'luxe-atelier')?.status, 'Published');
});

test('publishThemeById keeps exactly one published theme', () => {
  const result = publishThemeById(themeLibraryPresets, 'editorial-veil');
  assert.equal(result.filter((theme) => theme.status === 'Published').length, 1);
  assert.equal(result.find((theme) => theme.id === 'editorial-veil')?.status, 'Published');
  assert.equal(result.find((theme) => theme.id === 'luxe-atelier')?.status, 'Installed');
});
```

- [ ] **Step 2: Run the view-model test to verify it fails**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibraryViewModel.test.ts
```

Expected:

- failure because `./themeLibraryViewModel` does not exist

- [ ] **Step 3: Add the helper module**

Create `exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.ts`:

```ts
import { featuredThemeId, themeOrder, type ThemeLibraryPreset } from './themeLibrary';

export interface ThemeLibraryCardModel extends ThemeLibraryPreset {
  isPublished: boolean;
  isInstalled: boolean;
  statusNote: string;
}

export function buildThemeLibraryCards(themes: ThemeLibraryPreset[]): ThemeLibraryCardModel[] {
  const orderIndex = new Map(themeOrder.map((id, index) => [id, index]));
  return [...themes]
    .sort((left, right) => (orderIndex.get(left.id) ?? 999) - (orderIndex.get(right.id) ?? 999))
    .map((theme) => ({
      ...theme,
      isPublished: theme.status === 'Published',
      isInstalled: theme.status !== 'Draft',
      statusNote:
        theme.status === 'Published'
          ? 'This is the current live storefront theme.'
          : theme.status === 'Installed'
            ? 'Installed and ready to customize.'
            : 'Install this theme to start customizing it.',
    }))
    .sort((left, right) => {
      if (left.id === featuredThemeId) return -1;
      if (right.id === featuredThemeId) return 1;
      return 0;
    });
}

export function installThemeById(themes: ThemeLibraryPreset[], id: string): ThemeLibraryPreset[] {
  return themes.map((theme) =>
    theme.id === id && theme.status === 'Draft'
      ? { ...theme, status: 'Installed' }
      : theme,
  );
}

export function publishThemeById(themes: ThemeLibraryPreset[], id: string): ThemeLibraryPreset[] {
  return themes.map((theme) => {
    if (theme.id === id) return { ...theme, status: 'Published' };
    if (theme.status === 'Published') return { ...theme, status: 'Installed' };
    return theme;
  });
}
```

- [ ] **Step 4: Update `WebsiteBuilderModule.tsx` to use the helpers**

Replace local install and publish mapping logic with:

```ts
import {
  buildThemeLibraryCards,
  installThemeById,
  publishThemeById,
} from './themeLibraryViewModel';
```

And update handlers:

```ts
const installTheme = (id: string) => {
  setThemes((current) => installThemeById(current, id));
  const installed = themes.find((theme) => theme.id === id);
  setThemeActionNote(`${installed?.name ?? 'Theme'} is now installed and ready to customize before going live.`);
};

const publishTheme = (id: string) => {
  setThemes((current) => publishThemeById(current, id));
  const nextLive = themes.find((theme) => theme.id === id);
  setThemeActionNote(`${nextLive?.name ?? 'Theme'} is now the live storefront theme. Previous live theme stays installed as a backup draft path.`);
};
```

And in the hub:

```ts
const themeCards = buildThemeLibraryCards(themes);
```

then pass `themeCards` to the theme library panel.

- [ ] **Step 5: Run tests to verify the new helper layer**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibraryViewModel.test.ts src/modules/websiteBuilder/themeLibrary.test.ts
```

Expected:

- both test files pass

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.ts \
  exports/dashboard/src/modules/websiteBuilder/themeLibraryViewModel.test.ts \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "refactor: add website builder theme library view model"
```

## Task 4: Redesign Theme Library cards to show business fit, tags, and differentiated mini storefront previews

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Test: `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`

- [ ] **Step 1: Write the failing card-shape test**

Append to `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`:

```ts
test('card preview sections distinguish first-wave themes', () => {
  const byId = new Map(themeLibraryPresets.map((theme) => [theme.id, theme.previewSections]));
  assert.notDeepEqual(byId.get('luxe-atelier'), byId.get('editorial-veil'));
  assert.notDeepEqual(byId.get('campaign-glow'), byId.get('sage-ritual'));
  assert.deepEqual(byId.get('luxe-atelier'), ['split-hero', 'campaign-strip', 'lookbook-row']);
});
```

- [ ] **Step 2: Run the card-shape test to verify current UI is still behind the data**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts --test-name-pattern="card preview sections distinguish first-wave themes"
```

Expected:

- test may pass on data alone
- visual UI still does not reflect these differences, which is the implementation gap this task closes

- [ ] **Step 3: Update the `ThemePreviewCard` header content**

Inside `ThemePreviewCard` in `WebsiteBuilderModule.tsx`, replace the current title block:

```tsx
<div>
  <p className="text-lg font-semibold text-on-surface">{theme.name}</p>
  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.styleTag}</p>
</div>
```

with:

```tsx
<div>
  <p className="text-lg font-semibold text-on-surface">{theme.name}</p>
  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.styleTag}</p>
  <p className="mt-2 text-sm font-medium text-on-surface">{theme.fitLabel}</p>
</div>
```

and render tags under the summary:

```tsx
<div className="mt-4 flex flex-wrap gap-2">
  {theme.tags.map((tag) => (
    <span
      key={tag}
      className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-medium text-on-surface-variant"
    >
      {tag}
    </span>
  ))}
</div>
```

- [ ] **Step 4: Replace the generic preview body with theme-specific preview blocks**

Add a helper in `WebsiteBuilderModule.tsx` near `ThemePreviewCard`:

```tsx
function ThemePreviewSignature({ theme }: { theme: ThemePreset }) {
  if (theme.id === 'luxe-atelier') {
    return (
      <>
        <div className="grid gap-4 rounded-[28px] border border-black/5 bg-white/90 p-5 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-[180px] rounded-[28px]" style={{ background: `linear-gradient(145deg, ${theme.accent}33, #f8f3ee)` }} />
          <div className="flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-on-surface-variant">ATELIER SERIES</p>
            <h3 className="mt-3 font-serif text-3xl text-on-surface">{theme.preview.heading}</h3>
            <button className="mt-4 w-fit rounded-full px-4 py-2 text-sm text-white" style={{ backgroundColor: theme.accent }}>
              Shop collection
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {theme.preview.productRow.map((item) => (
            <div key={item} className="rounded-2xl bg-white/90 p-3 text-xs text-on-surface shadow-sm">{item}</div>
          ))}
        </div>
      </>
    );
  }
  if (theme.id === 'editorial-veil') {
    return (
      <>
        <div className="min-h-[220px] rounded-[14px] border border-black/5 bg-[linear-gradient(135deg,#f5f0e9,#ffffff)] p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-on-surface-variant">EDITORIAL DROP</p>
          <h3 className="mt-4 max-w-[12ch] font-serif text-4xl text-on-surface">{theme.preview.heading}</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[14px] bg-white/90 p-4 text-xs text-on-surface shadow-sm">Editor note</div>
          <div className="rounded-[14px] bg-white/90 p-4 text-xs text-on-surface shadow-sm">Lookbook row</div>
        </div>
      </>
    );
  }
  if (theme.id === 'campaign-glow') {
    return (
      <>
        <div className="rounded-[24px] border border-black/5 bg-white p-5">
          <span className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#7c2d12]" style={{ backgroundColor: `${theme.accent}55` }}>
            NEW DROP
          </span>
          <h3 className="mt-4 max-w-[10ch] text-4xl font-black text-on-surface">{theme.preview.heading}</h3>
          <div className="mt-4 flex gap-2">
            <button className="rounded-xl px-4 py-2 text-sm text-white" style={{ backgroundColor: theme.accent }}>Shop now</button>
            <button className="rounded-xl border border-outline px-4 py-2 text-sm text-on-surface">Preview sale</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#fff3e3] p-3 text-xs text-on-surface">Bundle</div>
          <div className="rounded-2xl bg-[#fff3e3] p-3 text-xs text-on-surface">Flash sale</div>
          <div className="rounded-2xl bg-[#fff3e3] p-3 text-xs text-on-surface">Drop banner</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="rounded-[24px] border border-black/5 bg-white p-5">
        <h3 className="max-w-[11ch] font-serif text-3xl text-on-surface">{theme.preview.heading}</h3>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {['Skin Care', 'Makeup', 'Hair Care', 'Body Care'].map((item) => (
            <div key={item} className="flex aspect-square items-center justify-center rounded-full bg-[#eef3ea] text-[10px] text-on-surface">
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/90 p-3 text-xs text-on-surface shadow-sm">Special care</div>
        <div className="rounded-2xl bg-white/90 p-3 text-xs text-on-surface shadow-sm">Results</div>
        <div className="rounded-2xl bg-white/90 p-3 text-xs text-on-surface shadow-sm">Bundles</div>
      </div>
    </>
  );
}
```

Then replace the current generic preview block inside `ThemePreviewCard` with:

```tsx
<div className="rounded-[32px] bg-slate-50 p-4">
  <div className="px-4 py-2 text-center text-[11px] text-white" style={{ backgroundColor: theme.accent }}>
    {theme.preview.announcement}
  </div>
  <div className="bg-[linear-gradient(180deg,#eef2ff_0%,#ffffff_100%)] p-4">
    <div className="mb-3 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.name}</div>
    <ThemePreviewSignature theme={theme} />
  </div>
</div>
```

- [ ] **Step 5: Run tests and a production build**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts src/modules/websiteBuilder/themeLibraryViewModel.test.ts
npm run build
```

Expected:

- tests pass
- Vite build succeeds

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx \
  exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts
git commit -m "feat: redesign website builder theme library cards"
```

## Task 5: Align Builder Studio defaults with the four approved theme profiles

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Modify: `exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts`
- Test: `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`

- [ ] **Step 1: Write the failing builder-profile test**

Append to `exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts`:

```ts
test('builder profiles map each first-wave theme to a distinct default rhythm', () => {
  const profiles = new Map(themeLibraryPresets.map((theme) => [theme.id, theme.builderProfile]));
  assert.equal(profiles.get('luxe-atelier'), 'luxe');
  assert.equal(profiles.get('editorial-veil'), 'editorial');
  assert.equal(profiles.get('campaign-glow'), 'campaign');
  assert.equal(profiles.get('sage-ritual'), 'beauty');
});
```

- [ ] **Step 2: Run the metadata test suite**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts
```

Expected:

- if the profile field is already present, this passes
- current builder defaults still need to be remapped from old IDs to the new first-wave IDs

- [ ] **Step 3: Replace legacy theme IDs in builder defaults and theme helpers**

Update `defaultSectionsByTheme` and theme helper branches in `WebsiteBuilderModule.tsx` so they use the new first-wave IDs:

```ts
const defaultSectionsByTheme: Record<string, BuilderSectionItem[]> = {
  'luxe-atelier': [/* keep the current premium modest-fashion defaults */],
  'editorial-veil': [/* keep airy editorial defaults */],
  'campaign-glow': [/* keep promo-heavy defaults */],
  'sage-ritual': [/* use beauty-oriented defaults */],
};
```

Update these branches:

```ts
theme.id === 'luxe-atelier'
theme.id === 'editorial-veil'
theme.id === 'campaign-glow'
theme.id === 'sage-ritual'
```

Specifically replace legacy IDs in:

- `getThemeHeroLayout`
- `getCategoryItems`
- `getProductItems`
- `getTestimonialItems`
- `buttonRadius` selection
- any section-grid conditions inside the storefront preview renderer

- [ ] **Step 4: Add a safe fallback to the featured theme**

Replace:

```ts
defaultSectionsByTheme[theme.id] ?? defaultSectionsByTheme['lumiere-noor']
```

with:

```ts
defaultSectionsByTheme[theme.id] ?? defaultSectionsByTheme['luxe-atelier']
```

And apply the same fallback for the active section state.

- [ ] **Step 5: Run tests and lint**

Run:

```bash
npm run test -- src/modules/websiteBuilder/themeLibrary.test.ts src/modules/websiteBuilder/themeLibraryViewModel.test.ts
npm run lint
```

Expected:

- tests pass
- `tsc --noEmit` passes

- [ ] **Step 6: Commit**

```bash
git add \
  exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx \
  exports/dashboard/src/modules/websiteBuilder/themeLibrary.ts \
  exports/dashboard/src/modules/websiteBuilder/themeLibrary.test.ts
git commit -m "feat: align builder defaults with first-wave theme profiles"
```

## Task 6: Final verification and documentation sync

**Files:**
- Modify: `docs/superpowers/specs/2026-04-23-website-builder-theme-library-design.md` (only if implementation decisions diverged)
- Modify: `docs/superpowers/plans/2026-04-23-website-builder-theme-library-implementation.md` (checkbox updates only if desired)

- [ ] **Step 1: Run the full website builder test slice**

Run:

```bash
npm run test -- src/modules/websiteBuilder/*.test.ts src/moduleRegistry.test.tsx
```

Expected:

- all website builder related tests pass

- [ ] **Step 2: Run full typecheck and build**

Run:

```bash
npm run lint
npm run build
```

Expected:

- no TypeScript errors
- production build succeeds

- [ ] **Step 3: Review UI manually in the dashboard**

Run:

```bash
npm run dev
```

Manual checks:

- Theme Library first row shows four themes in approved order
- Luxe Atelier appears as featured and published
- Each card visibly differs in hero/layout rhythm
- Fit label and tags are readable
- Install and publish actions still work
- Builder Studio loads the right default section flow per theme

- [ ] **Step 4: Update spec only if implementation diverged**

If the final implementation required a small rename or minor behavior adjustment, update the design spec with the exact final wording. If no changes were required, do not edit the spec.

- [ ] **Step 5: Commit final verification changes**

```bash
git add docs/superpowers/specs/2026-04-23-website-builder-theme-library-design.md
git commit -m "docs: sync theme library spec after implementation"
```

Skip this commit if the spec file did not change.

---

## Self-Review

### Spec coverage

- First-wave scope covered in Task 2 through the new approved theme lineup.
- Card differentiation rules covered in Task 4.
- Featured/default install strategy covered in Tasks 2 and 3.
- Builder implications covered in Task 5.
- Verification and regression safety covered in Task 6.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task names exact files and exact commands.
- Each code-editing step includes concrete code or code shapes to insert.

### Type consistency

- Plan uses `ThemeLibraryPreset` as the shared data type.
- Status values stay `Published | Installed | Draft`.
- First-wave IDs stay `luxe-atelier`, `editorial-veil`, `campaign-glow`, `sage-ritual` throughout the plan.
