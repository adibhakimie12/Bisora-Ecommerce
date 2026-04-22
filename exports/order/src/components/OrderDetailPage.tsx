import { ArrowLeft, MapPin, Printer, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Order } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  onGenerateShipment: (orderId: string) => void;
}

export function OrderDetailPage({ order, onBack, onGenerateShipment }: OrderDetailPageProps) {
  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-muted">Order Detail</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{order.id}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded border border-outline px-4 py-2 text-sm hover:bg-surface-low" type="button">
            <Printer className="h-4 w-4" />
            Print Waybill
          </button>
          <button
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
            onClick={() => onGenerateShipment(order.id)}
            type="button"
          >
            <Truck className="h-4 w-4" />
            Generate Shipment
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Panel title="Ordered Items">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded border border-outline p-4">
                  <img alt="" className="h-16 w-16 rounded object-cover" referrerPolicy="no-referrer" src={item.imageUrl} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.sku}</p>
                    <p className="mt-2 text-sm text-muted">Qty {item.quantity} x ${item.price.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.quantity * item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Customer Info">
            <div className="grid gap-4 md:grid-cols-3">
              <Info label="Name" value={order.customer.name} />
              <Info label="Email" value={order.customer.email} />
              <Info label="Tag" value={order.customer.tag} />
            </div>
          </Panel>

          <Panel title="Shipping Address">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <address className="not-italic text-sm leading-6 text-muted">
                <strong className="text-on-surface">{order.shippingAddress.recipient}</strong>
                <br />
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.line2}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.country}
              </address>
              <div className="grid min-h-32 place-items-center rounded border border-dashed border-outline bg-surface-low text-center text-sm text-muted">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Map preview
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Shipment Summary">
            <div className="space-y-4">
              <Info label="Order date" value={order.shipment.orderDate} />
              <Info label="Courier" value={order.shipment.courier} />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Status</p>
                <div className="mt-2">
                  <StatusBadge status={order.shipment.status} />
                </div>
              </div>
              <Info label="Location tracking" value={order.shipment.trackingLocation} />
              <Info label="Tracking number" value={order.shipment.trackingNumber ?? 'Pending generation'} />
            </div>
          </Panel>

          <Panel title="Payment Info">
            <div className="space-y-4">
              <Info label="Payment method" value={order.paymentMethod} />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Payment status</p>
                <div className="mt-2">
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <Info label="Order total" value={`$${order.total.toLocaleString()}`} />
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-outline bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
