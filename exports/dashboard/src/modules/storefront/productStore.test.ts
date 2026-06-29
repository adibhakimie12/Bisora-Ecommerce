import test from 'node:test';
import assert from 'node:assert/strict';

import { getProductSnapshot, loadProducts, saveProductToApi, saveProducts, subscribeProducts, syncProductsFromApi } from './productStore';
import type { Product } from '../products/types';

class FakeStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

const originalWindow = globalThis.window;

function createProduct(title: string): Product {
  return {
    id: `prod-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    sku: 'SKU-1',
    categoryId: 'cat-1',
    categoryName: 'Category',
    price: 100,
    stock: 2,
    status: 'Active',
    stockState: 'In Stock',
    thumbnailUrl: 'https://example.com/image.jpg',
    description: `${title} description`,
    vendor: 'Bisora',
    productType: 'Abaya',
    tags: ['abaya'],
    seoTitle: `${title} | Bisora`,
    seoDescription: `${title} SEO description`,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    variants: [],
  };
}

test.afterEach(() => {
  globalThis.window = originalWindow;
});

test('saveProducts updates the shared snapshot and notifies subscribers', () => {
  const storage = new FakeStorage();
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  const nextProducts = [createProduct('Shared Product')];
  let notified = false;
  const unsubscribe = subscribeProducts(() => {
    notified = true;
  });

  saveProducts(nextProducts);

  assert.equal(notified, true);
  assert.equal(getProductSnapshot()[0]?.title, 'Shared Product');
  unsubscribe();
});

test('loadProducts reads back the same records persisted through saveProducts', () => {
  const storage = new FakeStorage();
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  const nextProducts = [createProduct('Persistent Product')];
  saveProducts(nextProducts);

  assert.equal(loadProducts()[0]?.title, 'Persistent Product');
});

test('loadProducts does not show bundled demo products for authenticated tenant sessions', () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  assert.deepEqual(loadProducts(), []);
});

test('loadProducts ignores stale local product cache for authenticated tenant sessions', () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  storage.setItem('bisora-storefront-products', JSON.stringify([createProduct('Stale Demo Cache')]));
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  assert.deepEqual(loadProducts(), []);
});

test('syncProductsFromApi hydrates shared snapshot when backend credentials exist', async () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [
          {
            id: 5,
            category_id: null,
            title: 'Backend Product',
            slug: 'backend-product',
            sku: 'BACKEND-001',
            price: 2500,
            stock: 7,
            status: 'active',
            tags: [],
            variants: [],
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    await syncProductsFromApi();
    assert.equal(getProductSnapshot()[0]?.title, 'Backend Product');
    assert.equal(getProductSnapshot()[0]?.price, 25);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('syncProductsFromApi keeps an authenticated tenant empty when the backend has no products', async () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    await syncProductsFromApi();
    assert.deepEqual(getProductSnapshot(), []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveProductToApi surfaces backend plan limit errors for product create', async () => {
  const storage = new FakeStorage();
  storage.setItem('bisora.apiToken', 'token-123');
  storage.setItem('bisora.tenantId', '77');
  globalThis.window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        message: 'Free Trial product limit reached. Upgrade package to add more products.',
        limit: { plan: 'Free Trial', resource: 'products', max: 15, used: 15 },
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    await assert.rejects(
      () => saveProductToApi(createProduct('Blocked Product'), true),
      /Free Trial product limit reached/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
