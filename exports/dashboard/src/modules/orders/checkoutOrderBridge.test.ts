import test from 'node:test';
import assert from 'node:assert/strict';

import { createLocalCheckoutOrder, findLocalPublicOrder } from './checkoutOrderBridge';
import { loadLocalOrders } from './orderStore';
import { loadProducts, saveProducts } from '../storefront/productStore';
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

function productRecord(): Product {
  return {
    id: 'prod-comfy',
    title: 'Comfy',
    sku: 'NEW-SKU-001',
    categoryId: 'cat-premium',
    categoryName: 'Premium',
    price: 49,
    stock: 3,
    status: 'Active',
    stockState: 'In Stock',
    thumbnailUrl: 'https://example.test/comfy.jpg',
    description: 'Daily user',
    vendor: 'Bisora',
    productType: 'Tshirt',
    tags: ['new'],
    seoTitle: 'Comfy | Bisora',
    seoDescription: 'Daily user',
    slug: 'comfy',
    compareAtPrice: 69,
    variants: [
      {
        id: 'var-red-s',
        name: 'Red / s',
        sku: 'NEW-SKU-001-RED-S',
        price: 49,
        stock: 2,
        stockState: 'In Stock',
        lastUpdated: 'Today',
        imageUrl: 'https://example.test/red.jpg',
      },
      {
        id: 'var-red-m',
        name: 'Red / m',
        sku: 'NEW-SKU-001-RED-M',
        price: 49,
        stock: 1,
        stockState: 'In Stock',
        lastUpdated: 'Today',
        imageUrl: 'https://example.test/red.jpg',
      },
    ],
  };
}

test.afterEach(() => {
  globalThis.window = originalWindow;
});

test('createLocalCheckoutOrder saves a seller order and deducts catalog stock', () => {
  globalThis.window = {
    localStorage: new FakeStorage(),
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window & typeof globalThis;
  saveProducts([productRecord()]);

  const publicOrder = createLocalCheckoutOrder('byshayl', {
    customer: { name: 'Buyer One', email: 'buyer@example.test', phone: '0123456789' },
    shippingAddress: {
      addressLine1: 'No 1 Jalan Test',
      city: 'Kuala Lumpur',
      postcode: '50000',
      country: 'Malaysia',
    },
    shippingMethod: {
      id: 'sz-1-wr-1',
      label: 'J&T EXPRESS (2-3 working days)',
      zoneName: 'Semenanjung',
      courier: 'J&T EXPRESS',
      service: 'J&T EXPRESS (2-3 working days)',
      amount: 6,
    },
    paymentMethod: 'manual_bank_transfer',
    items: [{ productId: 'prod-comfy', quantity: 2 }],
  });

  assert.match(publicOrder.number, /^ORD-/);
  assert.equal(publicOrder.total, 104);
  assert.equal(publicOrder.customer.email, 'buyer@example.test');
  assert.equal(publicOrder.shipment.courier, 'J&T EXPRESS');

  const savedOrder = loadLocalOrders()[0];
  assert.equal(savedOrder.customer.name, 'Buyer One');
  assert.equal(savedOrder.items[0].sku, 'NEW-SKU-001');
  assert.equal(savedOrder.paymentStatus, 'Pending');
  assert.equal(savedOrder.fulfillmentStatus, 'Unfulfilled');
  assert.equal(savedOrder.shipment.shippingFee, 6);
  assert.equal(savedOrder.shipment.method, 'J&T EXPRESS (2-3 working days)');

  const savedProduct = loadProducts()[0];
  assert.equal(savedProduct.stock, 1);
  assert.equal(savedProduct.variants[0].stock, 0);
  assert.equal(savedProduct.variants[1].stock, 1);

  const trackedOrder = findLocalPublicOrder(publicOrder.number, 'buyer@example.test');
  assert.equal(trackedOrder?.number, publicOrder.number);
  assert.equal(trackedOrder?.fulfillmentStatus, 'unfulfilled');
});
