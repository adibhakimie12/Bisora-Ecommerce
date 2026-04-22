import type { FulfillmentStatus, PaymentStatus, SettlementStatus } from './types';

type Status =
  | PaymentStatus
  | SettlementStatus
  | FulfillmentStatus
  | 'Success'
  | 'Failed'
  | 'Abandoned'
  | 'Contacted'
  | 'Recovered';

const statusClasses: Record<Status, string> = {
  Paid: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Processing: 'bg-primary/10 text-primary',
  Unsettled: 'bg-warning/10 text-warning',
  Settled: 'bg-success/10 text-success',
  Shipped: 'bg-secondary/10 text-secondary',
  Unfulfilled: 'bg-warning/10 text-warning',
  Delivered: 'bg-success/10 text-success',
  Success: 'bg-success/10 text-success',
  Failed: 'bg-error/10 text-error',
  Abandoned: 'bg-error/10 text-error',
  Contacted: 'bg-warning/10 text-warning',
  Recovered: 'bg-success/10 text-success',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {status}
    </span>
  );
}
