import type { LucideIcon } from 'lucide-react';

export type PaymentStatus = 'Paid' | 'Pending';
export type FulfillmentStatus = 'Processing' | 'Shipped' | 'Unfulfilled' | 'Delivered';
export type SettlementStatus = 'Unsettled' | 'Processing' | 'Settled';

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface Customer {
  name: string;
  email: string;
  tag: string;
}

export interface ShippingAddress {
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  country: string;
}

export interface ShipmentSummary {
  orderDate: string;
  courier: string;
  status: FulfillmentStatus;
  trackingLocation: string;
  trackingNumber?: string;
}

export interface Order {
  id: string;
  backendId?: string;
  customer: Customer;
  products: string;
  date: string;
  total: number;
  paymentStatus: PaymentStatus;
  settlementStatus?: SettlementStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  shipment: ShipmentSummary;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

export interface BulkShipmentConfig {
  courier: string;
  packageType: string;
  shippingMethod: string;
  autoTracking: boolean;
  autoMarkShipped: boolean;
}

export interface GeneratedShipment {
  orderId: string;
  trackingNumber: string;
  status: 'Success' | 'Failed';
}
