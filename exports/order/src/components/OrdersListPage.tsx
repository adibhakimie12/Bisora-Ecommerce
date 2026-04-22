import { Download, Plus } from 'lucide-react';
import { kpiMetrics, orders } from '../data';
import type { Order, TopTab } from '../types';
import { BulkActionsBar } from './BulkActionsBar';
import { OrdersTable } from './OrdersTable';

const tabs: TopTab[] = ['All Orders', 'Draft Orders', 'Abandoned Checkouts'];

interface OrdersListPageProps {
  selectedOrderIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenOrder: (orderId: string) => void;
  onBulkShipment: () => void;
}

export function OrdersListPage({
  selectedOrderIds,
  onSelectionChange,
  onOpenOrder,
  onBulkShipment,
}: OrdersListPageProps) {
  const toggleOrder = (orderId: string) => {
    onSelectionChange(
      selectedOrderIds.includes(orderId)
        ? selectedOrderIds.filter((id) => id !== orderId)
        : [...selectedOrderIds, orderId],
    );
  };

  const toggleAll = () => {
    onSelectionChange(selectedOrderIds.length === orders.length ? [] : orders.map((order) => order.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-muted">Orders Module</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Orders</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded border border-outline px-4 py-2 text-sm font-medium hover:bg-surface-low">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim">
            <Plus className="h-4 w-4" />
            Create New Order
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-outline">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${
              tab === 'All Orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-on-surface'
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Order summary">
        {kpiMetrics.map((metric) => (
          <article key={metric.label} className="rounded border border-outline bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded bg-surface-low text-primary">
                <metric.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{metric.helper}</p>
          </article>
        ))}
      </section>

      {selectedOrderIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrderIds.length}
          onBulkShipment={onBulkShipment}
          onClearSelection={() => onSelectionChange([])}
        />
      )}

      <OrdersTable
        orders={orders}
        selectedOrderIds={selectedOrderIds}
        onOpenOrder={onOpenOrder}
        onToggleAll={toggleAll}
        onToggleOrder={toggleOrder}
      />
    </div>
  );
}
