import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Eye,
  Globe,
  GripVertical,
  ImagePlus,
  Layers3,
  LayoutPanelLeft,
  Monitor,
  MoveDown,
  MoveUp,
  Palette,
  Plus,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import { categories, products } from '../products/data';
import type { BlogPost } from '../storefront/blogStore';
import { loadBlogPosts, saveBlogPosts } from '../storefront/blogStore';

type WebsiteBuilderSection = 'overview' | 'installed-themes' | 'themes' | 'menus' | 'pages' | 'blog' | 'preferences' | 'metafields' | 'customize';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type EditorTab = 'content' | 'layout' | 'style';
type StorePageKey = 'homepage' | 'product' | 'collection' | 'cart';
type BuilderSectionKind = 'hero' | 'categories' | 'featured-products' | 'promotion-banner' | 'testimonials' | 'footer';
type Alignment = 'left' | 'center' | 'right';
type SurfaceTarget = 'header' | 'footer' | 'branding' | 'section';

interface BuilderSectionItem {
  id: string;
  kind: BuilderSectionKind;
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
    alignment: Alignment;
    spacing: 'tight' | 'comfortable' | 'airy';
    height: 'compact' | 'medium' | 'tall';
  };
  style: {
    backgroundColor: string;
    textColor: string;
    overlay: number;
  };
}

interface ThemePreset {
  id: string;
  name: string;
  status: 'Published' | 'Installed' | 'Draft';
  version: string;
  updatedAt: string;
  summary: string;
  styleTag: string;
  accent: string;
  preview: {
    announcement: string;
    heading: string;
    productRow: string[];
  };
  headerStyle: 'center-brand' | 'left-brand' | 'split-nav';
  navTone: 'light' | 'dark' | 'soft';
}

interface HeaderConfig {
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  logoText: string;
  logoImage?: string;
  menuItems: string[];
  searchEnabled: boolean;
  cartEnabled: boolean;
  stickyHeader: boolean;
}

interface FooterConfig {
  brandLine: string;
  newsletterEnabled: boolean;
  newsletterHeading: string;
  columns: Array<{ title: string; links: string[] }>;
  copyright: string;
}

interface BrandingConfig {
  primaryColor: string;
  surfaceColor: string;
  headingFont: string;
  buttonRadius: 'rounded' | 'pill' | 'sharp';
}

const themePresets: ThemePreset[] = [
  {
    id: 'lumiere-noor',
    name: 'Lumiere Noor',
    status: 'Published',
    version: 'v2.4.1',
    updatedAt: 'Saved 22 Apr 2026, 5:10 PM',
    summary: 'Luxury modest-fashion theme built for editorial hero stories, premium product pages, and soft beige conversion flows.',
    styleTag: 'Luxury Atelier',
    accent: '#8a7b6c',
    preview: {
      announcement: 'Ramadan capsule now live',
      heading: 'Define Your Grace',
      productRow: ['Abaya', 'Silk Wrap', 'Sandstone Set'],
    },
    headerStyle: 'center-brand',
    navTone: 'soft',
  },
  {
    id: 'al-nisa-atelier',
    name: 'Al-Nisa Atelier',
    status: 'Installed',
    version: 'v1.8.0',
    updatedAt: 'Saved 22 Apr 2026, 3:48 PM',
    summary: 'Clean artisan storefront for curated abaya, hijab, and capsule collection drops with an airy premium cart flow.',
    styleTag: 'Editorial Minimal',
    accent: '#6f6257',
    preview: {
      announcement: 'New arrivals for Eid week',
      heading: 'The Spring Edit',
      productRow: ['Baju Kurung', 'Abaya', 'Hijab'],
    },
    headerStyle: 'left-brand',
    navTone: 'soft',
  },
  {
    id: 'tampin',
    name: 'Tampin',
    status: 'Installed',
    version: 'v1.6.4',
    updatedAt: 'Saved 21 Apr 2026, 9:14 PM',
    summary: 'Modern fashion template with bold campaign banners and easier drop-focused storytelling.',
    styleTag: 'Campaign Fashion',
    accent: '#d49d4d',
    preview: {
      announcement: 'New arrival spotlight',
      heading: 'Collection',
      productRow: ['Nude Dress', 'Red Kaftan', 'Lilac Set'],
    },
    headerStyle: 'split-nav',
    navTone: 'light',
  },
  {
    id: 'jugra',
    name: 'Jugra',
    status: 'Installed',
    version: 'v1.2.1',
    updatedAt: 'Saved 21 Apr 2026, 6:32 PM',
    summary: 'Warm handcrafted look for heritage and artisan brands that want a cinematic storefront mood.',
    styleTag: 'Warm Heritage',
    accent: '#55604a',
    preview: {
      announcement: 'First purchase 10% off',
      heading: 'Jugra Heritage Series',
      productRow: ['Candle', 'Stone Mug', 'Workshop Set'],
    },
    headerStyle: 'center-brand',
    navTone: 'dark',
  },
  {
    id: 'linggi',
    name: 'Linggi',
    status: 'Draft',
    version: 'v0.9.5',
    updatedAt: 'Saved 20 Apr 2026, 11:42 PM',
    summary: 'Elegant product-grid theme with jewellery and refined giftable catalog presentation.',
    styleTag: 'Refined Grid',
    accent: '#7b7a87',
    preview: {
      announcement: 'Quiet luxury in motion',
      heading: 'Where Deep Heritage Meets Story',
      productRow: ['Diamond Cut', 'Gold Ring', 'Pearl Link'],
    },
    headerStyle: 'center-brand',
    navTone: 'soft',
  },
  {
    id: 'hartamas',
    name: 'Hartamas',
    status: 'Draft',
    version: 'v1.0.0',
    updatedAt: 'Saved 19 Apr 2026, 2:16 PM',
    summary: 'Confidence-first skincare and beauty theme with large campaign cards and soft product storytelling.',
    styleTag: 'Beauty Conversion',
    accent: '#394b8b',
    preview: {
      announcement: 'Texture reset event',
      heading: 'Improve Your Skin Texture',
      productRow: ['Starter Pack', 'Night Serum', 'Brightening Oil'],
    },
    headerStyle: 'left-brand',
    navTone: 'light',
  },
  {
    id: 'solaris',
    name: 'Solaris',
    status: 'Draft',
    version: 'v1.1.0',
    updatedAt: 'Saved 18 Apr 2026, 8:55 PM',
    summary: 'Streetwear and merch layout with stronger headline blocks, campaign tiles, and product-first grid spacing.',
    styleTag: 'Street Drop',
    accent: '#2b2f66',
    preview: {
      announcement: 'New year drop now live',
      heading: 'New Year. New Shirt.',
      productRow: ['Hoodie A', 'Hoodie B', 'Hoodie C'],
    },
    headerStyle: 'split-nav',
    navTone: 'dark',
  },
];

const pageTabs: Array<{ key: WebsiteBuilderSection; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'installed-themes', label: 'Installed Themes' },
  { key: 'themes', label: 'Themes' },
  { key: 'menus', label: 'Menus' },
  { key: 'pages', label: 'Pages' },
  { key: 'blog', label: 'Blog' },
  { key: 'metafields', label: 'Metafields' },
  { key: 'preferences', label: 'Preferences' },
];

const defaultSectionsByTheme: Record<string, BuilderSectionItem[]> = {
  'lumiere-noor': [
    createSection('hero', 'Luxury Hero', {
      heading: 'Define Your Grace',
      description: 'A refined storefront built to spotlight luxury abaya, premium hijab styling, and graceful first impressions.',
      buttonText: 'Shop The Edit',
      buttonLink: '#/collections/spring-edit',
      image: 'Warm studio portrait with arch shadows',
    }),
    createSection('categories', 'Category Grid', {
      heading: 'Shop By Collection',
      description: 'Guide buyers straight into abaya, hijab, prayer wear, and curated sets.',
      buttonText: 'Browse Collections',
      buttonLink: '#/collections',
      image: 'Four-square category collage',
    }),
    createSection('featured-products', 'Trending Products', {
      heading: 'Trending Pieces',
      description: 'Highlight bestsellers in a clean grid that feels premium, quiet, and easy to scan.',
      buttonText: 'View All Pieces',
      buttonLink: '#/products',
      image: 'Premium product strip',
    }),
    createSection('promotion-banner', 'Brand Story Banner', {
      heading: 'Every piece is crafted with the precision of a silent masterpiece.',
      description: 'Use this space for founder story, campaign drop, or craftsmanship message.',
      buttonText: 'Read Our Story',
      buttonLink: '#/pages/about',
      image: 'Muted editorial banner',
    }),
    createSection('testimonials', 'Client Reflections', {
      heading: 'Client Reflections',
      description: 'Add trusted reviews that keep the luxury tone intact while increasing confidence.',
      buttonText: 'See All Reviews',
      buttonLink: '#/reviews',
      image: 'Review card row',
    }),
    createSection('footer', 'Footer', {
      heading: 'Lumiere Noor Atelier',
      description: 'Contact, policy, shipping, and refined brand notes.',
      buttonText: 'Newsletter Signup',
      buttonLink: '#/newsletter',
      image: 'Footer columns',
    }),
  ],
  'al-nisa-atelier': [
    createSection('hero', 'Editorial Hero', {
      heading: 'The Spring Edit',
      description: 'A serene, premium storefront for quiet luxury modestwear with more breathing room and softer visual hierarchy.',
      buttonText: 'Explore The Edit',
      buttonLink: '#/collections/spring-edit',
      image: 'Soft editorial collage with neutral shadows',
    }),
    createSection('featured-products', 'Curated New Arrivals', {
      heading: 'Currently Trending',
      description: 'Keep the homepage focused on a selective grid so the store feels intentional instead of crowded.',
      buttonText: 'View Collection',
      buttonLink: '#/collections/new-arrivals',
      image: 'Quiet product grid',
    }),
    createSection('promotion-banner', 'Editorial Statement', {
      heading: 'Signature pieces designed for modern grace.',
      description: 'Use a calm campaign statement instead of a loud promo block.',
      buttonText: 'Read The Story',
      buttonLink: '#/pages/about',
      image: 'Editorial quote banner',
    }),
    createSection('categories', 'Collection Paths', {
      heading: 'Browse By Atelier Category',
      description: 'Let buyers move from homepage into abaya, hijab, and occasion-based edits.',
      buttonText: 'Shop Categories',
      buttonLink: '#/collections',
      image: 'Editorial category row',
    }),
    createSection('footer', 'Footer', {
      heading: 'Al-Nisa Atelier',
      description: 'Soft, minimal footer with quiet trust-building links.',
      buttonText: 'Join The List',
      buttonLink: '#/newsletter',
      image: 'Minimal footer layout',
    }),
  ],
  tampin: [
    createSection('hero', 'Campaign Hero', {
      heading: 'Collection',
      description: 'A bold fashion-first homepage with strong campaign moment, big imagery, and quick paths into new drops.',
      buttonText: 'Shop Now',
      buttonLink: '#/collections/new-arrivals',
      image: 'Large campaign photo',
    }),
    createSection('categories', 'Drop Categories', {
      heading: 'Shop The Drop',
      description: 'Fast category jumps for new arrivals, best sellers, and standout looks.',
      buttonText: 'See Categories',
      buttonLink: '#/collections',
      image: 'Fashion category strip',
    }),
    createSection('featured-products', 'New Arrival Grid', {
      heading: 'New Arrival',
      description: 'A stronger product strip that behaves more like a campaign rail than a quiet catalog block.',
      buttonText: 'View All',
      buttonLink: '#/products',
      image: 'Campaign product row',
    }),
    createSection('testimonials', 'Social Proof', {
      heading: 'What Buyers Are Loving',
      description: 'Use social proof closer to the campaign flow to keep confidence high.',
      buttonText: 'Read Reviews',
      buttonLink: '#/reviews',
      image: 'Review strip',
    }),
    createSection('footer', 'Footer', {
      heading: 'Tampin Studio',
      description: 'Fashion support links and brand follow-up.',
      buttonText: 'Subscribe',
      buttonLink: '#/newsletter',
      image: 'Fashion footer',
    }),
  ],
};

const sectionLibrary: Array<{ kind: BuilderSectionKind; title: string; note: string }> = [
  { kind: 'hero', title: 'Hero Banner', note: 'Best for first impression, campaign headline, and main CTA.' },
  { kind: 'categories', title: 'Categories', note: 'Guide shoppers into collection paths fast.' },
  { kind: 'featured-products', title: 'Featured Products', note: 'Surface bestsellers, new drops, or premium picks.' },
  { kind: 'promotion-banner', title: 'Promotion Banner', note: 'Good for founder story, campaign, or value proposition.' },
  { kind: 'testimonials', title: 'Testimonials', note: 'Add trust without making the page too heavy.' },
  { kind: 'footer', title: 'Footer', note: 'Keep contact, policy, and newsletter area tidy.' },
];

const pageOptionLabels: Record<StorePageKey, string> = {
  homepage: 'Homepage',
  product: 'Product Page',
  collection: 'Collection Page',
  cart: 'Cart & Checkout',
};

export function WebsiteBuilderModule({
  section,
  subSection,
  themeId,
}: {
  section?: string;
  subSection?: string;
  themeId?: string;
}) {
  const activeSection = normalizeSection(section);
  const [themes, setThemes] = useState<ThemePreset[]>(themePresets);
  const [themeActionNote, setThemeActionNote] = useState<string>('Live theme flow is now active. Seller can install, customize, and publish themes with a clearer storefront state.');
  const publishedTheme = themes.find((theme) => theme.status === 'Published') ?? themes[0];
  const currentTheme = useMemo(
    () => themes.find((theme) => theme.id === (themeId ?? subSection)) ?? publishedTheme,
    [publishedTheme, subSection, themeId, themes],
  );

  const installTheme = (id: string) => {
    setThemes((current) =>
      current.map((theme) =>
        theme.id === id
          ? {
              ...theme,
              status: theme.status === 'Draft' ? 'Installed' : theme.status,
              updatedAt: 'Installed just now',
            }
          : theme,
      ),
    );
    const installed = themes.find((theme) => theme.id === id);
    setThemeActionNote(`${installed?.name ?? 'Theme'} is now installed and ready to customize before going live.`);
  };

  const publishTheme = (id: string) => {
    setThemes((current) =>
      current.map((theme) => {
        if (theme.id === id) {
          return {
            ...theme,
            status: 'Published',
            updatedAt: 'Published just now',
          };
        }

        if (theme.status === 'Published') {
          return {
            ...theme,
            status: 'Installed',
            updatedAt: 'Moved back to installed library',
          };
        }

        return theme;
      }),
    );
    const nextLive = themes.find((theme) => theme.id === id);
    setThemeActionNote(`${nextLive?.name ?? 'Theme'} is now the live storefront theme. Previous live theme stays installed as a backup draft path.`);
  };

  if (activeSection === 'customize') {
    return <BuilderStudio theme={currentTheme} />;
  }

  return (
    <WebsiteBuilderHub
      activeSection={activeSection}
      themes={themes}
      publishedThemeId={publishedTheme.id}
      themeActionNote={themeActionNote}
      onInstallTheme={installTheme}
      onPublishTheme={publishTheme}
    />
  );
}

function WebsiteBuilderHub({
  activeSection,
  themes,
  publishedThemeId,
  themeActionNote,
  onInstallTheme,
  onPublishTheme,
}: {
  activeSection: WebsiteBuilderSection;
  themes: ThemePreset[];
  publishedThemeId: string;
  themeActionNote: string;
  onInstallTheme: (id: string) => void;
  onPublishTheme: (id: string) => void;
}) {
  const installedThemes = themes.filter((theme) => theme.status !== 'Draft');

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Online Store</p>
            <h1 className="text-3xl font-semibold text-on-surface">Website Builder</h1>
            <p className="max-w-3xl text-sm leading-6 text-on-surface-variant">
              Keep the website flow simple for seller: choose a theme, customize sections visually, manage menus and pages,
              then publish. `Frontstore Preview` is only for checking what buyers see after the builder work is ready. `Metafields` stay as advanced store data for richer product or content fields later, not the first place a beginner should touch.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoStatCard title="Installed Themes" value={`${installedThemes.length}`} note="Ready to customize or publish." />
            <InfoStatCard title="Store Pages" value="4" note="Homepage, collection, product, and cart flow." />
            <InfoStatCard title="Builder Mode" value="Live" note="Preview updates instantly while editing." />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">Theme System Status</p>
            <p className="mt-1 text-sm text-emerald-700">{themeActionNote}</p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs text-emerald-800 shadow-sm">
            Live theme: {themes.find((theme) => theme.id === publishedThemeId)?.name}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <GuideCard title="Step 1. Pick a theme" body="Installed Themes and Themes are where seller chooses the closest storefront starting point." />
          <GuideCard title="Step 2. Build here" body="Use Builder Studio to edit text, images, buttons, header, footer, and homepage sections." />
          <GuideCard title="Step 3. Preview after" body="Open Frontstore Preview only to review the buyer-facing result, not to do the main website setup." />
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {pageTabs.map((tab) => (
            <a
              key={tab.key}
              href={`#/website-builder/${tab.key}`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                tab.key === activeSection ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      {activeSection === 'overview' && <OverviewPanel />}
      {activeSection === 'installed-themes' && (
        <InstalledThemesPanel themes={installedThemes} publishedThemeId={publishedThemeId} onPublishTheme={onPublishTheme} />
      )}
      {activeSection === 'themes' && (
        <ThemeLibraryPanel themes={themes} publishedThemeId={publishedThemeId} onInstallTheme={onInstallTheme} onPublishTheme={onPublishTheme} />
      )}
      {activeSection === 'menus' && <MenusPanel />}
      {activeSection === 'pages' && <PagesPanel />}
      {activeSection === 'blog' && <BlogPanel />}
      {activeSection === 'metafields' && <MetafieldsPanel />}
      {activeSection === 'preferences' && <PreferencesPanel />}
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">How this module should work</p>
            <h2 className="mt-2 text-2xl font-semibold text-on-surface">Builder flow that stays beginner-friendly</h2>
          </div>
          <LayoutPanelLeft className="h-5 w-5 text-primary" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GuideCard
            title="1. Installed Themes"
            body="This is the seller's first stop. They see what theme is live, what is draft, and which one to customize."
          />
          <GuideCard
            title="2. Builder Studio"
            body="Customize should open the visual editor directly, not another confusing settings page."
          />
          <GuideCard
            title="3. Menus & Pages"
            body="Menus control header/footer navigation. Pages are store content like About Brand, Contact, or Size Guide."
          />
          <GuideCard
            title="4. Preferences"
            body="Use this for storewide website behavior like featured collection, search visibility, and lightweight storefront preferences."
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleHelp className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-on-surface">What each tab means</h3>
          </div>

          <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
            <QuickMeaning label="Menus" text="Header and footer links. Example: Home, New Arrivals, Abaya, Contact." />
            <QuickMeaning label="Pages" text="Static brand content pages. Example: About Us, Return Policy, Size Guide." />
            <QuickMeaning label="Metafields" text="Advanced custom data fields for products or content. Useful later, not the first thing most sellers need." />
            <QuickMeaning label="Preferences" text="Storefront behavior and website preferences like featured category or privacy/search visibility." />
          </div>
        </div>

        <div className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-on-surface-variant">Recommended seller path</p>
          <ol className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <li>1. Choose or install a theme that matches the brand mood.</li>
            <li>2. Open `Customize` and edit homepage sections, header, footer, and brand settings.</li>
            <li>3. Set menus so storefront navigation makes sense.</li>
            <li>4. Review pages like About, Contact, and policies.</li>
            <li>5. Adjust preferences only after the core storefront is already clear.</li>
            <li>6. Open `Frontstore Preview` only to review what buyers will see live.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function InstalledThemesPanel({
  themes,
  publishedThemeId,
  onPublishTheme,
}: {
  themes: ThemePreset[];
  publishedThemeId: string;
  onPublishTheme: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Installed Themes</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Theme control that should stay simple</h2>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-5">
        <p className="text-sm font-medium text-on-surface">Live storefront rule</p>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Only one theme should be live at a time. Publishing a new theme makes it the storefront buyers see, while the old live theme stays installed so seller can still reuse it later.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {themes.map((theme) => (
          <div key={theme.id} className="rounded-3xl border border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-on-surface">{theme.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs ${theme.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                    {theme.status}
                  </span>
                  {theme.id === publishedThemeId && <span className="rounded-full bg-white px-3 py-1 text-xs text-on-surface shadow-sm">Current Live Theme</span>}
                </div>
                <p className="text-sm text-on-surface-variant">{theme.summary}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">
                  {theme.version} · {theme.updatedAt}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={`#/website-builder/customize/${theme.id}`}
                  className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
                >
                  Customize
                </a>
                {theme.id !== publishedThemeId && (
                  <button
                    type="button"
                    onClick={() => onPublishTheme(theme.id)}
                    className="rounded-full border border-outline-variant/30 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
                  >
                    Publish Live
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemeLibraryPanel({
  themes,
  publishedThemeId,
  onInstallTheme,
  onPublishTheme,
}: {
  themes: ThemePreset[];
  publishedThemeId: string;
  onInstallTheme: (id: string) => void;
  onPublishTheme: (id: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Theme Library</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Templates seller can install before customizing</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
          Theme cards should feel close to the actual frontstore mood. Seller picks the closest starting point, then enters Builder Studio to tune sections and branding.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isPublished={theme.id === publishedThemeId}
            onInstallTheme={onInstallTheme}
            onPublishTheme={onPublishTheme}
          />
        ))}
      </div>
    </section>
  );
}

function MenusPanel() {
  const [menus, setMenus] = useState([
    {
      id: 'primary',
      title: 'Primary Navigation',
      note: 'This powers the main header navigation.',
      items: ['Home', 'New Arrivals', 'Abaya', 'Hijabs', 'Contact'],
    },
    {
      id: 'footer',
      title: 'Footer Quick Links',
      note: 'This keeps support and policy links easy to find.',
      items: ['Shipping', 'Returns', 'Privacy Policy', 'Contact Us'],
    },
  ]);
  const [activeMenuId, setActiveMenuId] = useState('primary');
  const activeMenu = menus.find((menu) => menu.id === activeMenuId) ?? menus[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Menus</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Control what buyers can click in header and footer</h2>

        <div className="mt-6 space-y-4">
          {menus.map((menu) => (
            <MenuCard
              key={menu.id}
              title={menu.title}
              items={menu.items}
              note={menu.note}
              active={menu.id === activeMenuId}
              actionLabel={menu.id === activeMenuId ? 'Editing' : 'Edit Menu'}
              onAction={() => setActiveMenuId(menu.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Menu Editor</p>
            <h3 className="mt-2 text-xl font-semibold text-on-surface">{activeMenu.title}</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              setMenus((current) =>
                current.map((menu) =>
                  menu.id === activeMenu.id ? { ...menu, items: [...menu.items, `New Link ${menu.items.length + 1}`] } : menu,
                ),
              )
            }
            className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
          >
            Add Link
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {activeMenu.items.map((item, index) => (
            <div key={`${activeMenu.id}-${index}`} className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-on-surface shadow-sm">{index + 1}</span>
                <input
                  value={item}
                  onChange={(event) =>
                    setMenus((current) =>
                      current.map((menu) =>
                        menu.id === activeMenu.id
                          ? {
                              ...menu,
                              items: menu.items.map((menuItem, menuIndex) => (menuIndex === index ? event.target.value : menuItem)),
                            }
                          : menu,
                      ),
                    )
                  }
                  className="min-w-0 flex-1 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMenus((current) =>
                      current.map((menu) =>
                        menu.id === activeMenu.id
                          ? { ...menu, items: menu.items.filter((_, menuIndex) => menuIndex !== index) }
                          : menu,
                      ),
                    )
                  }
                  className="rounded-full border border-outline-variant/20 px-3 py-2 text-xs text-on-surface transition-colors hover:bg-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-white p-4">
          <p className="text-sm font-medium text-on-surface">How to think about menus</p>
          <div className="mt-4 space-y-4 text-sm text-on-surface-variant">
            <QuickMeaning label="Header menu" text="Main buyer path into catalog, categories, and key brand pages." />
            <QuickMeaning label="Footer menu" text="Support, policy, contact, and trust-building links." />
            <QuickMeaning label="Builder connection" text="Header builder should use these menu groups, not hardcoded text." />
          </div>
        </div>
      </section>
    </div>
  );
}

function PagesPanel() {
  const [pages, setPages] = useState([
    {
      id: 'about',
      title: 'About The Brand',
      purpose: 'Brand story, trust, mission, and signature aesthetic.',
      status: 'Published',
      seoTitle: 'About Lumiere Noor',
      slug: '/pages/about-the-brand',
    },
    {
      id: 'size-guide',
      title: 'Size Guide',
      purpose: 'Sizing help, fit notes, and buying confidence.',
      status: 'Published',
      seoTitle: 'Size Guide',
      slug: '/pages/size-guide',
    },
    {
      id: 'contact',
      title: 'Contact & Support',
      purpose: 'Store contact methods, support hours, and inquiry form.',
      status: 'Draft',
      seoTitle: 'Contact & Support',
      slug: '/pages/contact',
    },
  ]);
  const [activePageId, setActivePageId] = useState('about');
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Pages</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Store content pages that support the frontstore</h2>

        <div className="mt-6 space-y-4">
          <PageCard title="Homepage" purpose="Main storefront page built inside Builder Studio." status="Managed in Builder" />
          {pages.map((page) => (
            <PageCard
              key={page.id}
              title={page.title}
              purpose={page.purpose}
              status={page.status}
              active={page.id === activePageId}
              actionLabel={page.id === activePageId ? 'Editing' : 'Edit Page'}
              onAction={() => setActivePageId(page.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Page Editor</p>
            <h3 className="mt-2 text-xl font-semibold text-on-surface">{activePage.title}</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              setPages((current) =>
                current.map((page) =>
                  page.id === activePage.id
                    ? { ...page, status: page.status === 'Published' ? 'Draft' : 'Published' }
                    : page,
                ),
              )
            }
            className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
          >
            {activePage.status === 'Published' ? 'Move to Draft' : 'Publish Page'}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <EditorField label="Page Title">
            <input
              value={activePage.title}
              onChange={(event) =>
                setPages((current) =>
                  current.map((page) => (page.id === activePage.id ? { ...page, title: event.target.value } : page)),
                )
              }
              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </EditorField>
          <EditorField label="Purpose / Summary">
            <textarea
              rows={4}
              value={activePage.purpose}
              onChange={(event) =>
                setPages((current) =>
                  current.map((page) => (page.id === activePage.id ? { ...page, purpose: event.target.value } : page)),
                )
              }
              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </EditorField>
          <div className="grid gap-4 md:grid-cols-2">
            <EditorField label="SEO Title">
              <input
                value={activePage.seoTitle}
                onChange={(event) =>
                  setPages((current) =>
                    current.map((page) => (page.id === activePage.id ? { ...page, seoTitle: event.target.value } : page)),
                  )
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </EditorField>
            <EditorField label="Page Slug">
              <input
                value={activePage.slug}
                onChange={(event) =>
                  setPages((current) =>
                    current.map((page) => (page.id === activePage.id ? { ...page, slug: event.target.value } : page)),
                  )
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </EditorField>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium text-on-surface">What pages are for</p>
          <div className="mt-4 space-y-4 text-sm text-on-surface-variant">
            <QuickMeaning label="Homepage" text="The visual storefront landing page that seller customizes section by section." />
            <QuickMeaning label="Brand pages" text="Helpful for story, trust, FAQs, size guide, or contact." />
            <QuickMeaning label="Why separate from themes" text="Themes control layout system. Pages hold the actual storefront content." />
          </div>
        </div>
      </section>
    </div>
  );
}

function BlogPanel() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(loadBlogPosts);
  const [activePostId, setActivePostId] = useState(blogPosts[0]?.id ?? '');
  const activePost = blogPosts.find((post) => post.id === activePostId) ?? blogPosts[0];

  useEffect(() => {
    saveBlogPosts(blogPosts);
  }, [blogPosts]);

  const handleBlogCoverUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePost) {
      return;
    }

    setBlogPosts((current) =>
      current.map((post) =>
        post.id === activePost.id
          ? {
              ...post,
              coverImage: file.name,
              coverImagePreview: URL.createObjectURL(file),
            }
          : post,
      ),
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Blog / Journal</p>
            <h2 className="mt-2 text-2xl font-semibold text-on-surface">Write SEO articles from the seller side, not from preview</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              setBlogPosts((current) => [
                ...current,
                {
                  id: `blog-${Date.now()}`,
                  title: 'New SEO article',
                  status: 'Draft',
                  keyword: 'long tail keyword',
                  summary: 'Use this for organic search, educational content, and category discovery.',
                  coverImage: 'New blog cover',
                  coverImagePreview: categories[0]?.coverUrl,
                },
              ])
            }
            className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
          >
            Add Article
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className={`rounded-2xl border p-4 ${post.id === activePostId ? 'border-primary bg-surface-low shadow-sm' : 'border-outline-variant/20 bg-surface-low'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <img
                    alt={post.title}
                    className="h-24 w-24 rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                    src={post.coverImagePreview ?? categories[0]?.coverUrl}
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-on-surface">{post.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs ${post.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">Primary keyword: {post.keyword}</p>
                    <p className="text-sm leading-6 text-on-surface-variant">{post.summary}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePostId(post.id)}
                  className={`rounded-full px-4 py-2 text-sm ${post.id === activePostId ? 'bg-primary text-on-primary' : 'border border-outline-variant/20 text-on-surface'}`}
                >
                  {post.id === activePostId ? 'Editing' : 'Edit Article'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Article Editor</p>
            <h3 className="mt-2 text-xl font-semibold text-on-surface">{activePost?.title ?? 'Select an article'}</h3>
          </div>
          <a
            href="#/frontend/blog"
            className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
          >
            Open Frontstore Blog Preview
          </a>
        </div>

        {activePost && (
          <>
            <div className="mt-5 space-y-4">
              <EditorField label="Cover Image">
                <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    Upload Blog Cover
                    <input type="file" accept="image/*" onChange={handleBlogCoverUpload} className="hidden" />
                  </label>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-on-surface">{activePost.coverImage}</p>
                      <p className="text-xs text-on-surface-variant">Recommended: 1600×900 or 1200×630 so the blog card and article header both look clean.</p>
                    </div>
                    {activePost.coverImagePreview && (
                      <img
                        src={activePost.coverImagePreview}
                        alt={activePost.title}
                        className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                      />
                    )}
                  </div>
                </div>
              </EditorField>
              <EditorField label="Article Title">
                <input
                  value={activePost.title}
                  onChange={(event) =>
                    setBlogPosts((current) =>
                      current.map((post) => (post.id === activePost.id ? { ...post, title: event.target.value } : post)),
                    )
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>
              <EditorField label="Primary Keyword">
                <input
                  value={activePost.keyword}
                  onChange={(event) =>
                    setBlogPosts((current) =>
                      current.map((post) => (post.id === activePost.id ? { ...post, keyword: event.target.value } : post)),
                    )
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>
              <EditorField label="Summary">
                <textarea
                  rows={5}
                  value={activePost.summary}
                  onChange={(event) =>
                    setBlogPosts((current) =>
                      current.map((post) => (post.id === activePost.id ? { ...post, summary: event.target.value } : post)),
                    )
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setBlogPosts((current) =>
                      current.map((post) =>
                        post.id === activePost.id
                          ? { ...post, status: post.status === 'Published' ? 'Draft' : 'Published' }
                          : post,
                      ),
                    )
                  }
                  className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
                >
                  {activePost.status === 'Published' ? 'Move to Draft' : 'Publish Article'}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium text-on-surface">How this should work</p>
              <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                <p>Seller manages article title, keyword, summary, and cover image here.</p>
                <p>Only `Published` articles should appear in `Frontstore Preview {'>'} Blog / Journal`.</p>
                <p>This keeps blog flow consistent with the product model: builder edits, preview reviews.</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MetafieldsPanel() {
  const [metafields, setMetafields] = useState([
    { id: 'fabric-note', title: 'Product fabric note', scope: 'Product', type: 'Single line text', status: 'Active' },
    { id: 'model-sizing', title: 'Model sizing block', scope: 'Product', type: 'Rich text', status: 'Active' },
    { id: 'editorial-quote', title: 'Editorial quote', scope: 'Page', type: 'Multi-line text', status: 'Draft' },
  ]);
  const [newFieldName, setNewFieldName] = useState('');

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Metafields</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Advanced custom store data, not a beginner tab</h2>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Most sellers can ignore this at first. Metafields are useful when the brand needs extra custom data beyond normal product title, price, image, and description.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GuideCard title="Product fabric note" body="Example: satin blend, care instructions, or modest coverage note." />
          <GuideCard title="Model sizing block" body="Example: model height, size worn, or fit guidance." />
          <GuideCard title="Editorial quote" body="Example: premium collection quote or campaign note used inside theme blocks." />
          <GuideCard title="Icon-based trust row" body="Example: halal-certified, handmade, or local atelier proof points." />
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-on-surface">Custom field registry</p>
              <p className="mt-1 text-sm text-on-surface-variant">Good for advanced product storytelling later.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {metafields.map((field) => (
              <div key={field.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-on-surface">{field.title}</p>
                  <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">{field.scope}</span>
                  <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">{field.type}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${field.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{field.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={newFieldName}
              onChange={(event) => setNewFieldName(event.target.value)}
              placeholder="New metafield name"
              className="min-w-0 flex-1 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => {
                if (!newFieldName.trim()) return;
                setMetafields((current) => [
                  ...current,
                  {
                    id: `custom-${Date.now()}`,
                    title: newFieldName.trim(),
                    scope: 'Product',
                    type: 'Single line text',
                    status: 'Draft',
                  },
                ]);
                setNewFieldName('');
              }}
              className="rounded-full bg-primary px-4 py-3 text-sm text-on-primary transition-colors hover:bg-primary-dim"
            >
              Add Field
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Bisora recommendation</p>
        <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
          <QuickMeaning label="Beginner seller" text="Ignore metafields until the storefront basics are already live." />
          <QuickMeaning label="Growing brand" text="Use metafields when products need richer content blocks inside premium themes." />
          <QuickMeaning label="Developer or agency" text="Metafields become useful when custom product storytelling is part of the build." />
        </div>
      </section>
    </div>
  );
}

function PreferencesPanel() {
  const [preferences, setPreferences] = useState({
    featuredCategory: 'Spring Edit',
    recentSalesPopup: false,
    popupNameMode: 'First name + city',
    searchVisibility: true,
    maintenanceMode: false,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Preferences</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Website-level behavior and storefront defaults</h2>

        <div className="mt-6 space-y-5">
          <EditorField label="Featured Category">
            <select
              value={preferences.featuredCategory}
              onChange={(event) => setPreferences((current) => ({ ...current, featuredCategory: event.target.value }))}
              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="Spring Edit">Spring Edit</option>
              <option value="New Arrivals">New Arrivals</option>
              <option value="Signature Abayas">Signature Abayas</option>
            </select>
          </EditorField>

          <ToggleRow
            label="Recent Sales Popup"
            description="Optional social-proof behavior. Keep it off unless it suits the brand tone."
            checked={preferences.recentSalesPopup}
            onToggle={() => setPreferences((current) => ({ ...current, recentSalesPopup: !current.recentSalesPopup }))}
          />

          {preferences.recentSalesPopup && (
            <EditorField label="Popup Privacy Display">
              <select
                value={preferences.popupNameMode}
                onChange={(event) => setPreferences((current) => ({ ...current, popupNameMode: event.target.value }))}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="First name + city">First name + city</option>
                <option value="Initial + state">Initial + state</option>
                <option value="Anonymous buyer">Anonymous buyer</option>
              </select>
            </EditorField>
          )}

          <ToggleRow
            label="Visible to Search Engines"
            description="Hide only when the store is not ready for public discovery."
            checked={preferences.searchVisibility}
            onToggle={() => setPreferences((current) => ({ ...current, searchVisibility: !current.searchVisibility }))}
          />

          <ToggleRow
            label="Maintenance Mode"
            description="Use only when seller wants to temporarily hide storefront while rebuilding or fixing something major."
            checked={preferences.maintenanceMode}
            onToggle={() => setPreferences((current) => ({ ...current, maintenanceMode: !current.maintenanceMode }))}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">What belongs here</p>
        <div className="mt-5 space-y-5">
          <PreferenceCard title="Featured Category" value={preferences.featuredCategory} note="Used by themes that surface a default featured collection block." />
          <PreferenceCard title="Recent Sales Popup" value={preferences.recentSalesPopup ? 'On' : 'Off'} note="Optional social-proof behavior. Keep it off unless it suits the brand tone." />
          <PreferenceCard title="Search Engine Visibility" value={preferences.searchVisibility ? 'Visible' : 'Hidden'} note="Hide only when store is not ready for public discovery." />
          <PreferenceCard title="Maintenance Mode" value={preferences.maintenanceMode ? 'On' : 'Off'} note="Temporary storefront lock while seller is rebuilding or fixing the store." />
        </div>

        <div className="mt-6 space-y-4 text-sm text-on-surface-variant">
          <QuickMeaning label="Storewide preferences" text="Defaults that affect how the storefront behaves overall." />
          <QuickMeaning label="Not section editing" text="If something changes one homepage block only, it belongs in Builder Studio, not Preferences." />
          <QuickMeaning label="Not developer setup" text="Search visibility or featured category lives here, but analytics and code scripts stay in Integrations." />
        </div>
      </section>
    </div>
  );
}

function BuilderStudio({ theme }: { theme: ThemePreset }) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [editorTab, setEditorTab] = useState<EditorTab>('content');
  const [storePage, setStorePage] = useState<StorePageKey>('homepage');
  const [sections, setSections] = useState<BuilderSectionItem[]>(defaultSectionsByTheme[theme.id] ?? defaultSectionsByTheme['lumiere-noor']);
  const [activeSectionId, setActiveSectionId] = useState<string>((defaultSectionsByTheme[theme.id] ?? defaultSectionsByTheme['lumiere-noor'])[0].id);
  const [activeSurface, setActiveSurface] = useState<SurfaceTarget>('section');
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    announcementEnabled: true,
    announcementText: theme.preview.announcement,
    announcementLink: '#/collections/new',
    logoText: theme.name,
    menuItems: ['Home', 'Collections', 'New Arrivals', 'Contact'],
    searchEnabled: true,
    cartEnabled: true,
    stickyHeader: true,
  });
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    brandLine: `${theme.name} Atelier`,
    newsletterEnabled: true,
    newsletterHeading: 'Join the private list for new drops and signature edits.',
    columns: [
      { title: 'Shop', links: ['New Arrivals', 'Collections', 'Best Sellers'] },
      { title: 'Support', links: ['Shipping', 'Returns', 'Contact'] },
      { title: 'About', links: ['Brand Story', 'Journal', 'Policies'] },
    ],
    copyright: `© 2026 ${theme.name}. All rights reserved.`,
  });
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    primaryColor: theme.accent,
    surfaceColor: '#f8f6f1',
    headingFont: theme.styleTag,
    buttonRadius: theme.id === 'solaris' ? 'sharp' : theme.id === 'tampin' ? 'rounded' : 'pill',
  });

  const activeSection = sections.find((item) => item.id === activeSectionId) ?? sections[0];

  const handleSectionImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    updateNestedSection('content', {
      image: file.name,
      imagePreview: URL.createObjectURL(file),
    });
  };

  const handleHeaderLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setHeaderConfig((current) => ({
      ...current,
      logoImage: URL.createObjectURL(file),
      logoText: current.logoText || file.name.replace(/\.[^.]+$/, ''),
    }));
  };

  const canvasWidthClass =
    device === 'desktop' ? 'max-w-[1180px]' : device === 'tablet' ? 'max-w-[820px]' : 'max-w-[390px]';

  const updateSection = (patch: Partial<BuilderSectionItem>) => {
    setSections((current) =>
      current.map((item) => (item.id === activeSection.id ? { ...item, ...patch } : item)),
    );
  };

  const updateNestedSection = <T extends 'content' | 'layout' | 'style'>(
    key: T,
    patch: Partial<BuilderSectionItem[T]>,
  ) => {
    setSections((current) =>
      current.map((item) =>
        item.id === activeSection.id
          ? {
              ...item,
              [key]: {
                ...item[key],
                ...patch,
              },
            }
          : item,
      ),
    );
  };

  const sectionGuidance = getSectionGuidance(activeSection.kind);
  const quickEditSectionLabel =
    activeSurface === 'section'
      ? activeSection.label
      : activeSurface === 'header'
        ? 'Header & Navigation'
        : activeSurface === 'footer'
          ? 'Footer Builder'
          : 'Branding';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <a
          href="#/website-builder/installed-themes"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-white px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Installed Themes
        </a>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Seller should build here first, then review in Frontstore Preview</div>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-outline-variant/20 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">{theme.styleTag}</p>
            <h1 className="mt-1 text-3xl font-semibold text-on-surface">{theme.name} Builder Studio</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={storePage}
              onChange={(event) => setStorePage(event.target.value as StorePageKey)}
              className="rounded-full border border-outline-variant/20 bg-white px-4 py-2 text-sm outline-none"
            >
              {Object.entries(pageOptionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-full border border-outline-variant/20 bg-surface-low p-1">
              <DeviceButton active={device === 'desktop'} onClick={() => setDevice('desktop')} icon={<Monitor className="h-4 w-4" />} />
              <DeviceButton active={device === 'tablet'} onClick={() => setDevice('tablet')} icon={<Tablet className="h-4 w-4" />} />
              <DeviceButton active={device === 'mobile'} onClick={() => setDevice('mobile')} icon={<Smartphone className="h-4 w-4" />} />
            </div>

            <button className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button className="rounded-full bg-primary px-5 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim">
              Save Theme
            </button>
          </div>
        </div>

        <div className="grid min-h-[780px] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="border-r border-outline-variant/20 bg-surface-lowest p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Sections</p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">Page outline</h2>
              </div>
              <button className="rounded-full bg-primary px-3 py-1.5 text-xs text-on-primary">Add Section</button>
            </div>

            <div className="space-y-3">
              <BuilderSurfaceButton
                active={activeSurface === 'header'}
                title="Header & Navigation"
                note="Logo, announcement, menu links, and utility icons."
                onClick={() => setActiveSurface('header')}
              />
              <BuilderSurfaceButton
                active={activeSurface === 'branding'}
                title="Branding"
                note="Global color, button feel, and storefront visual tone."
                onClick={() => setActiveSurface('branding')}
              />
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setActiveSurface('section');
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    section.id === activeSectionId && activeSurface === 'section'
                      ? 'border-primary bg-surface-low shadow-sm'
                      : 'border-outline-variant/20 bg-white hover:bg-surface-low'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="mt-1 h-4 w-4 text-on-surface-variant" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-on-surface">{section.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${section.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {section.enabled ? 'On' : 'Hidden'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">{section.kind.replace('-', ' ')}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MiniIconButton label="Up" disabled={index === 0} onClick={() => moveArrayItem(setSections, sections, index, 'up')} icon={<MoveUp className="h-3.5 w-3.5" />} />
                    <MiniIconButton
                      label="Down"
                      disabled={index === sections.length - 1}
                      onClick={() => moveArrayItem(setSections, sections, index, 'down')}
                      icon={<MoveDown className="h-3.5 w-3.5" />}
                    />
                    <MiniIconButton
                      label={section.enabled ? 'Hide' : 'Show'}
                      onClick={() => setSections((current) => current.map((item) => (item.id === section.id ? { ...item, enabled: !item.enabled } : item)))}
                      icon={<Eye className="h-3.5 w-3.5" />}
                    />
                    <MiniIconButton
                      label="Duplicate"
                      onClick={() => duplicateSection(setSections, sections, section)}
                      icon={<Layers3 className="h-3.5 w-3.5" />}
                    />
                    <MiniIconButton
                      label="Delete"
                      onClick={() => removeSection(setSections, sections, section.id, activeSectionId, setActiveSectionId)}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    />
                  </div>
                </button>
              ))}
              <BuilderSurfaceButton
                active={activeSurface === 'footer'}
                title="Footer Builder"
                note="Link columns, newsletter, and trust/support links."
                onClick={() => setActiveSurface('footer')}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
              <p className="text-sm font-medium text-on-surface">Section Library</p>
              <div className="mt-3 space-y-2">
                {sectionLibrary.map((item) => (
                  <button
                    key={item.kind}
                    onClick={() => addSection(setSections, item.kind, setActiveSectionId)}
                    className="flex w-full items-center justify-between rounded-xl bg-surface-low px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <span>{item.title}</span>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="bg-surface p-4 sm:p-6">
            <div className={`mx-auto overflow-hidden rounded-[26px] border border-outline-variant/20 bg-white shadow-sm transition-all ${canvasWidthClass}`}>
                <div className="border-b border-outline-variant/20 bg-surface-low px-5 py-3 text-sm text-on-surface-variant">
                {pageOptionLabels[storePage]} preview · {device}
              </div>

              <div className="space-y-0" style={{ backgroundColor: brandingConfig.surfaceColor }}>
                <PreviewHeader
                  theme={theme}
                  config={headerConfig}
                  branding={brandingConfig}
                  active={activeSurface === 'header'}
                  onSelect={() => setActiveSurface('header')}
                  device={device}
                  onQuickEdit={(tab) => {
                    setActiveSurface('header');
                    setEditorTab(tab);
                  }}
                />
                {sections.filter((section) => section.enabled).map((section) => (
                  <PreviewSection
                    key={section.id}
                    theme={theme}
                    section={section}
                    accent={brandingConfig.primaryColor}
                    active={section.id === activeSectionId && activeSurface === 'section'}
                    onSelect={() => {
                      setActiveSectionId(section.id);
                      setActiveSurface('section');
                    }}
                    buttonRadius={brandingConfig.buttonRadius}
                    device={device}
                    onQuickEdit={(tab) => {
                      setActiveSectionId(section.id);
                      setActiveSurface('section');
                      setEditorTab(tab);
                    }}
                  />
                ))}
                <PreviewFooter
                  config={footerConfig}
                  branding={brandingConfig}
                  active={activeSurface === 'footer'}
                  onSelect={() => setActiveSurface('footer')}
                  onQuickEdit={(tab) => {
                    setActiveSurface('footer');
                    setEditorTab(tab);
                  }}
                />
              </div>
            </div>
          </div>

          <aside className="border-l border-outline-variant/20 bg-surface-lowest p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Section Editor</p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">{quickEditSectionLabel}</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">Real-time</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['content', 'layout', 'style'] as EditorTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEditorTab(tab)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    editorTab === tab ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {capitalize(tab)}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-5">
              {activeSurface === 'section' && editorTab === 'content' && (
                <>
                  <EditorField label="Heading">
                    <input
                      value={activeSection.content.heading}
                      onChange={(event) => updateNestedSection('content', { heading: event.target.value })}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Description">
                    <textarea
                      value={activeSection.content.description}
                      onChange={(event) => updateNestedSection('content', { description: event.target.value })}
                      rows={4}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <EditorField label="Button Text">
                      <input
                        value={activeSection.content.buttonText}
                        onChange={(event) => updateNestedSection('content', { buttonText: event.target.value })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </EditorField>
                    <EditorField label="Button Link">
                      <input
                        value={activeSection.content.buttonLink}
                        onChange={(event) => updateNestedSection('content', { buttonLink: event.target.value })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </EditorField>
                  </div>
                  <EditorField label="Image Asset">
                    <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                        <ImagePlus className="h-4 w-4 text-primary" />
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handleSectionImageUpload} className="hidden" />
                      </label>
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-on-surface">{activeSection.content.image}</p>
                          <p className="text-xs text-on-surface-variant">
                            Recommended: hero 1920×1080, collection tile 1200×1200, keep under 300KB when possible.
                            {activeSection.kind === 'featured-products'
                              ? ' For product grids, product thumbnails should still come from the catalog. This upload is only for a custom section visual.'
                              : ''}
                          </p>
                        </div>
                        {activeSection.content.imagePreview && (
                          <img
                            src={activeSection.content.imagePreview}
                            alt={activeSection.content.image}
                            className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                          />
                        )}
                      </div>
                      {activeSection.content.imagePreview && (
                        <button
                          type="button"
                          onClick={() => updateNestedSection('content', { imagePreview: undefined })}
                          className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-low"
                        >
                          Remove Photo Preview
                        </button>
                      )}
                    </div>
                  </EditorField>
                  {(activeSection.kind === 'featured-products' || activeSection.kind === 'categories') && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                      <p className="text-sm font-medium text-amber-900">Where to edit images for this section</p>
                      <div className="mt-2 space-y-2 text-sm text-amber-800">
                        {activeSection.kind === 'featured-products' && (
                          <>
                            <p>This grid should use real product photos from your catalog. The upload above is only for an optional custom section visual.</p>
                            <a
                              href="#/products"
                              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs text-on-surface shadow-sm transition-colors hover:bg-surface-low"
                            >
                              Open Products
                            </a>
                          </>
                        )}
                        {activeSection.kind === 'categories' && (
                          <>
                            <p>This row should use real category cover images. The upload above is only for an optional editorial visual, not the main category source.</p>
                            <a
                              href="#/products/categories"
                              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs text-on-surface shadow-sm transition-colors hover:bg-surface-low"
                            >
                              Open Categories
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                    <p className="text-sm font-medium text-on-surface">Why this section exists</p>
                    <p className="mt-2 text-sm text-on-surface-variant">{sectionGuidance}</p>
                  </div>
                </>
              )}

              {activeSurface === 'section' && editorTab === 'layout' && (
                <>
                  <EditorField label="Alignment">
                    <select
                      value={activeSection.layout.alignment}
                      onChange={(event) => updateNestedSection('layout', { alignment: event.target.value as Alignment })}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </EditorField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <EditorField label="Spacing">
                      <select
                        value={activeSection.layout.spacing}
                        onChange={(event) => updateNestedSection('layout', { spacing: event.target.value as BuilderSectionItem['layout']['spacing'] })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="tight">Tight</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="airy">Airy</option>
                      </select>
                    </EditorField>
                    <EditorField label="Height">
                      <select
                        value={activeSection.layout.height}
                        onChange={(event) => updateNestedSection('layout', { height: event.target.value as BuilderSectionItem['layout']['height'] })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="compact">Compact</option>
                        <option value="medium">Medium</option>
                        <option value="tall">Tall</option>
                      </select>
                    </EditorField>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 text-sm text-on-surface-variant">
                    Seller-friendly rule: layout controls should stay simple. Let seller change alignment, section height, and spacing without turning this into a developer panel.
                  </div>
                </>
              )}

              {activeSurface === 'section' && editorTab === 'style' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <EditorField label="Background Color">
                      <input
                        value={activeSection.style.backgroundColor}
                        onChange={(event) => updateNestedSection('style', { backgroundColor: event.target.value })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </EditorField>
                    <EditorField label="Text Color">
                      <input
                        value={activeSection.style.textColor}
                        onChange={(event) => updateNestedSection('style', { textColor: event.target.value })}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </EditorField>
                  </div>
                  <EditorField label="Overlay Strength">
                    <input
                      type="range"
                      min={0}
                      max={70}
                      value={activeSection.style.overlay}
                      onChange={(event) => updateNestedSection('style', { overlay: Number(event.target.value) })}
                      className="w-full accent-primary"
                    />
                  </EditorField>
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-on-surface">Image Guidelines</p>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                      <p>Hero Banner: 1920 × 1080 · max 300KB</p>
                      <p>Category Image: 800 × 800</p>
                      <p>Product Image: 1000 × 1000 · max 200KB</p>
                      <p>Thumbnail: 500 × 500</p>
                    </div>
                  </div>
                </>
              )}

              {activeSurface === 'header' && (
                <>
                  <EditorField label="Logo Upload">
                    <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                        <ImagePlus className="h-4 w-4 text-primary" />
                        Upload Logo
                        <input type="file" accept="image/*" onChange={handleHeaderLogoUpload} className="hidden" />
                      </label>
                      <p className="text-xs text-on-surface-variant">Recommended: transparent PNG or SVG-style logo, around 320×120 for clean header display.</p>
                      {headerConfig.logoImage && (
                        <div className="flex items-center gap-3 rounded-2xl bg-surface-low p-3">
                          <img src={headerConfig.logoImage} alt="Store logo" className="h-12 w-auto max-w-[160px] object-contain" />
                          <button
                            type="button"
                            onClick={() => setHeaderConfig((current) => ({ ...current, logoImage: undefined }))}
                            className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-white"
                          >
                            Remove Logo
                          </button>
                        </div>
                      )}
                    </div>
                  </EditorField>
                  <EditorField label="Logo Text">
                    <input
                      value={headerConfig.logoText}
                      onChange={(event) => setHeaderConfig((current) => ({ ...current, logoText: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Announcement Text">
                    <input
                      value={headerConfig.announcementText}
                      onChange={(event) => setHeaderConfig((current) => ({ ...current, announcementText: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Announcement Link">
                    <input
                      value={headerConfig.announcementLink}
                      onChange={(event) => setHeaderConfig((current) => ({ ...current, announcementLink: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Menu Items">
                    <div className="space-y-2">
                      {headerConfig.menuItems.map((item, index) => (
                        <input
                          key={`${item}-${index}`}
                          value={item}
                          onChange={(event) =>
                            setHeaderConfig((current) => ({
                              ...current,
                              menuItems: current.menuItems.map((menuItem, menuIndex) =>
                                menuIndex === index ? event.target.value : menuItem,
                              ),
                            }))
                          }
                          className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      ))}
                    </div>
                  </EditorField>
                  <ToggleRow
                    label="Announcement Bar"
                    description="Useful for campaign drops, shipping note, or first-purchase offer."
                    checked={headerConfig.announcementEnabled}
                    onToggle={() => setHeaderConfig((current) => ({ ...current, announcementEnabled: !current.announcementEnabled }))}
                  />
                  <ToggleRow
                    label="Search Icon"
                    description="Keep on for larger catalogs. Optional for small curated storefronts."
                    checked={headerConfig.searchEnabled}
                    onToggle={() => setHeaderConfig((current) => ({ ...current, searchEnabled: !current.searchEnabled }))}
                  />
                  <ToggleRow
                    label="Cart Icon"
                    description="Should normally stay on for ecommerce storefronts."
                    checked={headerConfig.cartEnabled}
                    onToggle={() => setHeaderConfig((current) => ({ ...current, cartEnabled: !current.cartEnabled }))}
                  />
                  <ToggleRow
                    label="Sticky Header"
                    description="Helps buyers keep navigation visible while scrolling."
                    checked={headerConfig.stickyHeader}
                    onToggle={() => setHeaderConfig((current) => ({ ...current, stickyHeader: !current.stickyHeader }))}
                  />
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 text-sm text-on-surface-variant">
                    Theme header style for <span className="font-medium text-on-surface">{theme.name}</span>: {getHeaderStyleLabel(theme.headerStyle)}. This is where theme differences should start becoming visible.
                  </div>
                </>
              )}

              {activeSurface === 'footer' && (
                <>
                  <EditorField label="Brand Line">
                    <input
                      value={footerConfig.brandLine}
                      onChange={(event) => setFooterConfig((current) => ({ ...current, brandLine: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Newsletter Heading">
                    <textarea
                      value={footerConfig.newsletterHeading}
                      onChange={(event) => setFooterConfig((current) => ({ ...current, newsletterHeading: event.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  {footerConfig.columns.map((column, index) => (
                    <div key={column.title} className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                      <p className="text-sm font-medium text-on-surface">{column.title}</p>
                      <div className="mt-3 space-y-2">
                        {column.links.map((link, linkIndex) => (
                          <input
                            key={`${column.title}-${linkIndex}`}
                            value={link}
                            onChange={(event) =>
                              setFooterConfig((current) => ({
                                ...current,
                                columns: current.columns.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        links: item.links.map((existingLink, existingLinkIndex) =>
                                          existingLinkIndex === linkIndex ? event.target.value : existingLink,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                            className="w-full rounded-2xl border border-outline-variant/20 bg-surface-low px-4 py-3 text-sm outline-none focus:border-primary"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <ToggleRow
                    label="Newsletter Sign-up"
                    description="Good for growing audience and launch reminders."
                    checked={footerConfig.newsletterEnabled}
                    onToggle={() => setFooterConfig((current) => ({ ...current, newsletterEnabled: !current.newsletterEnabled }))}
                  />
                </>
              )}

              {activeSurface === 'branding' && (
                <>
                  <EditorField label="Primary Accent Color">
                    <input
                      value={brandingConfig.primaryColor}
                      onChange={(event) => setBrandingConfig((current) => ({ ...current, primaryColor: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Canvas Surface Color">
                    <input
                      value={brandingConfig.surfaceColor}
                      onChange={(event) => setBrandingConfig((current) => ({ ...current, surfaceColor: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Heading Direction">
                    <input
                      value={brandingConfig.headingFont}
                      onChange={(event) => setBrandingConfig((current) => ({ ...current, headingFont: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Button Shape">
                    <select
                      value={brandingConfig.buttonRadius}
                      onChange={(event) =>
                        setBrandingConfig((current) => ({
                          ...current,
                          buttonRadius: event.target.value as BrandingConfig['buttonRadius'],
                        }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="pill">Pill</option>
                      <option value="rounded">Rounded</option>
                      <option value="sharp">Sharp</option>
                    </select>
                  </EditorField>
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 text-sm text-on-surface-variant">
                    Branding here should affect the whole theme feel. Section-level styling still happens per block, but this panel sets the visual direction seller sees across header, buttons, and overall storefront tone.
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-medium text-on-surface">Quick edit expectation</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Seller should be able to click header, footer, branding, or a section on preview, then edit from this panel without hunting through multiple deep menus.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-low p-4">
              <p className="text-sm font-medium text-on-surface">Quick edit now active</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Click any live area on preview, then use quick-edit pills on that area to jump straight into `{quickEditSectionLabel}` content, layout, or style.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-medium text-on-surface">Image editing rule</p>
              <div className="mt-2 space-y-2 text-sm text-on-surface-variant">
                <p>`Website Builder` is for hero, banner, editorial, and section-level visuals.</p>
                <p>`Products` is where seller should change actual product photos.</p>
                <p>`Categories` is where seller should change collection cover images.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function BuilderSurfaceButton({
  active,
  title,
  note,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        active ? 'border-primary bg-surface-low shadow-sm' : 'border-outline-variant/20 bg-white hover:bg-surface-low'
      }`}
    >
      <p className="text-sm font-medium text-on-surface">{title}</p>
      <p className="mt-1 text-xs leading-5 text-on-surface-variant">{note}</p>
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-3 rounded-2xl border border-outline-variant/20 bg-white p-4 text-left"
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
          checked ? 'bg-primary justify-end' : 'bg-surface-container justify-start'
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
      <span>
        <span className="block text-sm font-medium text-on-surface">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-on-surface-variant">{description}</span>
      </span>
    </button>
  );
}

function PreviewHeader({
  theme,
  config,
  branding,
  active,
  onSelect,
  device,
  onQuickEdit,
}: {
  theme: ThemePreset;
  config: HeaderConfig;
  branding: BrandingConfig;
  active: boolean;
  onSelect: () => void;
  device: DeviceMode;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  const toneClasses =
    theme.navTone === 'dark'
      ? 'bg-[#171717] text-white'
      : theme.navTone === 'soft'
        ? 'bg-[#faf7f2] text-on-surface'
        : 'bg-white text-on-surface';

  return (
    <header
      onClick={onSelect}
      className={`group relative border-b border-outline-variant/15 transition-all ${active ? 'ring-2 ring-inset ring-primary' : 'hover:bg-surface-low/40'}`}
    >
      <QuickEditOverlay active={active} onQuickEdit={onQuickEdit} />
      {config.announcementEnabled && (
        <div className="px-5 py-2 text-center text-xs text-white" style={{ backgroundColor: branding.primaryColor }}>
          {config.announcementText}
        </div>
      )}

      <div className={`px-6 py-5 ${toneClasses}`}>
        {theme.headerStyle === 'center-brand' && (
          <div className={`grid items-center gap-4 ${device === 'mobile' ? 'grid-cols-1 text-center' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
            <nav className={`flex gap-5 text-sm ${device === 'mobile' ? 'justify-center flex-wrap order-2' : ''}`}>
              {config.menuItems.slice(0, 2).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </nav>
            <HeaderLogoMark config={config} />
            <div className={`flex gap-4 text-sm ${device === 'mobile' ? 'justify-center order-3' : 'justify-end'}`}>
              {config.searchEnabled && <span>Search</span>}
              {config.cartEnabled && <span>Cart</span>}
            </div>
          </div>
        )}

        {theme.headerStyle === 'left-brand' && (
          <div className={`flex gap-6 ${device === 'mobile' ? 'flex-col items-start' : 'items-center justify-between'}`}>
            <HeaderLogoMark config={config} />
            <nav className={`flex flex-wrap items-center gap-5 text-sm ${device === 'mobile' ? 'justify-start' : ''}`}>
              {config.menuItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {config.searchEnabled && <span>Search</span>}
              {config.cartEnabled && <span>Cart</span>}
            </nav>
          </div>
        )}

        {theme.headerStyle === 'split-nav' && (
          <div className={`grid gap-4 ${device === 'mobile' ? 'grid-cols-1 text-center' : 'grid-cols-[1fr_auto_1fr] items-center'}`}>
            <nav className={`flex gap-5 text-sm ${device === 'mobile' ? 'justify-center flex-wrap order-2' : ''}`}>
              {config.menuItems.slice(0, 2).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </nav>
            <HeaderLogoMark config={config} />
            <nav className={`flex items-center gap-5 text-sm ${device === 'mobile' ? 'justify-center flex-wrap order-3' : 'justify-end'}`}>
              {config.menuItems.slice(2).map((item) => (
                <span key={item}>{item}</span>
              ))}
              {config.searchEnabled && <span>Search</span>}
              {config.cartEnabled && <span>Cart</span>}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function PreviewSection({
  theme,
  section,
  accent,
  active,
  onSelect,
  buttonRadius,
  device,
  onQuickEdit,
}: {
  theme: ThemePreset;
  section: BuilderSectionItem;
  accent: string;
  active: boolean;
  onSelect: () => void;
  buttonRadius: BrandingConfig['buttonRadius'];
  device: DeviceMode;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  const textAlign = section.layout.alignment === 'left' ? 'text-left items-start' : section.layout.alignment === 'right' ? 'text-right items-end' : 'text-center items-center';
  const heightClass = section.layout.height === 'compact' ? 'min-h-[220px]' : section.layout.height === 'medium' ? 'min-h-[320px]' : 'min-h-[420px]';
  const spacingClass = section.layout.spacing === 'tight' ? 'p-6' : section.layout.spacing === 'comfortable' ? 'p-10' : 'p-14';
  const buttonRadiusClass = buttonRadius === 'pill' ? 'rounded-full' : buttonRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const heroLayout = getThemeHeroLayout(theme.id);
  const columns = device === 'mobile' ? 'grid-cols-1' : theme.id === 'tampin' ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  const productColumns = device === 'mobile' ? 'grid-cols-2' : theme.id === 'al-nisa-atelier' ? 'sm:grid-cols-3' : 'sm:grid-cols-4';
  const storefrontCategories = categories.filter((item) => item.status === 'Published').slice(0, device === 'mobile' ? 2 : theme.id === 'tampin' ? 4 : 3);
  const storefrontProducts = products.filter((item) => item.status === 'Active').slice(0, device === 'mobile' ? 2 : theme.id === 'al-nisa-atelier' ? 3 : 4);
  const sectionSurfaceClass =
    theme.id === 'lumiere-noor'
      ? 'bg-[#f7f3ed]'
      : theme.id === 'al-nisa-atelier'
        ? 'bg-[#fbf9f5]'
        : theme.id === 'tampin'
          ? 'bg-white'
          : '';

  return (
    <section
      onClick={onSelect}
      className={`group relative border-b border-outline-variant/15 transition-all ${active ? 'ring-2 ring-inset ring-primary' : 'hover:bg-surface-low/50'} ${sectionSurfaceClass}`}
      style={{ backgroundColor: section.style.backgroundColor, color: section.style.textColor }}
    >
      <QuickEditOverlay active={active} onQuickEdit={onQuickEdit} />
      <div className={`relative flex ${heightClass} ${spacingClass} ${textAlign}`}>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              section.content.imagePreview && section.kind === 'hero'
                ? `linear-gradient(135deg, rgba(17,24,39,0.08), rgba(17,24,39,0.18)), url(${section.content.imagePreview}) center/cover no-repeat`
                : section.kind === 'hero'
                ? `linear-gradient(135deg, ${accent} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1))`
                : 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.05))',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(17,24,39,${section.style.overlay / 100})` }} />
        <div className={`relative z-10 w-full space-y-4 ${heroLayout === 'split-editorial' && section.kind === 'hero' ? '' : 'max-w-3xl'}`}>
          <div className="inline-flex rounded-full bg-white/85 px-3 py-1 text-xs text-on-surface shadow-sm">{section.label}</div>
          {section.kind === 'hero' ? (
            <HeroVariant
              layout={heroLayout}
              heading={section.content.heading}
              description={section.content.description}
              buttonText={section.content.buttonText}
              accent={accent}
              buttonRadiusClass={buttonRadiusClass}
              device={device}
            />
          ) : (
            <>
              <h3 className={`font-semibold ${theme.id === 'al-nisa-atelier' ? 'text-4xl italic sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>{section.content.heading}</h3>
              <p className="max-w-2xl text-sm leading-6 opacity-90 sm:text-base">{section.content.description}</p>
              <div className={`flex ${section.layout.alignment === 'right' ? 'justify-end' : section.layout.alignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
                  {section.content.buttonText}
                </button>
              </div>
            </>
          )}

          {section.content.imagePreview && section.kind !== 'hero' && (
            <div className={`overflow-hidden shadow-sm ${theme.id === 'tampin' ? 'rounded-none border border-black/10' : 'rounded-[24px] bg-white/90'} ${device === 'mobile' ? 'max-w-full' : 'max-w-[320px]'}`}>
              <img src={section.content.imagePreview} alt={section.content.image} className="h-48 w-full object-cover" />
            </div>
          )}

          {section.kind === 'categories' && (
            <div className={`grid gap-3 pt-2 ${columns}`}>
              {storefrontCategories.map((item) => (
                <div key={item.id} className={`overflow-hidden text-sm text-on-surface shadow-sm ${theme.id === 'tampin' ? 'rounded-none border border-black/10 bg-white' : 'rounded-2xl bg-white/90'}`}>
                  <img alt={item.name} className="h-32 w-full object-cover" referrerPolicy="no-referrer" src={item.coverUrl} />
                  <div className="p-4">
                    <p className="font-medium text-on-surface">{item.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.kind === 'featured-products' && (
            <div className={`grid gap-3 pt-2 ${productColumns}`}>
              {storefrontProducts.map((item) => (
                <div key={item.id} className={`${theme.id === 'lumiere-noor' ? 'rounded-[28px]' : theme.id === 'tampin' ? 'rounded-none border border-black/10' : 'rounded-2xl'} bg-white/90 p-4 text-sm text-on-surface shadow-sm`}>
                  <img
                    alt={item.title}
                    className={`mb-3 aspect-square w-full object-cover ${theme.id === 'al-nisa-atelier' ? 'rounded-[28px]' : 'rounded-xl'}`}
                    referrerPolicy="no-referrer"
                    src={item.thumbnailUrl}
                  />
                  <p className="font-medium text-on-surface">{item.title}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{item.categoryName}</p>
                  <p className="mt-2 text-sm font-semibold text-on-surface">MYR {item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {section.kind === 'testimonials' && (
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {getTestimonialItems(theme.id).map((item) => (
                <div key={item} className={`${theme.id === 'al-nisa-atelier' ? 'rounded-[28px]' : 'rounded-2xl'} bg-white/90 p-4 text-sm text-on-surface shadow-sm`}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewFooter({
  config,
  branding,
  active,
  onSelect,
  onQuickEdit,
}: {
  config: FooterConfig;
  branding: BrandingConfig;
  active: boolean;
  onSelect: () => void;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  const buttonRadiusClass =
    branding.buttonRadius === 'pill' ? 'rounded-full' : branding.buttonRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';

  return (
    <footer
      onClick={onSelect}
      className={`group relative border-t border-outline-variant/15 bg-white transition-all ${active ? 'ring-2 ring-inset ring-primary' : 'hover:bg-surface-low/40'}`}
    >
      <QuickEditOverlay active={active} onQuickEdit={onQuickEdit} />
      <div className="grid gap-8 px-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-2xl font-semibold text-on-surface">{config.brandLine}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            Crafted storefront footer for support, policy, contact, and brand trust. Keep this area clear instead of overloaded.
          </p>
          {config.newsletterEnabled && (
            <div className="mt-6 rounded-2xl bg-surface-low p-4">
              <p className="text-sm font-medium text-on-surface">{config.newsletterHeading}</p>
              <div className="mt-3 flex gap-3">
                <input className="min-w-0 flex-1 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none" value="Email address" readOnly />
                <button className={`${buttonRadiusClass} px-4 py-3 text-sm text-white`} style={{ backgroundColor: branding.primaryColor }}>
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {config.columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-medium text-on-surface">{column.title}</p>
              <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                {column.links.map((link) => (
                  <p key={link}>{link}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-outline-variant/15 px-8 py-4 text-xs text-on-surface-variant">{config.copyright}</div>
    </footer>
  );
}

function QuickEditOverlay({
  active,
  onQuickEdit,
}: {
  active: boolean;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  return (
    <div className={`absolute right-4 top-4 z-20 flex gap-2 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      {(['content', 'layout', 'style'] as EditorTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onQuickEdit(tab);
          }}
          className="rounded-full bg-white/95 px-3 py-1.5 text-xs text-on-surface shadow-sm transition-colors hover:bg-white"
        >
          {capitalize(tab)}
        </button>
      ))}
    </div>
  );
}

function HeaderLogoMark({ config }: { config: HeaderConfig }) {
  if (config.logoImage) {
    return <img src={config.logoImage} alt={config.logoText || 'Store logo'} className="mx-auto h-12 w-auto max-w-[180px] object-contain" />;
  }

  return <div className="text-center text-2xl font-semibold">{config.logoText}</div>;
}

function HeroVariant({
  layout,
  heading,
  description,
  buttonText,
  accent,
  buttonRadiusClass,
  device,
}: {
  layout: 'split-editorial' | 'airy-story' | 'campaign-banner' | 'default';
  heading: string;
  description: string;
  buttonText: string;
  accent: string;
  buttonRadiusClass: string;
  device: DeviceMode;
}) {
  if (layout === 'split-editorial') {
    return (
      <div className={`grid items-center gap-6 ${device === 'mobile' ? 'grid-cols-1' : 'md:grid-cols-[1.1fr_0.9fr]'}`}>
        <div className="space-y-5">
          <h3 className="text-4xl font-semibold sm:text-6xl">{heading}</h3>
          <p className="max-w-xl text-sm leading-7 opacity-90 sm:text-base">{description}</p>
          <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
            {buttonText}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="aspect-[3/4] rounded-[28px] bg-white/85 shadow-sm" />
          <div className="aspect-[3/4] rounded-[28px] bg-white/60 shadow-sm sm:translate-y-8" />
        </div>
      </div>
    );
  }

  if (layout === 'airy-story') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <div className="mx-auto h-px w-20 bg-black/20" />
        <h3 className="text-4xl font-semibold italic sm:text-6xl">{heading}</h3>
        <p className="mx-auto max-w-2xl text-sm leading-7 opacity-90 sm:text-base">{description}</p>
        <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
          {buttonText}
        </button>
      </div>
    );
  }

  if (layout === 'campaign-banner') {
    return (
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs text-on-surface shadow-sm">New Arrival</span>
          <h3 className="text-5xl font-semibold uppercase tracking-tight sm:text-6xl">{heading}</h3>
          <p className="max-w-xl text-sm leading-7 opacity-90 sm:text-base">{description}</p>
          <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
            {buttonText}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="aspect-[4/5] rounded-none bg-white/85 shadow-sm" />
          <div className="grid gap-3">
            <div className="aspect-[4/5] rounded-none bg-white/70 shadow-sm" />
            <div className="aspect-[4/3] rounded-none bg-white/55 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-3xl font-semibold sm:text-4xl">{heading}</h3>
      <p className="max-w-2xl text-sm leading-6 opacity-90 sm:text-base">{description}</p>
      <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
        {buttonText}
      </button>
    </>
  );
}

function ThemePreviewCard({
  theme,
  isPublished,
  onInstallTheme,
  onPublishTheme,
}: {
  theme: ThemePreset;
  isPublished: boolean;
  onInstallTheme: (id: string) => void;
  onPublishTheme: (id: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-white shadow-sm">
      <div className="border-b border-outline-variant/20 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-on-surface">{theme.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.styleTag}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${theme.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : theme.status === 'Installed' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
            {theme.status}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="overflow-hidden rounded-[24px] border border-outline-variant/20 bg-surface-low shadow-sm">
          <div className="px-4 py-2 text-center text-[11px] text-white" style={{ backgroundColor: theme.accent }}>
            {theme.preview.announcement}
          </div>
          <div className="space-y-5 p-4">
            <div className="rounded-[22px] bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.name}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="min-h-[190px] rounded-[20px]" style={{ background: `linear-gradient(135deg, ${theme.accent}55, #ffffff)` }} />
                <div className="flex flex-col justify-center gap-4">
                  <h3 className="text-3xl font-semibold text-on-surface">{theme.preview.heading}</h3>
                  <div>
                    <button className="rounded-full px-4 py-2 text-sm text-white" style={{ backgroundColor: theme.accent }}>
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {theme.preview.productRow.map((item) => (
                <div key={item} className="rounded-[20px] bg-white p-3 shadow-sm">
                  <div className="mb-3 aspect-[4/5] rounded-2xl bg-surface-low" />
                  <p className="text-sm font-medium text-on-surface">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-on-surface-variant">{theme.summary}</p>
        <div className="mt-4 rounded-2xl bg-surface-low p-4 text-sm text-on-surface-variant">
          {isPublished
            ? 'This is the current live storefront theme.'
            : theme.status === 'Installed'
              ? 'Installed and ready to publish when seller is confident.'
              : 'Not installed yet. Install first, then customize or publish later.'}
        </div>
        <div className="mt-5 flex gap-3">
          <a
            href={`#/website-builder/customize/${theme.id}`}
            className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
          >
            Demo
          </a>
          {theme.status === 'Draft' ? (
            <button
              type="button"
              onClick={() => onInstallTheme(theme.id)}
              className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
            >
              Install
            </button>
          ) : (
            <a
              href={`#/website-builder/customize/${theme.id}`}
              className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
            >
              Customize
            </a>
          )}
          {theme.status !== 'Draft' && !isPublished && (
            <button
              type="button"
              onClick={() => onPublishTheme(theme.id)}
              className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
            >
              Publish Live
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function InfoStatCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-surface-low px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
    </div>
  );
}

function GuideCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
      <p className="text-sm font-medium text-on-surface">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{body}</p>
    </div>
  );
}

function QuickMeaning({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-on-surface">{label}</p>
      <p className="mt-1 leading-6">{text}</p>
    </div>
  );
}

function MenuCard({
  title,
  items,
  note,
  active = false,
  actionLabel = 'Edit Menu',
  onAction,
}: {
  title: string;
  items: string[];
  note: string;
  active?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? 'border-primary bg-surface-low shadow-sm' : 'border-outline-variant/20 bg-surface-low'}`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-on-surface">{title}</p>
        <button
          type="button"
          onClick={onAction}
          className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-primary text-on-primary' : 'border border-outline-variant/20 text-on-surface'}`}
        >
          {actionLabel}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm text-on-surface shadow-sm">
            {item}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{note}</p>
    </div>
  );
}

function PageCard({
  title,
  purpose,
  status,
  active = false,
  actionLabel = 'Edit Page',
  onAction,
}: {
  title: string;
  purpose: string;
  status: string;
  active?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? 'border-primary bg-surface-low shadow-sm' : 'border-outline-variant/20 bg-surface-low'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-on-surface">{title}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs text-on-surface shadow-sm">{status}</span>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-primary text-on-primary' : 'border border-outline-variant/20 text-on-surface'}`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{purpose}</p>
    </div>
  );
}

function PreferenceCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-on-surface">{title}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-on-surface shadow-sm">{value}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{note}</p>
    </div>
  );
}

function EditorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      {children}
    </label>
  );
}

function DeviceButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full p-2 transition-colors ${active ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white'}`}
    >
      {icon}
    </button>
  );
}

function MiniIconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 rounded-full border border-outline-variant/20 bg-white px-2.5 py-1 text-[11px] text-on-surface transition-colors hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

function createSection(kind: BuilderSectionKind, label: string, content: BuilderSectionItem['content']): BuilderSectionItem {
  return {
    id: `${kind}-${Math.random().toString(36).slice(2, 8)}`,
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
    },
  };
}

function addSection(
  setSections: Dispatch<SetStateAction<BuilderSectionItem[]>>,
  kind: BuilderSectionKind,
  setActiveSectionId: Dispatch<SetStateAction<string>>,
) {
  const libraryItem = sectionLibrary.find((item) => item.kind === kind);
  const nextSection = createSection(kind, libraryItem?.title ?? 'New Section', {
    heading: libraryItem?.title ?? 'New Section',
    description: libraryItem?.note ?? 'Add content for this new section.',
    buttonText: 'Learn More',
    buttonLink: '#/',
    image: kind === 'hero' ? 'New hero image' : 'New section image',
  });

  setSections((current) => [...current, nextSection]);
  setActiveSectionId(nextSection.id);
}

function duplicateSection(
  setSections: Dispatch<SetStateAction<BuilderSectionItem[]>>,
  sections: BuilderSectionItem[],
  section: BuilderSectionItem,
) {
  const clone: BuilderSectionItem = {
    ...section,
    id: `${section.kind}-${Math.random().toString(36).slice(2, 8)}`,
    label: `${section.label} Copy`,
  };
  const index = sections.findIndex((item) => item.id === section.id);
  setSections((current) => [...current.slice(0, index + 1), clone, ...current.slice(index + 1)]);
}

function removeSection(
  setSections: Dispatch<SetStateAction<BuilderSectionItem[]>>,
  sections: BuilderSectionItem[],
  sectionId: string,
  activeSectionId: string,
  setActiveSectionId: Dispatch<SetStateAction<string>>,
) {
  if (sections.length === 1) {
    return;
  }

  const nextSections = sections.filter((item) => item.id !== sectionId);
  setSections(nextSections);

  if (activeSectionId === sectionId) {
    setActiveSectionId(nextSections[0].id);
  }
}

function moveArrayItem<T>(
  setItems: Dispatch<SetStateAction<T[]>>,
  items: T[],
  index: number,
  direction: 'up' | 'down',
) {
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return;
  }

  const clone = [...items];
  [clone[index], clone[nextIndex]] = [clone[nextIndex], clone[index]];
  setItems(clone);
}

function getSectionGuidance(kind: BuilderSectionKind) {
  switch (kind) {
    case 'hero':
      return 'Use this for first impression, strongest campaign headline, and the main path deeper into the storefront.';
    case 'categories':
      return 'This should shorten the path into the catalog. Best for Abaya, Hijab, Prayer Wear, or collection groupings.';
    case 'featured-products':
      return 'Use this for bestsellers, trending products, or a premium edit. Keep product count tight so the section stays elegant.';
    case 'promotion-banner':
      return 'Best for founder story, value proposition, drop announcement, or high-margin collection push.';
    case 'testimonials':
      return 'Adds trust without making the page noisy. Good for premium storefronts that need reassurance near conversion sections.';
    case 'footer':
      return 'Footer should help with support, trust, newsletter, and policy links. It should not try to repeat the whole homepage.';
    default:
      return 'Keep this section simple and conversion-friendly.';
  }
}

function getThemeHeroLayout(themeId: string): 'split-editorial' | 'airy-story' | 'campaign-banner' | 'default' {
  if (themeId === 'lumiere-noor') {
    return 'split-editorial';
  }

  if (themeId === 'al-nisa-atelier') {
    return 'airy-story';
  }

  if (themeId === 'tampin') {
    return 'campaign-banner';
  }

  return 'default';
}

function getCategoryItems(themeId: string) {
  if (themeId === 'tampin') {
    return ['New Drop', 'Best Seller', 'Occasion Wear', 'Last Chance'];
  }

  if (themeId === 'al-nisa-atelier') {
    return ['Abaya', 'Hijab', 'Prayer Wear'];
  }

  return ['Abaya', 'Hijab', 'Prayer Wear'];
}

function getProductItems(themeId: string) {
  if (themeId === 'al-nisa-atelier') {
    return ['Sandstone Abaya', 'Premium Sand Hijab', 'Celestial Drape'];
  }

  if (themeId === 'tampin') {
    return ['Nude Dress', 'Red Kaftan', 'Lilac Set', 'Evening Wrap'];
  }

  return ['Ethereal Silk Abaya', 'Signature Sand Hijab', 'Evening Drape', 'Atelier Gift Set'];
}

function getTestimonialItems(themeId: string) {
  if (themeId === 'tampin') {
    return ['Fast moving collection and clean mobile feel.', 'Bold but still easy to shop.', 'The product flow feels more campaign-ready now.'];
  }

  if (themeId === 'al-nisa-atelier') {
    return ['Refined quality with a calm premium feel.', 'The storefront feels light and elegant.', 'Everything looks intentional and easy to trust.'];
  }

  return ['Elegant quality and premium finish.', 'The cart and checkout feel very polished.', 'Perfect for a luxury modestwear brand.'];
}

function getHeaderStyleLabel(style: ThemePreset['headerStyle']) {
  switch (style) {
    case 'center-brand':
      return 'Centered brand lockup with navigation split around the logo';
    case 'left-brand':
      return 'Left-aligned brand with navigation running on the right';
    case 'split-nav':
      return 'Brand centered or balanced with menu groups split across both sides';
    default:
      return 'Custom header layout';
  }
}

function normalizeSection(section?: string): WebsiteBuilderSection {
  if (
    section === 'installed-themes' ||
    section === 'themes' ||
    section === 'menus' ||
    section === 'pages' ||
    section === 'blog' ||
    section === 'preferences' ||
    section === 'metafields' ||
    section === 'customize'
  ) {
    return section;
  }

  return 'overview';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
