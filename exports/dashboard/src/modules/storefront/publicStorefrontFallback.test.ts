import assert from 'node:assert/strict';
import { buildPreviewStorefrontFallback } from './publicStorefrontFallback';
import type { Product } from '../products/types';

const activeProduct: Product = {
  id: 'prod-1',
  title: 'Comfy',
  sku: 'NEW-SKU-001',
  categoryId: 'cat-1',
  categoryName: 'Premium',
  price: 49,
  stock: 67,
  status: 'Active',
  stockState: 'High Stock',
  thumbnailUrl: 'https://example.test/comfy.jpg',
  imageUrls: ['https://example.test/comfy.jpg'],
  description: 'Daily wear',
  vendor: 'Bisora',
  productType: 'Tshirt',
  tags: ['new'],
  seoTitle: 'Comfy',
  seoDescription: 'Daily wear',
  slug: 'comfy',
  compareAtPrice: 69,
  variants: [],
};

function testBuildsFallbackFromActiveProducts() {
  const fallback = buildPreviewStorefrontFallback('byshayl', [activeProduct]);

  assert.ok(fallback);
  assert.equal(fallback.store.slug, 'byshayl');
  assert.equal(fallback.store.currency, 'RM');
  assert.equal(fallback.products[0].title, 'Comfy');
  assert.equal(fallback.products[0].category?.name, 'Premium');
}

function testReturnsNullWithoutActiveProducts() {
  const fallback = buildPreviewStorefrontFallback('byshayl', [{ ...activeProduct, status: 'Draft' }]);

  assert.equal(fallback, null);
}

testBuildsFallbackFromActiveProducts();
testReturnsNullWithoutActiveProducts();

console.log('public storefront fallback tests passed');
