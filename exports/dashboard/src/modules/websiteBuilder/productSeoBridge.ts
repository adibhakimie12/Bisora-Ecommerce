import type { Product } from '../products/types';
import type { WebsiteBuilderPageSeoInput } from './seo';

export interface WebsiteBuilderSeoProductRecord extends WebsiteBuilderPageSeoInput {
  status: string;
  productType: string;
}

export function productToSeoRecord(product: Product): WebsiteBuilderSeoProductRecord {
  return {
    id: product.id,
    title: product.title,
    purpose: product.description,
    status: product.status,
    pageType: product.productType,
    productType: product.productType,
    heroHeading: product.title,
    subheading: `${product.productType} by ${product.vendor}`,
    cta: 'Shop Product',
    seoTitle: product.seoTitle,
    metaDescription: product.seoDescription,
    primaryKeyword: product.tags.slice(0, 2).join(' '),
    slug: `/${product.slug}`,
    openGraphImage: product.thumbnailUrl,
    slugManuallyEdited: true,
  };
}

export function seoRecordToProduct(product: Product, record: WebsiteBuilderSeoProductRecord): Product {
  const keywordTags = record.primaryKeyword
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  return {
    ...product,
    seoTitle: record.seoTitle,
    seoDescription: record.metaDescription,
    slug: record.slug.replace(/^\/+/, ''),
    thumbnailUrl: record.openGraphImage || product.thumbnailUrl,
    tags: Array.from(new Set([...product.tags, ...keywordTags])),
  };
}
