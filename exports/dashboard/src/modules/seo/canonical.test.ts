import test from 'node:test';
import assert from 'node:assert/strict';

import { categories, products } from '../products/data';
import { defaultWebsitePages } from '../storefront/websitePagesStore';
import {
  buildCanonicalUrl,
  normalizeCanonicalPath,
  resolveCanonicalPathFromHash,
} from './canonical';

test('normalizeCanonicalPath removes query params hash fragments and trailing slash noise', () => {
  assert.equal(
    normalizeCanonicalPath('https://bisora.com/products/premium-modal-hijab/?variant=rose#details'),
    '/products/premium-modal-hijab',
  );
});

test('buildCanonicalUrl returns a clean absolute canonical url', () => {
  assert.equal(
    buildCanonicalUrl('/products/premium-modal-hijab?variant=rose', 'https://bisora.com/'),
    'https://bisora.com/products/premium-modal-hijab',
  );
});

test('resolveCanonicalPathFromHash uses product slug for frontend product routes', () => {
  const path = resolveCanonicalPathFromHash('#/frontend/product/premium-modal-hijab?variant=rose', {
    products,
    categories,
    pages: defaultWebsitePages,
  });

  assert.equal(path, '/products/premium-modal-hijab');
});

test('resolveCanonicalPathFromHash uses public product slug for admin product edit routes', () => {
  const path = resolveCanonicalPathFromHash('#/products/edit/prod-hijab-modal?tab=seo', {
    products,
    categories,
    pages: defaultWebsitePages,
  });

  assert.equal(path, '/products/premium-modal-hijab');
});

test('resolveCanonicalPathFromHash uses collection slug for category detail routes', () => {
  const path = resolveCanonicalPathFromHash('#/products/categories/cat-evening?tab=seo', {
    products,
    categories,
    pages: defaultWebsitePages,
  });

  assert.equal(path, '/collections/evening-collection');
});

test('resolveCanonicalPathFromHash uses website builder collection page slug for collection preview', () => {
  const path = resolveCanonicalPathFromHash('#/frontend/collection?sort=featured', {
    products,
    categories,
    pages: defaultWebsitePages,
  });

  assert.equal(path, '/collections/spring-edit');
});
