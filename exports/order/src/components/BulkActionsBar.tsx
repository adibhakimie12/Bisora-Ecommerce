import { PackageCheck, Printer, Trash2, Truck } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkShipment: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({ selectedCount, onBulkShipment, onClearSelection }: BulkActionsBarProps) {
  return (
    <section className="flex flex-col gap-3 rounded border border-primary/30 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-medium text-primary">{selectedCount} orders selected</p>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary"
          onClick={onBulkShipment}
          type="button"
        >
          <Truck className="h-4 w-4" />
          Bulk Generate Shipment
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline px-3 py-2 text-sm hover:bg-surface-low" type="button">
          <Printer className="h-4 w-4" />
          Print Waybill
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline px-3 py-2 text-sm hover:bg-surface-low" type="button">
          <PackageCheck className="h-4 w-4" />
          Mark as Shipped
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline px-3 py-2 text-sm text-error hover:bg-error/5" type="button">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <button className="rounded px-3 py-2 text-sm text-muted hover:text-on-surface" onClick={onClearSelection} type="button">
          Clear
        </button>
      </div>
    </section>
  );
}
