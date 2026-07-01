import { isPendingFulfillment } from './orderDetailActions';
import type { Order } from './types';

export interface SellerOrderNotification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  href: string;
  tone: 'attention' | 'success' | 'info';
  read: boolean;
}

export function getOrdersAttentionCount(orders: Order[]) {
  return orders.filter((order) => isPendingFulfillment(order.fulfillmentStatus)).length;
}

function buildOrderHref(orderId: string) {
  return `#/orders/${encodeURIComponent(orderId)}`;
}

function createNotification(order: Order, key: string, title: string, message: string, tone: SellerOrderNotification['tone'], readIds: Set<string>) {
  const id = `${order.id}:${key}`;

  return {
    id,
    orderId: order.id,
    title,
    message,
    href: buildOrderHref(order.id),
    tone,
    read: readIds.has(id),
  };
}

export function buildSellerOrderNotifications(orders: Order[], readIds = new Set<string>()): SellerOrderNotification[] {
  return orders.flatMap((order) => {
    const notifications: SellerOrderNotification[] = [];

    if (order.paymentStatus === 'Pending' || isPendingFulfillment(order.fulfillmentStatus)) {
      notifications.push(
        createNotification(
          order,
          'new-order',
          'New order needs action',
          `${order.customer.name} placed ${order.products}. Confirm payment and prepare fulfillment.`,
          'attention',
          readIds,
        ),
      );
    }

    if (order.fulfillmentStatus === 'Shipped') {
      notifications.push(
        createNotification(order, 'shipped', 'Order shipped', `${order.id} is marked shipped and ready for buyer tracking.`, 'success', readIds),
      );
    }

    if (order.fulfillmentStatus === 'Delivered') {
      notifications.push(createNotification(order, 'delivered', 'Order delivered', `${order.id} reached delivered status.`, 'success', readIds));
    }

    if (order.paymentStatus === 'Paid') {
      notifications.push(
        createNotification(order, 'payment-paid', 'Payment confirmed', `${order.customer.name}'s ${order.products} payment is paid.`, 'success', readIds),
      );
    }

    if (order.shipment.trackingNumber) {
      notifications.push(
        createNotification(
          order,
          'tracking-saved',
          'Tracking saved',
          `${order.shipment.courier} tracking ${order.shipment.trackingNumber} is attached to ${order.id}.`,
          'info',
          readIds,
        ),
      );
    }

    return notifications;
  });
}

export function getUnreadSellerNotificationCount(notifications: SellerOrderNotification[]) {
  return notifications.filter((notification) => !notification.read).length;
}
