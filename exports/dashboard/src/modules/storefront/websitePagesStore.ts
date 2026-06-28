import { useEffect, useSyncExternalStore } from 'react';
import { fetchStoreSettings, saveStoreSettings } from '../../api/settings';
import type { WebsiteBuilderPageSeoInput } from '../websiteBuilder/seo';

const WEBSITE_PAGES_STORAGE_KEY = 'bisora-storefront-pages';

export interface WebsitePageRecord extends WebsiteBuilderPageSeoInput {
  status: string;
}

export const defaultWebsitePages: WebsitePageRecord[] = [
  {
    id: 'homepage',
    title: 'Homepage',
    purpose: 'Main storefront page built inside Builder Studio.',
    status: 'Managed in Builder',
    pageType: 'Homepage',
    heroHeading: 'Define Your Grace',
    subheading: 'Editorial landing page designed to guide buyers into signature collections and premium edits.',
    cta: 'Shop The Edit',
    seoTitle: 'Lumiere Noor Homepage | Luxury Modestwear',
    metaDescription: 'Discover Lumiere Noor luxury modestwear through a refined homepage experience built to guide buyers into curated edits.',
    primaryKeyword: 'luxury modestwear',
    slug: '/',
    openGraphImage: 'https://picsum.photos/seed/category-evening/480/240',
    slugManuallyEdited: true,
  },
  {
    id: 'collection',
    title: 'Collection Page',
    purpose: 'Catalogue page for category browsing, filters, and product discovery.',
    status: 'Managed in Builder',
    pageType: 'Collection',
    heroHeading: 'The Spring Edit',
    subheading: 'A collection page that helps buyers browse clearly while still feeling premium and calm.',
    cta: 'View Collection',
    seoTitle: 'Spring Collection | Lumiere Noor',
    metaDescription: 'Browse the Spring Collection from Lumiere Noor with curated modestwear pieces designed for elegant daily and occasion styling.',
    primaryKeyword: 'spring collection modestwear',
    slug: '/collections/spring-edit',
    openGraphImage: 'https://picsum.photos/seed/category-everyday/480/240',
    slugManuallyEdited: true,
  },
  {
    id: 'about',
    title: 'About The Brand',
    purpose: 'Brand story, trust, mission, and signature aesthetic.',
    status: 'Published',
    pageType: 'Custom Page',
    heroHeading: 'A Quiet Luxury Story',
    subheading: 'Tell buyers why the brand exists, what it values, and what makes the design perspective distinct.',
    cta: 'Read Our Story',
    seoTitle: 'About Lumiere Noor',
    metaDescription: 'Learn the story, values, and design philosophy behind Lumiere Noor.',
    primaryKeyword: 'about lumiere noor',
    slug: '/pages/about-the-brand',
    openGraphImage: 'https://picsum.photos/seed/category-evening/480/240',
    slugManuallyEdited: true,
  },
  {
    id: 'size-guide',
    title: 'Size Guide',
    purpose: 'Sizing help, fit notes, and buying confidence.',
    status: 'Published',
    pageType: 'Support Page',
    heroHeading: 'Find Your Best Fit',
    subheading: 'Help buyers choose the right size with less hesitation and fewer support questions.',
    cta: 'Check Size Guide',
    seoTitle: 'Size Guide',
    metaDescription: 'Use the Lumiere Noor size guide to choose the right fit before placing your order.',
    primaryKeyword: 'abaya size guide',
    slug: '/pages/size-guide',
    openGraphImage: 'https://picsum.photos/seed/category-everyday/480/240',
    slugManuallyEdited: true,
  },
  {
    id: 'contact',
    title: 'Contact & Support',
    purpose: 'Store contact methods, support hours, and inquiry form.',
    status: 'Draft',
    pageType: 'Support Page',
    heroHeading: 'We Are Here To Help',
    subheading: 'Give buyers a simple way to contact the store about orders, sizing, or delivery questions.',
    cta: 'Contact Support',
    seoTitle: 'Contact & Support',
    metaDescription: 'Reach Lumiere Noor support for order help, store inquiries, and delivery questions.',
    primaryKeyword: 'contact lumiere noor',
    slug: '/pages/contact',
    openGraphImage: 'https://picsum.photos/seed/category-season/480/240',
    slugManuallyEdited: true,
  },
];

const pageListeners = new Set<() => void>();
let pageSnapshot: WebsitePageRecord[] | null = null;

function hasApiCredentials() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem('bisora.apiToken') && window.localStorage.getItem('bisora.tenantId'));
}

function readPagesFromStorage(): WebsitePageRecord[] {
  if (typeof window === 'undefined') {
    return defaultWebsitePages;
  }

  const saved = window.localStorage.getItem(WEBSITE_PAGES_STORAGE_KEY);
  if (!saved) {
    return defaultWebsitePages;
  }

  try {
    return JSON.parse(saved) as WebsitePageRecord[];
  } catch {
    return defaultWebsitePages;
  }
}

async function postSitemapRefresh(records: WebsitePageRecord[]) {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  try {
    await window.fetch('/__internal/sitemap-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: records }),
    });
  } catch {
    // Non-blocking in local/dev environments.
  }
}

function notifyPageListeners() {
  pageListeners.forEach((listener) => listener());
}

export function loadWebsitePages() {
  return readPagesFromStorage();
}

export function getWebsitePageSnapshot() {
  if (!pageSnapshot) {
    pageSnapshot = readPagesFromStorage();
  }

  return pageSnapshot;
}

export function saveWebsitePages(records: WebsitePageRecord[]) {
  pageSnapshot = records;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(WEBSITE_PAGES_STORAGE_KEY, JSON.stringify(records));
  }

  void postSitemapRefresh(records);
  notifyPageListeners();
}

export async function syncWebsitePagesFromApi() {
  if (!hasApiCredentials()) {
    return getWebsitePageSnapshot();
  }

  try {
    const settings = await fetchStoreSettings();
    const records = Array.isArray(settings.settings.website_pages)
      ? (settings.settings.website_pages as WebsitePageRecord[])
      : getWebsitePageSnapshot();
    pageSnapshot = records;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WEBSITE_PAGES_STORAGE_KEY, JSON.stringify(records));
    }

    notifyPageListeners();
    return records;
  } catch {
    return getWebsitePageSnapshot();
  }
}

export async function saveWebsitePagesToApi(records: WebsitePageRecord[]) {
  if (!hasApiCredentials()) {
    return records;
  }

  await saveStoreSettings({ settings: { website_pages: records } });
  return records;
}

export function subscribeWebsitePages(listener: () => void) {
  pageListeners.add(listener);
  return () => {
    pageListeners.delete(listener);
  };
}

export function useStorefrontPages() {
  const records = useSyncExternalStore(subscribeWebsitePages, getWebsitePageSnapshot, getWebsitePageSnapshot);

  useEffect(() => {
    void syncWebsitePagesFromApi();
  }, []);

  const setRecords = (
    updater: WebsitePageRecord[] | ((current: WebsitePageRecord[]) => WebsitePageRecord[]),
  ) => {
    const nextRecords = typeof updater === 'function' ? updater(getWebsitePageSnapshot()) : updater;
    saveWebsitePages(nextRecords);
    void saveWebsitePagesToApi(nextRecords);
  };

  return [records, setRecords] as const;
}
