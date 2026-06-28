import type { Category, Product } from '../products/types';
import type { WebsitePageRecord } from '../storefront/websitePagesStore';

const DEFAULT_SITE_URL = 'https://bisora.com';

type CanonicalProduct = Pick<Product, 'id' | 'slug'>;
type CanonicalCategory = Pick<Category, 'id' | 'slug'>;
type CanonicalPage = Pick<WebsitePageRecord, 'id' | 'slug'>;

interface CanonicalContext {
  products: CanonicalProduct[];
  categories: CanonicalCategory[];
  pages: CanonicalPage[];
}

function stripSiteOrigin(value: string) {
  return value.replace(/^https?:\/\/[^/]+/i, '');
}

function stripHashAndQuery(value: string) {
  return value.split('#', 1)[0]?.split('?', 1)[0] ?? '';
}

function normalizePathInput(value: string) {
  const originless = stripSiteOrigin(value.trim());
  const withoutHashQuery = stripHashAndQuery(originless);
  const normalized = withoutHashQuery.replace(/\/+/g, '/').trim();

  if (!normalized || normalized === '/') {
    return '/';
  }

  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function normalizeHashSegments(rawHash: string) {
  const cleaned = rawHash.replace(/^#\/?/, '').split('#', 1)[0] ?? '';
  const [pathOnly] = cleaned.split('?', 1);
  return pathOnly
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function buildAdminCanonicalPath(segments: string[]) {
  if (!segments.length) {
    return '/admin';
  }

  return normalizeCanonicalPath(`/admin/${segments.join('/')}`);
}

function findPageSlug(pages: CanonicalPage[], pageId: string, fallbackPath: string) {
  const match = pages.find((page) => page.id === pageId)?.slug;
  return normalizeCanonicalPath(match || fallbackPath);
}

export function normalizeCanonicalPath(value: string) {
  return normalizePathInput(value);
}

export function buildCanonicalUrl(value: string, siteUrl = DEFAULT_SITE_URL) {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const path = normalizeCanonicalPath(value);
  return `${cleanSiteUrl}${path === '/' ? '' : path}`;
}

export function syncCanonicalUrl(value: string, siteUrl = DEFAULT_SITE_URL) {
  if (typeof document === 'undefined') {
    return;
  }

  const selector = 'link[rel="canonical"]';
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }

  element.href = buildCanonicalUrl(value, siteUrl);
}

export function resolveCanonicalPathFromHash(rawHash: string, context: CanonicalContext) {
  const segments = normalizeHashSegments(rawHash);
  const [segment, section, id] = segments;

  if (!segment || segment === 'dashboard') {
    return '/admin';
  }

  if (segment === 'frontend' || segment === 'frontstore') {
    if (section === 'overview' || section === 'homepage') {
      return findPageSlug(context.pages, 'homepage', '/');
    }

    if (section === 'collection') {
      return id ? normalizeCanonicalPath(`/collections/${id}`) : findPageSlug(context.pages, 'collection', '/collections');
    }

    if (section === 'product') {
      const productSlug = context.products.find((product) => product.slug === id)?.slug ?? id;
      return normalizeCanonicalPath(productSlug ? `/products/${productSlug}` : '/products');
    }

    if (section === 'cart') return '/cart';
    if (section === 'checkout') return '/checkout';
    if (section === 'thank-you') return '/thank-you';
    if (section === 'blog') return '/blog';
  }

  if (segment === 'products') {
    if (section === 'edit') {
      const productSlug = context.products.find((product) => product.id === id)?.slug;
      return productSlug ? normalizeCanonicalPath(`/products/${productSlug}`) : buildAdminCanonicalPath(segments);
    }

    if (section === 'categories' && id) {
      const categorySlug = context.categories.find((category) => category.id === id)?.slug;
      return categorySlug ? normalizeCanonicalPath(`/collections/${categorySlug}`) : buildAdminCanonicalPath(segments);
    }
  }

  return buildAdminCanonicalPath(segments);
}
