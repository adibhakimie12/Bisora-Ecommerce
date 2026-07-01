import type { PublicOrder } from '../../api/storefront';

export interface PublicOrderTrackingModel {
  backToStoreHref: string;
  mapUrl: string;
  orderLabel: string;
  shipmentLabel: string;
  steps: Array<{ label: string; active: boolean }>;
  totalLabel: string;
  trackingUrl: string;
}

export function shouldShowOrderTrackingPage(orderNumber?: string) {
  return Boolean(orderNumber?.trim());
}

export function buildPublicOrderTrackingModel(
  order: PublicOrder,
  options: {
    currency: string;
    storeSlug: string;
  },
): PublicOrderTrackingModel {
  const paymentStatus = order.paymentStatus.toLowerCase();
  const fulfillmentStatus = order.fulfillmentStatus.toLowerCase();
  const trackingNumber = order.shipment.trackingNumber.trim();
  const courier = order.shipment.courier.trim();

  return {
    backToStoreHref: `#/store/${options.storeSlug}`,
    mapUrl: buildPublicMapUrl(order),
    orderLabel: order.number,
    shipmentLabel: trackingNumber
      ? `${courier || 'Courier'} tracking ${trackingNumber}`
      : 'Tracking will appear here once the seller ships the order.',
    steps: [
      { label: 'Order received', active: true },
      { label: `Payment ${paymentStatus || 'pending'}`, active: paymentStatus === 'paid' },
      { label: 'Processing', active: ['processing', 'shipped', 'delivered'].includes(fulfillmentStatus) },
      { label: 'Shipped', active: ['shipped', 'delivered'].includes(fulfillmentStatus) },
      { label: 'Delivered', active: fulfillmentStatus === 'delivered' },
    ],
    totalLabel: formatPublicMoney(order.total, options.currency),
    trackingUrl: trackingNumber
      ? `https://www.google.com/search?q=${encodeURIComponent(`${courier || 'Courier'} tracking ${trackingNumber}`)}`
      : '',
  };
}

function formatPublicMoney(value: number, currency: string) {
  const prefix = currency.toUpperCase() === 'MYR' ? 'RM' : currency.toUpperCase();
  return `${prefix} ${value.toFixed(2)}`;
}

function buildPublicMapUrl(order: PublicOrder) {
  const query = [order.shippingAddress.recipient, order.shippingAddress.city, order.shippingAddress.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
