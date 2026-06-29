import { createApiClient, type ApiProductPayload } from './http';
import type { Category, CategoryStatus, Product, ProductStatus, ProductVariant, StockState } from '../modules/products/types';

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  cover_url?: string | null;
  product_ids?: Array<number | string> | null;
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

function normalizeCategoryStatus(status?: string | null): CategoryStatus {
  return status === 'hidden' ? 'Hidden' : 'Published';
}

function resolveStockState(stock: number): StockState {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  if (stock >= 50) return 'High Stock';
  return 'In Stock';
}

function mapApiVariantToProductVariant(variant: unknown, product: ApiProduct): ProductVariant {
  const data = typeof variant === 'object' && variant !== null ? variant as Record<string, unknown> : {};
  const name = String(data.name ?? data.title ?? 'Default');
  const stock = Number(data.stock ?? product.stock ?? 0);
  const rawPrice = typeof data.price === 'number' ? data.price : undefined;
  const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : typeof data.image_url === 'string' ? data.image_url : undefined;

  return {
    id: String((data.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `${product.id}-variant`),
    name,
    sku: String(data.sku ?? `${product.sku}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`),
    price: typeof rawPrice === 'number' ? rawPrice : (fromMinorUnits(product.price) ?? 0),
    stock,
    stockState: resolveStockState(stock),
    lastUpdated: String(data.lastUpdated ?? data.last_updated ?? ''),
    ...(imageUrl ? { imageUrl } : {}),
  };
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
    variants: (product.variants ?? []).map((variant) => mapApiVariantToProductVariant(variant, product)),
  };
}

export function mapApiCategoryToCategory(category: ApiCategory): Category {
  return {
    id: String(category.id),
    name: category.name,
    description: category.description ?? '',
    status: normalizeCategoryStatus(category.status),
    productIds: (category.product_ids ?? []).map(String),
    coverUrl: category.cover_url ?? '',
    seoTitle: category.seo_title ?? category.name,
    seoDescription: category.seo_description ?? '',
    slug: category.slug,
    health: 'Good',
  };
}

function categoryStatusToApi(status: CategoryStatus) {
  return status === 'Hidden' ? 'hidden' : 'published';
}

function mapCategoryToApiPayload(category: Category) {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || null,
    status: categoryStatusToApi(category.status),
    seo_title: category.seoTitle || null,
    seo_description: category.seoDescription || null,
    cover_url: category.coverUrl || null,
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
    async listCategories() {
      const response = await client.request<{ data: ApiCategory[] }>('/categories');
      return response.data.map(mapApiCategoryToCategory);
    },
    async saveCategory(category: Category) {
      const isNumericId = /^\d+$/.test(category.id);
      const response = await client.request<{ data: ApiCategory }>(isNumericId ? `/categories/${category.id}` : '/categories', {
        method: isNumericId ? 'PATCH' : 'POST',
        body: JSON.stringify(mapCategoryToApiPayload(category)),
      });

      return mapApiCategoryToCategory(response.data);
    },
    async deleteCategory(categoryId: string) {
      await client.request<void>(`/categories/${categoryId}`, {
        method: 'DELETE',
      });
    },
    async saveProduct(product: Product) {
      const payload = mapProductToApiPayload(product);
      const response = await client.request<{ data: ApiProduct }>(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return mapApiProductToProduct(response.data);
    },
    async deleteProduct(productId: string) {
      await client.request<void>(`/products/${productId}`, {
        method: 'DELETE',
      });
    },
    async createProduct(product: Product) {
      const response = await client.catalog.createProduct(mapProductToApiPayload(product));
      return mapApiProductToProduct(response.data as ApiProduct);
    },
  };
}
