import assert from 'node:assert/strict';
import {
  mapApiCategoryToCategory,
  mapApiProductToProduct,
  mapProductToApiPayload,
  normalizeApiStatus,
  toMinorUnits,
} from './catalog';
import type { Product } from '../modules/products/types';

const apiProduct = {
  id: 15,
  category_id: 3,
  category: { id: 3, name: 'Hijab', slug: 'hijab' },
  title: 'Premium Modal Hijab',
  slug: 'premium-modal-hijab',
  sku: 'HIJAB-001',
  price: 12900,
  compare_at_price: 14900,
  stock: 4,
  status: 'active',
  thumbnail_url: 'https://example.com/hijab.jpg',
  image_urls: ['https://example.com/hijab.jpg', 'https://example.com/hijab-side.jpg'],
  description: 'Soft modal hijab',
  vendor: 'Bisora',
  product_type: 'Hijab',
  tags: ['modal', 'premium'],
  variants: [{
    id: 'rose',
    name: 'Rose',
    stock: 2,
    image_url: 'https://example.com/rose.jpg',
    image_urls: ['https://example.com/rose.jpg', 'https://example.com/rose-side.jpg'],
  }],
  seo_title: 'Premium Modal Hijab',
  seo_description: 'Shop premium modal hijab.',
};

const product: Product = {
  id: '15',
  title: 'Premium Modal Hijab',
  sku: 'HIJAB-001',
  categoryId: '3',
  categoryName: 'Hijab',
  price: 129,
  compareAtPrice: 149,
  stock: 4,
  status: 'Active',
  stockState: 'In Stock',
  thumbnailUrl: 'https://example.com/hijab.jpg',
  imageUrls: ['https://example.com/hijab.jpg'],
  description: 'Soft modal hijab',
  vendor: 'Bisora',
  productType: 'Hijab',
  tags: ['modal', 'premium'],
  seoTitle: 'Premium Modal Hijab',
  seoDescription: 'Shop premium modal hijab.',
  slug: 'premium-modal-hijab',
  variants: [
    {
      id: 'rose',
      name: 'Rose',
      sku: 'HIJAB-ROSE',
      price: 129,
      stock: 2,
      stockState: 'Low Stock',
      lastUpdated: '2026-05-25',
    },
  ],
};

assert.equal(toMinorUnits(129.9), 12990);
assert.equal(normalizeApiStatus('unpublished'), 'Unpublished');
assert.equal(normalizeApiStatus('hidden'), 'Hidden');
assert.equal(normalizeApiStatus('draft'), 'Draft');
assert.equal(normalizeApiStatus('active'), 'Active');

const mappedProduct = mapApiProductToProduct(apiProduct);
assert.equal(mappedProduct.id, '15');
assert.equal(mappedProduct.categoryName, 'Hijab');
assert.equal(mappedProduct.price, 129);
assert.equal(mappedProduct.compareAtPrice, 149);
assert.equal(mappedProduct.stockState, 'Low Stock');
assert.equal(mappedProduct.status, 'Active');
assert.deepEqual(mappedProduct.imageUrls, ['https://example.com/hijab.jpg', 'https://example.com/hijab-side.jpg']);
assert.deepEqual(mappedProduct.tags, ['modal', 'premium']);
assert.deepEqual(mappedProduct.variants, [
  {
    id: 'rose',
    name: 'Rose',
    sku: 'HIJAB-001-ROSE',
    price: 129,
    stock: 2,
    stockState: 'Low Stock',
      lastUpdated: '',
      imageUrl: 'https://example.com/rose.jpg',
      imageUrls: ['https://example.com/rose.jpg', 'https://example.com/rose-side.jpg'],
    },
  ]);

const payload = mapProductToApiPayload(product);
assert.equal(payload.category_id, 3);
assert.equal(payload.price, 12900);
assert.equal(payload.compare_at_price, 14900);
assert.equal(payload.status, 'active');
assert.equal(payload.thumbnail_url, 'https://example.com/hijab.jpg');
assert.deepEqual(payload.image_urls, ['https://example.com/hijab.jpg']);
assert.equal(payload.product_type, 'Hijab');
assert.equal(payload.seo_title, 'Premium Modal Hijab');
assert.deepEqual(payload.variants, product.variants);

const mappedCategory = mapApiCategoryToCategory({
  id: 9,
  name: 'Evening Wear',
  slug: 'evening-wear',
  description: 'Formal collection',
  status: 'hidden',
  seo_title: 'Evening Wear SEO',
  seo_description: 'Shop evening wear.',
  cover_url: 'https://example.com/evening.jpg',
  product_ids: [15, 16],
});
assert.equal(mappedCategory.id, '9');
assert.equal(mappedCategory.status, 'Hidden');
assert.deepEqual(mappedCategory.productIds, ['15', '16']);

console.log('catalog api mapper tests passed');
