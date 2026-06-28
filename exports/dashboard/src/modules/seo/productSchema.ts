import type { Product } from '../products/types';
import { buildCanonicalUrl } from './canonical';

const PRODUCT_SCHEMA_SCRIPT_ID = 'bisora-product-schema';

interface ProductSchemaOptions {
  currency?: string;
  siteUrl?: string;
}

interface ProductSchemaOffer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
}

export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string;
  sku: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: ProductSchemaOffer;
}

function getProductSchemaDescription(product: Product) {
  const source = (product.seoDescription || product.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return source || `Shop ${product.title} from ${product.vendor || 'Bisora'}.`;
}

export function mapProductAvailability(product: Product) {
  if (product.status !== 'Active') {
    return 'https://schema.org/Discontinued';
  }

  if (product.stock <= 0 || product.stockState === 'Out of Stock') {
    return 'https://schema.org/OutOfStock';
  }

  return 'https://schema.org/InStock';
}

export function buildProductSchema(product: Product, options: ProductSchemaOptions = {}): ProductSchema {
  const currency = options.currency || 'MYR';
  const siteUrl = options.siteUrl || 'https://bisora.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: getProductSchemaDescription(product),
    image: product.thumbnailUrl,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Bisora',
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: currency,
      availability: mapProductAvailability(product),
      url: buildCanonicalUrl(`/products/${product.slug}`, siteUrl),
    },
  };
}

export function toProductSchemaJson(product: Product, options: ProductSchemaOptions = {}) {
  return JSON.stringify(buildProductSchema(product, options));
}

export function syncProductSchema(product: Product | null, options: ProductSchemaOptions = {}) {
  if (typeof document === 'undefined') {
    return;
  }

  const existing = document.head.querySelector<HTMLScriptElement>(`script#${PRODUCT_SCHEMA_SCRIPT_ID}`);

  if (!product) {
    existing?.remove();
    return;
  }

  const element = existing ?? document.createElement('script');
  element.id = PRODUCT_SCHEMA_SCRIPT_ID;
  element.type = 'application/ld+json';
  element.textContent = toProductSchemaJson(product, options);

  if (!existing) {
    document.head.appendChild(element);
  }
}
