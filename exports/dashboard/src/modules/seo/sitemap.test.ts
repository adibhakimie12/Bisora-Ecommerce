import test from 'node:test';
import assert from 'node:assert/strict';

import { categories } from '../products/data';
import { products } from '../products/data';
import { defaultWebsitePages } from '../storefront/websitePagesStore';
import { buildSitemapEntries, buildSitemapXml } from './sitemap';

test('buildSitemapEntries includes homepage products collections and website pages', () => {
  const entries = buildSitemapEntries({
    siteUrl: 'https://bisora.com',
    generatedAt: '2026-04-23T00:00:00.000Z',
    products,
    categories,
    pages: defaultWebsitePages,
  });

  assert.ok(entries.some((entry) => entry.loc === 'https://bisora.com/'));
  assert.ok(entries.some((entry) => entry.loc === `https://bisora.com/products/${products[0].slug}`));
  assert.ok(entries.some((entry) => entry.loc === `https://bisora.com/collections/${categories[0].slug}`));
  assert.ok(entries.some((entry) => entry.loc === 'https://bisora.com/pages/about-the-brand'));
});

test('buildSitemapXml serializes loc lastmod and priority', () => {
  const xml = buildSitemapXml([
    {
      loc: 'https://bisora.com/products/silk-evening-abaya',
      lastmod: '2026-04-23T00:00:00.000Z',
      priority: 0.8,
    },
  ]);

  assert.match(xml, /<urlset/);
  assert.match(xml, /<loc>https:\/\/bisora.com\/products\/silk-evening-abaya<\/loc>/);
  assert.match(xml, /<lastmod>2026-04-23T00:00:00.000Z<\/lastmod>/);
  assert.match(xml, /<priority>0.8<\/priority>/);
});
