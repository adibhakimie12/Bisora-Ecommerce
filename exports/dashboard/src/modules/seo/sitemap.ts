import type { Category, Product } from '../products/types';
import type { WebsitePageRecord } from '../storefront/websitePagesStore';

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  priority?: number;
}

export function buildSitemapEntries({
  siteUrl,
  generatedAt,
  products,
  categories,
  pages,
  productLastmod = {},
  pageLastmod = {},
}: {
  siteUrl: string;
  generatedAt: string;
  products: Product[];
  categories: Category[];
  pages: WebsitePageRecord[];
  productLastmod?: Record<string, string>;
  pageLastmod?: Record<string, string>;
}): SitemapEntry[] {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');

  const homepage: SitemapEntry = {
    loc: `${cleanSiteUrl}/`,
    lastmod: generatedAt,
    priority: 1,
  };

  const productEntries = products.map((product) => ({
    loc: `${cleanSiteUrl}/products/${product.slug}`,
    lastmod: productLastmod[product.id] ?? generatedAt,
    priority: 0.8,
  }));

  const categoryEntries = categories.map((category) => ({
    loc: `${cleanSiteUrl}/collections/${category.slug}`,
    lastmod: generatedAt,
    priority: 0.7,
  }));

  const pageEntries = pages
    .filter((page) => page.slug.trim() && page.slug !== '/')
    .map((page) => ({
      loc: `${cleanSiteUrl}${normalizePagePath(page.slug)}`,
      lastmod: pageLastmod[page.id] ?? generatedAt,
      priority: page.pageType === 'Homepage' ? 1 : 0.6,
    }));

  const allEntries = [homepage, ...productEntries, ...categoryEntries, ...pageEntries];
  const uniqueEntries = new Map<string, SitemapEntry>();
  allEntries.forEach((entry) => {
    uniqueEntries.set(entry.loc, entry);
  });

  return Array.from(uniqueEntries.values());
}

export function buildSitemapXml(entries: SitemapEntry[]) {
  const rows = entries
    .map((entry) => {
      const priorityRow = typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : '';
      return `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${escapeXml(entry.lastmod)}</lastmod>${priorityRow}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>`;
}

function normalizePagePath(value: string) {
  const clean = value.startsWith('/') ? value : `/${value}`;
  if (clean === '/') return '/';
  if (clean.startsWith('/pages/') || clean.startsWith('/collections/')) return clean;
  return `/pages/${clean.replace(/^\/+/, '')}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
