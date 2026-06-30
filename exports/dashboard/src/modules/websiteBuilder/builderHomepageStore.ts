import type { SectionKind } from './builderStudioViewModel';

export type BuilderHomepageAlignment = 'left' | 'center' | 'right';

export interface BuilderHomepageSection {
  id: string;
  kind: SectionKind;
  label: string;
  enabled: boolean;
  content: {
    heading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    image: string;
    imagePreview?: string;
  };
  layout: {
    alignment: BuilderHomepageAlignment;
    spacing: 'tight' | 'comfortable' | 'airy';
    height: 'compact' | 'medium' | 'tall';
  };
  style: {
    backgroundColor: string;
    textColor: string;
    overlay: number;
    imageFit: 'cover' | 'contain';
    imageFocus: 'top' | 'center' | 'bottom';
    imageShape: 'soft-rounded' | 'rounded' | 'sharp';
    backgroundStyle: 'plain' | 'gradient' | 'image';
    backgroundImage?: string;
  };
}

export interface BuilderHomepageState {
  themeId: string;
  sections: BuilderHomepageSection[];
}

const BUILDER_HOMEPAGE_STORAGE_KEY = 'bisora-website-builder-homepage';

function createSection(
  id: string,
  kind: SectionKind,
  label: string,
  content: BuilderHomepageSection['content'],
): BuilderHomepageSection {
  return {
    id,
    kind,
    label,
    enabled: true,
    content,
    layout: {
      alignment: kind === 'footer' ? 'left' : kind === 'promotion-banner' ? 'center' : 'left',
      spacing: 'comfortable',
      height: kind === 'hero' ? 'tall' : 'medium',
    },
    style: {
      backgroundColor: kind === 'promotion-banner' ? '#f7f4ef' : '#ffffff',
      textColor: '#111827',
      overlay: kind === 'hero' ? 20 : 0,
      imageFit: 'cover',
      imageFocus: 'center',
      imageShape: 'rounded',
      backgroundStyle: 'plain',
    },
  };
}

export const defaultHomepageSectionsByTheme: Record<string, BuilderHomepageSection[]> = {
  'luxe-atelier': [
    createSection('luxe-hero', 'hero', 'Luxury Hero', {
      heading: 'Define Your Grace',
      description: 'A refined storefront built to spotlight luxury abaya, premium hijab styling, and graceful first impressions.',
      buttonText: 'Shop The Edit',
      buttonLink: '#/collections/spring-edit',
      image: 'Warm studio portrait with arch shadows',
    }),
    createSection('luxe-categories', 'categories', 'Category Grid', {
      heading: 'Shop By Collection',
      description: 'Guide buyers straight into abaya, hijab, prayer wear, and curated sets.',
      buttonText: 'Browse Collections',
      buttonLink: '#/collections',
      image: 'Four-square category collage',
    }),
    createSection('luxe-featured', 'featured-products', 'Trending Products', {
      heading: 'Trending Pieces',
      description: 'Highlight bestsellers in a clean grid that feels premium, quiet, and easy to scan.',
      buttonText: 'View All Pieces',
      buttonLink: '#/products',
      image: 'Premium product strip',
    }),
    createSection('luxe-story', 'promotion-banner', 'Brand Story Banner', {
      heading: 'Every piece is crafted with the precision of a silent masterpiece.',
      description: 'Use this space for founder story, campaign drop, or craftsmanship message.',
      buttonText: 'Read Our Story',
      buttonLink: '#/pages/about',
      image: 'Muted editorial banner',
    }),
    createSection('luxe-footer', 'footer', 'Footer', {
      heading: 'Luxe Atelier',
      description: 'Contact, policy, shipping, and refined brand notes.',
      buttonText: 'Newsletter Signup',
      buttonLink: '#/newsletter',
      image: 'Footer columns',
    }),
  ],
  'editorial-veil': [
    createSection('editorial-hero', 'hero', 'Editorial Hero', {
      heading: 'The Spring Edit',
      description: 'A serene, premium storefront for quiet luxury modestwear with more breathing room and softer visual hierarchy.',
      buttonText: 'Explore The Edit',
      buttonLink: '#/collections/spring-edit',
      image: 'Soft editorial collage with neutral shadows',
    }),
    createSection('editorial-featured', 'featured-products', 'Curated New Arrivals', {
      heading: 'Currently Trending',
      description: 'Keep the homepage focused on a selective grid so the store feels intentional instead of crowded.',
      buttonText: 'View Collection',
      buttonLink: '#/collections/new-arrivals',
      image: 'Quiet product grid',
    }),
    createSection('editorial-story', 'promotion-banner', 'Editorial Statement', {
      heading: 'Signature pieces designed for modern grace.',
      description: 'Use a calm campaign statement instead of a loud promo block.',
      buttonText: 'Read The Story',
      buttonLink: '#/pages/about',
      image: 'Editorial quote banner',
    }),
    createSection('editorial-footer', 'footer', 'Footer', {
      heading: 'Editorial Veil',
      description: 'Soft, minimal footer with quiet trust-building links.',
      buttonText: 'Join The List',
      buttonLink: '#/newsletter',
      image: 'Minimal footer layout',
    }),
  ],
  'campaign-glow': [
    createSection('campaign-hero', 'hero', 'Campaign Hero', {
      heading: 'Collection',
      description: 'A bold fashion-first homepage with strong campaign moment, big imagery, and quick paths into new drops.',
      buttonText: 'Shop Now',
      buttonLink: '#/collections/new-arrivals',
      image: 'Large campaign photo',
    }),
    createSection('campaign-categories', 'categories', 'Drop Categories', {
      heading: 'Shop The Drop',
      description: 'Fast category jumps for new arrivals, best sellers, and standout looks.',
      buttonText: 'See Categories',
      buttonLink: '#/collections',
      image: 'Fashion category strip',
    }),
    createSection('campaign-featured', 'featured-products', 'New Arrival Grid', {
      heading: 'New Arrival',
      description: 'A stronger product strip that behaves more like a campaign rail than a quiet catalog block.',
      buttonText: 'View All',
      buttonLink: '#/products',
      image: 'Campaign product row',
    }),
    createSection('campaign-footer', 'footer', 'Footer', {
      heading: 'Campaign Glow',
      description: 'Fashion support links and brand follow-up.',
      buttonText: 'Subscribe',
      buttonLink: '#/newsletter',
      image: 'Fashion footer',
    }),
  ],
  'sage-ritual': [
    createSection('sage-hero', 'hero', 'Beauty Hero', {
      heading: 'Your Journey To Effortless Elegance',
      description: 'A calm skincare and beauty storefront built around trust, rituals, and category-led discovery.',
      buttonText: 'Shop Beauty',
      buttonLink: '#/collections/beauty',
      image: 'Clean beauty hero with soft lighting',
    }),
    createSection('sage-categories', 'categories', 'Beauty Categories', {
      heading: 'Shop By Ritual',
      description: 'Guide buyers into skin care, body care, hair care, fragrances, and self-care bundles.',
      buttonText: 'Browse Rituals',
      buttonLink: '#/collections',
      image: 'Circular category bubbles',
    }),
    createSection('sage-featured', 'featured-products', 'Best Sellers', {
      heading: 'Beauty Best Sellers',
      description: 'Showcase skincare heroes in a soft trust-first grid that feels clean and premium.',
      buttonText: 'View Best Sellers',
      buttonLink: '#/products',
      image: 'Skincare product grid',
    }),
    createSection('sage-footer', 'footer', 'Footer', {
      heading: 'Sage Ritual',
      description: 'Customer care, ingredient notes, and beauty support links.',
      buttonText: 'Join The Ritual',
      buttonLink: '#/newsletter',
      image: 'Beauty footer',
    }),
  ],
};

export function getDefaultHomepageSections(themeId: string) {
  return defaultHomepageSectionsByTheme[themeId] ?? defaultHomepageSectionsByTheme['luxe-atelier'];
}

function parseHomepageState(value: string | null): BuilderHomepageState[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadBuilderHomepageState(
  themeId: string,
  storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
): BuilderHomepageState {
  const states = parseHomepageState(storage?.getItem(BUILDER_HOMEPAGE_STORAGE_KEY) ?? null);
  return states.find((state) => state.themeId === themeId) ?? {
    themeId,
    sections: getDefaultHomepageSections(themeId),
  };
}

export function saveBuilderHomepageState(
  state: BuilderHomepageState,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
) {
  if (!storage) return;

  const states = parseHomepageState(storage.getItem(BUILDER_HOMEPAGE_STORAGE_KEY));
  const nextStates = [
    ...states.filter((item) => item.themeId !== state.themeId),
    state,
  ];

  storage.setItem(BUILDER_HOMEPAGE_STORAGE_KEY, JSON.stringify(nextStates));
}
