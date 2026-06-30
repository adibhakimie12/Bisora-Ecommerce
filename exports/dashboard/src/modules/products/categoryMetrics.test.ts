import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCategoryMetrics } from './categoryMetrics';
import type { Category, Product } from './types';

const baseCategory: Category = {
  id: 'cat-premium',
  name: 'Premium',
  description: 'Premium series',
  status: 'Published',
  productIds: ['prod-1'],
  coverUrl: 'https://example.com/premium.jpg',
  seoTitle: 'Premium | Bisora',
  seoDescription: 'Shop premium series.',
  slug: 'premium',
  health: 'Good',
};

const baseProduct: Product = {
  id: 'prod-1',
  title: 'Comfy',
  sku: 'NEW-SKU-001',
  categoryId: 'cat-premium',
  categoryName: 'Premium',
  price: 49,
  stock: 10,
  status: 'Active',
  stockState: 'In Stock',
  thumbnailUrl: 'https://example.com/comfy.jpg',
  description: 'Daily wear',
  vendor: 'Bisora',
  productType: '',
  tags: [],
  seoTitle: 'Comfy | Bisora',
  seoDescription: 'Daily wear.',
  slug: 'comfy',
  variants: [],
};

test('buildCategoryMetrics uses the real category with the most products', () => {
  const metrics = buildCategoryMetrics([baseCategory], [baseProduct]);

  assert.equal(metrics.topCategoryName, 'Premium');
  assert.equal(metrics.topCategoryHelper, '1 products assigned');
});

test('buildCategoryMetrics does not show fake category names when no category has products', () => {
  const metrics = buildCategoryMetrics([{ ...baseCategory, productIds: [] }], []);

  assert.equal(metrics.topCategoryName, 'No product data yet');
  assert.equal(metrics.topCategoryHelper, 'Assign products to categories');
});

test('buildCategoryMetrics scores catalog health from live category setup', () => {
  const healthy = buildCategoryMetrics([baseCategory], [baseProduct]);
  const incomplete = buildCategoryMetrics([
    {
      ...baseCategory,
      status: 'Hidden',
      productIds: [],
      coverUrl: '',
      seoTitle: '',
      seoDescription: '',
      slug: '',
    },
  ], []);

  assert.equal(healthy.catalogHealth, '100%');
  assert.equal(incomplete.catalogHealth, '0%');
});
