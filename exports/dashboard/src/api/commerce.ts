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
  status: 'vip' | 'returning' | 'new';
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
  shipping_address?: Partial<ShippingAddress> | null;
  shipment?: { courier?: string; status?: ApiFulfillmentStatus; tracking_location?: string; tracking_number?: string } | null;
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
    },
    shippingAddress: {
      recipient: order.shipping_address?.recipient ?? order.customer?.name ?? '',
      line1: order.shipping_address?.line1 ?? '',
      line2: order.shipping_address?.line2 ?? '',
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
    status: customer.status === 'vip' ? 'VIP' : customer.status === 'returning' ? 'Returning' : 'New',
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

export async function fetchCustomers(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiCustomer[] }>('/customers');

  return response.data.map(mapCustomerFromApi);
}

export async function fetchOrders(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiOrder[] }>('/orders');

  return response.data.map(mapOrderFromApi);
}

export async function updateOrderStatus(
  orderId: string,
  patch: { fulfillmentStatus?: FulfillmentStatus; paymentStatus?: PaymentStatus; trackingNumber?: string; courier?: string },
  options: ApiClientOptions = {},
) {
  const client = createApiClient(options);
  const normalizedId = orderId.replace(/^#/, '');
  const response = await client.request<{ data: ApiOrder }>(`/orders/${normalizedId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      fulfillment_status: patch.fulfillmentStatus ? toApiFulfillmentStatus(patch.fulfillmentStatus) : undefined,
      payment_status: patch.paymentStatus ? patch.paymentStatus.toLowerCase() : undefined,
      tracking_number: patch.trackingNumber,
      courier: patch.courier,
    }),
  });

  return mapOrderFromApi(response.data);
}

export async function fetchReviews(options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiReview[] }>('/reviews');

  return response.data.map(mapReviewFromApi);
}

export async function updateReviewStatus(reviewId: string, status: ReviewRecord['status'], options: ApiClientOptions = {}) {
  const client = createApiClient(options);
  const response = await client.request<{ data: ApiReview }>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: status.toLowerCase() }),
  });

  return mapReviewFromApi(response.data);
}
