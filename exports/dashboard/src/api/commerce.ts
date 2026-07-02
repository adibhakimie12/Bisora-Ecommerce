import { createApiClient, type ApiClientOptions } from './http';
import type { Customer as CustomerRecord, CustomerOrderHistory, RecentPurchase, ReviewRecord } from '../modules/customers/types';
import type {
  FulfillmentStatus,
  Order,
  OrderItem,
  PaymentStatus,
  SettlementStatus,
  ShippingAddress,
} from '../modules/orders/types';

type ApiPaymentStatus = 'paid' | 'pending';
type ApiFulfillmentStatus = 'processing' | 'shipped' | 'unfulfilled' | 'delivered';
type ApiSettlementStatus = 'unsettled' | 'processing' | 'settled';
type ApiReviewStatus = 'pending' | 'approved' | 'hidden' | 'featured';

interface ApiCustomer {
  id: number | string;
  name: string;
  email: string;
  avatar_url?: string | null;
  status: 'vip' | 'returning' | 'new' | 'inactive';
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  member_since?: string | null;
  shipping_address?: string[] | null;
  notes?: string[] | null;
  orders?: Array<{
    id: number | string;
    number: string;
    total: number;
    payment_status: ApiPaymentStatus;
    fulfillment_status: ApiFulfillmentStatus;
    ordered_at?: string | null;
  }>;
}

interface ApiOrder {
  id: number | string;
  number: string;
  total: number;
  payment_status: ApiPaymentStatus;
  settlement_status?: ApiSettlementStatus | null;
  fulfillment_status: ApiFulfillmentStatus;
  ordered_at?: string | null;
  payment_method?: string | null;
  customer?: { id: number | string; name: string; email: string; status?: string } | null;
  items?: Array<{ id?: string; name: string; sku: string; quantity: number; price: number; image_url?: string | null }>;
  shipping_address?: (Partial<ShippingAddress> & { address_line_1?: string; address_line_2?: string }) | null;
  shipment?: {
    courier?: string;
    method?: string;
    service?: string;
    shipping_fee?: number;
    status?: ApiFulfillmentStatus;
    tracking_location?: string;
    tracking_number?: string;
  } | null;
}

interface ApiReview {
  id: number | string;
  customer_profile_id?: number | string | null;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_image_url?: string | null;
  rating: number;
  excerpt: string;
  full_review: string;
  status: ApiReviewStatus;
  reviewed_at?: string | null;
  verified_purchase: boolean;
}

interface ApiDraftOrder {
  id: number | string;
  number: string;
  customer_name: string;
  customer_email: string;
  source?: string | null;
  items?: Array<{ name: string; sku?: string | null; quantity: number; price: number; line_total?: number }>;
  total: number;
  status: 'draft' | 'invoice_sent' | 'converted';
  note?: string | null;
  updated_at?: string | null;
}

export interface DraftOrderRecord {
  backendId: string;
  id: string;
  customer: string;
  customerEmail: string;
  source: string;
  items: number;
  total: number;
  status: 'Draft' | 'Invoice Sent' | 'Converted';
  updatedAt: string;
  note: string;
  previewImages: string[];
}

function toMajorUnits(value: number) {
  return Number((value / 100).toFixed(2));
}

function titleCase<T extends string>(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}` as T;
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function toApiFulfillmentStatus(value: FulfillmentStatus): ApiFulfillmentStatus {
  return value.toLowerCase() as ApiFulfillmentStatus;
}

export function mapOrderFromApi(order: ApiOrder): Order {
  const items: OrderItem[] = (order.items ?? []).map((item, index) => ({
    id: item.id ?? `${order.id}-${index}`,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    price: toMajorUnits(item.price),
    imageUrl: item.image_url ?? '',
  }));
  const products = items.map((item) => item.name).join(', ') || 'No items';
  const fulfillmentStatus = titleCase<FulfillmentStatus>(order.fulfillment_status);

  return {
    id: `#${order.number}`,
    backendId: String(order.id),
    customer: {
      name: order.customer?.name ?? 'Guest customer',
      email: order.customer?.email ?? '',
      tag: order.customer?.status ?? 'Customer',
    },
    products,
    date: formatDate(order.ordered_at),
    total: toMajorUnits(order.total),
    paymentStatus: titleCase<PaymentStatus>(order.payment_status),
    settlementStatus: order.settlement_status ? titleCase<SettlementStatus>(order.settlement_status) : undefined,
    fulfillmentStatus,
    items,
    shipment: {
      orderDate: formatDate(order.ordered_at),
      courier: order.shipment?.courier ?? 'Not assigned',
      status: order.shipment?.status ? titleCase<FulfillmentStatus>(order.shipment.status) : fulfillmentStatus,
      trackingLocation: order.shipment?.tracking_location ?? 'Awaiting update',
      trackingNumber: order.shipment?.tracking_number,
      method: order.shipment?.method ?? order.shipment?.service,
      shippingFee: typeof order.shipment?.shipping_fee === 'number' ? toMajorUnits(order.shipment.shipping_fee) : undefined,
    },
    shippingAddress: {
      recipient: order.shipping_address?.recipient ?? order.customer?.name ?? '',
      line1: order.shipping_address?.line1 ?? order.shipping_address?.address_line_1 ?? '',
      line2: order.shipping_address?.line2 ?? order.shipping_address?.address_line_2 ?? '',
      city: order.shipping_address?.city ?? '',
      country: order.shipping_address?.country ?? '',
    },
    paymentMethod: order.payment_method ?? '',
  };
}

export function mapCustomerFromApi(customer: ApiCustomer): CustomerRecord {
  const orderHistory: CustomerOrderHistory[] = (customer.orders ?? []).map((order) => ({
    id: `#${order.number}`,
    date: formatDate(order.ordered_at),
    total: toMajorUnits(order.total),
    paymentStatus: titleCase<PaymentStatus>(order.payment_status),
    fulfillmentStatus: titleCase<CustomerOrderHistory['fulfillmentStatus']>(order.fulfillment_status),
  }));

  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email,
    avatarUrl: customer.avatar_url ?? '',
    status: customer.status === 'vip' ? 'VIP' : customer.status === 'returning' ? 'Returning' : customer.status === 'inactive' ? 'Inactive' : 'New',
    ordersCount: customer.orders_count,
    totalSpent: toMajorUnits(customer.total_spent),
    lastOrderDate: formatDate(customer.last_order_at),
    memberSince: formatDate(customer.member_since),
    shippingAddress: customer.shipping_address ?? [],
    notes: customer.notes ?? [],
    orderHistory,
    recentPurchases: [] satisfies RecentPurchase[],
  };
}

export function mapReviewFromApi(review: ApiReview): ReviewRecord {
  return {
    id: String(review.id),
    customerId: review.customer_profile_id ? String(review.customer_profile_id) : '',
    customerName: review.customer_name,
    customerEmail: review.customer_email,
    productName: review.product_name,
    productImageUrl: review.product_image_url ?? '',
    rating: review.rating,
    excerpt: review.excerpt,
    fullReview: review.full_review,
    status: titleCase<ReviewRecord['status']>(review.status),
    date: formatDate(review.reviewed_at),
    verifiedPurchase: review.verified_purchase,
  };
}

export function mapDraftOrderFromApi(draft: ApiDraftOrder): DraftOrderRecord {
  const status = draft.status === 'invoice_sent' ? 'Invoice Sent' : draft.status === 'converted' ? 'Converted' : 'Draft';

  return {
    backendId: String(draft.id),
    id: draft.number,
    customer: draft.customer_name,
    customerEmail: draft.customer_email,
    source: draft.source ?? 'Manual',
    items: draft.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    total: toMajorUnits(draft.total),
    status,
    updatedAt: formatDate(draft.updated_at),
    note: draft.note ?? '',
    previewImages: [],
  };
}

export async function fetchCustomers(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer[] }>('/customers');

  return response.data.map(mapCustomerFromApi);
}

export async function createCustomer(
  payload: { name: string; email: string; status: CustomerRecord['status'] },
  options: ApiClientOptions = {},
) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return mapCustomerFromApi(response.data);
}

export async function updateCustomer(
  customerId: string,
  payload: { name?: string; email?: string; status?: CustomerRecord['status'] },
  options: ApiClientOptions = {},
) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer }>(`/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return mapCustomerFromApi(response.data);
}

export async function addCustomerNote(customerId: string, message: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer }>(`/customers/${customerId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  return mapCustomerFromApi(response.data);
}

export async function deleteCustomer(customerId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  await client.request<void>(`/customers/${customerId}`, {
    method: 'DELETE',
  });
}

export async function contactCustomer(customerId: string, channel: 'Email' | 'WhatsApp', message: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  await client.request<{ data: unknown }>(`/customers/${customerId}/contact`, {
    method: 'POST',
    body: JSON.stringify({ channel, message }),
  });
}

export async function deactivateCustomer(customerId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer }>(`/customers/${customerId}/deactivate`, {
    method: 'POST',
  });

  return mapCustomerFromApi(response.data);
}

export async function fetchOrders(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiOrder[] }>('/orders');

  return response.data.map(mapOrderFromApi);
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  shippingAddress?: Partial<ShippingAddress>;
}

export async function createOrder(payload: CreateOrderPayload, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiOrder }>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer: payload.customer,
      items: payload.items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
      })),
      payment_method: payload.paymentMethod,
      payment_status: payload.paymentStatus?.toLowerCase(),
      shipping_address: payload.shippingAddress ? {
        recipient: payload.shippingAddress.recipient,
        line1: payload.shippingAddress.line1,
        line2: payload.shippingAddress.line2,
        city: payload.shippingAddress.city,
        country: payload.shippingAddress.country,
      } : undefined,
    }),
  });

  return mapOrderFromApi(response.data);
}

export async function updateOrderStatus(
  orderId: string,
  patch: {
    fulfillmentStatus?: FulfillmentStatus;
    paymentStatus?: PaymentStatus;
    settlementStatus?: SettlementStatus;
    trackingNumber?: string;
    courier?: string;
  },
  options: ApiClientOptions = {},
) {
  const client = createApiClient(options);
  const normalizedId = orderId.replace(/^#/, '');
  const response = await client.request<{ data: ApiOrder }>(`/orders/${normalizedId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      fulfillment_status: patch.fulfillmentStatus ? toApiFulfillmentStatus(patch.fulfillmentStatus) : undefined,
      payment_status: patch.paymentStatus ? patch.paymentStatus.toLowerCase() : undefined,
      settlement_status: patch.settlementStatus ? patch.settlementStatus.toLowerCase() : undefined,
      tracking_number: patch.trackingNumber,
      courier: patch.courier,
    }),
  });

  return mapOrderFromApi(response.data);
}

export async function deleteOrder(orderId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const normalizedId = orderId.replace(/^#/, '');
  await client.request<void>(`/orders/${normalizedId}`, {
    method: 'DELETE',
  });
}

export interface CreateDraftOrderPayload {
  customerName: string;
  customerEmail: string;
  source?: string;
  note?: string;
  status?: DraftOrderRecord['status'];
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
  }>;
}

function toApiDraftStatus(status?: DraftOrderRecord['status']) {
  if (status === 'Invoice Sent') return 'invoice_sent';
  if (status === 'Converted') return 'converted';
  return 'draft';
}

function draftPayloadToApi(payload: CreateDraftOrderPayload) {
  return {
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    source: payload.source,
    note: payload.note,
    status: toApiDraftStatus(payload.status),
    items: payload.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: Math.round(item.price * 100),
    })),
  };
}

export async function fetchDraftOrders(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiDraftOrder[] }>('/draft-orders');

  return response.data.map(mapDraftOrderFromApi);
}

export async function createDraftOrder(payload: CreateDraftOrderPayload, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiDraftOrder }>('/draft-orders', {
    method: 'POST',
    body: JSON.stringify(draftPayloadToApi(payload)),
  });

  return mapDraftOrderFromApi(response.data);
}

export async function updateDraftOrder(draftId: string, payload: Partial<CreateDraftOrderPayload>, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiDraftOrder }>(`/draft-orders/${draftId}`, {
    method: 'PATCH',
    body: JSON.stringify(draftPayloadToApi({
      customerName: payload.customerName ?? '',
      customerEmail: payload.customerEmail ?? 'draft@example.test',
      source: payload.source,
      note: payload.note,
      status: payload.status,
      items: payload.items ?? [{ name: 'Draft item', quantity: 1, price: 0 }],
    })),
  });

  return mapDraftOrderFromApi(response.data);
}

export async function deleteDraftOrder(draftId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  await client.request<void>(`/draft-orders/${draftId}`, {
    method: 'DELETE',
  });
}

export async function convertDraftOrder(
  draftId: string,
  payload: { paymentStatus?: PaymentStatus; paymentMethod?: string } = {},
  options: ApiClientOptions = {},
) {
  const client = createApiClient(options);
  const response = await client.request<{ data: { order: ApiOrder; draft: ApiDraftOrder } }>(`/draft-orders/${draftId}/convert`, {
    method: 'POST',
    body: JSON.stringify({
      payment_status: payload.paymentStatus?.toLowerCase(),
      payment_method: payload.paymentMethod,
    }),
  });

  return {
    order: mapOrderFromApi(response.data.order),
    draft: mapDraftOrderFromApi(response.data.draft),
  };
}

export async function sendDraftInvoice(draftId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: { draft: ApiDraftOrder } }>(`/draft-orders/${draftId}/send-invoice`, {
    method: 'POST',
  });

  return mapDraftOrderFromApi(response.data.draft);
}

export async function fetchReviews(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiReview[] }>('/reviews');

  return response.data.map(mapReviewFromApi);
}

export async function exportReviewReport(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{
    data: ApiReview[];
    summary: { total: number; average_rating: number; pending: number; approved: number; featured: number; hidden: number };
  }>('/reviews/export');

  return {
    reviews: response.data.map(mapReviewFromApi),
    summary: response.summary,
  };
}

export async function updateReviewStatus(reviewId: string, status: ReviewRecord['status'], options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiReview }>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: status.toLowerCase() }),
  });

  return mapReviewFromApi(response.data);
}

export async function deleteReview(reviewId: string, options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  await client.request<void>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}
