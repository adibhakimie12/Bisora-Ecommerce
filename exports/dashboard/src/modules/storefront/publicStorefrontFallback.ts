import { getStoredSession } from '../../api/authSession';
import type { PublicStorefront } from '../../api/storefront';
import { loadProducts } from './productStore';
import type { Product } from '../products/types';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCategory(product: Product) {
  const name = product.categoryName?.trim();
  if (!name || name === 'Uncategorized') {
    return null;
  }

  return {
    id: product.categoryId || slugify(name),
    name,
    slug: slugify(name),
  };
}

export function buildPreviewStorefrontFallback(storeSlug: string, records: Product[] = loadProducts()): PublicStorefront | null {
  const publishableProducts = records.filter((product) => product.status === 'Active');
  if (publishableProducts.length === 0) {
    return null;
  }

  const session = getStoredSession();
  const tenant = session?.tenants.find((item) => item.slug === storeSlug) ?? session?.tenants.find((item) => item.id === session.activeTenantId);
  const storeName = tenant?.name || storeSlug;

  return {
    store: {
      id: tenant?.id ?? 'preview',
      name: storeName,
      slug: tenant?.slug ?? storeSlug,
      managedDomain: `${storeSlug}.bisora.app`,
      customDomain: '',
      currency: 'RM',
      status: 'live',
      publishedUrl: '',
      branding: {
        brandName: storeName,
        tagline: 'Preview storefront from saved catalog data.',
        primaryColor: '#4f46e5',
        accentColor: '#e0e7ff',
        neutralColor: '#f8fafc',
      },
    },
    pages: [],
    blogPosts: [],
    products: publishableProducts.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.stock,
      thumbnailUrl: product.thumbnailUrl,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      variants: product.variants,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      category: normalizeCategory(product),
    })),
  };
}
