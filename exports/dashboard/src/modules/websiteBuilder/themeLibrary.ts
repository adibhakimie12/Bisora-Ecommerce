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
