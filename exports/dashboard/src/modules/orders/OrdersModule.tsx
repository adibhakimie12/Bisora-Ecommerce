import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Hash,
  ImagePlus,
  Mail,
  MapPin,
  PackageCheck,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { API_STORAGE_KEYS } from '../../api/http';
import { fetchOrders } from '../../api/commerce';
import { orderKpiMetrics, orders } from './data';
import type { Order } from './types';
import { BulkShipmentModal } from './BulkShipmentModal';
import { getCourierSettingByName, getEnabledCourierSettings } from './shippingSettings';
import { StatusBadge } from './StatusBadge';

interface OrdersModuleProps {
  section?: string;
  orderId?: string;
  subSection?: string;
}

interface ActionDialogState {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm?: () => void;
}

interface BannerState {
  title: string;
  description: string;
}

type ReminderChannel = 'smart' | 'email' | 'sms' | 'whatsapp';

const tabs = ['All Orders', 'Draft Orders', 'Abandoned Checkouts'] as const;

const draftOrders = [
  {
    id: 'DRAFT-104',
    customer: 'Nur Amirah',
    source: 'WhatsApp order',
    items: 3,
    total: 780,
    updatedAt: 'Apr 21, 2026',
    previewImages: [
      'https://picsum.photos/seed/draft-abaya/48/48',
      'https://picsum.photos/seed/draft-hijab/48/48',
      'https://picsum.photos/seed/draft-bag/48/48',
    ],
  },
  {
    id: 'DRAFT-103',
    customer: 'Siti Hajar',
    source: 'Offline boutique',
    items: 1,
    total: 360,
    updatedAt: 'Apr 20, 2026',
    previewImages: ['https://picsum.photos/seed/draft-dress/48/48'],
  },
];

const abandonedCheckouts: Array<{
  id: string;
  customer: string;
  email: string;
  value: number;
  cartItems: number;
  cartPreviewImages: string[];
  status: 'Abandoned' | 'Contacted' | 'Recovered';
  updatedAt: string;
}> = [
    {
      id: 'CHK-8821',
      customer: 'Alya Rahman',
      email: 'alya@example.com',
      value: 420,
      cartItems: 3,
      cartPreviewImages: [
        'https://picsum.photos/seed/checkout-abaya/48/48',
        'https://picsum.photos/seed/checkout-hijab/48/48',
        'https://picsum.photos/seed/checkout-accessory/48/48',
      ],
      status: 'Abandoned',
      updatedAt: '38 minutes ago',
    },
    {
      id: 'CHK-8817',
      customer: 'Sara Yusuf',
      email: 'sara@example.com',
      value: 890,
      cartItems: 2,
      cartPreviewImages: [
        'https://picsum.photos/seed/checkout-dress/48/48',
        'https://picsum.photos/seed/checkout-bag/48/48',
      ],
      status: 'Contacted',
      updatedAt: '2 hours ago',
    },
    {
      id: 'CHK-8801',
      customer: 'Maya Idris',
      email: 'maya@example.com',
      value: 315,
      cartItems: 1,
      cartPreviewImages: ['https://picsum.photos/seed/checkout-wrap/48/48'],
      status: 'Recovered',
      updatedAt: 'Yesterday',
    },
  ];

const shipmentSteps = [
  'Order Validation',
  'Courier Assignment',
  'Shipment Record',
  'Waybill Generation',
  'Status Update',
  'Notification Center',
];

interface ManualTrackingState {
  orderId: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
}

interface OrderTimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone?: 'default' | 'success' | 'warning';
}

interface SendInvoiceDraft {
  orderId: string;
  customerName: string;
  email: string;
}

type SellerFulfillmentStage =
  | 'Awaiting processing'
  | 'Processing'
  | 'Packed'
  | 'Ready for pickup'
  | 'Shipped'
  | 'Completed';

const sellerFulfillmentStages: SellerFulfillmentStage[] = [
  'Awaiting processing',
  'Processing',
  'Packed',
  'Ready for pickup',
  'Shipped',
  'Completed',
];

function hasApiToken() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(API_STORAGE_KEYS.token));
}

export function OrdersModule({ section, orderId, subSection }: OrdersModuleProps) {
  const [orderRecords, setOrderRecords] = useState<Order[]>(orders);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkShipment, setShowBulkShipment] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [manualTrackingOrderId, setManualTrackingOrderId] = useState<string | null>(null);
  const [sendInvoiceDraft, setSendInvoiceDraft] = useState<SendInvoiceDraft | null>(null);
  const [manualTrackingMap, setManualTrackingMap] = useState<Record<string, ManualTrackingState>>({});
  const [fulfillmentStageMap, setFulfillmentStageMap] = useState<Record<string, SellerFulfillmentStage>>({});
  const [orderTimelineMap, setOrderTimelineMap] = useState<Record<string, OrderTimelineEntry[]>>(() =>
    Object.fromEntries(orderRecords.map((order) => [order.id, createOrderTimelineSeed(order)])),
  );

  const selectedOrders = useMemo(
    () => orderRecords.filter((order) => selectedOrderIds.includes(order.id)),
    [orderRecords, selectedOrderIds],
  );

  const selectedOrder = orderId
    ? orderRecords.find((order) => routeId(order.id) === orderId)
    : undefined;

  const activeTab = normalizeOrdersTab(section);

  useEffect(() => {
    if (!hasApiToken()) return;

    fetchOrders()
      .then((items) => {
        if (items.length > 0) {
          setOrderRecords(items);
          setOrderTimelineMap(Object.fromEntries(items.map((order) => [order.id, createOrderTimelineSeed(order)])));
        }
      })
      .catch(() => {
        // Keep bundled demo orders available when backend is offline.
      });
  }, []);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setBanner(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const showBanner = (title: string, description: string) => {
    setBanner({ title, description });
  };

  const openActionDialog = (state: ActionDialogState) => {
    setActionDialog(state);
  };

  const openOrder = (id: string) => {
    window.location.hash = `/orders/${routeId(id)}`;
  };

  const openBulkShipment = (ids: string[]) => {
    setSelectedOrderIds(ids);
    setShowBulkShipment(true);
  };

  const appendTimelineEntry = (currentOrderId: string, entry: Omit<OrderTimelineEntry, 'id' | 'timestamp'>) => {
    setOrderTimelineMap((current) => {
      const currentOrder = orderRecords.find((item) => item.id === currentOrderId);
      const existingEntries = current[currentOrderId] ?? (currentOrder ? createOrderTimelineSeed(currentOrder) : []);

      return {
        ...current,
        [currentOrderId]: [
          {
            id: `${currentOrderId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: formatTimelineTimestamp(),
            ...entry,
          },
          ...existingEntries,
        ],
      };
    });
  };

  return (
    <>
      {selectedOrder && subSection === 'shipment-processing' ? (
        <ShipmentProcessingPage
          order={selectedOrder}
          onBack={() => (window.location.hash = `/orders/${routeId(selectedOrder.id)}`)}
          onPrintWaybill={() =>
            openActionDialog({
              title: 'Print waybill',
              description: `Waybill preview for ${selectedOrder.id} is ready for warehouse printing.`,
              confirmLabel: 'Done',
            })
          }
        />
      ) : selectedOrder ? (
        <OrderDetailPage
          order={selectedOrder}
          manualTracking={manualTrackingMap[selectedOrder.id]}
          fulfillmentStage={fulfillmentStageMap[selectedOrder.id] ?? mapOrderToSellerStage(selectedOrder.fulfillmentStatus)}
          timeline={orderTimelineMap[selectedOrder.id] ?? createOrderTimelineSeed(selectedOrder)}
          onBack={() => (window.location.hash = '/orders')}
          onGenerateShipment={(id) => (window.location.hash = `/orders/${routeId(id)}/shipment-processing`)}
          onManualTracking={() => setManualTrackingOrderId(selectedOrder.id)}
          onPrintOrder={() =>
            openActionDialog({
              title: 'Print order',
              description: `Printable order summary for ${selectedOrder.id} is ready for dispatch prep.`,
              confirmLabel: 'Done',
            })
          }
          onMarkShipped={() => {
            setFulfillmentStageMap((current) => ({ ...current, [selectedOrder.id]: 'Shipped' }));
            appendTimelineEntry(selectedOrder.id, {
              title: 'Order marked as shipped',
              description: 'Seller moved fulfillment forward manually while waiting for courier-side delivery confirmation.',
              tone: 'success',
            });
            showBanner('Marked as shipped', `${selectedOrder.id} has been moved to shipped status for the current session.`);
          }
          }
          onUpdateFulfillmentStage={(stage) => {
            setFulfillmentStageMap((current) => ({ ...current, [selectedOrder.id]: stage }));
            appendTimelineEntry(selectedOrder.id, {
              title: `Fulfillment stage updated to ${stage}`,
              description: 'Seller adjusted the operational stage for warehouse and support visibility.',
            });
            showBanner('Fulfillment updated', `${selectedOrder.id} is now set to ${stage}.`);
          }}
          onSendInvoice={() => {
            setSendInvoiceDraft({
              orderId: selectedOrder.id,
              customerName: selectedOrder.customer.name,
              email: selectedOrder.customer.email,
            });
          }}
          onDownloadInvoice={() => {
            appendTimelineEntry(selectedOrder.id, {
              title: 'Invoice PDF prepared',
              description: 'Seller opened the downloadable invoice copy for printing or manual sharing.',
            });
            openActionDialog({
              title: 'Download invoice',
              description: `Invoice PDF for ${selectedOrder.id} is ready for download.`,
              confirmLabel: 'Done',
            });
          }
          }
          onSendTrackingUpdate={() => {
            const tracking = manualTrackingMap[selectedOrder.id];
            if (!tracking) {
              showBanner('Tracking still missing', `Add a tracking number first before sending the delivery update to ${selectedOrder.customer.name}.`);
              return;
            }

            appendTimelineEntry(selectedOrder.id, {
              title: 'Tracking update sent to customer',
              description: `${selectedOrder.customer.name} was notified with ${tracking.trackingNumber} and the courier follow-up path.`,
              tone: 'success',
            });
            showBanner('Tracking update sent', `${selectedOrder.customer.name} can now follow ${tracking.trackingNumber} from the courier link.`);
          }}
        />
      ) : activeTab === 'New Order' ? (
        <CreateNewOrderPage
          onAddProduct={() =>
            openActionDialog({
              title: 'Product picker',
              description: 'Product search, variant selection, and quantity editing will plug into catalog data in the next backend phase.',
              confirmLabel: 'Got it',
            })
          }
          onSaveDraft={() => {
            showBanner('Draft saved', 'Manual order draft was saved and is now visible under Draft Orders.');
            window.location.hash = '/orders/drafts';
          }}
          onSendInvoice={() =>
            openActionDialog({
              title: 'Invoice prepared',
              description: 'Invoice delivery is mocked for now, but the order is ready to send through email or WhatsApp later.',
              confirmLabel: 'Close',
            })
          }
        />
      ) : activeTab === 'Draft Orders' ? (
        <OrdersShell activeTab={activeTab} banner={banner} onExportCsv={() => showBanner('Draft export queued', 'Draft orders CSV export was prepared for staff review.')}>
          <DraftOrdersPage
            onCreateClient={() =>
              openActionDialog({
                title: 'Create new client',
                description: 'Client creation flow is prepared here and will connect to Customers CRM records in the backend phase.',
                confirmLabel: 'Continue',
              })
            }
            onSaveDraft={() => showBanner('Draft updated', 'Draft order changes were saved successfully in the current workspace.')}
            onSendInvoice={() =>
              showBanner('Invoice sent', 'Draft invoice was prepared and sent to the selected customer contact flow.')
            }
          />
        </OrdersShell>
      ) : activeTab === 'Abandoned Checkouts' ? (
        <OrdersShell activeTab={activeTab} banner={banner} onExportCsv={() => showBanner('Recovery export queued', 'Abandoned checkout export is ready for recovery follow-up.')}>
          <AbandonedCheckoutsPage
            onExportData={() => showBanner('Export ready', 'Abandoned checkout export is ready for the retention team.')}
            onSendReminder={(checkoutId, channel) => {
              const channelLabel: Record<ReminderChannel, string> = {
                smart: 'Smart Send',
                email: 'Email',
                sms: 'SMS',
                whatsapp: 'WhatsApp',
              };
              showBanner('Reminder sent', `${channelLabel[channel]} reminder triggered for ${checkoutId}.`);
            }}
            onViewAnalytics={() =>
              openActionDialog({
                title: 'Recovery analytics',
                description: 'Analytics panel is active as a mocked flow. Recovery trends and attribution will connect to Reports later.',
                confirmLabel: 'Close',
              })
            }
          />
        </OrdersShell>
      ) : (
        <OrdersShell activeTab={activeTab} banner={banner} onExportCsv={() => showBanner('CSV export queued', 'Orders CSV export has been prepared for download.')}>
          <OrdersListPage
            selectedOrderIds={selectedOrderIds}
            onBulkShipment={() => {
              if (selectedOrders.length === 1) {
                window.location.hash = `/orders/${routeId(selectedOrders[0].id)}/shipment-processing`;
                return;
              }

              setShowBulkShipment(true);
            }}
            onDeleteSelected={() =>
              openActionDialog({
                title: 'Delete selected orders',
                description: `This mock flow will remove ${selectedOrderIds.length} selected orders after backend permissions are connected.`,
                confirmLabel: 'Acknowledge',
              })
            }
            onMarkSelectedShipped={() =>
              showBanner('Orders updated', `${selectedOrderIds.length} selected orders were marked as shipped in the current mock flow.`)
            }
            onOpenOrder={openOrder}
            onPrintSelected={() => {
              if (selectedOrders.length === 1) {
                const currentOrder = selectedOrders[0];
                const hasTracking = Boolean(currentOrder.shipment.trackingNumber);

                if (!hasTracking) {
                  openActionDialog({
                    title: 'Generate shipment first',
                    description: `${currentOrder.id} does not have a tracking number yet. Open Shipment Processing first, then generate and print the waybill.`,
                    confirmLabel: 'Open Shipment Processing',
                    onConfirm: () => {
                      window.location.hash = `/orders/${routeId(currentOrder.id)}/shipment-processing`;
                    },
                  });
                  return;
                }

                openActionDialog({
                  title: 'Print waybill',
                  description: `Waybill preview for ${currentOrder.id} is ready for printing.`,
                  confirmLabel: 'Done',
                });
                return;
              }

              openActionDialog({
                title: 'Print waybills',
                description: `Waybill batch for ${selectedOrderIds.length} selected orders is ready for printing.`,
                confirmLabel: 'Done',
              });
            }}
            onSelectionChange={setSelectedOrderIds}
            orders={orderRecords}
          />
        </OrdersShell>
      )}

      {showBulkShipment && (
        <BulkShipmentModal orders={selectedOrders} onClose={() => setShowBulkShipment(false)} />
      )}

      {manualTrackingOrderId && (
        <ManualTrackingModal
          orderId={manualTrackingOrderId}
          existing={manualTrackingMap[manualTrackingOrderId]}
          onClose={() => setManualTrackingOrderId(null)}
          onSave={(data) => {
            setManualTrackingMap((prev) => ({ ...prev, [manualTrackingOrderId]: data }));
            setFulfillmentStageMap((current) => ({ ...current, [manualTrackingOrderId]: 'Shipped' }));
            appendTimelineEntry(manualTrackingOrderId, {
              title: 'Manual tracking saved',
              description: `Tracking ${data.trackingNumber} via ${data.courierName} was keyed in manually because courier automation is not connected yet.`,
              tone: 'success',
            });
            setManualTrackingOrderId(null);
            showBanner(
              'Tracking number saved',
              `${data.trackingNumber} via ${data.courierName} has been recorded for ${manualTrackingOrderId}. Order moved to shipped.`,
            );
          }}
        />
      )}

      {sendInvoiceDraft && (
        <SendInvoiceModal
          draft={sendInvoiceDraft}
          onClose={() => setSendInvoiceDraft(null)}
          onSend={(email) => {
            appendTimelineEntry(sendInvoiceDraft.orderId, {
              title: 'Invoice emailed to customer',
              description: `Invoice copy was sent manually to ${email}.`,
              tone: 'success',
            });
            setSendInvoiceDraft(null);
            showBanner('Invoice emailed', `Invoice for ${sendInvoiceDraft.orderId} was sent to ${email}.`);
          }}
        />
      )}

      {actionDialog && (
        <ActionDialog
          confirmLabel={actionDialog.confirmLabel}
          description={actionDialog.description}
          onClose={() => setActionDialog(null)}
          onConfirm={() => {
            actionDialog.onConfirm?.();
            setActionDialog(null);
          }}
          title={actionDialog.title}
        />
      )}
    </>
  );
}

function OrdersShell({
  activeTab,
  banner,
  children,
  onExportCsv,
}: {
  activeTab: string;
  banner: BannerState | null;
  children: ReactNode;
  onExportCsv: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">Orders Module</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Manage and track global order, fulfillment, and recovery flow.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm font-medium hover:bg-surface-low"
            onClick={onExportCsv}
            type="button"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
            onClick={() => (window.location.hash = '/orders/new')}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create New Order
          </button>
        </div>
      </div>

      {banner && <InlineBanner title={banner.title} description={banner.description} />}

      <div className="flex gap-2 overflow-x-auto border-b border-outline-variant/20">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${tab === activeTab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            onClick={() => {
              if (tab === 'All Orders') window.location.hash = '/orders';
              if (tab === 'Draft Orders') window.location.hash = '/orders/drafts';
              if (tab === 'Abandoned Checkouts') window.location.hash = '/orders/abandoned';
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {children}
    </div>
  );
}

function OrdersListPage({
  orders,
  selectedOrderIds,
  onSelectionChange,
  onOpenOrder,
  onBulkShipment,
  onPrintSelected,
  onMarkSelectedShipped,
  onDeleteSelected,
}: {
  orders: Order[];
  selectedOrderIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenOrder: (orderId: string) => void;
  onBulkShipment: () => void;
  onPrintSelected: () => void;
  onMarkSelectedShipped: () => void;
  onDeleteSelected: () => void;
}) {
  const [query, setQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'Status: All' | 'Paid' | 'Pending'>('Status: All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'Fulfillment' | 'Processing' | 'Shipped' | 'Unfulfilled' | 'Delivered'>('Fulfillment');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const queryValue = query.trim().toLowerCase();
        const queryPass =
          queryValue.length === 0 ||
          order.id.toLowerCase().includes(queryValue) ||
          order.customer.name.toLowerCase().includes(queryValue) ||
          order.customer.email.toLowerCase().includes(queryValue) ||
          order.products.toLowerCase().includes(queryValue);

        const paymentPass = paymentFilter === 'Status: All' || order.paymentStatus === paymentFilter;
        const fulfillmentPass = fulfillmentFilter === 'Fulfillment' || order.fulfillmentStatus === fulfillmentFilter;

        return queryPass && paymentPass && fulfillmentPass;
      }),
    [fulfillmentFilter, paymentFilter, query],
  );

  const toggleOrder = (orderId: string) => {
    onSelectionChange(
      selectedOrderIds.includes(orderId)
        ? selectedOrderIds.filter((id) => id !== orderId)
        : [...selectedOrderIds, orderId],
    );
  };

  const toggleAll = () => {
    const visibleIds = filteredOrders.map((order) => order.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.includes(id));

    if (allVisibleSelected) {
      onSelectionChange(selectedOrderIds.filter((id) => !visibleIds.includes(id)));
      return;
    }

    onSelectionChange(Array.from(new Set([...selectedOrderIds, ...visibleIds])));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3" aria-label="Order summary">
        {orderKpiMetrics.map((metric) => (
          <article key={metric.label} className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-on-surface-variant">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded bg-surface-low text-primary">
                <metric.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">{metric.helper}</p>
          </article>
        ))}
      </section>

      <SearchBar
        fulfillmentFilter={fulfillmentFilter}
        onQueryChange={setQuery}
        onToggleAdvanced={() => setShowAdvancedFilters((current) => !current)}
        onUpdateFulfillmentFilter={setFulfillmentFilter}
        onUpdatePaymentFilter={setPaymentFilter}
        paymentFilter={paymentFilter}
        query={query}
        showAdvancedFilters={showAdvancedFilters}
      />

      {selectedOrderIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrderIds.length}
          onBulkShipment={onBulkShipment}
          onClearSelection={() => onSelectionChange([])}
          onDelete={onDeleteSelected}
          onMarkShipped={onMarkSelectedShipped}
          onPrintWaybill={onPrintSelected}
        />
      )}

      <OrdersTable
        ordersList={filteredOrders}
        selectedOrderIds={selectedOrderIds}
        onOpenOrder={onOpenOrder}
        onToggleAll={toggleAll}
        onToggleOrder={toggleOrder}
      />
    </div>
  );
}

function SearchBar({
  query,
  paymentFilter,
  fulfillmentFilter,
  showAdvancedFilters,
  onQueryChange,
  onUpdatePaymentFilter,
  onUpdateFulfillmentFilter,
  onToggleAdvanced,
}: {
  query: string;
  paymentFilter: 'Status: All' | 'Paid' | 'Pending';
  fulfillmentFilter: 'Fulfillment' | 'Processing' | 'Shipped' | 'Unfulfilled' | 'Delivered';
  showAdvancedFilters: boolean;
  onQueryChange: (value: string) => void;
  onUpdatePaymentFilter: (value: 'Status: All' | 'Paid' | 'Pending') => void;
  onUpdateFulfillmentFilter: (value: 'Fulfillment' | 'Processing' | 'Shipped' | 'Unfulfilled' | 'Delivered') => void;
  onToggleAdvanced: () => void;
}) {
  return (
    <section className="space-y-3 rounded border border-outline-variant/20 bg-surface-lowest p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_160px_180px]">
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm outline-none focus:border-primary"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search orders..."
            value={query}
          />
        </label>
        <select
          className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
          onChange={(event) => onUpdatePaymentFilter(event.target.value as 'Status: All' | 'Paid' | 'Pending')}
          value={paymentFilter}
        >
          <option>Status: All</option>
          <option>Paid</option>
          <option>Pending</option>
        </select>
        <select
          className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
          onChange={(event) =>
            onUpdateFulfillmentFilter(
              event.target.value as 'Fulfillment' | 'Processing' | 'Shipped' | 'Unfulfilled' | 'Delivered',
            )
          }
          value={fulfillmentFilter}
        >
          <option>Fulfillment</option>
          <option>Processing</option>
          <option>Shipped</option>
          <option>Unfulfilled</option>
          <option>Delivered</option>
        </select>
        <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onToggleAdvanced} type="button">
          {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
        </button>
      </div>

      {showAdvancedFilters ? (
        <div className="grid gap-3 rounded border border-outline-variant/20 bg-surface p-4 md:grid-cols-3">
          <Info label="Search Scope" value="Order ID, customer, email, products" />
          <Info label="Payment Filter" value={paymentFilter} />
          <Info label="Fulfillment Filter" value={fulfillmentFilter} />
        </div>
      ) : null}
    </section>
  );
}

function DraftOrdersPage({
  onCreateClient,
  onSendInvoice,
  onSaveDraft,
}: {
  onCreateClient: () => void;
  onSendInvoice: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
        <h2 className="text-lg font-semibold">Draft Orders</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Manual orders from WhatsApp, boutique walk-ins, and offline channels.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6">
          <Panel title="Draft Builder">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Client Details</p>
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm" placeholder="Search or create client..." />
                  </label>
                </div>
                <div className="flex items-end">
                  <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onCreateClient} type="button">
                    Create New Client
                  </button>
                </div>
              </div>

              <div className="rounded border border-outline-variant/20 p-4">
                <p className="text-sm font-semibold">Nur Amirah</p>
                <p className="mt-1 text-sm text-on-surface-variant">nur.amirah@example.com</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-on-surface-variant">VIP Client</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Product Selection</p>
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm" placeholder="Search products, collection, or SKU..." />
                </label>
                <LineItem imageUrl="https://picsum.photos/seed/lineitem-abaya/120/120" name="Silk Midnight Abaya" sku="ABY-LGC-097" quantity="1" price="$420" />
                <LineItem imageUrl="https://picsum.photos/seed/lineitem-hijab/120/120" name="Premium Chiffon Hijab" sku="HJB-NJR-097" quantity="2" price="$110" />
              </div>

              <div className="overflow-hidden rounded border border-outline-variant/20">
                <table className="w-full text-left">
                  <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Draft ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items Preview</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {draftOrders.map((draft) => (
                      <tr key={draft.id} className="hover:bg-surface-low">
                        <td className="px-4 py-4 font-mono text-sm font-semibold text-primary">{draft.id}</td>
                        <td className="px-4 py-4 text-sm font-medium">{draft.customer}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {draft.previewImages.slice(0, 3).map((imageUrl) => (
                                <img
                                  key={`${draft.id}-${imageUrl}`}
                                  alt=""
                                  className="h-6 w-6 rounded border border-surface object-cover"
                                  referrerPolicy="no-referrer"
                                  src={imageUrl}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-on-surface-variant">{draft.items} items</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold">${draft.total.toLocaleString()}</td>
                        <td className="px-4 py-4"><StatusBadge status="Pending" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Draft Summary">
            <div className="space-y-3">
              <Info label="Subtotal" value="$530" />
              <Info label="Shipping" value="$25" />
              <Info label="Custom Adjustment" value="-$15" />
              <Info label="Draft Total" value="$540" />
            </div>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSendInvoice} type="button">
                Send Invoice to Customer
              </button>
              <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onSaveDraft} type="button">
                Save as Draft
              </button>
            </div>
          </Panel>

          <Panel title="Internal Note">
            <textarea className="min-h-28 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" placeholder="Add private note for staff..." />
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function AbandonedCheckoutsPage({
  onExportData,
  onViewAnalytics,
  onSendReminder,
}: {
  onExportData: () => void;
  onViewAnalytics: () => void;
  onSendReminder: (checkoutId: string, channel: ReminderChannel) => void;
}) {
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null);
  const [channelsByCheckout, setChannelsByCheckout] = useState<Record<string, ReminderChannel>>(
    () =>
      abandonedCheckouts.reduce<Record<string, ReminderChannel>>((acc, checkout) => {
        acc[checkout.id] = 'smart';
        return acc;
      }, {}),
  );

  const selectedCheckout = selectedCheckoutId
    ? abandonedCheckouts.find((checkout) => checkout.id === selectedCheckoutId)
    : undefined;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Recoverable Revenue" value="$14,200" helper="+12.6% vs last month" />
        <MetricCard label="Recovery Rate" value="24%" helper="+3.1% vs last month" />
        <MetricCard label="Recovered Orders" value="42" helper="+8 new today" />
      </section>

      <section className="flex flex-col gap-3 rounded border border-outline-variant/20 bg-surface-lowest p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Abandoned Checkouts</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Recover lost sales by reminding customers and tracking conversion recovery.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onExportData} type="button">
            Export Data
          </button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onViewAnalytics} type="button">
            View Recovery Analytics
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_300px]">
        <div className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-left">
              <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Checkout ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Cart Items</th>
                  <th className="px-4 py-3">Cart Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {abandonedCheckouts.map((checkout) => (
                  <tr key={checkout.id} className="hover:bg-surface-low">
                    <td className="px-4 py-4">
                      <button
                        className="font-mono text-sm font-semibold text-primary hover:underline"
                        onClick={() => setSelectedCheckoutId(checkout.id)}
                        type="button"
                      >
                        {checkout.id}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">{checkout.customer}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{checkout.email}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {checkout.cartPreviewImages.slice(0, 2).map((imageUrl) => (
                            <img
                              key={`${checkout.id}-${imageUrl}`}
                              alt=""
                              className="h-6 w-6 rounded border border-surface object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              src={imageUrl}
                            />
                          ))}
                          {checkout.cartItems > 2 && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-outline-variant/30 bg-surface text-xs font-medium text-on-surface-variant">
                              +{checkout.cartItems - 2}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant">{checkout.cartItems}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold">${checkout.value.toLocaleString()}</td>
                    <td className="px-4 py-4"><StatusBadge status={checkout.status} /></td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{checkout.updatedAt}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          aria-label={`Reminder channel for ${checkout.id}`}
                          className="rounded border border-outline-variant/30 bg-surface px-2 py-1.5 text-xs"
                          onChange={(event) =>
                            setChannelsByCheckout((prev) => ({
                              ...prev,
                              [checkout.id]: event.target.value as ReminderChannel,
                            }))
                          }
                          value={channelsByCheckout[checkout.id] ?? 'smart'}
                        >
                          <option value="smart">Smart Send</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                        <button
                          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary hover:bg-primary-dim"
                          onClick={() => onSendReminder(checkout.id, channelsByCheckout[checkout.id] ?? 'smart')}
                          type="button"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Send
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <Panel title="Recovery Insights">
            <div className="space-y-4">
              <div className="grid h-28 grid-cols-4 items-end gap-2">
                {[40, 85, 92, 34].map((height, index) => (
                  <div key={index} className="rounded-t bg-primary/70" style={{ height: `${height}%` }} />
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">Peak abandonment happens between 14:00 and 18:00. Reminder sequence works best inside the first 4 hours.</p>
            </div>
          </Panel>
          <Panel title="Strategy Tip">
            <p className="text-sm text-on-surface-variant">Send reminders within 4 hours of abandonment to maximize recovery velocity for high-intent carts.</p>
            <button className="mt-4 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onViewAnalytics} type="button">
              Adjust Automation
            </button>
          </Panel>
          <Panel title="Recent Success">
            <div className="space-y-3 text-sm">
              <p>Sarah recovered a cart worth $210.00</p>
              <p>Hana recovered a cart worth $545.00</p>
            </div>
          </Panel>
        </aside>
      </section>

      {selectedCheckout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <section className="w-full max-w-lg rounded bg-surface-lowest p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Checkout Detail</p>
                <h2 className="mt-1 font-mono text-xl font-semibold text-primary">{selectedCheckout.id}</h2>
              </div>
              <button
                className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low"
                onClick={() => setSelectedCheckoutId(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Customer" value={selectedCheckout.customer} />
              <Info label="Email" value={selectedCheckout.email} />
              <Info label="Cart value" value={`$${selectedCheckout.value.toLocaleString()}`} />
              <Info label="Status" value={selectedCheckout.status} />
              <Info label="Updated" value={selectedCheckout.updatedAt} />
              <Info label="Items" value={`${selectedCheckout.cartItems} items`} />
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Cart Preview</p>
              <div className="mt-2 flex items-center gap-2">
                {selectedCheckout.cartPreviewImages.map((imageUrl) => (
                  <img
                    key={`${selectedCheckout.id}-preview-${imageUrl}`}
                    alt=""
                    className="h-10 w-10 rounded border border-surface object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={imageUrl}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CreateNewOrderPage({
  onAddProduct,
  onSaveDraft,
  onSendInvoice,
}: {
  onAddProduct: () => void;
  onSaveDraft: () => void;
  onSendInvoice: () => void;
}) {
  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={() => (window.location.hash = '/orders')} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <section className="flex flex-col gap-2">
        <p className="text-sm text-on-surface-variant">Manual Order Creation</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create New Order</h1>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Panel title="Customer">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Customer name" defaultValue="Nur Amirah" />
              <Field label="Email" defaultValue="nur.amirah@example.com" />
              <Field label="Phone" defaultValue="+60 12-888 3391" />
              <Field label="Order source" defaultValue="WhatsApp" />
            </div>
          </Panel>

          <Panel title="Products">
            <div className="space-y-3">
              <LineItem imageUrl="https://picsum.photos/seed/lineitem-evening-abaya/120/120" name="Silk Evening Abaya" sku="ABY-SLK-004" quantity="1" price="$360" />
              <LineItem imageUrl="https://picsum.photos/seed/lineitem-modal-hijab/120/120" name="Premium Modal Hijab" sku="HJB-MDL-018" quantity="2" price="$180" />
              <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onAddProduct} type="button">
                Add Product
              </button>
            </div>
          </Panel>

          <Panel title="Pricing & Shipping">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Shipping fee" defaultValue="20" />
              <Field label="Discount" defaultValue="0" />
              <Field label="Payment method" defaultValue="Manual transfer" />
              <Field label="Invoice note" defaultValue="Send payment confirmation after transfer" />
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Actions">
            <div className="space-y-3">
              <button className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSaveDraft} type="button">
                Save as Draft
              </button>
              <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onSendInvoice} type="button">
                Send Invoice
              </button>
              <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={() => (window.location.hash = '/orders/drafts')} type="button">
                View Draft Orders
              </button>
            </div>
          </Panel>

          <Panel title="Order Summary">
            <div className="space-y-3">
              <Info label="Subtotal" value="$540" />
              <Info label="Shipping" value="$20" />
              <Info label="Total" value="$560" />
              <Info label="Status" value="Draft" />
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function BulkActionsBar({
  selectedCount,
  onBulkShipment,
  onPrintWaybill,
  onMarkShipped,
  onDelete,
  onClearSelection,
}: {
  selectedCount: number;
  onBulkShipment: () => void;
  onPrintWaybill: () => void;
  onMarkShipped: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded border border-primary/30 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-medium text-primary">{selectedCount} orders selected</p>
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary" onClick={onBulkShipment} type="button">
          <Truck className="h-4 w-4" />
          {selectedCount === 1 ? 'Generate Shipment' : 'Bulk Generate Shipment'}
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onPrintWaybill} type="button">
          <Printer className="h-4 w-4" />
          Print Waybill
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onMarkShipped} type="button">
          <PackageCheck className="h-4 w-4" />
          Mark as Shipped
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-3 py-2 text-sm text-error hover:bg-error/5" onClick={onDelete} type="button">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <button className="rounded px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface" onClick={onClearSelection} type="button">
          Clear
        </button>
      </div>
    </section>
  );
}

function OrdersTable({
  ordersList,
  selectedOrderIds,
  onToggleOrder,
  onToggleAll,
  onOpenOrder,
}: {
  ordersList: Order[];
  selectedOrderIds: string[];
  onToggleOrder: (orderId: string) => void;
  onToggleAll: () => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const allSelected = ordersList.length > 0 && ordersList.every((order) => selectedOrderIds.includes(order.id));

  return (
    <section className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">
                <input aria-label="Select all orders" checked={allSelected} className="h-4 w-4 rounded border-outline-variant" onChange={onToggleAll} type="checkbox" />
              </th>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Settlement Status</th>
              <th className="px-4 py-3 font-semibold">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {ordersList.map((order) => {
              const selected = selectedOrderIds.includes(order.id);

              return (
                <tr key={order.id} className={selected ? 'bg-primary/5' : 'hover:bg-surface-low'}>
                  <td className="px-4 py-4">
                    <input aria-label={`Select ${order.id}`} checked={selected} className="h-4 w-4 rounded border-outline-variant" onChange={() => onToggleOrder(order.id)} type="checkbox" />
                  </td>
                  <td className="px-4 py-4">
                    <button className="font-mono text-sm font-semibold text-primary hover:underline" onClick={() => onOpenOrder(order.id)} type="button">
                      {order.id}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-left" onClick={() => onOpenOrder(order.id)} type="button">
                      <span className="block text-sm font-medium">{order.customer.name}</span>
                      <span className="block text-xs text-on-surface-variant">{order.customer.email}</span>
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 2).map((item) => (
                          <img
                            key={item.id}
                            alt=""
                            className="h-7 w-7 rounded border border-surface object-cover"
                            referrerPolicy="no-referrer"
                            src={item.imageUrl}
                          />
                        ))}
                        {order.items.length > 2 && (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-outline-variant/30 bg-surface text-xs font-medium text-on-surface-variant">
                            +{order.items.length - 2}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-on-surface-variant">{order.products}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{order.date}</td>
                  <td className="px-4 py-4 text-sm font-semibold">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-4"><StatusBadge status={order.paymentStatus} /></td>
                  <td className="px-4 py-4">
                    {order.paymentStatus === 'Paid' && order.settlementStatus ? (
                      <StatusBadge status={order.settlementStatus} />
                    ) : (
                      <span className="text-sm text-on-surface-variant">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={order.fulfillmentStatus} /></td>
                </tr>
              );
            })}
            {ordersList.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-on-surface-variant" colSpan={9}>
                  No orders match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrderDetailPage({
  order,
  manualTracking,
  fulfillmentStage,
  timeline,
  onBack,
  onGenerateShipment,
  onManualTracking,
  onPrintOrder,
  onMarkShipped,
  onUpdateFulfillmentStage,
  onSendInvoice,
  onDownloadInvoice,
  onSendTrackingUpdate,
}: {
  order: Order;
  manualTracking?: ManualTrackingState;
  fulfillmentStage: SellerFulfillmentStage;
  timeline: OrderTimelineEntry[];
  onBack: () => void;
  onGenerateShipment: (orderId: string) => void;
  onManualTracking: () => void;
  onPrintOrder: () => void;
  onMarkShipped: () => void;
  onUpdateFulfillmentStage: (stage: SellerFulfillmentStage) => void;
  onSendInvoice: () => void;
  onDownloadInvoice: () => void;
  onSendTrackingUpdate: () => void;
}) {
  const [invoiceMenuOpen, setInvoiceMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [headerMoreMenuOpen, setHeaderMoreMenuOpen] = useState(false);
  const [actionMoreMenuOpen, setActionMoreMenuOpen] = useState(false);
  const parcelProfile = deriveOrderParcelProfile(order);
  const trackingSearchUrl = manualTracking
    ? manualTracking.trackingUrl?.trim() || `https://www.google.com/search?q=${encodeURIComponent(manualTracking.courierName + ' tracking ' + manualTracking.trackingNumber)}`
    : '';

  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">Orders / All Orders / {order.id}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{order.id}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Placed on {order.shipment.orderDate} and currently moving through fulfillment.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onPrintOrder} type="button">
            <Printer className="h-4 w-4" />
            Print Order
          </button>
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
              onClick={() => setHeaderMoreMenuOpen((current) => !current)}
              type="button"
            >
              More
            </button>
            {headerMoreMenuOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded border border-outline-variant/20 bg-white p-2 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                  onClick={() => {
                    setHeaderMoreMenuOpen(false);
                    onManualTracking();
                  }}
                  type="button"
                >
                  <Hash className="h-4 w-4" />
                  {manualTracking ? 'Update tracking' : 'Add tracking'}
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                  onClick={() => {
                    setHeaderMoreMenuOpen(false);
                    onGenerateShipment(order.id);
                  }}
                  type="button"
                >
                  <Truck className="h-4 w-4" />
                  Arrange shipment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Panel title="Ordered Items">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded border border-outline-variant/20 p-4">
                  <img alt="" className="h-16 w-16 rounded object-cover" referrerPolicy="no-referrer" src={item.imageUrl} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">{item.sku}</p>
                    <p className="mt-2 text-sm text-on-surface-variant">Qty {item.quantity} x ${item.price.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.quantity * item.price).toLocaleString()}</p>
                </div>
              ))}

              <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/20 pt-4">
                <div className="relative">
                  <button
                    className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                    onClick={() => setInvoiceMenuOpen((current) => !current)}
                    type="button"
                  >
                    Invoice
                  </button>
                  {invoiceMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded border border-outline-variant/20 bg-white p-2 shadow-lg">
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                        onClick={() => {
                          setInvoiceMenuOpen(false);
                          onSendInvoice();
                        }}
                        type="button"
                      >
                        <Mail className="h-4 w-4" />
                        Email invoice
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                        onClick={() => {
                          setInvoiceMenuOpen(false);
                          onDownloadInvoice();
                        }}
                        type="button"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                    onClick={() => setStatusMenuOpen((current) => !current)}
                    type="button"
                  >
                    {fulfillmentStage}
                  </button>
                  {statusMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded border border-outline-variant/20 bg-white p-2 shadow-lg">
                      {sellerFulfillmentStages.map((stage) => (
                        <button
                          key={stage}
                          className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-surface-low ${stage === fulfillmentStage ? 'bg-surface-low font-medium text-primary' : ''}`}
                          onClick={() => {
                            setStatusMenuOpen(false);
                            onUpdateFulfillmentStage(stage);
                          }}
                          type="button"
                        >
                          <span>{stage}</span>
                          {stage === 'Ready for pickup' && <span className="text-xs text-on-surface-variant">Pickup</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                  onClick={() => onGenerateShipment(order.id)}
                  type="button"
                >
                  Open shipment setup
                </button>

                <div className="relative">
                  <button
                    className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                    onClick={() => setActionMoreMenuOpen((current) => !current)}
                    type="button"
                  >
                    More
                  </button>
                  {actionMoreMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded border border-outline-variant/20 bg-white p-2 shadow-lg">
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                        onClick={() => {
                          setActionMoreMenuOpen(false);
                          onManualTracking();
                        }}
                        type="button"
                      >
                        <Hash className="h-4 w-4" />
                        {manualTracking ? 'Update tracking' : 'Add tracking'}
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!manualTracking}
                        onClick={() => {
                          setActionMoreMenuOpen(false);
                          onSendTrackingUpdate();
                        }}
                        type="button"
                      >
                        <Mail className="h-4 w-4" />
                        Send tracking to customer
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-low"
                        onClick={() => {
                          setActionMoreMenuOpen(false);
                          onMarkShipped();
                        }}
                        type="button"
                      >
                        <Truck className="h-4 w-4" />
                        Mark shipped
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Fulfillment & Shipping">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={mapSellerStageToBadge(fulfillmentStage)} />
                {manualTracking && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Manual tracking</span>}
              </div>

              {manualTracking ? (
                <div className="rounded border border-success/30 bg-success/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-success flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Manual Tracking Active
                    </p>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={onManualTracking}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Info label="Courier" value={manualTracking.courierName} />
                    <Info label="Tracking Number" value={manualTracking.trackingNumber} />
                    <Info label="Tracking URL" value={manualTracking.trackingUrl?.trim() || 'Courier search link'} />
                    <Info label="Order stage" value={fulfillmentStage} />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Tracking saved manually because seller has not completed courier-provider automation for this order.
                  </p>
                  <a
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    href={trackingSearchUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Check tracking on courier website
                  </a>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                      onClick={onSendTrackingUpdate}
                      type="button"
                    >
                      Send tracking to customer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded border border-warning/30 bg-warning/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    No tracking number yet
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    No courier integration connected. You can enter a tracking number manually after creating the shipment at the courier's office.
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20"
                    onClick={onManualTracking}
                    type="button"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Enter Tracking Number Manually
                  </button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Package profile" value={parcelProfile.packageSize} />
                <Info label="Shipping weight" value={`${parcelProfile.weightKg.toFixed(1)} kg`} />
              </div>
              <div className="rounded border border-outline-variant/20 bg-surface-low p-4 text-sm">
                <p className="font-medium">Auto-fulfillment uses the live shipping setup</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  When courier routing is live, Bisora should read parcel weight from product data, assign the checkout courier path, generate shipment records, then return tracking and provider waybill automatically. Manual entry stays as fallback only.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => onGenerateShipment(order.id)} type="button">
                  Open Shipment Setup
                </button>
                <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onPrintOrder} type="button">
                  Print Waybill
                </button>
                <button
                  className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
                  onClick={onMarkShipped}
                  type="button"
                >
                  Mark Shipped
                </button>
              </div>
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
              <address className="not-italic text-sm leading-6 text-on-surface-variant">
                <strong className="text-on-surface">{order.shippingAddress.recipient}</strong>
                <br />
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.line2}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.country}
              </address>
              <div className="grid min-h-32 place-items-center rounded border border-dashed border-outline-variant/30 bg-surface-low text-center text-sm text-on-surface-variant">
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
              <Info label="Courier" value={manualTracking ? manualTracking.courierName : order.shipment.courier} />
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Status</p>
                <div className="mt-2"><StatusBadge status={mapSellerStageToBadge(fulfillmentStage)} /></div>
              </div>
              <Info label="Location tracking" value={order.shipment.trackingLocation} />
              <Info label="Tracking number" value={manualTracking ? manualTracking.trackingNumber : (order.shipment.trackingNumber ?? 'Pending generation')} />
              {manualTracking && (
                <div className="rounded border border-outline-variant/20 bg-surface-low p-3">
                  <p className="text-xs text-on-surface-variant">Manual tracking — check on courier website</p>
                  <a
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    href={trackingSearchUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Track parcel externally
                  </a>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Payment Info">
            <div className="space-y-4">
              <Info label="Payment method" value={order.paymentMethod} />
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Payment status</p>
                <div className="mt-2"><StatusBadge status={order.paymentStatus} /></div>
              </div>
              <Info label="Order total" value={`$${order.total.toLocaleString()}`} />
            </div>
          </Panel>

          <Panel title="Activity Timeline">
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded border p-3 ${entry.tone === 'success'
                      ? 'border-success/30 bg-success/5'
                      : entry.tone === 'warning'
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-outline-variant/20 bg-surface-low'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{entry.title}</p>
                    <span className="text-[11px] text-on-surface-variant">{entry.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">{entry.description}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function ShipmentProcessingPage({
  order,
  onBack,
  onPrintWaybill,
}: {
  order: Order;
  onBack: () => void;
  onPrintWaybill: () => void;
}) {
  const enabledCouriers = useMemo(() => getEnabledCourierSettings(), []);
  const parcelProfile = useMemo(() => deriveOrderParcelProfile(order), [order]);
  const initialCourier = useMemo(() => {
    const fromOrder = getCourierSettingByName(order.shipment.courier);
    if (fromOrder) {
      return fromOrder.name;
    }

    return enabledCouriers[0]?.name ?? '';
  }, [enabledCouriers, order.shipment.courier]);

  const [selectedCourier, setSelectedCourier] = useState(initialCourier);
  const activeCourier = getCourierSettingByName(selectedCourier);
  const serviceTypes = activeCourier?.serviceTypes ?? [];
  const [selectedServiceType, setSelectedServiceType] = useState(serviceTypes[0] ?? '');
  const [shipmentBanner, setShipmentBanner] = useState<BannerState | null>(null);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [shipmentRecord, setShipmentRecord] = useState<{
    provider: string;
    serviceType: string;
    method: 'Dropoff' | 'Pickup';
    customWeightEnabled: boolean;
    effectiveWeightKg: number;
    shipmentId: string;
    trackingNumber: string;
  } | null>(null);

  useEffect(() => {
    setSelectedCourier(initialCourier);
  }, [initialCourier]);

  useEffect(() => {
    if (!activeCourier) {
      setSelectedServiceType('');
      return;
    }

    setSelectedServiceType((current) =>
      activeCourier.serviceTypes.includes(current)
        ? current
        : activeCourier.serviceTypes[0] ?? '',
    );
  }, [activeCourier]);

  useEffect(() => {
    if (!shipmentBanner) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setShipmentBanner(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [shipmentBanner]);

  const autoAssignmentMatched = Boolean(getCourierSettingByName(order.shipment.courier));

  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to order detail
      </button>

      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-on-surface-variant">Arrange shipments</p>
          <h1 className="text-3xl font-semibold tracking-tight">{order.id}</h1>
        </div>
        <button
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
          onClick={() => setShipmentModalOpen(true)}
          type="button"
        >
          Create shipment
        </button>
      </section>

      {shipmentBanner && (
        <div className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <p className="font-medium">{shipmentBanner.title}</p>
          <p className="mt-1 text-xs">{shipmentBanner.description}</p>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_300px]">
        <div className="space-y-6">
          {shipmentSteps.map((step, index) => (
            <Panel key={step} title={`${String(index + 1).padStart(2, '0')} ${step}`}>
              {step === 'Order Validation' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <StatusPill label="Payment Status" value="Paid" />
                    <StatusPill label="Shipping Status" value="Not Shipped" />
                    <StatusPill label="Ready for Dispatch" value="Yes" />
                    <StatusPill label="Shipping Weight" value={`${parcelProfile.weightKg.toFixed(1)} kg`} />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Package profile should be read from product shipping attributes. Seller should not key this manually once product-level weight and parcel rules are connected.
                  </p>
                </div>
              )}
              {step === 'Courier Assignment' && (
                <>
                  <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
                    <p className="text-sm font-medium">
                      {enabledCouriers.length === 0
                        ? 'Manual fallback mode'
                        : autoAssignmentMatched
                          ? 'Auto-assigned from live shipping setup'
                          : 'Courier still needs seller confirmation'}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {enabledCouriers.length === 0
                        ? 'No courier provider is connected yet, so seller must create the shipment outside Bisora and key in tracking manually.'
                        : autoAssignmentMatched
                          ? `Checkout/routing already pointed this order to ${order.shipment.courier}. Seller can still override before finalizing.`
                          : 'A connected courier exists, but this order did not arrive with a strong checkout assignment yet, so seller can choose the best live courier path.'}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      <span>Select courier</span>
                      <select
                        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={enabledCouriers.length === 0}
                        onChange={(event) => setSelectedCourier(event.target.value)}
                        value={selectedCourier}
                      >
                        {enabledCouriers.map((courier) => (
                          <option key={courier.id} value={courier.name}>
                            {courier.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium">
                      <span>Service type</span>
                      <select
                        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={serviceTypes.length === 0}
                        onChange={(event) => setSelectedServiceType(event.target.value)}
                        value={selectedServiceType}
                      >
                        {serviceTypes.map((serviceType) => (
                          <option key={serviceType} value={serviceType}>
                            {serviceType}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {enabledCouriers.length === 0 && (
                    <div className="mt-3 rounded border border-warning/30 bg-warning/5 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        No courier provider connected
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Go to Settings → Shipping to connect a courier. In the meantime, create the shipment manually at the courier office and enter the tracking number below.
                      </p>
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20"
                        onClick={() => {
                          window.location.hash = `/orders/${order.id.replace('#', '')}`;
                        }}
                        type="button"
                      >
                        <Hash className="h-3.5 w-3.5" />
                        Go back and enter tracking manually
                      </button>
                    </div>
                  )}
                </>
              )}
              {step === 'Shipment Record' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Info label="Tracking Number" value={shipmentRecord?.trackingNumber ?? 'Generated after create shipment'} />
                  <Info label="Shipment ID" value={shipmentRecord?.shipmentId ?? 'Generated after create shipment'} />
                </div>
              )}
              {step === 'Waybill Generation' && (
                <div className="space-y-4">
                  <div className="rounded border border-outline-variant/20 p-4">
                    <p className="text-sm text-on-surface-variant">Recipient address</p>
                    <p className="mt-2 text-sm font-medium">{order.shippingAddress.line1}, {order.shippingAddress.city}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Live flow: Bisora should request the provider waybill from the connected courier account and return the label PDF here. Manual mode should not promise a provider-generated waybill.
                  </p>
                  <button
                    className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!shipmentRecord}
                    onClick={onPrintWaybill}
                    type="button"
                  >
                    Print provider waybill
                  </button>
                </div>
              )}
              {step === 'Status Update' && (
                <div className="rounded border border-outline-variant/20 p-4 text-sm">
                  <p className="font-medium">Auto status trigger stays on by default</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    After shipment finalizes, order status should move forward automatically and seller should only use manual overrides for exception cases.
                  </p>
                </div>
              )}
              {step === 'Notification Center' && (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-2 rounded border border-outline-variant/20 p-3 text-sm"><input defaultChecked type="checkbox" /> SMS Update</label>
                    <label className="flex items-center gap-2 rounded border border-outline-variant/20 p-3 text-sm"><input defaultChecked type="checkbox" /> Email Dispatch</label>
                    <label className="flex items-center gap-2 rounded border border-outline-variant/20 p-3 text-sm"><input type="checkbox" /> WhatsApp Bot</label>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Once payment is verified or seller marks a manual payment as paid, invoice and order-update notifications should trigger from the active customer-notification flow.
                  </p>
                </div>
              )}
            </Panel>
          ))}

          <div className="flex flex-wrap justify-end gap-3">
            <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onBack} type="button">
              Discard Draft
            </button>
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => setShipmentModalOpen(true)} type="button">
              Create Shipment
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <Panel title="Fulfillment Summary">
            <div className="space-y-3">
              <Info label="Order total" value={`$${order.total.toLocaleString()}`} />
              <Info label="Items" value={`${order.items.length} lines`} />
              <Info label="Destination" value={order.shippingAddress.country} />
              <Info label="Weight" value={`${parcelProfile.weightKg.toFixed(1)} kg`} />
              <Info label="Package profile" value={parcelProfile.packageSize} />
            </div>
          </Panel>
          <Panel title="Current State">
            <div className="space-y-3">
              <StatusBadge status="Processing" />
              <p className="text-sm text-on-surface-variant">Inventory checks and shipment handoff are ready for the courier stage.</p>
            </div>
          </Panel>
          <Panel title="AI Recommendation">
            <p className="text-sm text-on-surface-variant">Suggested DHL Express because this route has the best balance of speed and successful delivery rate for premium orders.</p>
          </Panel>
          <Panel title="Packaging Visual">
            <div className="grid h-40 place-items-center rounded bg-surface-low text-center text-sm text-on-surface-variant">
              Premium parcel packaging preview
            </div>
          </Panel>
        </aside>
      </section>

      {shipmentModalOpen && (
        <CreateShipmentModal
          couriers={enabledCouriers.map((courier) => ({ id: courier.id, name: courier.name, serviceTypes: courier.serviceTypes }))}
          defaultCourier={selectedCourier}
          defaultMethod="Dropoff"
          defaultWeightKg={parcelProfile.weightKg}
          onClose={() => setShipmentModalOpen(false)}
          onCreate={(draft) => {
            setSelectedCourier(draft.provider);
            setSelectedServiceType(draft.serviceType);
            setShipmentRecord({
              ...draft,
              shipmentId: `SHP-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900) + 100}`,
              trackingNumber: `${draft.provider.replace(/\s+/g, '').toUpperCase().slice(0, 4)}-${Math.floor(Math.random() * 900000) + 100000}`,
            });
            setShipmentBanner({
              title: 'Shipment created',
              description: `${draft.provider}${draft.serviceType ? ` · ${draft.serviceType}` : ''} ${draft.method.toLowerCase()} shipment is now ready for provider label and tracking.`,
            });
            setShipmentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SendInvoiceModal({
  draft,
  onClose,
  onSend,
}: {
  draft: SendInvoiceDraft;
  onClose: () => void;
  onSend: (email: string) => void;
}) {
  const [email, setEmail] = useState(draft.email);
  const canSend = email.trim().length > 3 && email.includes('@');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-xl rounded-lg bg-surface-lowest shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 p-6">
          <div>
            <h2 className="text-xl font-semibold">Send invoice</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Manual invoice send for {draft.orderId}.</p>
          </div>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <input
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/20 px-6 py-4">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSend}
            onClick={() => onSend(email.trim())}
            type="button"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}

function CreateShipmentModal({
  couriers,
  defaultCourier,
  defaultMethod,
  defaultWeightKg,
  onClose,
  onCreate,
}: {
  couriers: Array<{ id: string; name: string; serviceTypes: string[] }>;
  defaultCourier: string;
  defaultMethod: 'Dropoff' | 'Pickup';
  defaultWeightKg: number;
  onClose: () => void;
  onCreate: (draft: {
    provider: string;
    serviceType: string;
    method: 'Dropoff' | 'Pickup';
    customWeightEnabled: boolean;
    effectiveWeightKg: number;
  }) => void;
}) {
  const [provider, setProvider] = useState(defaultCourier);
  const [customWeightEnabled, setCustomWeightEnabled] = useState(false);
  const [customWeight, setCustomWeight] = useState(defaultWeightKg.toFixed(1));
  const [method, setMethod] = useState<'Dropoff' | 'Pickup'>(defaultMethod);

  const activeCourier = couriers.find((courier) => courier.name === provider);
  const serviceTypes = activeCourier?.serviceTypes ?? [];
  const [serviceType, setServiceType] = useState(serviceTypes[0] ?? '');

  useEffect(() => {
    setServiceType(serviceTypes[0] ?? '');
  }, [provider]);

  const effectiveWeightKg = customWeightEnabled ? Number(customWeight) || defaultWeightKg : defaultWeightKg;
  const canSubmit = provider.trim().length > 0;
  const liveMode = couriers.length > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-2xl rounded-lg bg-surface-lowest shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 p-6">
          <div>
            <h2 className="text-xl font-semibold">Create shipment</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {liveMode
                ? 'Connected courier path is already available. Seller mostly just confirms the provider shipment request here.'
                : 'No live courier provider is connected yet. Use manual tracking instead after dropoff or counter booking.'}
            </p>
          </div>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {liveMode ? (
            <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
              <p className="text-sm font-medium">Live provider mode</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Provider, service, and label request should already come from the connected shipping setup. Custom weight is only for exception handling.
              </p>
            </div>
          ) : (
            <div className="rounded border border-warning/30 bg-warning/5 p-4">
              <p className="text-sm font-medium text-warning">Manual fallback recommended</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Since no provider is connected, seller should usually go back and add tracking manually after the courier accepts the parcel.
              </p>
            </div>
          )}

          <label className="block space-y-2 text-sm font-medium">
            <span>Select shipment provider</span>
            <select
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={couriers.length === 0}
              onChange={(event) => setProvider(event.target.value)}
              value={provider}
            >
              <option value="">Select shipment provider</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.name}>
                  {courier.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Choose service</span>
            <select
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={serviceTypes.length === 0}
              onChange={(event) => setServiceType(event.target.value)}
              value={serviceType}
            >
              <option value="">Choose service</option>
              {serviceTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded border border-outline-variant/20 p-4 text-sm">
            <input checked={customWeightEnabled} onChange={(event) => setCustomWeightEnabled(event.target.checked)} type="checkbox" />
            <span>Enable custom weight override</span>
          </label>

          {customWeightEnabled && (
            <label className="block space-y-2 text-sm font-medium">
              <span>Custom weight (kg)</span>
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(event) => setCustomWeight(event.target.value)}
                value={customWeight}
              />
            </label>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Method</p>
            <div className="max-w-xs">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => setMethod(event.target.value as 'Dropoff' | 'Pickup')}
                value={method}
              >
                <option value="Dropoff">Dropoff</option>
                <option value="Pickup">Pickup</option>
              </select>
            </div>
          </div>

          <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
            <p className="text-xs font-medium text-on-surface-variant">Effective shipment payload</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Info label="Provider" value={provider || 'Not selected'} />
              <Info label="Service" value={serviceType || 'Auto-select after provider'} />
              <Info label="Weight used" value={`${effectiveWeightKg.toFixed(1)} kg`} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/20 px-6 py-4">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() =>
              onCreate({
                provider,
                serviceType,
                method,
                customWeightEnabled,
                effectiveWeightKg,
              })
            }
            type="button"
          >
            Submit
          </button>
        </div>
      </section>
    </div>
  );
}

function ManualTrackingModal({
  orderId,
  existing,
  onClose,
  onSave,
}: {
  orderId: string;
  existing?: ManualTrackingState;
  onClose: () => void;
  onSave: (data: ManualTrackingState) => void;
}) {
  const commonCouriers = ['J&T', 'Pos Laju', 'DHL', 'Ninja Van', 'GDEX', 'Aramex'];
  const initialPreset = existing && commonCouriers.includes(existing.courierName) ? existing.courierName : existing?.courierName ? 'Other' : '';
  const [carrierPreset, setCarrierPreset] = useState(initialPreset);
  const [courierName, setCourierName] = useState(existing?.courierName ?? '');
  const [trackingNumber, setTrackingNumber] = useState(existing?.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = useState(existing?.trackingUrl ?? '');

  const canSave = courierName.trim().length > 0 && trackingNumber.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-md rounded-lg bg-surface-lowest shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Manual Shipment</p>
            <h2 className="mt-1 text-xl font-semibold">{orderId}</h2>
          </div>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice banner */}
        <div className="mx-6 mt-5 flex items-start gap-3 rounded border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-on-surface-variant">
            Enter the tracking number you received after creating the shipment at the courier's office.
            Customers can use this number to track their parcel on the courier's website directly.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          <label className="block space-y-2 text-sm font-medium">
            <span>Carrier</span>
            <select
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              onChange={(e) => {
                const value = e.target.value;
                setCarrierPreset(value);
                if (value !== 'Other') {
                  setCourierName(value);
                } else if (commonCouriers.includes(courierName)) {
                  setCourierName('');
                }
              }}
              value={carrierPreset}
            >
              <option value="">Select carrier</option>
              {commonCouriers.map((courier) => (
                <option key={courier} value={courier}>
                  {courier}
                </option>
              ))}
              <option value="Other">Other / Manual entry</option>
            </select>
          </label>

          {carrierPreset === 'Other' && (
            <label className="block space-y-2 text-sm font-medium">
              <span>Courier Name</span>
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. Pos Laju, J&T, DHL, Ninja Van..."
                value={courierName}
              />
            </label>
          )}

          <label className="block space-y-2 text-sm font-medium">
            <span>Tracking Number</span>
            <input
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-primary"
              onChange={(e) => setTrackingNumber(e.target.value.trim())}
              placeholder="e.g. EP123456789MY"
              value={trackingNumber}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Tracking URL</span>
            <input
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://tracking-link.example/order"
              value={trackingUrl}
            />
          </label>

          <div className="rounded border border-outline-variant/20 bg-surface-low p-3">
            <p className="text-xs font-medium text-on-surface-variant">What happens next?</p>
            <ul className="mt-2 space-y-1 text-xs text-on-surface-variant list-disc list-inside">
              <li>Tracking number saved to this order</li>
              <li>Order can move straight into shipped status</li>
              <li>Customer can track using the courier URL or tracking number</li>
              <li>Seller can later complete the order after delivery</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-outline-variant/20 px-6 py-4">
          <button
            className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSave}
            onClick={() =>
              onSave({
                orderId,
                courierName: courierName.trim(),
                trackingNumber: trackingNumber.trim(),
                trackingUrl: trackingUrl.trim(),
              })
            }
            type="button"
          >
            <Hash className="h-4 w-4" />
            Save Tracking Number
          </button>
        </div>
      </section>
    </div>
  );
}

function ActionDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-md rounded bg-surface-lowest p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function InlineBanner({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex items-start gap-3 rounded border border-success/30 bg-success/5 p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
      <div>
        <p className="text-sm font-semibold text-success">{title}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      </div>
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>
    </article>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-outline-variant/20 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" defaultValue={defaultValue} />
    </label>
  );
}

function LineItem({
  imageUrl,
  name,
  sku,
  quantity,
  price,
}: {
  imageUrl?: string;
  name: string;
  sku: string;
  quantity: string;
  price: string;
}) {
  return (
    <div className="grid gap-3 rounded border border-outline-variant/20 p-4 md:grid-cols-[minmax(0,1fr)_120px_120px]">
      <div className="flex items-start gap-3">
        {imageUrl && <img alt="" className="h-14 w-14 rounded object-cover" loading="lazy" referrerPolicy="no-referrer" src={imageUrl} />}
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-on-surface-variant">{sku}</p>
        </div>
      </div>
      <Field label="Quantity" defaultValue={quantity} />
      <Field label="Price" defaultValue={price.replace('$', '')} />
    </div>
  );
}

function normalizeOrdersTab(section?: string) {
  if (section === 'drafts') return 'Draft Orders';
  if (section === 'abandoned') return 'Abandoned Checkouts';
  if (section === 'new') return 'New Order';
  return 'All Orders';
}

function mapOrderToSellerStage(status: Order['fulfillmentStatus']): SellerFulfillmentStage {
  switch (status) {
    case 'Unfulfilled':
      return 'Awaiting processing';
    case 'Processing':
      return 'Processing';
    case 'Shipped':
      return 'Shipped';
    case 'Delivered':
      return 'Completed';
    default:
      return 'Processing';
  }
}

function mapSellerStageToBadge(stage: SellerFulfillmentStage): Order['fulfillmentStatus'] {
  switch (stage) {
    case 'Awaiting processing':
      return 'Unfulfilled';
    case 'Processing':
    case 'Packed':
    case 'Ready for pickup':
      return 'Processing';
    case 'Shipped':
      return 'Shipped';
    case 'Completed':
      return 'Delivered';
    default:
      return 'Processing';
  }
}

function formatTimelineTimestamp() {
  return new Date().toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function createOrderTimelineSeed(order: Order): OrderTimelineEntry[] {
  const entries: OrderTimelineEntry[] = [
    {
      id: `${order.id}-placed`,
      title: 'Order placed',
      description: `${order.customer.name} completed checkout and the order entered seller operations.`,
      timestamp: order.date,
    },
  ];

  if (order.paymentStatus === 'Paid') {
    entries.unshift({
      id: `${order.id}-payment`,
      title: 'Payment verified',
      description: `${order.paymentMethod} is recorded as paid and ready for fulfillment handling.`,
      timestamp: order.date,
      tone: 'success',
    });
  }

  if (order.shipment.trackingNumber) {
    entries.unshift({
      id: `${order.id}-shipment`,
      title: `${order.shipment.courier} tracking active`,
      description: `Tracking ${order.shipment.trackingNumber} is already attached to this order.`,
      timestamp: order.shipment.orderDate,
      tone: 'success',
    });
  }

  return entries;
}

function deriveOrderParcelProfile(order: Order) {
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const weightKg = Math.max(0.4, totalUnits * 0.6);

  let packageSize = 'S';
  if (weightKg > 3) {
    packageSize = 'L';
  } else if (weightKg > 1.5) {
    packageSize = 'M';
  }

  return {
    totalUnits,
    weightKg,
    packageSize,
  };
}

function routeId(orderId: string) {
  return orderId.replace('#', '');
}
