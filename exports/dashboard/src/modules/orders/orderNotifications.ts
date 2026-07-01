import { isPendingFulfillment } from './orderDetailActions';
import type { Order } from './types';

export function getOrdersAttentionCount(orders: Order[]) {
  return orders.filter((order) => isPendingFulfillment(order.fulfillmentStatus)).length;
}
