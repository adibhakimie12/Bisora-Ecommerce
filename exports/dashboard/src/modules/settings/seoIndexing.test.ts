import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSeoSitemapUrl } from './seoIndexing';

test('resolveSeoSitemapUrl uses connected custom domain when available', () => {
  assert.equal(
    resolveSeoSitemapUrl({
      domain: 'store.lumiere-noor.com',
      subdomain: 'lumiere-noor.shop',
      connectionStatus: 'Connected',
    }),
    'https://store.lumiere-noor.com/sitemap.xml',
  );
});

test('resolveSeoSitemapUrl falls back to managed subdomain when custom domain is not live', () => {
  assert.equal(
    resolveSeoSitemapUrl({
      domain: 'store.lumiere-noor.com',
      subdomain: 'lumiere-noor.shop',
      connectionStatus: 'Pending',
    }),
    'https://lumiere-noor.shop/sitemap.xml',
  );
});
