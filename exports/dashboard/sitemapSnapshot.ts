import fs from 'fs';
import path from 'path';
import { categories, products } from './src/modules/products/data';
import type { Product } from './src/modules/products/types';
import { buildSitemapEntries, buildSitemapXml } from './src/modules/seo/sitemap';
import { defaultWebsitePages, type WebsitePageRecord } from './src/modules/storefront/websitePagesStore';

export interface SitemapSnapshot {
  products?: Product[];
  pages?: WebsitePageRecord[];
  productLastmod?: Record<string, string>;
  pageLastmod?: Record<string, string>;
}

const SNAPSHOT_DIR = path.resolve(__dirname, '.generated');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'sitemap-data.json');

export function readSitemapSnapshot(): SitemapSnapshot {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) as SitemapSnapshot;
  } catch {
    return {};
  }
}

export function writeSitemapSnapshot(partial: SitemapSnapshot, now = new Date().toISOString()) {
  const current = readSitemapSnapshot();
  const next: SitemapSnapshot = {
    ...current,
    ...partial,
    productLastmod: partial.products
      ? Object.fromEntries(partial.products.map((product) => [product.id, now]))
      : current.productLastmod,
    pageLastmod: partial.pages
      ? Object.fromEntries(partial.pages.map((page) => [page.id, now]))
      : current.pageLastmod,
  };

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export function generateSitemapXml(siteUrl: string, generatedAt = new Date().toISOString()) {
  const snapshot = readSitemapSnapshot();
  const entries = buildSitemapEntries({
    siteUrl,
    generatedAt,
    products: snapshot.products ?? products,
    categories,
    pages: snapshot.pages ?? defaultWebsitePages,
    productLastmod: snapshot.productLastmod,
    pageLastmod: snapshot.pageLastmod,
  });

  return buildSitemapXml(entries);
}
