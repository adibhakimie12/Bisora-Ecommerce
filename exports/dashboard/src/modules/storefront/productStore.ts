import { products } from '../products/data';
import type { Product } from '../products/types';

const PRODUCT_STORAGE_KEY = 'bisora-storefront-products';

export function loadProducts(): Product[] {
  if (typeof window === 'undefined') {
    return products;
  }

  const saved = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!saved) {
    return products;
  }

  try {
    return JSON.parse(saved) as Product[];
  } catch {
    return products;
  }
}

export function saveProducts(records: Product[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(records));
}
