import { useEffect, useSyncExternalStore } from 'react';
import { createCatalogApi } from '../../api/catalog';
import { hasLiveTenantSession, shouldUseDemoData } from '../../liveDataMode';
import { products } from '../products/data';
import type { Product } from '../products/types';

const PRODUCT_STORAGE_KEY = 'bisora-storefront-products';
const productListeners = new Set<() => void>();
let productSnapshot: Product[] | null = null;
let storageListenerAttached = false;

async function notifySitemapRefresh(records: Product[]) {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  try {
    await window.fetch('/__internal/sitemap-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: records }),
    });
  } catch {
    // Non-blocking in local/dev environments.
  }
}

function notifyProductListeners() {
  productListeners.forEach((listener) => listener());
}

function hasApiCredentials() {
  return hasLiveTenantSession();
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== PRODUCT_STORAGE_KEY) return;
    productSnapshot = readProductsFromStorage();
    notifyProductListeners();
  });
  storageListenerAttached = true;
}

function readProductsFromStorage(): Product[] {
  if (typeof window === 'undefined') {
    return products;
  }

  const saved = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!shouldUseDemoData()) {
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as Product[];
    } catch {
      return [];
    }
  }

  if (!saved) {
    return products;
  }

  try {
    return JSON.parse(saved) as Product[];
  } catch {
    return products;
  }
}

export function loadProducts(): Product[] {
  return readProductsFromStorage();
}

export function getProductSnapshot(): Product[] {
  attachStorageListener();
  if (!productSnapshot) {
    productSnapshot = readProductsFromStorage();
  }
  return productSnapshot;
}

export function subscribeProducts(listener: () => void) {
  attachStorageListener();
  productListeners.add(listener);
  return () => {
    productListeners.delete(listener);
  };
}

export function saveProducts(records: Product[]) {
  productSnapshot = records;
  if (typeof window === 'undefined') {
    notifyProductListeners();
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(records));
  void notifySitemapRefresh(records);
  notifyProductListeners();
}

export async function syncProductsFromApi() {
  if (!hasApiCredentials()) {
    return getProductSnapshot();
  }

  try {
    const nextProducts = await createCatalogApi().listProducts();
    productSnapshot = nextProducts;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(nextProducts));
    }

    notifyProductListeners();
    return nextProducts;
  } catch {
    return getProductSnapshot();
  }
}

export async function saveProductToApi(record: Product, isNewProduct = false) {
  if (!hasApiCredentials()) {
    return record;
  }

  const api = createCatalogApi();
  return isNewProduct ? await api.createProduct(record) : await api.saveProduct(record);
}

export function useStorefrontProducts() {
  const productRecords = useSyncExternalStore(subscribeProducts, getProductSnapshot, getProductSnapshot);

  useEffect(() => {
    void syncProductsFromApi();
  }, []);

  const setProductRecords = (updater: Product[] | ((current: Product[]) => Product[])) => {
    const nextRecords = typeof updater === 'function' ? updater(getProductSnapshot()) : updater;
    saveProducts(nextRecords);
  };

  return [productRecords, setProductRecords] as const;
}
