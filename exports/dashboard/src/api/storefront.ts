import { createApiClient, type ApiClientOptions } from './http';

interface ApiPublicStorefront {
  store: {
    id: string;
    name: string;
    slug: string;
    managed_domain?: string | null;
    custom_domain?: string | null;
    currency: string;
    status: 'live' | 'draft';
    published_url?: string | null;
    branding: Record<string, any>;
  };
  pages?: Array<Record<string, any>>;
  blog_posts?: Array<Record<string, any>>;
  products: Array<{
    id: string;
    title: string;
    slug: string;
    sku: string;
    price: number;
    compare_at_price?: number | null;
    stock: number;
    thumbnail_url?: string | null;
    description?: string | null;
    vendor?: string | null;
    product_type?: string | null;
    tags?: string[];
    variants?: unknown[];
    seo_title?: string | null;
    seo_description?: string | null;
    category?: { id: string; name: string; slug: string } | null;
  }>;
}

interface ApiPublicOrder {
  id: number | string;
  number: string;
  total: number;
  payment_status: string;
  settlement_status?: string | null;
  fulfillment_status: string;
  payment_method?: string | null;
  items?: Array<{ name: string; sku: string; quantity: number; price: number }>;
  shipping_address?: Record<string, string | null> | null;
  shipment?: { courier?: string | null; tracking_number?: string | null; tracking_location?: string | null } | null;
  customer?: {
    id: number | string;
    name: string;
    email: string;
    status: string;
  } | null;
}

export interface PublicStorefront {
  store: {
    id: string;
    name: string;
    slug: string;
    managedDomain: string;
    customDomain: string;
    currency: string;
    status: 'live' | 'draft';
    publishedUrl: string;
    branding: Record<string, any>;
  };
  pages: Array<Record<string, any>>;
  blogPosts: Array<Record<string, any>>;
  products: Array<{
    id: string;
    title: string;
    slug: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    thumbnailUrl: string;
    description: string;
    vendor: string;
    productType: string;
    tags: string[];
    variants: unknown[];
    seoTitle: string;
    seoDescription: string;
    category: { id: string; name: string; slug: string } | null;
  }>;
}

export interface PublicCheckoutPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postcode?: string;
    country: string;
  };
  paymentMethod?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface PublicOrder {
  id: string;
  number: string;
  total: number;
  paymentStatus: string;
  settlementStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  shipment: {
    courier: string;
    trackingNumber: string;
    trackingLocation: string;
  };
  shippingAddress: {
    recipient: string;
    city: string;
    country: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
}

function toMajorUnits(value: number | null | undefined) {
  return typeof value === 'number' ? Number((value / 100).toFixed(2)) : null;
}

export function mapPublicStorefrontFromApi(payload: ApiPublicStorefront): PublicStorefront {
  return {
    store: {
      id: payload.store.id,
      name: payload.store.name,
      slug: payload.store.slug,
      managedDomain: payload.store.managed_domain ?? '',
      customDomain: payload.store.custom_domain ?? '',
      currency: payload.store.currency,
      status: payload.store.status,
      publishedUrl: payload.store.published_url ?? '',
      branding: payload.store.branding ?? {},
    },
    pages: payload.pages ?? [],
    blogPosts: payload.blog_posts ?? [],
    products: payload.products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      price: toMajorUnits(product.price) ?? 0,
      compareAtPrice: toMajorUnits(product.compare_at_price),
      stock: product.stock,
      thumbnailUrl: product.thumbnail_url ?? '',
      description: product.description ?? '',
      vendor: product.vendor ?? '',
      productType: product.product_type ?? '',
      tags: product.tags ?? [],
      variants: product.variants ?? [],
      seoTitle: product.seo_title ?? '',
      seoDescription: product.seo_description ?? '',
      category: product.category ?? null,
    })),
  };
}

export async function fetchPublicStorefront(store: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiPublicStorefront }>(`/storefront/${encodeURIComponent(store)}`);

  return mapPublicStorefrontFromApi(response.data);
}

export function mapPublicOrderFromApi(payload: ApiPublicOrder): PublicOrder {
  return {
    id: String(payload.id),
    number: payload.number,
    total: toMajorUnits(payload.total) ?? 0,
    paymentStatus: payload.payment_status,
    settlementStatus: payload.settlement_status ?? '',
    fulfillmentStatus: payload.fulfillment_status,
    paymentMethod: payload.payment_method ?? '',
    items: (payload.items ?? []).map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: toMajorUnits(item.price) ?? 0,
    })),
    shipment: {
      courier: payload.shipment?.courier ?? '',
      trackingNumber: payload.shipment?.tracking_number ?? '',
      trackingLocation: payload.shipment?.tracking_location ?? '',
    },
    shippingAddress: {
      recipient: payload.shipping_address?.recipient ?? '',
      city: payload.shipping_address?.city ?? '',
      country: payload.shipping_address?.country ?? '',
    },
    customer: {
      id: String(payload.customer?.id ?? ''),
      name: payload.customer?.name ?? '',
      email: payload.customer?.email ?? '',
      status: payload.customer?.status ?? '',
    },
  };
}

function toCheckoutApiPayload(payload: PublicCheckoutPayload) {
  return {
    customer: payload.customer,
    shipping_address: {
      address_line_1: payload.shippingAddress.addressLine1,
      ...(payload.shippingAddress.addressLine2 ? { address_line_2: payload.shippingAddress.addressLine2 } : {}),
      city: payload.shippingAddress.city,
      ...(payload.shippingAddress.state ? { state: payload.shippingAddress.state } : {}),
      ...(payload.shippingAddress.postcode ? { postcode: payload.shippingAddress.postcode } : {}),
      country: payload.shippingAddress.country,
    },
    payment_method: payload.paymentMethod ?? 'manual_bank_transfer',
    items: payload.items.map((item) => ({
      product_id: Number(item.productId),
      quantity: item.quantity,
    })),
  };
}

export async function submitPublicCheckout(store: string, payload: PublicCheckoutPayload, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiPublicOrder }>(`/storefront/${encodeURIComponent(store)}/checkout`, {
    method: 'POST',
    body: JSON.stringify(toCheckoutApiPayload(payload)),
  });

  return mapPublicOrderFromApi(response.data);
}

export async function fetchPublicOrder(store: string, orderNumber: string, email: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiPublicOrder }>(
    `/storefront/${encodeURIComponent(store)}/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`,
  );

  return mapPublicOrderFromApi(response.data);
}
