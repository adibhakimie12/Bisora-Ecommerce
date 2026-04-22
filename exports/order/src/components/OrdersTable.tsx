import type { Order } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrdersTableProps {
  orders: Order[];
  selectedOrderIds: string[];
  onToggleOrder: (orderId: string) => void;
  onToggleAll: () => void;
  onOpenOrder: (orderId: string) => void;
}

export function OrdersTable({
  orders,
  selectedOrderIds,
  onToggleAll,
  onToggleOrder,
  onOpenOrder,
}: OrdersTableProps) {
  const allSelected = selectedOrderIds.length === orders.length;

  return (
    <section className="overflow-hidden rounded border border-outline bg-surface-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">
                <input
                  aria-label="Select all orders"
                  checked={allSelected}
                  className="h-4 w-4 rounded border-outline"
                  onChange={onToggleAll}
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {orders.map((order) => {
              const selected = selectedOrderIds.includes(order.id);

              return (
                <tr key={order.id} className={selected ? 'bg-primary/5' : 'hover:bg-surface-low'}>
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${order.id}`}
                      checked={selected}
                      className="h-4 w-4 rounded border-outline"
                      onChange={() => onToggleOrder(order.id)}
                      onClick={(event) => event.stopPropagation()}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="font-mono text-sm font-semibold text-primary hover:underline"
                      onClick={() => onOpenOrder(order.id)}
                      type="button"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-left" onClick={() => onOpenOrder(order.id)} type="button">
                      <span className="block text-sm font-medium">{order.customer.name}</span>
                      <span className="block text-xs text-muted">{order.customer.email}</span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">{order.products}</td>
                  <td className="px-4 py-4 text-sm text-muted">{order.date}</td>
                  <td className="px-4 py-4 text-sm font-semibold">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.fulfillmentStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
