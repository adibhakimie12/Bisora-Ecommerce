import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { BlogPost, BlogCtaType } from '../storefront/blogStore';
import { loadBlogPosts, normalizeBlogPost, saveBlogPosts, saveBlogPostsToApi, syncBlogPostsFromApi } from '../storefront/blogStore';
import { useStorefrontProducts } from '../storefront/productStore';
import { useStorefrontPages, type WebsitePageRecord } from '../storefront/websitePagesStore';
import {
  applySeoAction,
  buildSeoRecommendations,
  buildPageSeoChecklist,
  buildSeoValidation,
  computePageSeoScore,
  createAutoPageSlug,
  ensurePageSlug,
  resolvePageSeoState,
  suggestKeywordInsights,
  syncDocumentSeo,
} from './seo';
import { buildSeoGuideItems, buildSeoHelpQuestions, getSimplifiedSeoState, getTopSeoRecommendations } from './seoHelp';
import {
  applyBlogAiActionWithRuntime,
  createBlogSlug,
  ensureBlogSlug,
  resolveBlogPreview,
  testBlogAiConnection,
  type BlogAiRuntime,
} from './blogAssistant';
import {
  normalizeWebsiteBuilderSection,
  websiteBuilderTabs,
  type WebsiteBuilderSection,
} from './websiteBuilderSections';
import {
  loadBuilderHomepageState,
  saveBuilderHomepageState,
} from './builderHomepageStore';
import { seoWorkspaceModes, type SeoWorkspaceScope } from './seoWorkspaceModes';
import {
  type ThemeLibraryPreset,
} from './themeLibrary';
import {
  buildThemeLibraryCards,
  installThemeById,
  publishThemeById,
  type ThemeLibraryCardModel,
} from './themeLibraryViewModel';
import { loadThemeLibrary, saveThemeLibrary } from './themeLibraryStore';
import {
  backgroundStyleOptions,
  builderStudioThemeDefaults,
  builderStudioShellItems,
  imageFitOptions,
  imageFocusOptions,
  imageShapeOptions,
  logoPositionOptions,
} from './builderStudioConfig';
import {
  buildBuilderPanelGroups,
  getBuilderSelectionLabel,
  type ActiveSurface,
  type BuilderPanelGroup,
  type EditorTab,
  type SectionKind,
} from './builderStudioViewModel';
import type { Product } from '../products/types';
import { productToSeoRecord, seoRecordToProduct, type WebsiteBuilderSeoProductRecord } from './productSeoBridge';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type StorePageKey = 'homepage' | 'product' | 'collection' | 'cart';
type BuilderSectionKind = SectionKind;
type Alignment = 'left' | 'center' | 'right';
type SurfaceTarget = ActiveSurface;

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
    imageFit: 'cover' | 'contain';
    imageFocus: 'top' | 'center' | 'bottom';
    imageShape: 'soft-rounded' | 'rounded' | 'sharp';
    backgroundStyle: 'plain' | 'gradient' | 'image';
    backgroundImage?: string;
  };
}

type ThemePreset = ThemeLibraryPreset;

export type BuilderView = { tab: WebsiteBuilderSection; themeId?: string };

export function resolveBuilderView(section?: string, themeId?: string): BuilderView {
  const tab = normalizeWebsiteBuilderSection(section);
  return tab === 'customize' ? { tab, themeId } : { tab };
}

interface HeaderConfig {
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  logoText: string;
  logoImage?: string;
  logoPosition: 'left' | 'center' | 'split';
  logoWidth: number;
  useTextLogo: boolean;
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
  pageWidth: 'contained' | 'wide';
  sectionSpacing: 'tight' | 'comfortable' | 'airy';
  cardRadius: 'soft-rounded' | 'rounded' | 'sharp';
  backgroundStyle: 'plain' | 'gradient' | 'image';
  backgroundImage?: string;
}

type WebsiteBuilderPage = WebsitePageRecord;

interface WebsiteBuilderPagePanelProps {
  activePageId: string;
  pages: WebsiteBuilderPage[];
  setActivePageId: Dispatch<SetStateAction<string>>;
  setPages: Dispatch<SetStateAction<WebsiteBuilderPage[]>>;
}
const defaultSectionsByTheme: Record<string, BuilderSectionItem[]> = {
  'luxe-atelier': [
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
      heading: 'Luxe Atelier',
      description: 'Contact, policy, shipping, and refined brand notes.',
      buttonText: 'Newsletter Signup',
      buttonLink: '#/newsletter',
      image: 'Footer columns',
    }),
  ],
  'editorial-veil': [
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
      heading: 'Editorial Veil',
      description: 'Soft, minimal footer with quiet trust-building links.',
      buttonText: 'Join The List',
      buttonLink: '#/newsletter',
      image: 'Minimal footer layout',
    }),
  ],
  'campaign-glow': [
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
      heading: 'Campaign Glow',
      description: 'Fashion support links and brand follow-up.',
      buttonText: 'Subscribe',
      buttonLink: '#/newsletter',
      image: 'Fashion footer',
    }),
  ],
  'sage-ritual': [
    createSection('hero', 'Beauty Hero', {
      heading: 'Your Journey To Effortless Elegance',
      description: 'A calm skincare and beauty storefront built around trust, rituals, and category-led discovery.',
      buttonText: 'Shop Beauty',
      buttonLink: '#/collections/beauty',
      image: 'Clean beauty hero with soft lighting',
    }),
    createSection('categories', 'Beauty Categories', {
      heading: 'Shop By Ritual',
      description: 'Guide buyers into skin care, body care, hair care, fragrances, and self-care bundles.',
      buttonText: 'Browse Rituals',
      buttonLink: '#/collections',
      image: 'Circular category bubbles',
    }),
    createSection('promotion-banner', 'Special Care Banner', {
      heading: 'Special care deals and ingredient-first formulas for everyday routines.',
      description: 'Use this area for offer cards, ingredient education, or routine bundles.',
      buttonText: 'Explore Offers',
      buttonLink: '#/collections/best-sellers',
      image: 'Wellness promo banner',
    }),
    createSection('featured-products', 'Best Sellers', {
      heading: 'Beauty Best Sellers',
      description: 'Showcase skincare heroes in a soft trust-first grid that feels clean and premium.',
      buttonText: 'View Best Sellers',
      buttonLink: '#/products',
      image: 'Skincare product grid',
    }),
    createSection('testimonials', 'Results & Trust', {
      heading: 'Why Customers Return',
      description: 'Blend social proof with calm metrics so the page feels credible without becoming loud.',
      buttonText: 'Read Customer Stories',
      buttonLink: '#/reviews',
      image: 'Beauty trust cards',
    }),
    createSection('footer', 'Footer', {
      heading: 'Sage Ritual',
      description: 'Customer care, ingredient notes, and beauty support links.',
      buttonText: 'Join The Ritual',
      buttonLink: '#/newsletter',
      image: 'Beauty footer',
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
  const activeSection = normalizeWebsiteBuilderSection(section);
  const [themes, setThemes] = useState<ThemePreset[]>(() => loadThemeLibrary());
  const [themeActionNote, setThemeActionNote] = useState<string>('Live theme flow is now active. Seller can install, customize, and publish themes with a clearer storefront state.');
  const publishedTheme = themes.find((theme) => theme.status === 'Published') ?? themes[0];
  const currentTheme = useMemo(
    () => themes.find((theme) => theme.id === (themeId ?? subSection)) ?? publishedTheme,
    [publishedTheme, subSection, themeId, themes],
  );

  const installTheme = (id: string) => {
    setThemes((current) => {
      const nextThemes = installThemeById(current, id);
      saveThemeLibrary(nextThemes);
      return nextThemes;
    });
    const installed = themes.find((theme) => theme.id === id);
    setThemeActionNote(`${installed?.name ?? 'Theme'} is now installed and ready to customize before going live.`);
  };

  const publishTheme = (id: string) => {
    setThemes((current) => {
      const nextThemes = publishThemeById(current, id);
      saveThemeLibrary(nextThemes);
      return nextThemes;
    });
    const nextLive = themes.find((theme) => theme.id === id);
    setThemeActionNote(`${nextLive?.name ?? 'Theme'} is now the live storefront theme. Previous live theme stays installed as a backup draft path.`);
  };

  if (activeSection === 'customize') {
    return <BuilderStudio key={currentTheme.id} theme={currentTheme} />;
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
  const themeCards = buildThemeLibraryCards(themes);
  const installedThemes = themeCards.filter((theme) => theme.isInstalled);
  const [pages, setPages] = useStorefrontPages();
  const [activePageId, setActivePageId] = useState('about');
  const [productRecords, setProductRecords] = useStorefrontProducts();
  const [activeSeoProductId, setActiveSeoProductId] = useState(productRecords[0]?.id ?? 'prod-abaya-silk');

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
          {websiteBuilderTabs.map((tab) => (
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
        <ThemeLibraryPanel themes={themeCards} publishedThemeId={publishedThemeId} onInstallTheme={onInstallTheme} onPublishTheme={onPublishTheme} />
      )}
      {activeSection === 'menus' && <MenusPanel />}
      {activeSection === 'pages' && <PagesPanel activePageId={activePageId} pages={pages} setActivePageId={setActivePageId} setPages={setPages} />}
      {activeSection === 'page-seo' && (
        <SeoPanel
          activePageId={activePageId}
          pages={pages}
          setActivePageId={setActivePageId}
          setPages={setPages}
          activeProductId={activeSeoProductId}
          products={productRecords}
          setActiveProductId={setActiveSeoProductId}
          setProducts={setProductRecords}
        />
      )}
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
  themes: ThemeLibraryCardModel[];
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
                    {theme.badge}
                  </span>
                  {theme.id === publishedThemeId && <span className="rounded-full bg-white px-3 py-1 text-xs text-on-surface shadow-sm">Current Live Theme</span>}
                </div>
                <p className="text-sm font-medium text-on-surface">{theme.fitLabel}</p>
                <p className="text-sm text-on-surface-variant">{theme.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {theme.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-on-surface-variant shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">
                  {theme.version} - {theme.updatedAt}
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
  themes: ThemeLibraryCardModel[];
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

function PagesPanel({ activePageId, pages, setActivePageId, setPages }: WebsiteBuilderPagePanelProps) {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];

  const updateActivePage = (updater: (page: (typeof pages)[number]) => (typeof pages)[number]) => {
    setPages((current) => current.map((page) => (page.id === activePage.id ? updater(page) : page)));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Pages</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Store content pages that support the frontstore</h2>

        <div className="mt-6 space-y-4">
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
                  current.map((page) => {
                    if (page.id !== activePage.id) return page;
                    const nextTitle = event.target.value;
                    const nextSlug = page.slugManuallyEdited ? page.slug : ensurePageSlug(createAutoPageSlug({ title: nextTitle, heroHeading: page.heroHeading }), current, page.id);
                    return { ...page, title: nextTitle, slug: nextSlug };
                  }),
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
            <EditorField label="Hero Heading">
              <input
                value={activePage.heroHeading}
                onChange={(event) =>
                  updateActivePage((page) => ({
                    ...page,
                    heroHeading: event.target.value,
                    slug: page.slugManuallyEdited ? page.slug : ensurePageSlug(createAutoPageSlug({ title: page.title, heroHeading: event.target.value }), pages, page.id),
                  }))
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </EditorField>
            <EditorField label="Call To Action">
              <input
                value={activePage.cta}
                onChange={(event) => updateActivePage((page) => ({ ...page, cta: event.target.value }))}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </EditorField>
          </div>
          <EditorField label="Subheading">
            <textarea
              rows={3}
              value={activePage.subheading}
              onChange={(event) => updateActivePage((page) => ({ ...page, subheading: event.target.value }))}
              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </EditorField>
        </div>

        <div className="mt-6 rounded-3xl border border-outline-variant/20 bg-surface-low p-5">
          <p className="text-sm font-medium text-primary">SEO moved out</p>
          <h4 className="mt-2 text-lg font-semibold text-on-surface">Manage search, sharing, previews, and AI SEO inside the `SEO` tab</h4>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Pages now stay focused on content structure and page management. The `SEO` tab uses the same storefront records, so edits there still connect directly to this page.
          </p>
          <a
            href="#/website-builder/page-seo"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
          >
            Open SEO
          </a>
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

function SeoPanel({
  activePageId,
  pages,
  setActivePageId,
  setPages,
  activeProductId,
  products,
  setActiveProductId,
  setProducts,
}: WebsiteBuilderPagePanelProps & {
  activeProductId: string;
  products: Product[];
  setActiveProductId: Dispatch<SetStateAction<string>>;
  setProducts: Dispatch<SetStateAction<Product[]>>;
}) {
  const openGraphObjectUrlsRef = useRef(new Map<string, string>());
  const [activeScope, setActiveScope] = useState<SeoWorkspaceScope>('pages');
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const activeProduct = products.find((product) => product.id === activeProductId) ?? products[0];
  const activeProductRecord = activeProduct ? productToSeoRecord(activeProduct) : null;
  const activeRecord = activeScope === 'pages' ? activePage : activeProductRecord;
  const activeRecords = activeScope === 'pages' ? pages : products.map(productToSeoRecord);
  const [seoActionNote, setSeoActionNote] = useState('AI helper can suggest cleaner search copy from your page content.');
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [activeHelpQuestionId, setActiveHelpQuestionId] = useState('seo-title');
  const resolvedSeo = resolvePageSeoState(activeRecord ?? activePage, activeRecords);
  const validation = buildSeoValidation(activeRecord ?? activePage, resolvedSeo);
  const keywordInsights = suggestKeywordInsights(activeRecord ?? activePage, resolvedSeo);
  const seoScore = computePageSeoScore(validation);
  const checklist = buildPageSeoChecklist(activeRecord ?? activePage, resolvedSeo, validation);
  const recommendationCards = buildSeoRecommendations(activeRecord ?? activePage, resolvedSeo, validation, keywordInsights);
  const simplifiedSeoState = getSimplifiedSeoState(seoScore.label);
  const seoGuideItems = buildSeoGuideItems();
  const helpQuestions = buildSeoHelpQuestions(activeScope);
  const activeHelpQuestion =
    helpQuestions.find((question) => question.id === activeHelpQuestionId) ?? helpQuestions[0];
  const primaryRecommendations = getTopSeoRecommendations(recommendationCards);
  const validationItems = [
    { label: 'Title length', ...validation.title },
    { label: 'Description length', ...validation.description },
    { label: 'Primary keyword', ...validation.keyword },
    { label: 'Slug format', ...validation.slug },
    { label: 'Open Graph image', ...validation.openGraphImage },
  ];

  const updateActivePage = (updater: (page: WebsiteBuilderPage) => WebsiteBuilderPage) => {
    setPages((current) => current.map((page) => (page.id === activePage.id ? updater(page) : page)));
  };

  const updateActiveProduct = (updater: (product: WebsiteBuilderSeoProductRecord) => WebsiteBuilderSeoProductRecord) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === activeProduct.id ? seoRecordToProduct(product, updater(productToSeoRecord(product))) : product,
      ),
    );
  };

  const updateActiveSeoRecord = (
    updater: (record: WebsiteBuilderPage | WebsiteBuilderSeoProductRecord) => WebsiteBuilderPage | WebsiteBuilderSeoProductRecord,
  ) => {
    if (activeScope === 'pages') {
      updateActivePage((page) => updater(page) as WebsiteBuilderPage);
      return;
    }

    updateActiveProduct((product) => updater(product) as WebsiteBuilderSeoProductRecord);
  };

  useEffect(() => {
    syncDocumentSeo(resolvedSeo);
  }, [resolvedSeo]);

  useEffect(() => {
    return () => {
      for (const objectUrl of openGraphObjectUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const runSeoHelper = (
    action:
      | 'title'
      | 'description'
      | 'improve'
      | 'clickable'
      | 'elegant'
      | 'brand'
      | 'conversion'
      | 'keyword'
      | 'shorten'
      | 'regenerate',
  ) => {
    updateActiveSeoRecord((record) => ({ ...record, ...applySeoAction(record, action) }));

    const noteMap = {
      title: 'SEO title generated directly into the title field.',
      description: 'Meta description generated directly into the description field.',
      improve: 'Existing copy tightened to sound clearer and more buyer-friendly.',
      clickable: 'Copy made more clickable so buyers have a stronger reason to tap the result.',
      elegant: 'Copy refined to feel more elegant and premium.',
      brand: 'Copy shifted to feel more brand-led and signature-driven.',
      conversion: 'Copy adjusted to feel more action-oriented and conversion-aware.',
      keyword: 'Primary keyword inserted more naturally into the SEO fields.',
      shorten: 'Copy shortened to stay closer to what Google usually displays.',
      regenerate: 'Fresh variation generated using page content and layout intent.',
    } as const;

    setSeoActionNote(noteMap[action]);
  };

  const handleOpenGraphUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeRecord) return;

    const previousObjectUrl = openGraphObjectUrlsRef.current.get(activeRecord.id);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    openGraphObjectUrlsRef.current.set(activeRecord.id, nextObjectUrl);

    updateActiveSeoRecord((record) => ({ ...record, openGraphImage: nextObjectUrl }));
    setSeoActionNote('Open Graph image updated for social sharing preview.');
  };

  const handleClearOpenGraphImage = () => {
    if (!activeRecord) {
      return;
    }

    const previousObjectUrl = openGraphObjectUrlsRef.current.get(activeRecord.id);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
      openGraphObjectUrlsRef.current.delete(activeRecord.id);
    }

    updateActiveSeoRecord((record) => ({ ...record, openGraphImage: undefined }));
    setSeoActionNote('Open Graph image removed from the sharing preview.');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">SEO</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">One workspace for page SEO and product SEO</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Use the mode switch below to optimize storefront pages or catalog products without bouncing between separate SEO areas.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {seoWorkspaceModes.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setActiveScope(mode.key)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                activeScope === mode.key ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-on-surface-variant">
          {seoWorkspaceModes.find((mode) => mode.key === activeScope)?.note}
        </p>

        <div className="mt-6 space-y-4">
          {activeScope === 'pages'
            ? pages.map((page) => (
                <PageCard
                  key={page.id}
                  title={page.title}
                  purpose={page.purpose}
                  status={page.status}
                  active={page.id === activePageId}
                  actionLabel={page.id === activePageId ? 'Optimizing' : 'Open SEO'}
                  onAction={() => setActivePageId(page.id)}
                />
              ))
            : products.map((product) => (
                <PageCard
                  key={product.id}
                  title={product.title}
                  purpose={product.description}
                  status={product.status}
                  active={product.id === activeProductId}
                  actionLabel={product.id === activeProductId ? 'Optimizing' : 'Open SEO'}
                  onAction={() => setActiveProductId(product.id)}
                />
              ))}
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
          <p className="text-sm font-medium text-on-surface">How this SEO tab works</p>
          <div className="mt-4 space-y-4 text-sm text-on-surface-variant">
            <QuickMeaning label="Pages mode" text="Best for homepage, about page, support page, and other storefront content." />
            <QuickMeaning label="Products mode" text="Best for catalog item snippets, slug control, and product sharing previews." />
            <QuickMeaning label="Connected flow" text="This tab now groups the SEO work in one place so sellers do not need to guess whether to edit pages SEO or products SEO separately." />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white p-4">
          <p className="text-sm font-medium text-on-surface">Simple SEO Guide</p>
          <div className="mt-4 space-y-4 text-sm text-on-surface-variant">
            {seoGuideItems.map((item) => (
              <QuickMeaning key={item.label} label={item.label} text={item.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">SEO Workspace</p>
            <h3 className="mt-2 text-xl font-semibold text-on-surface">{activeRecord.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Keep this simple: fill in the basics, check the main fixes, then preview what Google and shoppers will see.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-4 py-2 text-sm font-medium ${getWorkspaceStateTone(simplifiedSeoState.tone)}`}>{simplifiedSeoState.label}</span>
            <button
              type="button"
              onClick={() => setShowHelpAssistant((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-low px-4 py-2 text-sm text-on-surface transition-colors hover:border-primary/30 hover:text-primary"
            >
              <CircleHelp className="h-4 w-4" />
              Need Help?
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-outline-variant/20 bg-surface-low p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Smart Help</p>
              <p className="mt-2 text-sm text-on-surface-variant">{simplifiedSeoState.note}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SeoToneChip label="Fix For Me" onClick={() => runSeoHelper('improve')} />
              <SeoToneChip label="Make It Better" onClick={() => runSeoHelper('clickable')} />
              <SeoToneChip label="Shorten" onClick={() => runSeoHelper('shorten')} />
              <SeoToneChip label="Add Keyword" onClick={() => runSeoHelper('keyword')} />
            </div>
          </div>
        </div>

        {showHelpAssistant ? (
          <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">Quick Help</p>
                <p className="mt-1 text-sm text-on-surface-variant">Tap a question below if you want a simple explanation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpAssistant(false)}
                className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
              >
                Hide
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {helpQuestions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setActiveHelpQuestionId(question.id)}
                  className={`rounded-full px-3 py-2 text-xs transition-colors ${
                    activeHelpQuestion.id === question.id
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant/20 bg-surface-low text-on-surface hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {question.question}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4 text-sm leading-6 text-on-surface-variant">
              {activeHelpQuestion.answer}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-semibold text-on-surface">1. Basics</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                These are the main details Google and shoppers usually care about first.
              </p>
              <div className="mt-4 space-y-4">
                <EditorField label="SEO Title">
                  <div className="space-y-2">
                    <input
                      value={activeRecord.seoTitle}
                      onChange={(event) => updateActiveSeoRecord((record) => ({ ...record, seoTitle: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <p className="text-xs text-on-surface-variant">This is the title Google usually shows in search results.</p>
                  </div>
                </EditorField>

                <EditorField label="Meta Description">
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={activeRecord.metaDescription}
                      onChange={(event) => updateActiveSeoRecord((record) => ({ ...record, metaDescription: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <p className="text-xs text-on-surface-variant">This short summary appears under the title in Google.</p>
                  </div>
                </EditorField>

                <div className="grid gap-4 md:grid-cols-2">
                  <EditorField label="URL Slug">
                    <div className="space-y-2">
                      <input
                        value={activeRecord.slug}
                        onChange={(event) =>
                          updateActiveSeoRecord((record) => {
                            if (!event.target.value.trim()) {
                              return {
                                ...record,
                                slug: ensurePageSlug(createAutoPageSlug(record), activeRecords, record.id),
                                slugManuallyEdited: false,
                              };
                            }

                            return {
                              ...record,
                              slug: ensurePageSlug(event.target.value, activeRecords, record.id),
                              slugManuallyEdited: true,
                            };
                          })
                        }
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                      <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                        <span>{activeRecord.slugManuallyEdited ? 'Manual link active' : 'Link auto-created from title'}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSeoRecord((record) => ({
                              ...record,
                              slug: ensurePageSlug(createAutoPageSlug(record), activeRecords, record.id),
                              slugManuallyEdited: false,
                            }))
                          }
                          className="font-medium text-primary transition-colors hover:text-primary-dim"
                        >
                          Use auto slug
                        </button>
                      </div>
                      <p className="text-xs text-on-surface-variant">This is the link part of your page URL.</p>
                    </div>
                  </EditorField>

                  <EditorField label="Primary Keyword">
                    <div className="space-y-3">
                      <input
                        value={activeRecord.primaryKeyword}
                        onChange={(event) => updateActiveSeoRecord((record) => ({ ...record, primaryKeyword: event.target.value }))}
                        className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Suggested Keyword</p>
                            <p className="mt-1 text-sm font-medium text-on-surface">{keywordInsights.primaryKeyword}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateActiveSeoRecord((record) => ({ ...record, primaryKeyword: keywordInsights.primaryKeyword }))}
                            className="rounded-full border border-outline-variant/20 bg-white px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:border-primary/30 hover:text-primary"
                          >
                            Use
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-on-surface-variant">Pick one clear phrase so your snippet stays focused.</p>
                      </div>
                    </div>
                  </EditorField>
                </div>

                <EditorField label="Open Graph Image">
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-low p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      {activeRecord.openGraphImage ? (
                        <img alt={activeRecord.title} className="h-20 w-20 rounded-2xl object-cover" referrerPolicy="no-referrer" src={activeRecord.openGraphImage} />
                      ) : (
                        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white text-on-surface-variant">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                      )}
                      <div className="text-sm text-on-surface-variant">
                        <p className="font-medium text-on-surface">Social sharing image</p>
                        <p className="mt-1">This image appears when your link is shared on WhatsApp or social media.</p>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim">
                      Upload Image
                      <input type="file" accept="image/*" onChange={handleOpenGraphUpload} className="hidden" />
                    </label>
                    {activeRecord.openGraphImage?.startsWith('blob:') ? (
                      <button
                        type="button"
                        onClick={handleClearOpenGraphImage}
                        className="rounded-full border border-outline-variant/20 bg-white px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
                      >
                        Remove Image
                      </button>
                    ) : null}
                  </div>
                </EditorField>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-semibold text-on-surface">2. Smart Help</p>
              <div className="mt-4 space-y-3">
                {primaryRecommendations.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-outline-variant/15 bg-surface-low px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{card.title}</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{card.body}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-primary shadow-sm">{card.action}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SeoActionButton label="Generate Title" onClick={() => runSeoHelper('title')} />
                <SeoActionButton label="Generate Description" onClick={() => runSeoHelper('description')} />
                <SeoActionButton label="Make More Clickable" onClick={() => runSeoHelper('clickable')} />
                <SeoActionButton label="Regenerate" onClick={() => runSeoHelper('regenerate')} />
              </div>
              <div className="mt-4 rounded-2xl border border-primary/15 bg-[rgba(108,92,231,0.06)] p-4 text-sm text-on-surface-variant">{seoActionNote}</div>
            </div>

            <details className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-on-surface">
                More Details
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-on-surface">Keyword Assistant</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywordInsights.relatedKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => updateActiveSeoRecord((record) => ({ ...record, primaryKeyword: keyword }))}
                        className="rounded-full border border-outline-variant/20 bg-surface-low px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:border-primary/30 hover:bg-[rgba(108,92,231,0.06)]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {validationItems.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-surface-low px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.status === 'good' ? 'bg-primary text-on-primary' : 'bg-amber-100 text-amber-800'}`}>
                          {item.status === 'good' ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">!</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{item.label}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{item.message}</p>
                          <p className="mt-2 text-xs font-medium text-primary">{item.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-surface-low px-4 py-3">
                      <div className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${item.done ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant'}`}>
                        {item.done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{item.label}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{item.help}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-semibold text-on-surface">3. Preview</p>
              <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-xs text-success">{resolvedSeo.url.replace(/^https?:\/\//, '')}</p>
                <h4 className="mt-2 text-lg font-semibold text-primary">{resolvedSeo.title}</h4>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{resolvedSeo.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-semibold text-on-surface">Search & Sharing Preview</p>
              <div className="mt-4 overflow-hidden rounded-[24px] border border-outline-variant/20 bg-surface-low">
                {resolvedSeo.openGraphImage ? (
                  <img alt={activeRecord.title} className="h-44 w-full object-cover" referrerPolicy="no-referrer" src={resolvedSeo.openGraphImage} />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-[linear-gradient(135deg,rgba(108,92,231,0.08),rgba(255,255,255,0.95))] text-sm text-on-surface-variant">
                    Upload a sharing image to complete the preview
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{resolvedSeo.url.replace(/^https?:\/\//, '')}</p>
                  <h4 className="mt-2 text-lg font-semibold text-on-surface">{resolvedSeo.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{resolvedSeo.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BlogPanel() {
  const BLOG_AI_RUNTIME_STORAGE_KEY = 'bisora-blog-ai-runtime';
  const blogCoverObjectUrlsRef = useRef(new Map<string, string>());
  const openGraphObjectUrlsRef = useRef(new Map<string, string>());
  const blogHelpQuestions = [
    {
      id: 'blog-goal',
      question: 'Blog ni untuk apa?',
      answer:
        'Blog helps bring search traffic from Google, then guides readers into your products, collections, or WhatsApp.',
    },
    {
      id: 'blog-keyword',
      question: 'Primary keyword tu apa?',
      answer:
        'Primary keyword is the main phrase buyers might search on Google. Fill one clear phrase so title and content stay focused.',
    },
    {
      id: 'blog-cover',
      question: 'Upload image untuk apa?',
      answer:
        'Cover image is used on blog cards and article header. A clean image makes the post look more trusted and more clickable.',
    },
    {
      id: 'blog-seo',
      question: 'SEO Title / Description / Slug tu macam mana?',
      answer:
        'SEO Title is the blue headline in Google, Meta Description is the short summary below it, and Slug is the URL path.',
    },
    {
      id: 'blog-publish',
      question: 'Bila patut publish?',
      answer:
        'Publish after keyword, title, description, and preview look clear. If still rough, keep as draft first and improve with AI buttons.',
    },
  ] as const;

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(loadBlogPosts);
  const blogPostsHydratedRef = useRef(false);
  const [activePostId, setActivePostId] = useState(blogPosts[0]?.id ?? '');
  const [blogActionNote, setBlogActionNote] = useState('Use this workspace to write articles that attract Google traffic and guide shoppers into products.');
  const [showBlogGuide, setShowBlogGuide] = useState(true);
  const [showBlogHelpAssistant, setShowBlogHelpAssistant] = useState(false);
  const [activeBlogHelpQuestionId, setActiveBlogHelpQuestionId] = useState<string>(blogHelpQuestions[0].id);
  const [blogAiRuntime, setBlogAiRuntime] = useState<BlogAiRuntime>(() => {
    if (typeof window === 'undefined') {
      return {
        mode: 'template',
        endpoint: '/api/ai/blog',
        apiKey: '',
        connected: false,
      };
    }

    try {
      const saved = window.localStorage.getItem(BLOG_AI_RUNTIME_STORAGE_KEY);
      if (!saved) {
        return {
          mode: 'template',
          endpoint: '/api/ai/blog',
          apiKey: '',
          connected: false,
        };
      }

      const parsed = JSON.parse(saved) as BlogAiRuntime;
      return {
        mode: parsed.mode === 'api' ? 'api' : 'template',
        endpoint: parsed.endpoint?.trim() || '/api/ai/blog',
        apiKey: parsed.apiKey ?? '',
        connected: !!parsed.connected,
      };
    } catch {
      return {
        mode: 'template',
        endpoint: '/api/ai/blog',
        apiKey: '',
        connected: false,
      };
    }
  });
  const [isTestingBlogAi, setIsTestingBlogAi] = useState(false);
  const activePost = blogPosts.find((post) => post.id === activePostId) ?? blogPosts[0];
  const blogPreview = activePost ? resolveBlogPreview(activePost) : null;
  const activeBlogHelpQuestion =
    blogHelpQuestions.find((question) => question.id === activeBlogHelpQuestionId) ?? blogHelpQuestions[0];

  useEffect(() => {
    void syncBlogPostsFromApi().then((posts) => {
      blogPostsHydratedRef.current = true;
      setBlogPosts(posts);
      setActivePostId((current) => current || posts[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!blogPostsHydratedRef.current) {
      blogPostsHydratedRef.current = true;
      return;
    }

    const persistedPosts = blogPosts.map((post) => ({
      ...post,
      coverImagePreview: post.coverImagePreview?.startsWith('blob:') ? undefined : post.coverImagePreview,
    }));
    saveBlogPosts(
      persistedPosts,
    );
    void saveBlogPostsToApi(persistedPosts);
  }, [blogPosts]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(BLOG_AI_RUNTIME_STORAGE_KEY, JSON.stringify(blogAiRuntime));
  }, [blogAiRuntime]);

  const updateActivePost = (updater: (post: BlogPost) => BlogPost) => {
    if (!activePost) {
      return;
    }

    setBlogPosts((current) => current.map((post) => (post.id === activePost.id ? updater(post) : post)));
  };

  useEffect(() => {
    return () => {
      for (const objectUrl of blogCoverObjectUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }

      for (const objectUrl of openGraphObjectUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  const handleBlogCoverUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePost) {
      return;
    }

    const previousObjectUrl = blogCoverObjectUrlsRef.current.get(activePost.id);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    blogCoverObjectUrlsRef.current.set(activePost.id, nextObjectUrl);

    updateActivePost((post) => ({
      ...post,
      coverImage: file.name,
      coverImagePreview: nextObjectUrl,
    }));
  };

  const handleClearBlogCover = () => {
    if (!activePost) {
      return;
    }

    const previousObjectUrl = blogCoverObjectUrlsRef.current.get(activePost.id);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
      blogCoverObjectUrlsRef.current.delete(activePost.id);
    }

    updateActivePost((post) => ({
      ...post,
      coverImagePreview: undefined,
    }));
    setBlogActionNote('Blog cover image removed from the article preview.');
  };

  const runBlogAiAction = async (action: Parameters<typeof applyBlogAiActionWithRuntime>[1]) => {
    if (!activePost) {
      return;
    }

    const canUseApi = blogAiRuntime.mode === 'api' && !!blogAiRuntime.connected && !!blogAiRuntime.endpoint?.trim();

    try {
      const next = await applyBlogAiActionWithRuntime(activePost, action, blogAiRuntime);
      setBlogPosts((current) =>
        current.map((post) =>
          post.id === activePost.id
            ? {
                ...next,
                slug: ensureBlogSlug(next.slug || createBlogSlug(next.title), current, post.id),
              }
            : post,
        ),
      );

      const noteMap = {
        title: 'AI generated a stronger blog title and SEO title.',
        meta: 'AI generated a cleaner meta description for search.',
        outline: 'AI created a clearer article outline.',
        article: 'AI drafted a full article structure with hook, problem, solution, product mention, and CTA.',
        readability: 'AI simplified the article so it is easier to scan.',
        keyword: 'AI inserted the primary keyword more naturally into the article.',
        'keyword-article': 'AI generated a full beginner-friendly article from the primary keyword.',
        'title-suggestions': 'AI suggested a few title options. Pick one and apply with one click.',
        'heading-suggestions': 'AI suggested H1, H2, and H3 heading ideas for easier article structure.',
        expand: 'AI expanded your short draft into a fuller article body.',
        'rewrite-seo': 'AI rewrote the draft for clearer search-friendly wording.',
      } as const;

      if (canUseApi) {
        setBlogActionNote(`Real AI API: ${noteMap[action]}`);
      } else if (blogAiRuntime.mode === 'api' && !blogAiRuntime.connected) {
        setBlogActionNote(`API mode selected but not connected yet. Template AI was used: ${noteMap[action]}`);
      } else {
        setBlogActionNote(`Template AI: ${noteMap[action]}`);
      }
    } catch (error) {
      setBlogActionNote(
        `Real AI request failed. Check endpoint/key connection. Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  const checkBlogAiConnection = async () => {
    if (isTestingBlogAi) {
      return;
    }

    setIsTestingBlogAi(true);
    const connected = await testBlogAiConnection(blogAiRuntime);
    setBlogAiRuntime((current) => ({
      ...current,
      connected,
    }));
    setIsTestingBlogAi(false);

    if (connected) {
      setBlogActionNote('Real AI API is connected. Blog assistant will now use real AI output.');
    } else {
      setBlogActionNote('AI API is not connected yet. Template AI remains active until connection succeeds.');
    }
  };

  const toggleRelation = (field: 'relatedProductIds' | 'relatedCollectionIds' | 'relatedPostIds', id: string) => {
    updateActivePost((post) => ({
      ...post,
      [field]: post[field].includes(id) ? post[field].filter((entry) => entry !== id) : [...post[field], id],
    }));
  };

  const setCtaBlockEnabled = (type: BlogCtaType, enabled: boolean) => {
    updateActivePost((post) => {
      const exists = post.ctaBlocks.some((block) => block.type === type);
      if (enabled && !exists) {
        const defaults: Record<BlogCtaType, { label: string; href: string }> = {
          'product-card': { label: 'Featured Product', href: '/products/silk-evening-abaya' },
          'buy-now': { label: 'Buy Now', href: '/products/silk-evening-abaya' },
          whatsapp: { label: 'WhatsApp Us', href: 'https://wa.me/60123456789' },
        };

        return {
          ...post,
          ctaBlocks: [...post.ctaBlocks, { id: `${post.id}-${type}`, type, ...defaults[type] }],
        };
      }

      if (!enabled) {
        return {
          ...post,
          ctaBlocks: post.ctaBlocks.filter((block) => block.type !== type),
        };
      }

      return post;
    });
  };

  const updateCtaBlock = (type: BlogCtaType, key: 'label' | 'href', value: string) => {
    updateActivePost((post) => ({
      ...post,
      ctaBlocks: post.ctaBlocks.map((block) => (block.type === type ? { ...block, [key]: value } : block)),
    }));
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
                normalizeBlogPost({
                  id: `blog-${Date.now()}`,
                  title: 'New SEO article',
                  status: 'Draft',
                  keyword: 'long tail keyword',
                  summary: 'Use this for organic search, educational content, and category discovery.',
                  coverImage: 'New blog cover',
                  coverImagePreview: categories[0]?.coverUrl,
                }),
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
                    <p className="text-sm text-on-surface-variant">Primary keyword: {post.primaryKeyword}</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBlogHelpAssistant((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-low px-4 py-2 text-sm text-on-surface transition-colors hover:border-primary/30 hover:text-primary"
            >
              <CircleHelp className="h-4 w-4" />
              Need Help?
            </button>
            <a
              href="#/frontend/blog"
              className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
            >
              Open Frontstore Blog Preview
            </a>
          </div>
        </div>

        {activePost && (
          <>
            {showBlogHelpAssistant ? (
              <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Quick Blog Help</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Tap one question for a simple answer.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBlogHelpAssistant(false)}
                    className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    Hide
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {blogHelpQuestions.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveBlogHelpQuestionId(question.id)}
                      className={`rounded-full px-3 py-2 text-xs transition-colors ${
                        activeBlogHelpQuestion.id === question.id
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant/20 bg-surface-low text-on-surface hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {question.question}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4 text-sm leading-6 text-on-surface-variant">
                  {activeBlogHelpQuestion.answer}
                </div>
              </div>
            ) : null}

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
                      <p className="text-xs text-on-surface-variant">Recommended: 1600 x 900 or 1200 x 630 so the blog card and article header both look clean.</p>
                    </div>
                    {activePost.coverImagePreview && (
                      <img
                        src={activePost.coverImagePreview}
                        alt={activePost.title}
                        className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                      />
                    )}
                  </div>
                  {activePost.coverImagePreview?.startsWith('blob:') ? (
                    <button
                      type="button"
                      onClick={handleClearBlogCover}
                      className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-low"
                    >
                      Remove Cover
                    </button>
                  ) : null}
                </div>
              </EditorField>
              <div className="grid gap-4 md:grid-cols-2">
                <EditorField label="Article Title">
                  <input
                    value={activePost.title}
                    onChange={(event) =>
                      updateActivePost((post) => ({
                        ...post,
                        title: event.target.value,
                        slug: ensureBlogSlug(createBlogSlug(event.target.value), blogPosts, post.id),
                      }))
                    }
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </EditorField>
                <EditorField label="Author">
                  <input
                    value={activePost.author}
                    onChange={(event) => updateActivePost((post) => ({ ...post, author: event.target.value }))}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </EditorField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <EditorField label="Publish Date">
                  <input
                    type="date"
                    value={activePost.publishDate}
                    onChange={(event) => updateActivePost((post) => ({ ...post, publishDate: event.target.value }))}
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </EditorField>
                <EditorField label="URL Slug">
                  <input
                    value={activePost.slug}
                    onChange={(event) =>
                      updateActivePost((post) => ({
                        ...post,
                        slug: ensureBlogSlug(event.target.value, blogPosts, post.id),
                      }))
                    }
                    className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </EditorField>
              </div>
              <EditorField label="Primary Keyword">
                <input
                  value={activePost.primaryKeyword}
                  onChange={(event) =>
                    updateActivePost((post) => ({
                      ...post,
                      primaryKeyword: event.target.value,
                      keyword: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>
              <EditorField label="Summary">
                <input
                  value={activePost.summary}
                  onChange={(event) =>
                    updateActivePost((post) => ({ ...post, summary: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">SEO Setup</p>
                <div className="mt-4 space-y-4">
                  <EditorField label="SEO Title">
                    <input
                      value={activePost.seoTitle}
                      onChange={(event) => updateActivePost((post) => ({ ...post, seoTitle: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Meta Description">
                    <textarea
                      rows={3}
                      value={activePost.metaDescription}
                      onChange={(event) => updateActivePost((post) => ({ ...post, metaDescription: event.target.value }))}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Google Preview</p>
                    <p className="mt-3 text-xs text-success">{blogPreview?.url}</p>
                    <h4 className="mt-2 text-lg font-semibold text-primary">{blogPreview?.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{blogPreview?.description}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-on-surface">Simple Blog Guide</p>
                  <button
                    type="button"
                    onClick={() => setShowBlogGuide((current) => !current)}
                    className="rounded-full border border-outline-variant/20 bg-white px-3 py-1 text-xs text-on-surface transition-colors hover:bg-surface-low"
                  >
                    {showBlogGuide ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showBlogGuide ? (
                  <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
                    <div className="rounded-2xl border border-outline-variant/20 bg-white p-3">
                      <p className="font-medium text-on-surface">Step 1: Set your topic first</p>
                      <p className="mt-1">Fill in title + primary keyword so AI can generate better article ideas.</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-white p-3">
                      <p className="font-medium text-on-surface">Step 2: Let AI draft quickly</p>
                      <p className="mt-1">Use `Generate Article From Keyword`, then refine using `Expand` or `Rewrite`.</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-white p-3">
                      <p className="font-medium text-on-surface">Step 3: Check preview and publish</p>
                      <p className="mt-1">Review SEO title, meta description, and Google preview before publishing.</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/20 bg-white p-3">
                      <p className="font-medium text-on-surface">What is upload image for?</p>
                      <p className="mt-1">This is blog cover image. It appears on blog listing and when article is opened, so your post looks more trusted and clickable.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-on-surface">AI Source</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      blogAiRuntime.mode === 'api' && blogAiRuntime.connected
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {blogAiRuntime.mode === 'api' && blogAiRuntime.connected ? 'Real AI Connected' : 'Template AI Active'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">
                  You can start with Template AI for free. Switch to Real AI when your API is ready.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBlogAiRuntime((current) => ({
                        ...current,
                        mode: 'template',
                      }))
                    }
                    className={`rounded-full px-3 py-2 text-xs transition-colors ${
                      blogAiRuntime.mode === 'template'
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                    }`}
                  >
                    Template AI (No API)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBlogAiRuntime((current) => ({
                        ...current,
                        mode: 'api',
                      }))
                    }
                    className={`rounded-full px-3 py-2 text-xs transition-colors ${
                      blogAiRuntime.mode === 'api'
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                    }`}
                  >
                    Real AI API
                  </button>
                </div>
                {blogAiRuntime.mode === 'api' ? (
                  <div className="mt-4 grid gap-3">
                    <input
                      value={blogAiRuntime.endpoint ?? ''}
                      onChange={(event) =>
                        setBlogAiRuntime((current) => ({
                          ...current,
                          endpoint: event.target.value,
                          connected: false,
                        }))
                      }
                      placeholder="AI endpoint, example: /api/ai/blog"
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      value={blogAiRuntime.apiKey ?? ''}
                      onChange={(event) =>
                        setBlogAiRuntime((current) => ({
                          ...current,
                          apiKey: event.target.value,
                          connected: false,
                        }))
                      }
                      placeholder="Optional API key"
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={checkBlogAiConnection}
                      disabled={isTestingBlogAi}
                      className="rounded-full border border-outline-variant/20 bg-white px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low disabled:opacity-60"
                    >
                      {isTestingBlogAi ? 'Testing...' : 'Test AI Connection'}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">AI Blog Assistant</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SeoActionButton label="Generate Article From Keyword" onClick={() => runBlogAiAction('keyword-article')} />
                  <SeoActionButton label="Suggest Blog Titles" onClick={() => runBlogAiAction('title-suggestions')} />
                  <SeoActionButton label="Suggest Headings (H1/H2/H3)" onClick={() => runBlogAiAction('heading-suggestions')} />
                  <SeoActionButton label="Expand Short Content" onClick={() => runBlogAiAction('expand')} />
                  <SeoActionButton label="Rewrite Content For SEO" onClick={() => runBlogAiAction('rewrite-seo')} />
                  <SeoActionButton label="Generate Meta Description" onClick={() => runBlogAiAction('meta')} />
                </div>
                {activePost.aiTitleSuggestions?.length ? (
                  <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Suggested Titles</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activePost.aiTitleSuggestions.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() =>
                            updateActivePost((post) => ({
                              ...post,
                              title,
                              seoTitle: title,
                              slug: ensureBlogSlug(createBlogSlug(title), blogPosts, post.id),
                            }))
                          }
                          className="rounded-full border border-outline-variant/20 bg-white px-3 py-2 text-xs text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-low"
                        >
                          Use: {title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {activePost.aiHeadingSuggestions ? (
                  <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Suggested Headings</p>
                    <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">H1</p>
                        <p className="mt-1 text-sm font-medium text-on-surface">{activePost.aiHeadingSuggestions.h1}</p>
                        <button
                          type="button"
                          onClick={() =>
                            updateActivePost((post) => ({
                              ...post,
                              title: post.aiHeadingSuggestions?.h1 || post.title,
                              seoTitle: post.aiHeadingSuggestions?.h1 || post.seoTitle,
                              slug: ensureBlogSlug(createBlogSlug(post.aiHeadingSuggestions?.h1 || post.title), blogPosts, post.id),
                            }))
                          }
                          className="mt-2 rounded-full border border-outline-variant/20 bg-white px-3 py-1 text-xs text-on-surface transition-colors hover:bg-surface-low"
                        >
                          Use H1 as title
                        </button>
                      </div>
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">H2</p>
                        <p className="mt-1">{activePost.aiHeadingSuggestions.h2.join(' - ')}</p>
                      </div>
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-low p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">H3</p>
                        <p className="mt-1">{activePost.aiHeadingSuggestions.h3.join(' - ')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateActivePost((post) => ({
                            ...post,
                            outline: [
                              ...(post.aiHeadingSuggestions?.h2 ?? []),
                              ...(post.aiHeadingSuggestions?.h3 ?? []),
                            ],
                          }))
                        }
                        className="rounded-full border border-outline-variant/20 bg-white px-3 py-2 text-xs text-on-surface transition-colors hover:bg-surface-low"
                      >
                        Use H2/H3 as article outline
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 rounded-2xl border border-primary/15 bg-[rgba(108,92,231,0.06)] p-4 text-sm text-on-surface-variant">{blogActionNote}</div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">Content Flow</p>
                <p className="mt-2 text-sm text-on-surface-variant">Use this simple structure so the article feels clear, helpful, and conversion-focused.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <EditorField label="Hook">
                    <textarea
                      rows={2}
                      value={activePost.contentFlow.hook}
                      onChange={(event) =>
                        updateActivePost((post) => ({ ...post, contentFlow: { ...post.contentFlow, hook: event.target.value } }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Problem">
                    <textarea
                      rows={2}
                      value={activePost.contentFlow.problem}
                      onChange={(event) =>
                        updateActivePost((post) => ({ ...post, contentFlow: { ...post.contentFlow, problem: event.target.value } }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Solution">
                    <textarea
                      rows={2}
                      value={activePost.contentFlow.solution}
                      onChange={(event) =>
                        updateActivePost((post) => ({ ...post, contentFlow: { ...post.contentFlow, solution: event.target.value } }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                  <EditorField label="Product Mention">
                    <textarea
                      rows={2}
                      value={activePost.contentFlow.productMention}
                      onChange={(event) =>
                        updateActivePost((post) => ({ ...post, contentFlow: { ...post.contentFlow, productMention: event.target.value } }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                </div>
                <div className="mt-4">
                  <EditorField label="CTA">
                    <textarea
                      rows={2}
                      value={activePost.contentFlow.cta}
                      onChange={(event) =>
                        updateActivePost((post) => ({ ...post, contentFlow: { ...post.contentFlow, cta: event.target.value } }))
                      }
                      className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </EditorField>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateActivePost((post) => ({
                      ...post,
                      content: [
                        `Hook: ${post.contentFlow.hook}`,
                        `Problem: ${post.contentFlow.problem}`,
                        `Solution: ${post.contentFlow.solution}`,
                        `Product Mention: ${post.contentFlow.productMention}`,
                        `CTA: ${post.contentFlow.cta}`,
                      ].join('\n\n'),
                    }))
                  }
                  className="mt-4 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-white"
                >
                  Apply Flow To Article
                </button>
              </div>

              <EditorField label="Content Editor">
                <textarea
                  rows={12}
                  value={activePost.content}
                  onChange={(event) =>
                    updateActivePost((post) => ({ ...post, content: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </EditorField>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">Internal Linking</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Link Products</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {products.slice(0, 4).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleRelation('relatedProductIds', product.id)}
                          className={`rounded-full px-3 py-2 text-xs transition-colors ${
                            activePost.relatedProductIds.includes(product.id)
                              ? 'bg-primary text-on-primary'
                              : 'border border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                          }`}
                        >
                          {product.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Link Collections</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.slice(0, 4).map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleRelation('relatedCollectionIds', category.id)}
                          className={`rounded-full px-3 py-2 text-xs transition-colors ${
                            activePost.relatedCollectionIds.includes(category.id)
                              ? 'bg-primary text-on-primary'
                              : 'border border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Link Other Blog Posts</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {blogPosts.filter((post) => post.id !== activePost.id).map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => toggleRelation('relatedPostIds', post.id)}
                          className={`rounded-full px-3 py-2 text-xs transition-colors ${
                            activePost.relatedPostIds.includes(post.id)
                              ? 'bg-primary text-on-primary'
                              : 'border border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                          }`}
                        >
                          {post.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-semibold text-on-surface">CTA Blocks</p>
                <div className="mt-4 space-y-4">
                  {([
                    ['product-card', 'Product Card'],
                    ['buy-now', 'Buy Now Button'],
                    ['whatsapp', 'WhatsApp CTA'],
                  ] as Array<[BlogCtaType, string]>).map(([type, label]) => {
                    const block = activePost.ctaBlocks.find((entry) => entry.type === type);
                    return (
                      <div key={type} className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                        <ToggleRow
                          checked={!!block}
                          label={label}
                          description={block ? 'This CTA block will appear inside the article preview.' : 'Turn this on to add a conversion block inside the article.'}
                          onToggle={() => setCtaBlockEnabled(type, !block)}
                        />
                        {block ? (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <input
                              value={block.label}
                              onChange={(event) => updateCtaBlock(type, 'label', event.target.value)}
                              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                              placeholder="Button label"
                            />
                            <input
                              value={block.href}
                              onChange={(event) => updateCtaBlock(type, 'href', event.target.value)}
                              className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                              placeholder="Link or WhatsApp URL"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateActivePost((post) => ({
                      ...post,
                      status: post.status === 'Published' ? 'Draft' : 'Published',
                    }))
                  }
                  className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
                >
                  {activePost.status === 'Published' ? 'Move to Draft' : 'Publish Article'}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium text-on-surface">How this blog should work</p>
              <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                <p>Use blog to bring Google traffic into the store, not just to publish random content.</p>
                <p>Each article should educate first, then naturally guide readers into products, collections, or WhatsApp.</p>
                <p>Only `Published` articles appear in `Frontstore Preview {'>'} Blog / Journal`.</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-white p-4">
              <p className="text-sm font-semibold text-on-surface">Conversion Preview</p>
              <div className="mt-4 space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">{activePost.author} - {activePost.publishDate}</p>
                  <h4 className="mt-2 text-xl font-semibold text-on-surface">{activePost.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{activePost.summary}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm whitespace-pre-line text-on-surface-variant">{activePost.content}</p>
                </div>
                {activePost.relatedProductIds.length ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-on-surface">Linked Products</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-on-surface-variant">
                      {activePost.relatedProductIds.map((id) => {
                        const product = products.find((entry) => entry.id === id);
                        return <span key={id} className="rounded-full border border-outline-variant/20 px-3 py-2">{product?.title ?? id}</span>;
                      })}
                    </div>
                  </div>
                ) : null}
                {activePost.ctaBlocks.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activePost.ctaBlocks.map((block) => (
                      <a key={block.id} href={block.href} className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary">
                        {block.label}
                      </a>
                    ))}
                  </div>
                ) : null}
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
  const themeBuilderStudioDefaults = builderStudioThemeDefaults[theme.id] ?? builderStudioThemeDefaults['luxe-atelier'];
  const shellItemById = Object.fromEntries(builderStudioShellItems.map((item) => [item.id, item])) as Record<
    (typeof builderStudioShellItems)[number]['id'],
    (typeof builderStudioShellItems)[number]
  >;
  const sectionImageObjectUrlsRef = useRef(new Map<string, string>());
  const sectionBackgroundObjectUrlsRef = useRef(new Map<string, string>());
  const headerLogoObjectUrlRef = useRef<string | null>(null);
  const brandingBackgroundObjectUrlRef = useRef<string | null>(null);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [editorTab, setEditorTab] = useState<EditorTab>('content');
  const [storePage, setStorePage] = useState<StorePageKey>('homepage');
  const [sections, setSections] = useState<BuilderSectionItem[]>(
    () => loadBuilderHomepageState(theme.id).sections as BuilderSectionItem[],
  );
  const [activeSectionId, setActiveSectionId] = useState<string>(
    () => loadBuilderHomepageState(theme.id).sections[0].id,
  );
  const [activeSurface, setActiveSurface] = useState<SurfaceTarget>('section');
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    announcementEnabled: true,
    announcementText: theme.preview.announcement,
    announcementLink: '#/collections/new',
    logoText: theme.name,
    menuItems: ['Home', 'Collections', 'New Arrivals', 'Contact'],
    logoPosition: themeBuilderStudioDefaults.logoPosition,
    logoWidth: 160,
    useTextLogo: false,
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
    copyright: `Copyright 2026 ${theme.name}. All rights reserved.`,
  });
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    primaryColor: theme.accent,
    surfaceColor: '#f8f6f1',
    headingFont: theme.styleTag,
    buttonRadius: themeBuilderStudioDefaults.buttonShape,
    pageWidth: themeBuilderStudioDefaults.pageWidth,
    sectionSpacing: themeBuilderStudioDefaults.sectionSpacing,
    cardRadius: themeBuilderStudioDefaults.cardRadius,
    backgroundStyle: themeBuilderStudioDefaults.backgroundStyle,
  });

  const activeSection = sections.find((item) => item.id === activeSectionId) ?? sections[0];

  useEffect(() => {
    const savedState = loadBuilderHomepageState(theme.id);
    setSections(savedState.sections as BuilderSectionItem[]);
    setActiveSectionId(savedState.sections[0].id);
  }, [theme.id]);

  useEffect(() => {
    saveBuilderHomepageState({
      themeId: theme.id,
      sections,
    });
  }, [sections, theme.id]);

  const handleSectionImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const sectionId = activeSection.id;
    const previousObjectUrl = sectionImageObjectUrlsRef.current.get(sectionId);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    sectionImageObjectUrlsRef.current.set(sectionId, nextObjectUrl);

    updateNestedSection('content', {
      image: file.name,
      imagePreview: nextObjectUrl,
    });
  };

  const handleHeaderLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (headerLogoObjectUrlRef.current) {
      URL.revokeObjectURL(headerLogoObjectUrlRef.current);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    headerLogoObjectUrlRef.current = nextObjectUrl;

    setHeaderConfig((current) => ({
      ...current,
      logoImage: nextObjectUrl,
      logoText: current.logoText || file.name.replace(/\.[^.]+$/, ''),
      useTextLogo: false,
    }));
  };

  const handleSectionBackgroundUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const sectionId = activeSection.id;
    const previousObjectUrl = sectionBackgroundObjectUrlsRef.current.get(sectionId);
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    sectionBackgroundObjectUrlsRef.current.set(sectionId, nextObjectUrl);
    updateNestedSection('style', {
      backgroundStyle: 'image',
      backgroundImage: nextObjectUrl,
    });
  };

  const handleBrandingBackgroundUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (brandingBackgroundObjectUrlRef.current) {
      URL.revokeObjectURL(brandingBackgroundObjectUrlRef.current);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    brandingBackgroundObjectUrlRef.current = nextObjectUrl;
    setBrandingConfig((current) => ({
      ...current,
      backgroundStyle: 'image',
      backgroundImage: nextObjectUrl,
    }));
  };

  useEffect(() => {
    return () => {
      for (const objectUrl of sectionImageObjectUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }

      for (const objectUrl of sectionBackgroundObjectUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }

      if (headerLogoObjectUrlRef.current) {
        URL.revokeObjectURL(headerLogoObjectUrlRef.current);
      }

      if (brandingBackgroundObjectUrlRef.current) {
        URL.revokeObjectURL(brandingBackgroundObjectUrlRef.current);
      }
    };
  }, []);

  const canvasWidthClass =
    device === 'desktop'
      ? brandingConfig.pageWidth === 'wide'
        ? 'max-w-[1320px]'
        : 'max-w-[1180px]'
      : device === 'tablet'
        ? 'max-w-[820px]'
        : 'max-w-[390px]';

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
  const quickEditSectionLabel = getBuilderSelectionLabel(activeSurface, activeSection.label);
  const panelGroups: BuilderPanelGroup[] = buildBuilderPanelGroups({
    activeSurface,
    editorTab,
    sectionKind: activeSection.kind,
  });
  const renderPanelGroupContent = (groupId: string) => {
    if (activeSurface === 'section') {
      if (editorTab === 'content') {
        if (groupId === 'content') {
          return (
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
            </>
          );
        }

        if (groupId === 'media') {
          return (
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
                      Recommended: hero 1920 x 1080, collection tile 1200 x 1200, keep under 300KB when possible.
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
                    onClick={() => {
                      const previousObjectUrl = sectionImageObjectUrlsRef.current.get(activeSection.id);
                      if (previousObjectUrl) {
                        URL.revokeObjectURL(previousObjectUrl);
                        sectionImageObjectUrlsRef.current.delete(activeSection.id);
                      }

                      updateNestedSection('content', { imagePreview: undefined });
                    }}
                    className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-low"
                  >
                    Remove Photo Preview
                  </button>
                )}
              </div>
            </EditorField>
          );
        }

        if (groupId === 'links') {
          return (
            <>
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
          );
        }
      }

      if (editorTab === 'layout') {
        if (groupId === 'layout') {
          return (
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
              <EditorField label="Image Focus">
                <select
                  value={activeSection.style.imageFocus}
                  onChange={(event) => updateNestedSection('style', { imageFocus: event.target.value as BuilderSectionItem['style']['imageFocus'] })}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {imageFocusOptions.map((option) => (
                    <option key={option} value={option}>
                      {capitalize(option)}
                    </option>
                  ))}
                </select>
              </EditorField>
            </>
          );
        }

        if (groupId === 'spacing') {
          return (
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
          );
        }

        if (groupId === 'width') {
          return (
            <>
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
              <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 text-sm text-on-surface-variant">
                Seller-friendly rule: layout controls should stay simple. Let seller change alignment, section height, and spacing without turning this into a developer panel.
              </div>
            </>
          );
        }
      }

      if (editorTab === 'style') {
        if (groupId === 'style') {
          return (
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
              <EditorField label="Image Fit">
                <select
                  value={activeSection.style.imageFit}
                  onChange={(event) => updateNestedSection('style', { imageFit: event.target.value as BuilderSectionItem['style']['imageFit'] })}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {imageFitOptions.map((option) => (
                    <option key={option} value={option}>
                      {capitalize(option)}
                    </option>
                  ))}
                </select>
              </EditorField>
              <EditorField label="Image Shape">
                <select
                  value={activeSection.style.imageShape}
                  onChange={(event) => updateNestedSection('style', { imageShape: event.target.value as BuilderSectionItem['style']['imageShape'] })}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {imageShapeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'soft-rounded' ? 'Soft Rounded' : capitalize(option)}
                    </option>
                  ))}
                </select>
              </EditorField>
            </>
          );
        }

        if (groupId === 'background') {
          return (
            <>
              <EditorField label="Background Style">
                <select
                  value={activeSection.style.backgroundStyle}
                  onChange={(event) => updateNestedSection('style', { backgroundStyle: event.target.value as BuilderSectionItem['style']['backgroundStyle'] })}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {backgroundStyleOptions.map((option) => (
                    <option key={option} value={option}>
                      {capitalize(option)}
                    </option>
                  ))}
                </select>
              </EditorField>
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
              <EditorField label="Background Image">
                <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    Upload Background
                    <input type="file" accept="image/*" onChange={handleSectionBackgroundUpload} className="hidden" />
                  </label>
                  {activeSection.style.backgroundImage && (
                    <>
                      <img src={activeSection.style.backgroundImage} alt={`${activeSection.label} background`} className="h-24 w-full rounded-2xl object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const previousObjectUrl = sectionBackgroundObjectUrlsRef.current.get(activeSection.id);
                          if (previousObjectUrl) {
                            URL.revokeObjectURL(previousObjectUrl);
                            sectionBackgroundObjectUrlsRef.current.delete(activeSection.id);
                          }
                          updateNestedSection('style', { backgroundImage: undefined, backgroundStyle: 'plain' });
                        }}
                        className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-low"
                      >
                        Remove Background
                      </button>
                    </>
                  )}
                </div>
              </EditorField>
            </>
          );
        }

        if (groupId === 'advanced') {
          return (
            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-on-surface">Image Guidelines</p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                <p>Hero Banner: 1920 x 1080 | max 300KB</p>
                <p>Category Image: 800 x 800</p>
                <p>Product Image: 1000 x 1000 | max 200KB</p>
                <p>Thumbnail: 500 x 500</p>
              </div>
            </div>
          );
        }
      }
    }

    if (activeSurface === 'header') {
      if (groupId === 'logo') {
        return (
          <>
            <EditorField label="Logo Upload">
              <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleHeaderLogoUpload} className="hidden" />
                </label>
                <p className="text-xs text-on-surface-variant">Recommended: transparent PNG or SVG-style logo, around 320 x 120 for clean header display.</p>
                {headerConfig.logoImage && (
                  <div className="flex items-center gap-3 rounded-2xl bg-surface-low p-3">
                    <img src={headerConfig.logoImage} alt="Store logo" className="h-12 w-auto max-w-[160px] object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        if (headerLogoObjectUrlRef.current) {
                          URL.revokeObjectURL(headerLogoObjectUrlRef.current);
                          headerLogoObjectUrlRef.current = null;
                        }

                        setHeaderConfig((current) => ({ ...current, logoImage: undefined }));
                      }}
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
            <EditorField label="Logo Position">
              <select
                value={headerConfig.logoPosition}
                onChange={(event) => setHeaderConfig((current) => ({ ...current, logoPosition: event.target.value as HeaderConfig['logoPosition'] }))}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {logoPositionOptions.map((option) => (
                  <option key={option} value={option}>
                    {capitalize(option)}
                  </option>
                ))}
              </select>
            </EditorField>
            <EditorField label="Logo Width">
              <input
                type="range"
                min={96}
                max={240}
                value={headerConfig.logoWidth}
                onChange={(event) => setHeaderConfig((current) => ({ ...current, logoWidth: Number(event.target.value) }))}
                className="w-full accent-primary"
              />
            </EditorField>
            <ToggleRow
              label="Use Text Logo"
              description="Use text-only logo when image logo is not needed."
              checked={headerConfig.useTextLogo}
              onToggle={() => setHeaderConfig((current) => ({ ...current, useTextLogo: !current.useTextLogo }))}
            />
          </>
        );
      }

      if (groupId === 'announcement') {
        return (
          <>
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
          </>
        );
      }

      if (groupId === 'behavior') {
        return (
          <>
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
              Header layout follows logo position first, then theme default. Seller can override this anytime.
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 text-sm text-on-surface-variant">
              Theme header style for <span className="font-medium text-on-surface">{theme.name}</span>: {getHeaderStyleLabel(theme.headerStyle)}. This is where theme differences should start becoming visible.
            </div>
          </>
        );
      }
    }

    if (activeSurface === 'footer') {
      if (groupId === 'content') {
        return (
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
          </>
        );
      }

      if (groupId === 'columns') {
        return (
          <>
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
          </>
        );
      }

      if (groupId === 'newsletter') {
        return (
          <ToggleRow
            label="Newsletter Sign-up"
            description="Good for growing audience and launch reminders."
            checked={footerConfig.newsletterEnabled}
            onToggle={() => setFooterConfig((current) => ({ ...current, newsletterEnabled: !current.newsletterEnabled }))}
          />
        );
      }
    }

    if (activeSurface === 'branding') {
      if (groupId === 'theme') {
        return (
          <>
            <EditorField label="Primary Accent Color">
              <input
                value={brandingConfig.primaryColor}
                onChange={(event) => setBrandingConfig((current) => ({ ...current, primaryColor: event.target.value }))}
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
          </>
        );
      }

      if (groupId === 'layout') {
        return (
          <>
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
            <EditorField label="Page Width">
              <select
                value={brandingConfig.pageWidth}
                onChange={(event) =>
                  setBrandingConfig((current) => ({
                    ...current,
                    pageWidth: event.target.value as BrandingConfig['pageWidth'],
                  }))
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="contained">Contained</option>
                <option value="wide">Wide</option>
              </select>
            </EditorField>
            <EditorField label="Section Spacing">
              <select
                value={brandingConfig.sectionSpacing}
                onChange={(event) =>
                  setBrandingConfig((current) => ({
                    ...current,
                    sectionSpacing: event.target.value as BrandingConfig['sectionSpacing'],
                  }))
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="tight">Tight</option>
                <option value="comfortable">Comfortable</option>
                <option value="airy">Airy</option>
              </select>
            </EditorField>
            <EditorField label="Card Radius">
              <select
                value={brandingConfig.cardRadius}
                onChange={(event) =>
                  setBrandingConfig((current) => ({
                    ...current,
                    cardRadius: event.target.value as BrandingConfig['cardRadius'],
                  }))
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="soft-rounded">Soft Rounded</option>
                <option value="rounded">Rounded</option>
                <option value="sharp">Sharp</option>
              </select>
            </EditorField>
          </>
        );
      }

      if (groupId === 'background') {
        return (
          <>
            <EditorField label="Canvas Surface Color">
              <input
                value={brandingConfig.surfaceColor}
                onChange={(event) => setBrandingConfig((current) => ({ ...current, surfaceColor: event.target.value }))}
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </EditorField>
            <EditorField label="Default Background Style">
              <select
                value={brandingConfig.backgroundStyle}
                onChange={(event) =>
                  setBrandingConfig((current) => ({
                    ...current,
                    backgroundStyle: event.target.value as BrandingConfig['backgroundStyle'],
                  }))
                }
                className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {backgroundStyleOptions.map((option) => (
                  <option key={option} value={option}>
                    {capitalize(option)}
                  </option>
                ))}
              </select>
            </EditorField>
            <EditorField label="Background Image">
              <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  Upload Theme Background
                  <input type="file" accept="image/*" onChange={handleBrandingBackgroundUpload} className="hidden" />
                </label>
                {brandingConfig.backgroundImage && (
                  <>
                    <img src={brandingConfig.backgroundImage} alt="Theme background" className="h-24 w-full rounded-2xl object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        if (brandingBackgroundObjectUrlRef.current) {
                          URL.revokeObjectURL(brandingBackgroundObjectUrlRef.current);
                          brandingBackgroundObjectUrlRef.current = null;
                        }
                        setBrandingConfig((current) => ({ ...current, backgroundImage: undefined, backgroundStyle: 'plain' }));
                      }}
                      className="rounded-full border border-outline-variant/20 px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-low"
                    >
                      Remove Theme Background
                    </button>
                  </>
                )}
              </div>
            </EditorField>
          </>
        );
      }
    }

    return null;
  };

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
            <button className="rounded-full border border-outline-variant/20 px-5 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
              Publish
            </button>
          </div>
        </div>

        <div className="grid min-h-[780px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
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
                title={shellItemById.header.title}
                note={shellItemById.header.note}
                onClick={() => setActiveSurface('header')}
              />
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setActiveSurface('section');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveSectionId(section.id);
                      setActiveSurface('section');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={section.id === activeSectionId && activeSurface === 'section'}
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
                      onClick={() => {
                        const previousObjectUrl = sectionImageObjectUrlsRef.current.get(section.id);
                        if (previousObjectUrl) {
                          URL.revokeObjectURL(previousObjectUrl);
                          sectionImageObjectUrlsRef.current.delete(section.id);
                        }

                        removeSection(setSections, sections, section.id, activeSectionId, setActiveSectionId);
                      }}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    />
                  </div>
                </div>
              ))}
              <BuilderSurfaceButton
                active={activeSurface === 'footer'}
                title={shellItemById.footer.title}
                note={shellItemById.footer.note}
                onClick={() => setActiveSurface('footer')}
              />
              <BuilderSurfaceButton
                active={activeSurface === 'branding'}
                title={shellItemById['theme-settings'].title}
                note={shellItemById['theme-settings'].note}
                onClick={() => setActiveSurface('branding')}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-white p-4">
              <p className="text-sm font-medium text-on-surface">{shellItemById.sections.title}</p>
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
                {pageOptionLabels[storePage]} preview - {device}
              </div>

              <div
                className="space-y-0"
                style={getBrandingCanvasStyle(brandingConfig)}
              >
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
                    globalSpacing={brandingConfig.sectionSpacing}
                    globalCardRadius={brandingConfig.cardRadius}
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
                  globalCardRadius={brandingConfig.cardRadius}
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
            <div className="mt-5 space-y-4">
              {panelGroups.map((group) => {
                const content = renderPanelGroupContent(group.id);
                if (!content) {
                  return null;
                }

                return (
                  <section key={group.id} className="rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{group.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">{group.id}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">{content}</div>
                  </section>
                );
              })}
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
  const headerLayout = config.logoPosition === 'center' ? 'center-brand' : config.logoPosition === 'split' ? 'split-nav' : 'left-brand';
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
        {headerLayout === 'center-brand' && (
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

        {headerLayout === 'left-brand' && (
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

        {headerLayout === 'split-nav' && (
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
  globalSpacing,
  globalCardRadius,
  device,
  onQuickEdit,
}: {
  theme: ThemePreset;
  section: BuilderSectionItem;
  accent: string;
  active: boolean;
  onSelect: () => void;
  buttonRadius: BrandingConfig['buttonRadius'];
  globalSpacing: BrandingConfig['sectionSpacing'];
  globalCardRadius: BrandingConfig['cardRadius'];
  device: DeviceMode;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  const textAlign = section.layout.alignment === 'left' ? 'text-left items-start' : section.layout.alignment === 'right' ? 'text-right items-end' : 'text-center items-center';
  const heightClass = section.layout.height === 'compact' ? 'min-h-[220px]' : section.layout.height === 'medium' ? 'min-h-[320px]' : 'min-h-[420px]';
  const resolvedSpacing = section.layout.spacing === 'comfortable' ? globalSpacing : section.layout.spacing;
  const spacingClass = resolvedSpacing === 'tight' ? 'p-6' : resolvedSpacing === 'comfortable' ? 'p-10' : 'p-14';
  const buttonRadiusClass = buttonRadius === 'pill' ? 'rounded-full' : buttonRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const cardRadiusClass = globalCardRadius === 'soft-rounded' ? 'rounded-[28px]' : globalCardRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const imageShapeClass = section.style.imageShape === 'soft-rounded' ? 'rounded-[28px]' : section.style.imageShape === 'rounded' ? 'rounded-xl' : 'rounded-none';
  const imageObjectFitClass = section.style.imageFit === 'contain' ? 'object-contain bg-white' : 'object-cover';
  const imageObjectPositionClass = section.style.imageFocus === 'top' ? 'object-top' : section.style.imageFocus === 'bottom' ? 'object-bottom' : 'object-center';
  const heroLayout = getThemeHeroLayout(theme.id);
  const columns = device === 'mobile' ? 'grid-cols-1' : theme.id === 'campaign-glow' || theme.id === 'sage-ritual' ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  const productColumns = device === 'mobile' ? 'grid-cols-2' : theme.id === 'editorial-veil' ? 'sm:grid-cols-3' : 'sm:grid-cols-4';
  const storefrontCategories = categories.filter((item) => item.status === 'Published').slice(0, device === 'mobile' ? 2 : theme.id === 'campaign-glow' || theme.id === 'sage-ritual' ? 4 : 3);
  const storefrontProducts = products.filter((item) => item.status === 'Active').slice(0, device === 'mobile' ? 2 : theme.id === 'editorial-veil' ? 3 : 4);
  const sectionSurfaceClass =
    theme.id === 'luxe-atelier'
      ? 'bg-[#f7f3ed]'
      : theme.id === 'editorial-veil'
        ? 'bg-[#fbf9f5]'
        : theme.id === 'campaign-glow'
          ? 'bg-white'
          : theme.id === 'sage-ritual'
            ? 'bg-[#f3f6ef]'
          : '';

  return (
    <section
      onClick={onSelect}
      className={`group relative border-b border-outline-variant/15 transition-all ${active ? 'ring-2 ring-inset ring-primary' : 'hover:bg-surface-low/50'} ${sectionSurfaceClass}`}
      style={getSectionSurfaceStyle(section)}
    >
      <QuickEditOverlay active={active} onQuickEdit={onQuickEdit} />
      <div className={`relative flex ${heightClass} ${spacingClass} ${textAlign}`}>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              section.content.imagePreview && section.kind === 'hero'
                ? `linear-gradient(135deg, rgba(17,24,39,0.08), rgba(17,24,39,0.18)), url(${section.content.imagePreview}) ${section.style.imageFocus} / ${section.style.imageFit} no-repeat`
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
              <h3 className={`font-semibold ${theme.id === 'editorial-veil' ? 'text-4xl italic sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>{section.content.heading}</h3>
              <p className="max-w-2xl text-sm leading-6 opacity-90 sm:text-base">{section.content.description}</p>
              <div className={`flex ${section.layout.alignment === 'right' ? 'justify-end' : section.layout.alignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                <button className={`${buttonRadiusClass} px-5 py-2 text-sm text-white shadow-sm`} style={{ backgroundColor: accent }}>
                  {section.content.buttonText}
                </button>
              </div>
            </>
          )}

          {section.content.imagePreview && section.kind !== 'hero' && (
            <div className={`overflow-hidden shadow-sm ${theme.id === 'campaign-glow' ? 'border border-black/10' : theme.id === 'sage-ritual' ? 'border border-[#dce8d4] bg-white/95' : 'bg-white/90'} ${cardRadiusClass} ${device === 'mobile' ? 'max-w-full' : 'max-w-[320px]'}`}>
              <img src={section.content.imagePreview} alt={section.content.image} className={`h-48 w-full ${imageShapeClass} ${imageObjectFitClass} ${imageObjectPositionClass}`} />
            </div>
          )}

          {section.kind === 'categories' && (
            <div className={`grid gap-3 pt-2 ${columns}`}>
              {storefrontCategories.map((item) => (
                <div key={item.id} className={`overflow-hidden text-sm text-on-surface shadow-sm ${theme.id === 'campaign-glow' ? 'border border-black/10 bg-white' : theme.id === 'sage-ritual' ? 'border border-[#dce8d4] bg-white/95' : 'bg-white/90'} ${cardRadiusClass}`}>
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
                <div key={item.id} className={`${theme.id === 'campaign-glow' ? 'border border-black/10' : ''} ${cardRadiusClass} bg-white/90 p-4 text-sm text-on-surface shadow-sm`}>
                  <img
                    alt={item.title}
                    className={`mb-3 aspect-square w-full ${imageObjectFitClass} ${imageObjectPositionClass} ${imageShapeClass}`}
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
                <div key={item} className={`${cardRadiusClass} bg-white/90 p-4 text-sm text-on-surface shadow-sm`}>
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
  globalCardRadius,
  active,
  onSelect,
  onQuickEdit,
}: {
  config: FooterConfig;
  branding: BrandingConfig;
  globalCardRadius: BrandingConfig['cardRadius'];
  active: boolean;
  onSelect: () => void;
  onQuickEdit: (tab: EditorTab) => void;
}) {
  const buttonRadiusClass =
    branding.buttonRadius === 'pill' ? 'rounded-full' : branding.buttonRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const cardRadiusClass = globalCardRadius === 'soft-rounded' ? 'rounded-[28px]' : globalCardRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none';

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
            <div className={`mt-6 ${cardRadiusClass} bg-surface-low p-4`}>
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

function getBrandingCanvasStyle(branding: BrandingConfig) {
  if (branding.backgroundStyle === 'image' && branding.backgroundImage) {
    return {
      backgroundColor: branding.surfaceColor,
      backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.84)), url(${branding.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (branding.backgroundStyle === 'gradient') {
    return {
      background: `linear-gradient(180deg, ${branding.surfaceColor}, #ffffff)`,
    };
  }

  return {
    backgroundColor: branding.surfaceColor,
  };
}

function getSectionSurfaceStyle(section: BuilderSectionItem) {
  if (section.style.backgroundStyle === 'image' && section.style.backgroundImage) {
    return {
      color: section.style.textColor,
      backgroundColor: section.style.backgroundColor,
      backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.18)), url(${section.style.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: section.style.imageFocus,
    };
  }

  if (section.style.backgroundStyle === 'gradient') {
    return {
      color: section.style.textColor,
      background: `linear-gradient(180deg, ${section.style.backgroundColor}, rgba(255,255,255,0.92))`,
    };
  }

  return {
    backgroundColor: section.style.backgroundColor,
    color: section.style.textColor,
  };
}

function HeaderLogoMark({ config }: { config: HeaderConfig }) {
  if (config.logoImage && !config.useTextLogo) {
    return <img src={config.logoImage} alt={config.logoText || 'Store logo'} className="mx-auto h-12 w-auto object-contain" style={{ maxWidth: `${config.logoWidth}px` }} />;
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

function ThemePreviewCard({
  theme,
  isPublished,
  onInstallTheme,
  onPublishTheme,
}: {
  theme: ThemeLibraryCardModel;
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
            <p className="mt-2 text-sm font-medium text-on-surface">{theme.fitLabel}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${theme.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : theme.status === 'Installed' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
            {theme.badge}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="overflow-hidden rounded-[24px] border border-outline-variant/20 bg-surface-low shadow-sm">
          <div className="px-4 py-2 text-center text-[11px] text-white" style={{ backgroundColor: theme.accent }}>
            {theme.preview.announcement}
          </div>
          <div className="bg-[linear-gradient(180deg,#eef2ff_0%,#ffffff_100%)] p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.25em] text-on-surface-variant">{theme.name}</div>
            <ThemePreviewSignature theme={theme} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-on-surface-variant">{theme.summary}</p>
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
        <div className="mt-4 rounded-2xl bg-surface-low p-4 text-sm text-on-surface-variant">
          {theme.statusNote}
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

function getSeoScoreTone(label: string) {
  if (label === 'Strong') return 'bg-primary text-on-primary';
  if (label === 'Good') return 'bg-emerald-50 text-emerald-700';
  if (label === 'Fair') return 'bg-amber-50 text-amber-800';
  return 'bg-rose-50 text-rose-700';
}

function getSeoScoreMiniTone(label: string) {
  if (label === 'Strong') return 'strong';
  if (label === 'Good') return 'good';
  if (label === 'Fair') return 'fair';
  return 'poor';
}

function getWorkspaceStateTone(tone: 'good' | 'warning' | 'strong') {
  if (tone === 'strong') return 'bg-primary text-on-primary';
  if (tone === 'good') return 'bg-emerald-50 text-emerald-700';
  return 'bg-amber-50 text-amber-800';
}

function SeoActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-outline-variant/20 bg-surface-low px-4 py-3 text-left text-sm text-on-surface transition-colors hover:border-primary/30 hover:bg-[rgba(108,92,231,0.06)]"
    >
      {label}
    </button>
  );
}

function SeoToneChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-outline-variant/20 bg-white px-4 py-2 text-xs font-medium text-on-surface transition-colors hover:border-primary/30 hover:bg-[rgba(108,92,231,0.06)] hover:text-primary"
    >
      {label}
    </button>
  );
}

function SeoMiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'fair' | 'poor' | 'strong';
}) {
  const toneMap = {
    strong: 'border-primary/20 bg-[rgba(108,92,231,0.08)] text-primary',
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    fair: 'border-amber-200 bg-amber-50 text-amber-800',
    poor: 'border-rose-200 bg-rose-50 text-rose-700',
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
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
      imageFit: 'cover',
      imageFocus: 'center',
      imageShape: 'rounded',
      backgroundStyle: 'plain',
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
  if (themeId === 'luxe-atelier') {
    return 'split-editorial';
  }

  if (themeId === 'editorial-veil' || themeId === 'sage-ritual') {
    return 'airy-story';
  }

  if (themeId === 'campaign-glow') {
    return 'campaign-banner';
  }

  return 'default';
}

function getCategoryItems(themeId: string) {
  if (themeId === 'campaign-glow') {
    return ['New Drop', 'Best Seller', 'Occasion Wear', 'Last Chance'];
  }

  if (themeId === 'editorial-veil') {
    return ['Abaya', 'Hijab', 'Prayer Wear'];
  }

  if (themeId === 'sage-ritual') {
    return ['Skin Care', 'Hair Care', 'Fragrance', 'Body Care'];
  }

  return ['Abaya', 'Hijab', 'Prayer Wear'];
}

function getProductItems(themeId: string) {
  if (themeId === 'editorial-veil') {
    return ['Sandstone Abaya', 'Premium Sand Hijab', 'Celestial Drape'];
  }

  if (themeId === 'campaign-glow') {
    return ['Nude Dress', 'Red Kaftan', 'Lilac Set', 'Evening Wrap'];
  }

  if (themeId === 'sage-ritual') {
    return ['Calming Serum', 'Brightening Oil', 'Hydration Cream', 'Body Elixir'];
  }

  return ['Ethereal Silk Abaya', 'Signature Sand Hijab', 'Evening Drape', 'Atelier Gift Set'];
}

function getTestimonialItems(themeId: string) {
  if (themeId === 'campaign-glow') {
    return ['Fast moving collection and clean mobile feel.', 'Bold but still easy to shop.', 'The product flow feels more campaign-ready now.'];
  }

  if (themeId === 'editorial-veil') {
    return ['Refined quality with a calm premium feel.', 'The storefront feels light and elegant.', 'Everything looks intentional and easy to trust.'];
  }

  if (themeId === 'sage-ritual') {
    return ['The skincare layout feels calm and trustworthy.', 'Categories are easier to browse by routine.', 'The store feels softer without losing conversion clarity.'];
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
