import { ShoppingBag, Truck, Wallet } from 'lucide-react';
import type { KpiMetric, Order } from './types';

export const orders: Order[] = [
  {
    id: '#ORD-9021',
    customer: { name: 'Amina Al-Farsi', email: 'amina@example.com', tag: 'Platinum Member' },
    products: 'Silk Abaya, Modal Hijab',
    date: 'Apr 21, 2026',
    total: 450,
    paymentStatus: 'Paid',
    settlementStatus: 'Unsettled',
    fulfillmentStatus: 'Processing',
    paymentMethod: 'Visa ending 4242',
    shipment: {
      orderDate: 'Apr 21, 2026',
      courier: 'DHL',
      status: 'Processing',
      trackingLocation: 'Preparing shipment at warehouse',
      trackingNumber: 'DHL-9021-4881',
    },
    shippingAddress: {
      recipient: 'Amina Al-Farsi',
      line1: 'Villa 14, Jalan Ampang',
      line2: 'Taman U-Thant',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
    },
    items: [
      {
        id: 'item-1',
        name: 'Silk Evening Abaya',
        sku: 'ABY-SLK-004',
        quantity: 1,
        price: 360,
        imageUrl: 'https://picsum.photos/seed/order-abaya/96/96',
      },
      {
        id: 'item-2',
        name: 'Premium Modal Hijab',
        sku: 'HJB-MDL-018',
        quantity: 1,
        price: 90,
        imageUrl: 'https://picsum.photos/seed/order-hijab/96/96',
      },
    ],
  },
  {
    id: '#ORD-9019',
    customer: { name: 'Laila Bin-Khalid', email: 'laila@example.com', tag: 'Returning Customer' },
    products: 'Linen Dress, Wool Coat',
    date: 'Apr 21, 2026',
    total: 1220,
    paymentStatus: 'Pending',
    fulfillmentStatus: 'Unfulfilled',
    paymentMethod: 'Bank transfer',
    shipment: {
      orderDate: 'Apr 21, 2026',
      courier: 'Not assigned',
      status: 'Unfulfilled',
      trackingLocation: 'Awaiting fulfillment',
    },
    shippingAddress: {
      recipient: 'Laila Bin-Khalid',
      line1: 'No. 82, Persiaran KLCC',
      line2: 'Level 12',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
    },
    items: [
      {
        id: 'item-3',
        name: 'Linen Essential Dress',
        sku: 'DRS-LIN-212',
        quantity: 1,
        price: 520,
        imageUrl: 'https://picsum.photos/seed/order-dress/96/96',
      },
      {
        id: 'item-4',
        name: 'Wool Long Coat',
        sku: 'COT-WOL-102',
        quantity: 1,
        price: 700,
        imageUrl: 'https://picsum.photos/seed/order-coat/96/96',
      },
    ],
  },
  {
    id: '#ORD-9015',
    customer: { name: 'Zahra Mansour', email: 'zahra@example.com', tag: 'New Customer' },
    products: 'Chiffon Wrap Set',
    date: 'Apr 20, 2026',
    total: 890,
    paymentStatus: 'Paid',
    settlementStatus: 'Processing',
    fulfillmentStatus: 'Shipped',
    paymentMethod: 'Mastercard ending 1188',
    shipment: {
      orderDate: 'Apr 20, 2026',
      courier: 'J&T',
      status: 'Shipped',
      trackingLocation: 'Kuala Lumpur sorting hub',
      trackingNumber: 'JT-9015-2409',
    },
    shippingAddress: {
      recipient: 'Zahra Mansour',
      line1: '19 Jalan Maarof',
      line2: 'Bangsar',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
    },
    items: [
      {
        id: 'item-5',
        name: 'Chiffon Wrap Set',
        sku: 'WRP-CHF-022',
        quantity: 2,
        price: 445,
        imageUrl: 'https://picsum.photos/seed/order-wrap/96/96',
      },
    ],
  },
  {
    id: '#ORD-9011',
    customer: { name: 'Noura Saleh', email: 'noura@example.com', tag: 'VIP' },
    products: 'Linen Palazzo Pant',
    date: 'Apr 19, 2026',
    total: 315,
    paymentStatus: 'Paid',
    settlementStatus: 'Settled',
    fulfillmentStatus: 'Delivered',
    paymentMethod: 'Apple Pay',
    shipment: {
      orderDate: 'Apr 19, 2026',
      courier: 'DHL',
      status: 'Delivered',
      trackingLocation: 'Delivered to recipient',
      trackingNumber: 'DHL-9011-7833',
    },
    shippingAddress: {
      recipient: 'Noura Saleh',
      line1: 'Suite 7, Jalan Damai',
      line2: 'Ampang',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
    },
    items: [
      {
        id: 'item-6',
        name: 'Linen Palazzo Pant',
        sku: 'PNT-LIN-055',
        quantity: 1,
        price: 315,
        imageUrl: 'https://picsum.photos/seed/order-pant/96/96',
      },
    ],
  },
];

const revenue = orders.reduce((total, order) => total + order.total, 0);
const pendingFulfillment = orders.filter((order) => order.fulfillmentStatus === 'Unfulfilled').length;

export const orderKpiMetrics: KpiMetric[] = [
  { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, helper: 'Across all orders', icon: Wallet },
  { label: 'Total Orders', value: String(orders.length), helper: 'Current order queue', icon: ShoppingBag },
  { label: 'Pending Fulfillment', value: String(pendingFulfillment), helper: 'Needs shipment action', icon: Truck },
];
