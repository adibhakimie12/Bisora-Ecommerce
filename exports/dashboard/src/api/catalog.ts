import { createApiClient, type ApiProductPayload } from './http';
import type { Product, ProductStatus, StockState } from '../modules/products/types';

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ApiProduct {
  id: number;
  category_id: number | null;
  category?: ApiCategory | null;
  title: string;
  slug: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  status: string;
  thumbnail_url?: string | null;
  description?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  tags?: string[] | null;
  variants?: unknown[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

const statusToApi: Record<ProductStatus, ApiProductPayload['status']> = {
  Active: 'active',
  Draft: 'draft',
  Hidden: 'hidden',
  Unpublished: 'unpublished',
};

export function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

function fromMinorUnits(value?: number | null) {
  return typeof value === 'number' ? value / 100 : undefined;
}

export function normalizeApiStatus(status: string): ProductStatus {
  if (status === 'active') return 'Active';
  if (status === 'hidden') return 'Hidden';
  if (status === 'unpublished') return 'Unpublished';
  return 'Draft';
}

function resolveStockState(stock: number): StockState {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  if (stock >= 50) return 'High Stock';
  return 'In Stock';
}

export function mapApiProductToProduct(product: ApiProduct): Product {
  return {
    id: String(product.id),
    title: product.title,
    sku: product.sku,
    categoryId: product.category_id ? String(product.category_id) : '',
    categoryName: product.category?.name ?? 'Uncategorized',
    price: fromMinorUnits(product.price) ?? 0,
    compareAtPrice: fromMinorUnits(product.compare_at_price),
    stock: product.stock,
    status: normalizeApiStatus(product.status),
    stockState: resolveStockState(product.stock),
    thumbnailUrl: product.thumbnail_url ?? '',
    description: product.description ?? '',
    vendor: product.vendor ?? '',
    productType: product.product_type ?? '',
    tags: product.tags ?? [],
    seoTitle: product.seo_title ?? product.title,
    seoDescription: product.seo_description ?? '',
    slug: product.slug,
    variants: [],
  };
}

export function mapProductToApiPayload(product: Product): ApiProductPayload {
  const categoryId = Number(product.categoryId);

  return {
    category_id: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    price: toMinorUnits(product.price),
    compare_at_price: typeof product.compareAtPrice === 'number' ? toMinorUnits(product.compareAtPrice) : null,
    stock: product.stock,
    status: statusToApi[product.status],
    thumbnail_url: product.thumbnailUrl || null,
    description: product.description || null,
    vendor: product.vendor || null,
    product_type: product.productType || null,
    tags: product.tags,
    variants: product.variants,
    seo_title: product.seoTitle || null,
    seo_description: product.seoDescription || null,
  };
}

export function createCatalogApi() {
  const client = createApiClient();

  return {
    async listProducts() {
      const response = await client.catalog.listProducts();
      return (response.data as ApiProduct[]).map(mapApiProductToProduct);
    },
    async saveProduct(product: Product) {
      const payload = mapProductToApiPayload(product);
      const response = await client.request<{ data: ApiProduct }>(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return mapApiProductToProduct(response.data);
    },
    async createProduct(product: Product) {
      const response = await client.catalog.createProduct(mapProductToApiPayload(product));
      return mapApiProductToProduct(response.data as ApiProduct);
    },
  };
}
