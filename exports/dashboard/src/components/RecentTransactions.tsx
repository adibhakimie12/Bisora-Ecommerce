import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { recentTransactions } from '../data';
import type { Transaction } from '../types';

export function RecentTransactions() {
  const [transactions, setTransactions] = useState(recentTransactions);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [archiveCandidateId, setArchiveCandidateId] = useState<string | null>(null);
  const [lastArchived, setLastArchived] = useState<{ transaction: Transaction; index: number } | null>(null);

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenuId(null);
        setArchiveCandidateId(null);
      }
    };
    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
      setLastArchived(null);
    }, 4800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const markAsShipped = (transactionId: string) => {
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === transactionId
          ? {
              ...transaction,
              status: 'Shipped',
            }
          : transaction,
      ),
    );
    setNotice(`${transactionId} marked as shipped.`);
  };

  const archiveTransaction = (transactionId: string) => {
    setTransactions((current) => {
      const targetIndex = current.findIndex((transaction) => transaction.id === transactionId);

      if (targetIndex === -1) {
        return current;
      }

      setLastArchived({ transaction: current[targetIndex], index: targetIndex });
      return current.filter((transaction) => transaction.id !== transactionId);
    });
    setNotice(`${transactionId} archived from dashboard list.`);
  };

  const undoArchive = () => {
    if (!lastArchived) {
      return;
    }

    setTransactions((current) => {
      const next = [...current];
      const insertAt = Math.min(lastArchived.index, next.length);
      next.splice(insertAt, 0, lastArchived.transaction);
      return next;
    });
    setLastArchived(null);
    setNotice('Archive reverted.');
  };

  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest">
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 p-5">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Recent Transactions</h2>
          <p className="text-sm text-on-surface-variant">Latest orders across the storefront</p>
        </div>
        <a className="text-sm font-medium text-primary hover:underline" href="#/orders">
          View All
        </a>
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 bg-primary/5 px-5 py-2 text-xs text-primary">
          <span>{notice}</span>
          {lastArchived ? (
            <button
              className="rounded border border-primary/30 px-2 py-1 text-[11px] font-medium hover:bg-primary/10"
              onClick={undoArchive}
              type="button"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-5 py-3 font-semibold">Order ID</th>
              <th className="px-5 py-3 font-semibold">Customer Name</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                activeMenuId={activeMenuId}
                onMarkAsShipped={markAsShipped}
                onRequestArchive={setArchiveCandidateId}
                onSendInvoice={(id) => setNotice(`Invoice reminder queued for ${id}.`)}
                onToggleMenu={(id) => setActiveMenuId((current) => (current === id ? null : id))}
                transaction={transaction}
              />
            ))}
            {transactions.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-sm text-on-surface-variant" colSpan={5}>
                  No recent transactions in this dashboard view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {archiveCandidateId ? (
        <ConfirmArchiveDialog
          onCancel={() => setArchiveCandidateId(null)}
          onConfirm={() => {
            archiveTransaction(archiveCandidateId);
            setArchiveCandidateId(null);
          }}
          transactionId={archiveCandidateId}
        />
      ) : null}
    </section>
  );
}

function TransactionRow({
  transaction,
  activeMenuId,
  onMarkAsShipped,
  onRequestArchive,
  onSendInvoice,
  onToggleMenu,
}: {
  transaction: Transaction;
  activeMenuId: string | null;
  onMarkAsShipped: (id: string) => void;
  onRequestArchive: (id: string) => void;
  onSendInvoice: (id: string) => void;
  onToggleMenu: (id: string) => void;
}) {
  const orderRouteId = transaction.id.replace('#', '');

  return (
    <tr className="hover:bg-surface-low">
      <td className="px-5 py-4">
        <a className="font-mono text-sm font-semibold text-primary hover:underline" href={transaction.href}>
          {transaction.id}
        </a>
      </td>
      <td className="px-5 py-4 text-sm font-medium">{transaction.customerName}</td>
      <td className="px-5 py-4">
        <StatusBadge status={transaction.status} />
      </td>
      <td className="px-5 py-4 text-sm font-semibold">{transaction.amount}</td>
      <td className="relative px-5 py-4 text-right">
        <button
          aria-label={`Actions for ${transaction.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface hover:text-primary"
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu(transaction.id);
          }}
          type="button"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {activeMenuId === transaction.id ? (
          <div
            className="absolute right-4 top-12 z-10 w-48 rounded border border-outline-variant/30 bg-surface-lowest p-1 text-left shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <a
              className="block rounded px-3 py-2 text-xs hover:bg-surface-low"
              href={`#/orders/${orderRouteId}`}
              onClick={() => onToggleMenu(transaction.id)}
            >
              View order details
            </a>
            <a
              className="block rounded px-3 py-2 text-xs hover:bg-surface-low"
              href={`#/orders/${orderRouteId}/shipment-processing`}
              onClick={() => onToggleMenu(transaction.id)}
            >
              Open shipment flow
            </a>
            <button
              className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low"
              onClick={() => {
                onToggleMenu(transaction.id);
                onSendInvoice(transaction.id);
              }}
              type="button"
            >
              Send invoice
            </button>
            <button
              className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low"
              onClick={() => {
                onToggleMenu(transaction.id);
                onMarkAsShipped(transaction.id);
              }}
              type="button"
            >
              Mark as shipped
            </button>
            <button
              className="block w-full rounded px-3 py-2 text-left text-xs text-error hover:bg-error/5"
              onClick={() => {
                onToggleMenu(transaction.id);
                onRequestArchive(transaction.id);
              }}
              type="button"
            >
              Archive row
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const statusClass = {
    Paid: 'bg-success/10 text-success',
    Processing: 'bg-warning/10 text-warning',
    Shipped: 'bg-primary/10 text-primary',
  }[status];

  return <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass}`}>{status}</span>;
}

function ConfirmArchiveDialog({
  transactionId,
  onCancel,
  onConfirm,
}: {
  transactionId: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-lg border border-outline-variant/30 bg-surface-lowest p-5 shadow-xl">
        <p className="text-lg font-semibold text-on-surface">Archive transaction?</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          {transactionId} will be removed from dashboard quick list. You can still open it from Orders.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="rounded border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/5" onClick={onConfirm} type="button">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
