import type { AdminTenantSession } from '../../api/authSession';
import type { Product } from './types';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProductPreviewHash(product: Pick<Product, 'id' | 'slug' | 'title'>, activeTenant?: Pick<AdminTenantSession, 'slug'>) {
  const storeSlug = activeTenant?.slug || 'preview-store';
  const productSlug = product.slug || slugify(product.title) || product.id;
  return `#/store/${encodeURIComponent(storeSlug)}/product/${encodeURIComponent(productSlug)}`;
}
