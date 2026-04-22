import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Download, Search, Sparkles } from 'lucide-react';
import {
  dateRows,
  financeKpis,
  intelligenceCards,
  overviewMetrics,
  payoutRows,
  productSalesRows,
  reconciliationRows,
  recommendedActionsSeed,
  revenuePerformance,
  settlementRows,
  topProducts,
  transactionRows,
  variantSalesRows,
} from './data';
import type {
  DateBreakdownRow,
  FinanceKpi,
  FinanceTab,
  PayoutRow,
  ProductSalesRow,
  ReconciliationRow,
  RecommendedAction,
  ReportsMetric,
  ReportsSection,
  ReportsTab,
  RevenuePoint,
  SettlementRow,
  TopProduct,
  TransactionRow,
  VariantSalesRow,
} from './types';

interface ReportsModuleProps {
  section?: string;
}

interface BannerState {
  title: string;
  description: string;
}

interface ReportsSectionGroup {
  id: 'analytics' | 'finance';
  label: string;
  description: string;
  items: Array<{
    key: ReportsSection;
    label: string;
    href: string;
  }>;
}

interface ActiveReportsView {
  group: 'analytics' | 'finance';
  tab: ReportsSection;
}

type FinanceViewMode = 'basic' | 'advanced';

const analyticsTabs: Array<{ key: ReportsTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'date', label: 'Sales by Date' },
  { key: 'product', label: 'Sales by Product' },
  { key: 'variant', label: 'Sales by Variant' },
  { key: 'ai-insights', label: 'AI Insights' },
];

const financeTabs: Array<{ key: FinanceTab; label: string }> = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'reconciliation', label: 'Reconciliation' },
];

const reportsSectionGroups: ReportsSectionGroup[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Performance reporting',
    items: analyticsTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      href: tab.key === 'overview' ? '#/reports' : `#/reports/${tab.key}`,
    })),
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Cash flow and controls',
    items: financeTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      href: `#/reports/${tab.key}`,
    })),
  },
];

export function ReportsModule({ section }: ReportsModuleProps) {
  const activeView = normalizeReportsSection(section);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [actions, setActions] = useState(recommendedActionsSeed);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setBanner(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const notify = (title: string, description: string) => setBanner({ title, description });

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-on-surface-variant">Reports Module</p>
        <h1 className="text-4xl font-semibold tracking-tight text-on-surface">Reports</h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          Separate performance analytics from finance operations with focused reporting surfaces for growth and cash flow.
        </p>
      </header>

      {banner ? <Banner title={banner.title} description={banner.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <ReportsSectionNav activeView={activeView} />

        <div className="space-y-6">
          {activeView.group === 'analytics' ? (
            <AnalyticsWorkspace
              activeTab={activeView.tab as ReportsTab}
              actions={actions}
              onExecuteAction={(id) =>
                setActions((current) =>
                  current.map((action) => (action.id === id ? { ...action, status: 'Executed' } : action)),
                )
              }
              onNotify={notify}
            />
          ) : (
            <FinanceWorkspace activeTab={activeView.tab as FinanceTab} onNotify={notify} />
          )}
        </div>
      </div>
    </section>
  );
}

function ReportsSectionNav({ activeView }: { activeView: ActiveReportsView }) {
  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-lowest shadow-sm">
        <div className="border-b border-outline-variant/20 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Report Areas</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Keep analytics and finance separate, but one click away.
          </p>
        </div>

        <nav className="space-y-1 p-3">
          {reportsSectionGroups.map((group, groupIndex) => (
            <div
              className={groupIndex > 0 ? 'mt-4 border-t border-outline-variant/20 pt-4' : ''}
              key={group.id}
            >
              <div className="px-2 pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  {group.label}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">{group.description}</p>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeView.tab === item.key;
                  return (
                    <a
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm transition ${
                        isActive
                          ? 'border-primary/25 bg-primary/10 text-primary shadow-sm'
                          : 'border-transparent text-on-surface-variant hover:border-outline-variant/20 hover:bg-surface-low hover:text-on-surface'
                      }`}
                      href={item.href}
                      key={item.key}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isActive ? 'bg-primary' : group.id === 'finance' ? 'bg-primary/25' : 'bg-surface-container-high'
                        }`}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function AnalyticsWorkspace({
  activeTab,
  actions,
  onExecuteAction,
  onNotify,
}: {
  activeTab: ReportsTab;
  actions: RecommendedAction[];
  onExecuteAction: (id: string) => void;
  onNotify: (title: string, description: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHero
        badge="Analytics"
        title="Performance analytics"
        description="Existing growth and conversion reporting stays exactly where operators expect it, with the current analytics tab strip preserved."
      />

      <nav className="border-b border-outline-variant/20">
        <ul className="flex flex-wrap gap-1">
          {analyticsTabs.map((tab) => (
            <li key={tab.key}>
              <a
                className={`inline-flex rounded-t px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                href={tab.key === 'overview' ? '#/reports' : `#/reports/${tab.key}`}
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {activeTab === 'overview' ? (
        <OverviewTab
          onExport={() => onNotify('Overview exported', 'High-level report export is ready.')}
          onRunInsight={() => onNotify('AI insight refreshed', 'New recommendations were generated from latest data.')}
        />
      ) : null}

      {activeTab === 'date' ? (
        <SalesByDateTab onExport={() => onNotify('Date report exported', 'Sales by Date CSV is prepared.')} />
      ) : null}

      {activeTab === 'product' ? (
        <SalesByProductTab
          onExport={() => onNotify('Product report exported', 'Sales by Product export is prepared.')}
          onViewAllInsights={() => onNotify('Category insights opened', 'Insights panel expanded for deeper analysis.')}
        />
      ) : null}

      {activeTab === 'variant' ? (
        <SalesByVariantTab
          onApplySuggestion={(suggestion) => onNotify('Suggestion applied', `${suggestion} updated in current workspace.`)}
          onExport={() => onNotify('Variant report exported', 'Sales by Variant export is prepared.')}
        />
      ) : null}

      {activeTab === 'ai-insights' ? (
        <AIInsightsTab
          actions={actions}
          onExecute={onExecuteAction}
          onExport={() => onNotify('AI actions exported', 'Recommended action queue exported successfully.')}
          onRunCard={(title) => onNotify('Insight opened', `${title} workflow has been opened.`)}
        />
      ) : null}
    </div>
  );
}

function FinanceWorkspace({
  activeTab,
  onNotify,
}: {
  activeTab: FinanceTab;
  onNotify: (title: string, description: string) => void;
}) {
  const [viewMode, setViewMode] = useState<FinanceViewMode>('basic');

  return (
    <div className="space-y-6">
      <SectionHero
        badge="Finance"
        title="Financial reporting"
        description="Monitor cash movement, settlement timing, payout operations, and reconciliation exceptions without adding finance noise into analytics."
      />

      <FinanceExperienceBar activeTab={activeTab} viewMode={viewMode} onChangeViewMode={setViewMode} />

      <FinanceSummaryStrip />

      {activeTab === 'transactions' ? (
        <TransactionsFinanceTab
          onExport={() => onNotify('Transactions exported', 'Transaction ledger export is ready.')}
          onReviewFlagged={() => onNotify('Flagged queue opened', 'Flagged transactions filtered for finance review.')}
          viewMode={viewMode}
        />
      ) : null}

      {activeTab === 'settlements' ? (
        <SettlementsFinanceTab
          onExport={() => onNotify('Settlements exported', 'Settlement summary package is prepared.')}
          onSync={() => onNotify('Settlement sync started', 'Processor settlement data is being refreshed.')}
          viewMode={viewMode}
        />
      ) : null}

      {activeTab === 'payouts' ? (
        <PayoutsFinanceTab
          onExport={() => onNotify('Payouts exported', 'Payout register export is prepared.')}
          onReviewHold={() => onNotify('Hold queue opened', 'On-hold payouts were filtered for follow-up.')}
          viewMode={viewMode}
        />
      ) : null}

      {activeTab === 'reconciliation' ? (
        <ReconciliationFinanceTab
          onExport={() => onNotify('Reconciliation exported', 'Exception report exported successfully.')}
          onIssueAction={(label, row) => onNotify(label, `${row.orderId} is now open in the ${label.toLowerCase()} workflow.`)}
          onOpenExceptions={() => onNotify('Exceptions opened', 'Open reconciliation exceptions are ready for investigation.')}
          viewMode={viewMode}
        />
      ) : null}
    </div>
  );
}

function FinanceExperienceBar({
  activeTab,
  viewMode,
  onChangeViewMode,
}: {
  activeTab: FinanceTab;
  viewMode: FinanceViewMode;
  onChangeViewMode: (mode: FinanceViewMode) => void;
}) {
  const helperCopy = {
    transactions: 'See what customers paid, with deeper gateway details only when you need them.',
    settlements: 'Follow money moving from gateway to your bank without reading every batch first.',
    payouts: 'Start with seller-friendly cash flow summaries, then open detailed payout records if needed.',
    reconciliation: 'See the few issues that need action before digging into technical reconciliation work.',
  }[activeTab];

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Finance View</p>
          <p className="mt-2 text-sm text-on-surface">{viewMode === 'basic' ? 'Basic mode keeps things calmer for sellers.' : 'Advanced mode shows the full finance operating layer.'}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{helperCopy}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface p-1">
          {(
            [
              { key: 'basic', label: 'Basic' },
              { key: 'advanced', label: 'Advanced' },
            ] as const
          ).map((option) => (
            <button
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                viewMode === option.key
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
              }`}
              key={option.key}
              onClick={() => onChangeViewMode(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHero({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(139,92,246,0.1),rgba(255,255,255,0.96))] px-5 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{badge}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{description}</p>
    </section>
  );
}

function FinanceSummaryStrip() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {financeKpis.map((metric) => (
        <FinanceMetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}

function TransactionsFinanceTab({
  onExport,
  onReviewFlagged,
  viewMode,
}: {
  onExport: () => void;
  onReviewFlagged: () => void;
  viewMode: FinanceViewMode;
}) {
  const [dateRange, setDateRange] = useState<'Last 7 Days' | 'Last 30 Days' | 'This Month'>('Last 30 Days');
  const [gateway, setGateway] = useState<'All Gateways' | 'SecurePay' | 'Stripe'>('All Gateways');
  const [status, setStatus] = useState<'All Statuses' | 'Paid' | 'Failed' | 'Refunded'>('All Statuses');
  const [query, setQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(transactionRows[0]?.id ?? null);

  const filteredRows = useMemo(
    () =>
      transactionRows.filter((row) => {
        const gatewayPass = gateway === 'All Gateways' || row.gateway === gateway;
        const statusPass = status === 'All Statuses' || row.status === status;
        const queryValue = query.trim().toLowerCase();
        const queryPass =
          queryValue.length === 0 ||
          row.transactionId.toLowerCase().includes(queryValue) ||
          row.orderId.toLowerCase().includes(queryValue) ||
          row.customer.toLowerCase().includes(queryValue);

        const datePass =
          dateRange === 'Last 7 Days'
            ? ['tr-1', 'tr-2', 'tr-3'].includes(row.id)
            : dateRange === 'This Month'
              ? row.id !== 'tr-7'
              : true;

        return gatewayPass && statusPass && queryPass && datePass;
      }),
    [dateRange, gateway, query, status],
  );

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedTransactionId(null);
      return;
    }

    setSelectedTransactionId((current) =>
      current && filteredRows.some((row) => row.id === current) ? current : filteredRows[0].id,
    );
  }, [filteredRows]);

  const selectedTransaction =
    filteredRows.find((row) => row.id === selectedTransactionId) ??
    transactionRows.find((row) => row.id === selectedTransactionId) ??
    null;

  const totalTransactions = filteredRows.length;
  const successfulPayments = filteredRows.filter((row) => row.status === 'Paid').length;
  const failedPayments = filteredRows.filter((row) => row.status === 'Failed').length;
  const refundedAmount = filteredRows
    .filter((row) => row.status === 'Refunded')
    .reduce((sum, row) => sum + row.grossAmount, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceMetricCard
          metric={{ label: 'Total Transactions', value: totalTransactions.toLocaleString(), helper: `${dateRange} selection` }}
        />
        <FinanceMetricCard
          metric={{ label: 'Successful Payments', value: successfulPayments.toLocaleString(), helper: 'Paid and captured successfully' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Failed Payments', value: failedPayments.toLocaleString(), helper: 'Authorization or capture failures' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Refunded Amount', value: formatRM(refundedAmount), helper: 'Gross value returned to customers' }}
        />
      </section>

      {viewMode === 'basic' ? (
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Ledger
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onReviewFlagged} type="button">
                Review Failed
              </button>
            </div>
          }
          subtitle="Quick finance view for sellers"
          title="Transaction Summary"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">What this page shows</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Customer payments from connected gateways. Use this view to check whether payments are successful, failed, or refunded without scanning the full ledger.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <DetailStatCard label="Gateway View" value={gateway} />
                <DetailStatCard label="Date Range" value={dateRange} />
                <DetailStatCard label="Focus" value={status === 'All Statuses' ? 'All payments' : status} />
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">Needs attention</p>
              <div className="mt-3 space-y-3">
                <InsightPill tone="warning" text={`${failedPayments} payment(s) need review in this selection.`} />
                <InsightPill tone="positive" text={`${successfulPayments} payment(s) were captured successfully.`} />
              </div>
            </div>
          </div>
        </Panel>
      ) : (
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel
            action={
              <div className="flex flex-wrap gap-2">
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                  Export Ledger
                </button>
                <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onReviewFlagged} type="button">
                  Review Failed
                </button>
              </div>
            }
            subtitle="All gateway transactions across SecurePay, Stripe, and wallet payment flows"
            title="Transactions Ledger"
          >
            <div className="grid gap-3 border-b border-outline-variant/20 pb-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-on-surface-variant">Date Range</span>
                <select
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) => setDateRange(event.target.value as 'Last 7 Days' | 'Last 30 Days' | 'This Month')}
                  value={dateRange}
                >
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Month</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-on-surface-variant">Gateway</span>
                <select
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) => setGateway(event.target.value as 'All Gateways' | 'SecurePay' | 'Stripe')}
                  value={gateway}
                >
                  <option>All Gateways</option>
                  <option>SecurePay</option>
                  <option>Stripe</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-on-surface-variant">Payment Status</span>
                <select
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  onChange={(event) => setStatus(event.target.value as 'All Statuses' | 'Paid' | 'Failed' | 'Refunded')}
                  value={status}
                >
                  <option>All Statuses</option>
                  <option>Paid</option>
                  <option>Failed</option>
                  <option>Refunded</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-on-surface-variant">Search</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
                  <input
                    className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm outline-none focus:border-primary"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Order ID / customer / transaction ID"
                    value={query}
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1220px] text-sm">
                <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left">Transaction ID</th>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Gateway</th>
                    <th className="px-4 py-3 text-left">Payment Method</th>
                    <th className="px-4 py-3 text-left">Gross Amount</th>
                    <th className="px-4 py-3 text-left">Fees</th>
                    <th className="px-4 py-3 text-left">Net Amount</th>
                    <th className="px-4 py-3 text-left">Payment Status</th>
                    <th className="px-4 py-3 text-left">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredRows.map((row) => (
                    <TransactionTableRow
                      isActive={row.id === selectedTransactionId}
                      key={row.id}
                      onSelect={() => setSelectedTransactionId(row.id)}
                      row={row}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-outline-variant/30 px-4 py-8 text-center text-sm text-on-surface-variant">
                No transactions match the selected filters.
              </div>
            ) : null}
          </Panel>
        </div>

        <TransactionDetailDrawer
          transaction={selectedTransaction}
          onClose={() => setSelectedTransactionId(null)}
        />
      </section>
      )}
    </div>
  );
}

function SettlementsFinanceTab({
  onExport,
  onSync,
  viewMode,
}: {
  onExport: () => void;
  onSync: () => void;
  viewMode: FinanceViewMode;
}) {
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(settlementRows[0]?.id ?? null);
  const pendingSettlement = settlementRows
    .filter((row) => row.status === 'Pending')
    .reduce((sum, row) => sum + row.netPayout, 0);
  const processingSettlement = settlementRows
    .filter((row) => row.status === 'Processing')
    .reduce((sum, row) => sum + row.netPayout, 0);
  const settledThisWeek = settlementRows
    .filter((row) => row.status === 'Settled')
    .reduce((sum, row) => sum + row.netPayout, 0);
  const totalFeesDeducted = settlementRows.reduce((sum, row) => sum + row.fees, 0);
  const selectedSettlement =
    settlementRows.find((row) => row.id === selectedSettlementId) ?? settlementRows[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceMetricCard
          metric={{ label: 'Pending Settlement', value: formatRM(pendingSettlement), helper: 'Queued for processor release' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Processing Settlement', value: formatRM(processingSettlement), helper: 'Moving through gateway payout flow' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Settled This Week', value: formatRM(settledThisWeek), helper: 'Arrived in merchant bank account' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Total Fees Deducted', value: formatRM(totalFeesDeducted), helper: 'Gateway deductions across listed batches' }}
        />
      </section>

      {viewMode === 'basic' ? (
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Settlements
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSync} type="button">
                Sync Processors
              </button>
            </div>
          }
          subtitle="Simple view of money moving to your bank"
          title="Settlement Overview"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">What to focus on</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                `Pending` means the gateway still has the funds. `Processing` means payout is moving. `Settled` means the money reached your bank.
              </p>
              <div className="mt-4 space-y-3">
                {settlementRows.slice(0, 3).map((row) => (
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-lowest px-3 py-3" key={row.id}>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{row.settlementBatchId}</p>
                      <p className="text-xs text-on-surface-variant">{row.gateway} to {row.bankAccount}</p>
                    </div>
                    <FinanceStatusPill tone={row.status === 'Settled' ? 'success' : row.status === 'Processing' ? 'warning' : 'neutral'}>
                      {row.status}
                    </FinanceStatusPill>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">Seller note</p>
              <div className="mt-3 space-y-3">
                <InsightPill tone="positive" text={`${settlementRows.filter((row) => row.status === 'Settled').length} batch(es) already reached the bank.`} />
                <InsightPill tone="warning" text={`${settlementRows.filter((row) => row.status !== 'Settled').length} batch(es) are still in progress.`} />
              </div>
            </div>
          </div>
        </Panel>
      ) : (
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel
            action={
              <div className="flex flex-wrap gap-2">
                <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                  Export Settlements
                </button>
                <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSync} type="button">
                  Sync Processors
                </button>
              </div>
            }
            subtitle="Track funds moving from gateway clearing into merchant bank accounts"
            title="Settlement Batches"
          >
            <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Settlement Status Mix</p>
                <div className="mt-4 space-y-4">
                  {settlementRows.map((row) => {
                    const ratio = row.grossAmount > 0 ? Math.round((row.netPayout / row.grossAmount) * 100) : 0;
                    return (
                      <div key={row.id}>
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span>{row.settlementBatchId}</span>
                          <span>{ratio}% net payout</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-surface-low">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Settlement Clarity</p>
                <div className="mt-4 space-y-3 text-sm">
                  <InsightPill tone="positive" text="Settled batches show clear bank arrival visibility for treasury teams." />
                  <InsightPill tone="warning" text="Pending batches are highlighted before payout timing slips affect cash planning." />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 text-left">Settlement Batch ID</th>
                    <th className="px-4 py-3 text-left">Gateway</th>
                    <th className="px-4 py-3 text-left">Number of Orders</th>
                    <th className="px-4 py-3 text-left">Gross Amount</th>
                    <th className="px-4 py-3 text-left">Fees</th>
                    <th className="px-4 py-3 text-left">Net Payout</th>
                    <th className="px-4 py-3 text-left">Bank Account</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Estimated Arrival Date</th>
                    <th className="px-4 py-3 text-left">Settled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {settlementRows.map((row) => (
                    <SettlementTableRow
                      isActive={row.id === selectedSettlementId}
                      key={row.id}
                      onSelect={() => setSelectedSettlementId(row.id)}
                      row={row}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <SettlementDetailDrawer settlement={selectedSettlement} />
      </section>
      )}
    </div>
  );
}

function PayoutsFinanceTab({
  onExport,
  onReviewHold,
  viewMode,
}: {
  onExport: () => void;
  onReviewHold: () => void;
  viewMode: FinanceViewMode;
}) {
  const availableBalance = payoutRows
    .filter((row) => row.status === 'In transit' || row.status === 'Completed')
    .reduce((sum, row) => sum + row.amount, 0);
  const upcomingPayout = payoutRows
    .filter((row) => row.status === 'In transit')
    .reduce((sum, row) => sum + row.amount, 0);
  const settledThisMonth = payoutRows
    .filter((row) => row.status === 'Completed')
    .reduce((sum, row) => sum + row.amount, 0);
  const lastPayoutDate = payoutRows
    .filter((row) => row.status === 'Completed')
    .map((row) => row.expectedAt)
    .at(-1) ?? '-';

  const payoutTrend = payoutRows.map((row) => ({
    label: row.periodLabel,
    current: row.status === 'Completed' ? row.amount : 0,
    previous: row.status === 'In transit' || row.status === 'On hold' ? row.amount : 0,
  }));

  const gatewayBreakdown = ['SecurePay', 'Stripe'].map((gateway) => {
    const rows = payoutRows.filter((row) => row.gateway === gateway);
    return {
      gateway,
      grossSales: rows.reduce((sum, row) => sum + row.grossSales, 0),
      fees: rows.reduce((sum, row) => sum + row.fees, 0),
      netPayout: rows.reduce((sum, row) => sum + row.amount, 0),
    };
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceMetricCard
          metric={{ label: 'Available Balance', value: formatRM(availableBalance), helper: 'Money ready or already moving to your bank' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Upcoming Payout', value: formatRM(upcomingPayout), helper: 'Expected in the next transfer cycle' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Settled This Month', value: formatRM(settledThisMonth), helper: 'Arrived in your bank this month' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Last Payout Date', value: lastPayoutDate, helper: 'Most recent completed payout date' }}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Panel
          action={
            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Settled
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-container-high" />
                Pending
              </span>
            </div>
          }
          subtitle="Daily payout trend showing what is already settled versus still pending"
          title="Payout Trend"
        >
          <LineComparisonChart points={payoutTrend} />
        </Panel>

        <Panel title="Cash Flow Notes">
          <div className="space-y-3 text-sm">
            <InsightPill tone="positive" text="Available Balance shows money already completed or on the way to your bank." />
            <InsightPill tone="warning" text="Upcoming Payout includes transfers still being processed by the gateway." />
            <InsightPill tone="positive" text="Use the gateway breakdown below to see how each provider contributes to net cash." />
          </div>
        </Panel>
      </section>

      {viewMode === 'basic' ? (
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Payouts
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onReviewHold} type="button">
                Review Holds
              </button>
            </div>
          }
          subtitle="Simple breakdown for sellers"
          title="Payout Snapshot"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="space-y-4">
              {gatewayBreakdown.map((item) => (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4" key={item.gateway}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-on-surface">{item.gateway}</p>
                    <FinanceStatusPill tone="success">Connected</FinanceStatusPill>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <DetailStatCard label="Gross Sales" value={formatRM(item.grossSales)} />
                    <DetailStatCard label="Fees" value={formatRM(item.fees)} />
                    <DetailStatCard label="Net Payout" value={formatRM(item.netPayout)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">Quick read</p>
              <div className="mt-3 space-y-3">
                <InsightPill tone="positive" text={`Last completed payout landed on ${lastPayoutDate}.`} />
                <InsightPill tone="warning" text={`${payoutRows.filter((row) => row.status !== 'Completed').length} payout(s) are still pending or on hold.`} />
              </div>
            </div>
          </div>
        </Panel>
      ) : (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Payouts
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onReviewHold} type="button">
                Review Holds
              </button>
            </div>
          }
          subtitle="Simple view of gross sales, fees, and final net payout by gateway"
          title="Gateway Breakdown"
        >
          <div className="space-y-4">
            {gatewayBreakdown.map((item) => (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4" key={item.gateway}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-on-surface">{item.gateway}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">How this gateway contributes to your cash flow</p>
                  </div>
                  <FinanceStatusPill tone="success">Active</FinanceStatusPill>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DetailStatCard label="Gross Sales" value={formatRM(item.grossSales)} />
                  <DetailStatCard label="Fees" value={formatRM(item.fees)} />
                  <DetailStatCard label="Net Payout" value={formatRM(item.netPayout)} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel subtitle="Latest payout events and where the money is headed" title="Payout Register">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-left">Payout ID</th>
                  <th className="px-4 py-3 text-left">Gateway</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Net Payout</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payoutRows.map((row) => (
                  <PayoutTableRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
      )}
    </div>
  );
}

function ReconciliationFinanceTab({
  onExport,
  onIssueAction,
  onOpenExceptions,
  viewMode,
}: {
  onExport: () => void;
  onIssueAction: (label: string, row: ReconciliationRow) => void;
  onOpenExceptions: () => void;
  viewMode: FinanceViewMode;
}) {
  const paidButUnsettledOrders = reconciliationRows.filter((row) => row.issueType === 'Unsettled' && row.status !== 'Resolved').length;
  const missingTransactions = reconciliationRows.filter((row) => row.issueType === 'Missing' && row.status !== 'Resolved').length;
  const settlementMismatch = reconciliationRows
    .filter((row) => row.issueType === 'Unsettled' || row.issueType === 'Missing')
    .reduce((sum, row) => sum + (row.status === 'Resolved' ? 0 : row.amount), 0);
  const syncErrors = reconciliationRows.filter((row) => row.issueType === 'Failed Sync' && row.status !== 'Resolved').length;
  const activeIssues = reconciliationRows.filter((row) => row.status !== 'Resolved');

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceMetricCard
          metric={{ label: 'Paid but Unsettled Orders', value: String(paidButUnsettledOrders), helper: 'Orders paid, but not yet matched to settlement' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Missing Transactions', value: String(missingTransactions), helper: 'Orders without a usable payment record' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Settlement Mismatch', value: formatRM(settlementMismatch), helper: 'Value currently not reconciling cleanly' }}
        />
        <FinanceMetricCard
          metric={{ label: 'Sync Errors', value: String(syncErrors), helper: 'Gateway sync issues that need attention' }}
        />
      </section>

      {viewMode === 'basic' ? (
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Exceptions
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onOpenExceptions} type="button">
                Open Exception Queue
              </button>
            </div>
          }
          subtitle="Only the most important mismatches"
          title="Reconciliation Summary"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="space-y-3">
              {activeIssues.slice(0, 3).map((row) => (
                <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4" key={row.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-warning">{row.orderId}</p>
                      <p className="mt-1 text-sm text-warning/90">{row.description}</p>
                    </div>
                    <FinanceStatusPill tone="warning">{row.issueType}</FinanceStatusPill>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
              <p className="text-sm font-medium text-on-surface">What this means</p>
              <div className="mt-3 space-y-3">
                <InsightPill tone="warning" text="Open issues mean some orders, payments, and settlements still do not match." />
                <InsightPill tone="positive" text="Switch to Advanced mode when you want the full issue workflow." />
              </div>
            </div>
          </div>
        </Panel>
      ) : (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Panel
          action={
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
                Export Exceptions
              </button>
              <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onOpenExceptions} type="button">
                Open Exception Queue
              </button>
            </div>
          }
          subtitle="Focused issue list for orders, payments, and settlements that do not line up"
          title="Reconciliation Issues"
        >
          <div className="mb-4 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-4">
            <p className="text-sm font-medium text-warning">Attention needed</p>
            <p className="mt-1 text-sm text-warning/90">
              {activeIssues.length} active issues need review before your records fully match across orders, payments, and settlements.
            </p>
          </div>

          <div className="space-y-3">
            {reconciliationRows.map((row) => (
              <ReconciliationIssueCard key={row.id} onAction={onIssueAction} row={row} />
            ))}
          </div>
        </Panel>

        <Panel title="What These Mean">
          <div className="space-y-3 text-sm">
            <WarningNote
              title="Unsettled"
              description="The order was paid, but the settlement record has not arrived yet."
            />
            <WarningNote
              title="Missing"
              description="The order exists, but the matching payment transaction is not available."
            />
            <WarningNote
              title="Failed Sync"
              description="The gateway update did not sync correctly and may need a manual retry."
            />
          </div>
        </Panel>
      </section>
      )}
    </div>
  );
}

function OverviewTab({
  onExport,
  onRunInsight,
}: {
  onExport: () => void;
  onRunInsight: () => void;
}) {
  const [selectedRange, setSelectedRange] = useState<'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days'>('Last 30 Days');

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded border border-outline-variant/20 p-1">
          {(['Last 7 Days', 'Last 30 Days', 'Last 90 Days'] as const).map((range) => (
            <button
              className={`rounded px-3 py-1.5 text-xs ${
                selectedRange === range ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-low'
              }`}
              key={range}
              onClick={() => setSelectedRange(range)}
              type="button"
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </span>
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onRunInsight} type="button">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Run AI Insight
            </span>
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <Panel title="Revenue Performance" subtitle={`${selectedRange} vs previous period`}>
          <LineComparisonChart points={revenuePerformance} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatTile label="Email" value="42% Share" />
            <StatTile label="WhatsApp" value="38% Share" />
            <StatTile label="New Customers" value="RM 64,412" />
            <StatTile label="Returning Customers" value="RM 73,200" />
          </div>
        </Panel>

        <Panel title="AI Insights Panel">
          <div className="space-y-3 text-sm">
            <InsightPill tone="positive" text="Revenue trend is stable and improving in the last 14 days." />
            <InsightPill tone="warning" text="Conversion dip detected on selected product variants." />
            <InsightPill tone="positive" text="WhatsApp retention flows outperform broad email blasts." />
            <button className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onRunInsight} type="button">
              Apply Recommendation
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="Top Performing Products">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Units Sold</th>
                <th className="px-4 py-3 text-left">Revenue</th>
                <th className="px-4 py-3 text-left">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {topProducts.map((product) => (
                <tr className="hover:bg-surface-low" key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={product.name} className="h-10 w-10 rounded object-cover" src={product.imageUrl} />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">{product.units.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatRM(product.revenue)}</td>
                  <td className="px-4 py-3">{trendLabel(product.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SalesByDateTab({ onExport }: { onExport: () => void }) {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [granularity, setGranularity] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [compare, setCompare] = useState(true);

  const rows = useMemo(() => {
    if (range === '7') {
      return dateRows.slice(0, 4);
    }
    if (range === '90') {
      return [...dateRows, ...dateRows].map((row, index) => ({ ...row, id: `${row.id}-${index}` })).slice(0, 10);
    }
    return dateRows;
  }, [range]);

  const metrics = useMemo(() => {
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const orders = rows.reduce((sum, row) => sum + row.orders, 0);
    const aov = orders > 0 ? revenue / orders : 0;
    return {
      revenue,
      orders,
      aov,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs uppercase tracking-wide text-on-surface-variant">Date Range</label>
          {(
            [
              { key: '7', label: 'Last 7 Days' },
              { key: '30', label: 'Last 30 Days' },
              { key: '90', label: 'Last 90 Days' },
            ] as const
          ).map((option) => (
            <button
              className={`rounded border px-3 py-1.5 text-xs ${
                range === option.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-low'
              }`}
              key={option.key}
              onClick={() => setRange(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['Daily', 'Weekly', 'Monthly'] as const).map((option) => (
            <button
              className={`rounded border px-3 py-1.5 text-xs ${
                granularity === option
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-low'
              }`}
              key={option}
              onClick={() => setGranularity(option)}
              type="button"
            >
              {option}
            </button>
          ))}
          <button
            className={`rounded border px-3 py-1.5 text-xs ${
              compare ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant'
            }`}
            onClick={() => setCompare((current) => !current)}
            type="button"
          >
            Compare
          </button>
          <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={onExport} type="button">
            Export Report
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard metric={{ label: 'Revenue', value: formatRM(metrics.revenue), helper: `${granularity} view` }} />
        <MetricCard metric={{ label: 'Orders', value: metrics.orders.toLocaleString(), helper: `${range}-day range` }} />
        <MetricCard metric={{ label: 'Avg Order Value', value: formatRM(metrics.aov), helper: compare ? 'Compared to previous period' : 'No comparison enabled' }} />
      </section>

      <Panel title="Revenue Trend">
        <LineComparisonChart
          points={revenuePerformance.map((point) => ({
            ...point,
            current: granularity === 'Daily' ? point.current : granularity === 'Weekly' ? point.current * 1.8 : point.current * 2.6,
            previous: granularity === 'Daily' ? point.previous : granularity === 'Weekly' ? point.previous * 1.7 : point.previous * 2.4,
          }))}
          showPrevious={compare}
        />
      </Panel>

      <Panel title="Daily Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Orders</th>
                <th className="px-4 py-3 text-left">Revenue</th>
                <th className="px-4 py-3 text-left">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((row) => (
                <tr className="hover:bg-surface-low" key={row.id}>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.orders}</td>
                  <td className="px-4 py-3">{formatRM(row.revenue)}</td>
                  <td className="px-4 py-3">{formatRM(row.avgOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SalesByProductTab({
  onExport,
  onViewAllInsights,
}: {
  onExport: () => void;
  onViewAllInsights: () => void;
}) {
  const [category, setCategory] = useState<'All Categories' | 'Abayas' | 'Wraps' | 'Gowns' | 'Kaftans'>(
    'All Categories',
  );
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      productSalesRows.filter((row) => {
        const categoryPass = category === 'All Categories' || row.category === category;
        const queryPass =
          query.trim().length === 0 ||
          row.name.toLowerCase().includes(query.toLowerCase()) ||
          row.category.toLowerCase().includes(query.toLowerCase());
        return categoryPass && queryPass;
      }),
    [category, query],
  );

  const totalRevenue = filtered.reduce((sum, row) => sum + row.revenue, 0);
  const unitsSold = filtered.reduce((sum, row) => sum + row.unitsSold, 0);
  const topCategory = filtered[0]?.category ?? '-';
  const avgItemsPerOrder = filtered.length > 0 ? unitsSold / Math.max(filtered.length * 120, 1) : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
            onChange={(event) =>
              setCategory(
                event.target.value as 'All Categories' | 'Abayas' | 'Wraps' | 'Gowns' | 'Kaftans',
              )
            }
            value={category}
          >
            <option>All Categories</option>
            <option>Abayas</option>
            <option>Wraps</option>
            <option>Gowns</option>
            <option>Kaftans</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
            <input
              className="w-64 rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product / SKU"
              value={query}
            />
          </div>
        </div>
        <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
          Export Report
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard metric={{ label: 'Total Revenue', value: formatRM(totalRevenue), helper: 'Filtered product revenue' }} />
        <MetricCard metric={{ label: 'Units Sold', value: unitsSold.toLocaleString(), helper: 'Across selected products' }} />
        <MetricCard metric={{ label: 'Top Category', value: topCategory, helper: 'Highest share in current filter' }} />
        <MetricCard metric={{ label: 'Avg Items per Order', value: avgItemsPerOrder.toFixed(2), helper: 'Estimated basket density' }} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <Panel title="Revenue Distribution">
          <div className="space-y-3">
            {filtered.slice(0, 4).map((row) => {
              const pct = totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={row.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{row.name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-surface-low">
                    <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Category Insights">
          <p className="text-sm text-on-surface-variant">
            Top category currently contributes the largest revenue share in this range.
          </p>
          <button className="mt-4 w-full rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onViewAllInsights} type="button">
            View Detailed Insights
          </button>
        </Panel>
      </div>

      <Panel title="Product Performance">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Units Sold</th>
                <th className="px-4 py-3 text-left">Revenue</th>
                <th className="px-4 py-3 text-left">Conv.</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((row) => (
                <tr className="hover:bg-surface-low" key={row.id}>
                  <td className="px-4 py-3">{row.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={row.name} className="h-10 w-10 rounded object-cover" src={row.imageUrl} />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{row.unitsSold.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatRM(row.revenue)}</td>
                  <td className="px-4 py-3">{row.conversionRate.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={row.status === 'Healthy' ? 'success' : row.status === 'Watch' ? 'warning' : 'neutral'}>
                      {row.status}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SalesByVariantTab({
  onExport,
  onApplySuggestion,
}: {
  onExport: () => void;
  onApplySuggestion: (suggestion: string) => void;
}) {
  const [stockFilter, setStockFilter] = useState<'All' | 'Low Stock' | 'Healthy'>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      variantSalesRows.filter((row) => {
        const queryPass =
          query.trim().length === 0 ||
          row.productName.toLowerCase().includes(query.toLowerCase()) ||
          row.variant.toLowerCase().includes(query.toLowerCase()) ||
          row.sku.toLowerCase().includes(query.toLowerCase());
        const stockPass =
          stockFilter === 'All' || (stockFilter === 'Low Stock' ? row.stock <= 10 : row.stock > 10);
        return queryPass && stockPass;
      }),
    [query, stockFilter],
  );

  const totalRevenue = filtered.reduce((sum, row) => sum + row.revenue, 0);
  const totalOrders = filtered.reduce((sum, row) => sum + row.orders, 0);
  const bestVariant = filtered.reduce((best, row) => (row.revenue > best.revenue ? row : best), filtered[0] ?? null);
  const lowStockCount = filtered.filter((row) => row.stock <= 10).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Low Stock', 'Healthy'] as const).map((option) => (
            <button
              className={`rounded border px-3 py-1.5 text-xs ${
                stockFilter === option
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-low'
              }`}
              key={option}
              onClick={() => setStockFilter(option)}
              type="button"
            >
              {option}
            </button>
          ))}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
            <input
              className="w-64 rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search variant / SKU"
              value={query}
            />
          </div>
        </div>
        <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
          Export Report
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard metric={{ label: 'Revenue', value: formatRM(totalRevenue), helper: 'Variant-level revenue' }} />
        <MetricCard metric={{ label: 'Orders', value: totalOrders.toLocaleString(), helper: 'Variant-level orders' }} />
        <MetricCard metric={{ label: 'Best Variant', value: bestVariant ? bestVariant.variant : '-', helper: bestVariant ? bestVariant.productName : 'No data' }} />
        <MetricCard metric={{ label: 'Low Stock Variants', value: String(lowStockCount), helper: 'Need restock planning' }} />
      </section>

      <Panel title="Variant Performance">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Variant</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Orders</th>
                <th className="px-4 py-3 text-left">Revenue</th>
                <th className="px-4 py-3 text-left">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((row) => (
                <tr className="hover:bg-surface-low" key={row.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={row.productName} className="h-10 w-10 rounded object-cover" src={row.imageUrl} />
                      <span className="font-medium">{row.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.variant}</td>
                  <td className="px-4 py-3">{row.sku}</td>
                  <td className="px-4 py-3">
                    <span className={row.stock <= 10 ? 'font-medium text-warning' : ''}>{row.stock}</span>
                  </td>
                  <td className="px-4 py-3">{row.orders}</td>
                  <td className="px-4 py-3">{formatRM(row.revenue)}</td>
                  <td className="px-4 py-3">{trendLabel(row.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <SuggestionCard
          description="Focus ads on top converting variants in navy and emerald tones."
          title="Optimize Top Variant"
          onApply={() => onApplySuggestion('Top variant optimization')}
        />
        <SuggestionCard
          description="Bundle neutral-color variants to improve basket completion."
          title="Neutral Color Strategy"
          onApply={() => onApplySuggestion('Neutral color bundling')}
        />
        <SuggestionCard
          description="Restock low-stock winning variants to prevent revenue loss."
          title="Critical Restock Action"
          onApply={() => onApplySuggestion('Critical restock')}
        />
      </div>
    </div>
  );
}

function AIInsightsTab({
  actions,
  onRunCard,
  onExecute,
  onExport,
}: {
  actions: RecommendedAction[];
  onRunCard: (title: string) => void;
  onExecute: (id: string) => void;
  onExport: () => void;
}) {
  const confidence = 94;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {intelligenceCards.map((card) => (
            <Panel key={card.id} subtitle={card.summary} title={card.title}>
              <div className="flex items-center justify-between">
                <StatusPill tone={card.status === 'Positive' ? 'success' : card.status === 'Warning' ? 'warning' : 'neutral'}>
                  {card.status}
                </StatusPill>
                <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onRunCard(card.title)} type="button">
                  {card.cta}
                </button>
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="AI Confidence">
          <div className="text-center">
            <p className="text-5xl font-semibold text-primary">{confidence}%</p>
            <p className="mt-2 text-sm text-on-surface-variant">Data confidence score</p>
          </div>
          <div className="mt-4 space-y-2 text-xs text-on-surface-variant">
            <p>Data sources:</p>
            <p>1. Orders</p>
            <p>2. Products</p>
            <p>3. Marketing</p>
            <p>4. Channel tracking</p>
          </div>
        </Panel>
      </section>

      <Panel
        action={
          <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={onExport} type="button">
            Export Actions
          </button>
        }
        title="Recommended Action Queue"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Est. Impact</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {actions.map((action) => (
                <tr className="hover:bg-surface-low" key={action.id}>
                  <td className="px-4 py-3">{action.action}</td>
                  <td className="px-4 py-3">{action.priority}</td>
                  <td className="px-4 py-3">{action.category}</td>
                  <td className="px-4 py-3">{action.impact}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={action.status === 'Executed' ? 'success' : 'warning'}>{action.status}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={action.status === 'Executed'}
                      onClick={() => onExecute(action.id)}
                      type="button"
                    >
                      Execute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest">
      <header className="flex items-start justify-between gap-3 border-b border-outline-variant/20 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetricCard({ metric }: { metric: ReportsMetric }) {
  return (
    <article className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{metric.helper}</p>
    </article>
  );
}

function FinanceMetricCard({ metric }: { metric: FinanceKpi }) {
  return (
    <article className="rounded-2xl border border-outline-variant/20 bg-surface-lowest p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant">{metric.label}</p>
      <p className="mt-3 text-2xl font-semibold text-on-surface">{metric.value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{metric.helper}</p>
    </article>
  );
}

function MiniFinanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-lowest px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'neutral';
  children: ReactNode;
}) {
  const className = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    neutral: 'bg-surface-low text-on-surface-variant',
  }[tone];
  return <span className={`rounded px-2 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function FinanceStatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'neutral';
  children: ReactNode;
}) {
  const className = {
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    neutral: 'border-outline-variant/20 bg-surface-low text-on-surface-variant',
  }[tone];
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function Banner({ title, description }: BannerState) {
  return (
    <div className="rounded border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      <p className="font-medium">{title}</p>
      <p className="text-xs">{description}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-outline-variant/20 px-3 py-2">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function InsightPill({ tone, text }: { tone: 'positive' | 'warning'; text: string }) {
  return (
    <div className={`rounded border px-3 py-2 text-xs ${tone === 'positive' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
      {text}
    </div>
  );
}

function SuggestionCard({
  title,
  description,
  onApply,
}: {
  title: string;
  description: string;
  onApply: () => void;
}) {
  return (
    <div className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
      <button className="mt-4 w-full rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onApply} type="button">
        Apply Suggestion
      </button>
    </div>
  );
}

function LineComparisonChart({
  points,
  showPrevious = true,
}: {
  points: RevenuePoint[];
  showPrevious?: boolean;
}) {
  const maxValue = Math.max(...points.map((point) => Math.max(point.current, point.previous)));
  return (
    <div className="h-56">
      <div className="flex h-full items-end gap-3 rounded border border-outline-variant/20 px-4 py-3">
        {points.map((point) => (
          <div className="flex h-full flex-1 flex-col justify-end gap-2" key={point.label}>
            <div className="relative h-full">
              {showPrevious ? (
                <div
                  className="absolute bottom-0 left-1/2 w-2 -translate-x-1/2 rounded bg-surface-container-high"
                  style={{ height: `${Math.max((point.previous / maxValue) * 100, 4)}%` }}
                />
              ) : null}
              <div
                className="absolute bottom-0 left-1/2 w-3 -translate-x-1/2 rounded bg-primary"
                style={{ height: `${Math.max((point.current / maxValue) * 100, 6)}%` }}
              />
            </div>
            <span className="text-center text-[11px] text-on-surface-variant">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionTableRow({
  row,
  isActive,
  onSelect,
}: {
  row: TransactionRow;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={`cursor-pointer transition ${isActive ? 'bg-primary/5' : 'hover:bg-surface-low'}`}
      onClick={onSelect}
    >
      <td className="px-4 py-3 font-medium">{row.transactionId}</td>
      <td className="px-4 py-3">{row.orderId}</td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-on-surface">{row.customer}</p>
          <p className="text-xs text-on-surface-variant">{row.customerEmail}</p>
        </div>
      </td>
      <td className="px-4 py-3">{row.gateway}</td>
      <td className="px-4 py-3">{row.paymentMethod}</td>
      <td className="px-4 py-3">
        {formatRM(row.grossAmount)}
      </td>
      <td className="px-4 py-3">{formatRM(row.fee)}</td>
      <td className="px-4 py-3 font-medium">{formatRM(row.netAmount)}</td>
      <td className="px-4 py-3">
        <FinanceStatusPill tone={row.status === 'Paid' ? 'success' : row.status === 'Failed' ? 'warning' : 'neutral'}>
          {row.status}
        </FinanceStatusPill>
      </td>
      <td className="px-4 py-3 text-on-surface-variant">{row.paymentDate}</td>
    </tr>
  );
}

function TransactionDetailDrawer({
  transaction,
  onClose,
}: {
  transaction: TransactionRow | null;
  onClose: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-outline-variant/20 bg-surface-lowest shadow-sm 2xl:sticky 2xl:top-24 2xl:self-start">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Transaction Detail</p>
          <h3 className="mt-2 text-lg font-semibold text-on-surface">
            {transaction ? transaction.transactionId : 'No transaction selected'}
          </h3>
        </div>
        <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={onClose} type="button">
          Clear
        </button>
      </div>

      {transaction ? (
        <div className="space-y-5 px-5 py-5">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Payment Status</p>
                <div className="mt-2">
                  <FinanceStatusPill tone={transaction.status === 'Paid' ? 'success' : transaction.status === 'Failed' ? 'warning' : 'neutral'}>
                    {transaction.status}
                  </FinanceStatusPill>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Net Amount</p>
                <p className="mt-2 text-xl font-semibold text-on-surface">{formatRM(transaction.netAmount)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <DetailRow label="Order ID" value={transaction.orderId} />
            <DetailRow label="Customer" value={transaction.customer} />
            <DetailRow label="Email" value={transaction.customerEmail} />
            <DetailRow label="Gateway" value={transaction.gateway} />
            <DetailRow label="Payment Method" value={transaction.paymentMethod} />
            <DetailRow label="Gross Amount" value={formatRM(transaction.grossAmount)} />
            <DetailRow label="Fees" value={formatRM(transaction.fee)} />
            <DetailRow label="Net Amount" value={formatRM(transaction.netAmount)} />
            <DetailRow label="Payment Date" value={transaction.paymentDate} />
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Notes</p>
            <p className="mt-2 text-sm leading-6 text-on-surface">{transaction.notes}</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-on-surface-variant">
          Select a row from the transactions table to inspect gateway, payment, and customer details.
        </div>
      )}
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

function SettlementTableRow({
  row,
  isActive,
  onSelect,
}: {
  row: SettlementRow;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={`cursor-pointer transition ${isActive ? 'bg-primary/5' : 'hover:bg-surface-low'}`}
      onClick={onSelect}
    >
      <td className="px-4 py-3 font-medium">{row.settlementBatchId}</td>
      <td className="px-4 py-3">{row.gateway}</td>
      <td className="px-4 py-3">{row.orderCount}</td>
      <td className="px-4 py-3">{formatRM(row.grossAmount)}</td>
      <td className="px-4 py-3">{formatRM(row.fees)}</td>
      <td className="px-4 py-3 font-medium">{formatRM(row.netPayout)}</td>
      <td className="px-4 py-3">{row.bankAccount}</td>
      <td className="px-4 py-3">
        <FinanceStatusPill tone={row.status === 'Settled' ? 'success' : row.status === 'Processing' ? 'warning' : 'neutral'}>
          {row.status}
        </FinanceStatusPill>
      </td>
      <td className="px-4 py-3 text-on-surface-variant">{row.estimatedArrivalDate}</td>
      <td className="px-4 py-3 text-on-surface-variant">{row.settledDate}</td>
    </tr>
  );
}

function SettlementDetailDrawer({ settlement }: { settlement: SettlementRow | null }) {
  return (
    <aside className="rounded-2xl border border-outline-variant/20 bg-surface-lowest shadow-sm 2xl:sticky 2xl:top-24 2xl:self-start">
      <div className="border-b border-outline-variant/20 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">Settlement Detail</p>
        <h3 className="mt-2 text-lg font-semibold text-on-surface">
          {settlement ? settlement.settlementBatchId : 'No settlement selected'}
        </h3>
      </div>

      {settlement ? (
        <div className="space-y-5 px-5 py-5">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Payout Status</p>
                <div className="mt-2">
                  <FinanceStatusPill tone={settlement.status === 'Settled' ? 'success' : settlement.status === 'Processing' ? 'warning' : 'neutral'}>
                    {settlement.status}
                  </FinanceStatusPill>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Net Payout</p>
                <p className="mt-2 text-xl font-semibold text-on-surface">{formatRM(settlement.netPayout)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <DetailRow label="Gateway" value={settlement.gateway} />
            <DetailRow label="Orders" value={String(settlement.orderCount)} />
            <DetailRow label="Gross Amount" value={formatRM(settlement.grossAmount)} />
            <DetailRow label="Fees" value={formatRM(settlement.fees)} />
            <DetailRow label="Bank Account" value={settlement.bankAccount} />
            <DetailRow label="Estimated Arrival" value={settlement.estimatedArrivalDate} />
            <DetailRow label="Settled Date" value={settlement.settledDate} />
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Settlement Timeline</p>
            <div className="mt-4 space-y-4">
              {settlement.timeline.map((step, index) => (
                <div className="flex gap-3" key={`${step.label}-${index}`}>
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-0.5 h-3 w-3 rounded-full ${
                        step.state === 'complete'
                          ? 'bg-success'
                          : step.state === 'current'
                            ? 'bg-primary'
                            : 'bg-surface-container-high'
                      }`}
                    />
                    {index < settlement.timeline.length - 1 ? (
                      <span className="mt-1 h-10 w-px bg-outline-variant/30" />
                    ) : null}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-on-surface">{step.label}</p>
                      <FinanceStatusPill tone={step.state === 'complete' ? 'success' : step.state === 'current' ? 'warning' : 'neutral'}>
                        {step.state === 'complete' ? 'Done' : step.state === 'current' ? 'Active' : 'Upcoming'}
                      </FinanceStatusPill>
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">{step.at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-on-surface-variant">
          Select a settlement row to review payout status and bank transfer timeline.
        </div>
      )}
    </aside>
  );
}

function PayoutTableRow({ row }: { row: PayoutRow }) {
  return (
    <tr className="hover:bg-surface-low">
      <td className="px-4 py-3 font-medium">{row.payoutId}</td>
      <td className="px-4 py-3">{row.gateway}</td>
      <td className="px-4 py-3">{row.destination}</td>
      <td className="px-4 py-3">{row.expectedAt}</td>
      <td className="px-4 py-3 font-medium">{formatRM(row.amount)}</td>
      <td className="px-4 py-3">
        <FinanceStatusPill tone={row.status === 'Completed' ? 'success' : row.status === 'On hold' ? 'warning' : 'neutral'}>
          {row.status}
        </FinanceStatusPill>
      </td>
    </tr>
  );
}

function DetailStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-lowest px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-base font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function ReconciliationIssueCard({
  row,
  onAction,
}: {
  row: ReconciliationRow;
  onAction: (label: string, row: ReconciliationRow) => void;
}) {
  const tone =
    row.status === 'Resolved' ? 'success' : row.issueType === 'Failed Sync' ? 'warning' : 'neutral';

  return (
    <article
      className={`rounded-2xl border p-4 ${
        row.status === 'Resolved'
          ? 'border-outline-variant/20 bg-surface'
          : 'border-warning/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.96))]'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-on-surface">{row.orderId}</p>
            <FinanceStatusPill tone={tone}>{row.issueType}</FinanceStatusPill>
            <FinanceStatusPill tone={row.status === 'Resolved' ? 'success' : row.status === 'In review' ? 'neutral' : 'warning'}>
              {row.status}
            </FinanceStatusPill>
          </div>

          <p className="max-w-2xl text-sm text-on-surface-variant">{row.description}</p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <IssueMeta label="Order ID" value={row.orderId} />
            <IssueMeta label="Issue Type" value={row.issueType} />
            <IssueMeta label="Amount" value={formatRM(row.amount)} />
            <IssueMeta label="Status" value={row.status} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low"
            onClick={() => onAction(row.actionLabel, row)}
            type="button"
          >
            {row.actionLabel}
          </button>
          <button
            className="rounded border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning hover:bg-warning/15"
            onClick={() => onAction('Investigate', row)}
            type="button"
          >
            Investigate
          </button>
        </div>
      </div>
    </article>
  );
}

function WarningNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
      <p className="text-sm font-semibold text-warning">{title}</p>
      <p className="mt-1 text-sm text-warning/90">{description}</p>
    </div>
  );
}

function IssueMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-lowest px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-medium text-on-surface">{value}</p>
    </div>
  );
}

function trendLabel(trend: 'up' | 'down' | 'flat') {
  if (trend === 'up') {
    return 'Up';
  }
  if (trend === 'down') {
    return 'Down';
  }
  return 'Flat';
}

function normalizeReportsSection(section?: string): ActiveReportsView {
  if (!section || section === 'overview') {
    return { group: 'analytics', tab: 'overview' };
  }

  if (
    section === 'date' ||
    section === 'product' ||
    section === 'variant' ||
    section === 'ai-insights'
  ) {
    return { group: 'analytics', tab: section };
  }

  if (
    section === 'transactions' ||
    section === 'settlements' ||
    section === 'payouts' ||
    section === 'reconciliation'
  ) {
    return { group: 'finance', tab: section };
  }

  return { group: 'analytics', tab: 'overview' };
}

function formatRM(value: number) {
  return `RM ${value.toLocaleString()}`;
}
