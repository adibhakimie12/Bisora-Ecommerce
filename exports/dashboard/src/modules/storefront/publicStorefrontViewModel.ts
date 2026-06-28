import type { PublicStorefront } from '../../api/storefront';

export interface PublicStorefrontProductCard {
  id: string;
  title: string;
  slug: string;
  href: string;
  priceLabel: string;
  compareAtPriceLabel: string;
  stockLabel: string;
  imageUrl: string;
  description: string;
  vendor: string;
  categoryName: string;
  isInStock: boolean;
}

export interface PublicStorefrontViewModel {
  brandName: string;
  tagline: string;
  domainLabel: string;
  productCountLabel: string;
  heroProductImage: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    neutralColor: string;
  };
  products: PublicStorefrontProductCard[];
}

function brandingString(branding: Record<string, any>, key: string) {
  const value = branding[key];
  return typeof value === 'string' ? value.trim() : '';
}

function formatMoney(currency: string, amount: number | null) {
  if (amount === null || Number.isNaN(amount)) {
    return '';
  }

  return `${currency} ${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)}`;
}

export function buildPublicStorefrontViewModel(storefront: PublicStorefront): PublicStorefrontViewModel {
  const { store } = storefront;
  const brandName = brandingString(store.branding, 'brandName') || store.name;
  const tagline = brandingString(store.branding, 'tagline') || 'Curated products ready to shop.';
  const primaryColor = brandingString(store.branding, 'primaryColor') || '#4f46e5';
  const accentColor = brandingString(store.branding, 'accentColor') || '#dbeafe';
  const neutralColor = brandingString(store.branding, 'neutralColor') || '#f8fafc';
  const domainLabel = store.publishedUrl || store.customDomain || store.managedDomain || store.slug;

  const products = storefront.products.map((product) => {
    const isInStock = product.stock > 0;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      href: `#/store/${store.slug}/product/${product.slug}`,
      priceLabel: formatMoney(store.currency, product.price),
      compareAtPriceLabel: formatMoney(store.currency, product.compareAtPrice),
      stockLabel: isInStock ? `${product.stock} in stock` : 'Out of stock',
      imageUrl: product.thumbnailUrl,
      description: product.description,
      vendor: product.vendor,
      categoryName: product.category?.name ?? product.productType,
      isInStock,
    };
  });

  return {
    brandName,
    tagline,
    domainLabel,
    productCountLabel: `${products.length} ${products.length === 1 ? 'product' : 'products'}`,
    heroProductImage: products.find((product) => product.imageUrl)?.imageUrl ?? '',
    theme: {
      primaryColor,
      accentColor,
      neutralColor,
    },
    products,
  };
}
