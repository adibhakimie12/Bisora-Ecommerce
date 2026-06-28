import test from 'node:test';
import assert from 'node:assert/strict';

import type { Product } from '../products/types';
import { productToSeoRecord, seoRecordToProduct } from './productSeoBridge';

const product: Product = {
  id: 'prod-1',
  title: 'Silk Evening Abaya',
  sku: 'ABY-001',
  categoryId: 'cat-1',
  categoryName: 'Evening',
  price: 200,
  stock: 5,
  status: 'Active',
  stockState: 'In Stock',
  thumbnailUrl: 'https://example.com/image.jpg',
  description: 'Premium silk abaya for elegant occasions.',
  vendor: 'Bisora',
  productType: 'Abaya',
  tags: ['silk', 'abaya'],
  seoTitle: 'Silk Evening Abaya | Bisora',
  seoDescription: 'Shop a premium silk evening abaya for elegant occasions.',
  slug: 'silk-evening-abaya',
  variants: [],
};

test('productToSeoRecord maps product SEO fields into the unified SEO workspace shape', () => {
  const record = productToSeoRecord(product);

  assert.equal(record.id, product.id);
  assert.equal(record.title, product.title);
  assert.equal(record.metaDescription, product.seoDescription);
  assert.equal(record.slug, '/silk-evening-abaya');
  assert.equal(record.openGraphImage, product.thumbnailUrl);
});

test('seoRecordToProduct writes SEO edits back into the original product shape', () => {
  const updated = seoRecordToProduct(product, {
    ...productToSeoRecord(product),
    seoTitle: 'Refined Abaya | Bisora',
    metaDescription: 'Discover a refined abaya for modern occasions.',
    slug: '/refined-abaya',
    openGraphImage: 'https://example.com/new-image.jpg',
    primaryKeyword: 'refined abaya',
  });

  assert.equal(updated.seoTitle, 'Refined Abaya | Bisora');
  assert.equal(updated.seoDescription, 'Discover a refined abaya for modern occasions.');
  assert.equal(updated.slug, 'refined-abaya');
  assert.equal(updated.thumbnailUrl, 'https://example.com/new-image.jpg');
  assert.ok(updated.tags.includes('refined'));
});
