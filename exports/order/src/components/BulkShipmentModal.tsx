import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Eye, Loader2, X } from 'lucide-react';
import type { BulkShipmentConfig, GeneratedShipment, Order } from '../types';
import { StatusBadge } from './StatusBadge';

type FlowStep = 'configure' | 'processing' | 'complete';

interface BulkShipmentModalProps {
  orders: Order[];
  onClose: () => void;
}

const processingSteps = [
  'Validating orders',
  'Assigning courier',
  'Generating tracking',
  'Sending notifications',
];

export function BulkShipmentModal({ orders, onClose }: BulkShipmentModalProps) {
  const [flowStep, setFlowStep] = useState<FlowStep>('configure');
  const [activeProcessingStep, setActiveProcessingStep] = useState(0);
  const [config, setConfig] = useState<BulkShipmentConfig>({
    courier: 'J&T',
    packageType: 'Parcel',
    shippingMethod: 'Standard',
    autoTracking: true,
    autoMarkShipped: true,
  });

  const shipments = useMemo<GeneratedShipment[]>(
    () =>
      orders.map((order, index) => ({
        orderId: order.id,
        trackingNumber: `${config.courier.replace('&', '').replace(/\s/g, '').toUpperCase()}-${order.id.replace('#ORD-', '')}-${2400 + index}`,
        status: 'Success',
      })),
    [config.courier, orders],
  );

  const startProcessing = () => {
    setFlowStep('processing');
    setActiveProcessingStep(0);

    processingSteps.forEach((_, index) => {
      window.setTimeout(() => {
        setActiveProcessingStep(index + 1);
        if (index === processingSteps.length - 1) {
          setFlowStep('complete');
        }
      }, 650 * (index + 1));
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded bg-surface-lowest">
        <div className="flex items-start justify-between gap-4 border-b border-outline p-5">
          <div>
            <p className="text-sm text-muted">Bulk Shipment Flow</p>
            <h2 className="text-xl font-semibold">
              {flowStep === 'configure' && 'Configure shipment'}
              {flowStep === 'processing' && 'Generating shipments'}
              {flowStep === 'complete' && 'Shipment generation complete'}
            </h2>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded text-muted hover:bg-surface-low hover:text-on-surface" onClick={onClose} type="button">
            <span className="sr-only">Close shipment modal</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {flowStep === 'configure' && (
            <ConfigureStep
              config={config}
              orders={orders}
              onConfigChange={setConfig}
              onGenerate={startProcessing}
            />
          )}

          {flowStep === 'processing' && (
            <ProcessingStep activeStep={activeProcessingStep} />
          )}

          {flowStep === 'complete' && (
            <CompletionStep shipments={shipments} onClose={onClose} />
          )}
        </div>
      </section>
    </div>
  );
}

function ConfigureStep({
  config,
  orders,
  onConfigChange,
  onGenerate,
}: {
  config: BulkShipmentConfig;
  orders: Order[];
  onConfigChange: (config: BulkShipmentConfig) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded border border-outline bg-surface-low p-4">
        <p className="text-sm font-medium">{orders.length} selected orders</p>
        <p className="mt-1 text-sm text-muted">{orders.map((order) => order.id).join(', ')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium">
          <span>Courier</span>
          <select
            className="w-full rounded border border-outline bg-surface px-3 py-2"
            onChange={(event) => onConfigChange({ ...config, courier: event.target.value })}
            value={config.courier}
          >
            <option>J&T</option>
            <option>DHL</option>
            <option>Pos Laju</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>Package type</span>
          <select
            className="w-full rounded border border-outline bg-surface px-3 py-2"
            onChange={(event) => onConfigChange({ ...config, packageType: event.target.value })}
            value={config.packageType}
          >
            <option>Parcel</option>
            <option>Box</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>Shipping method</span>
          <select
            className="w-full rounded border border-outline bg-surface px-3 py-2"
            onChange={(event) => onConfigChange({ ...config, shippingMethod: event.target.value })}
            value={config.shippingMethod}
          >
            <option>Standard</option>
            <option>Express</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Toggle
          checked={config.autoTracking}
          label="Auto tracking"
          onChange={(checked) => onConfigChange({ ...config, autoTracking: checked })}
        />
        <Toggle
          checked={config.autoMarkShipped}
          label="Auto mark shipped"
          onChange={(checked) => onConfigChange({ ...config, autoMarkShipped: checked })}
        />
      </div>

      <div className="flex justify-end">
        <button
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
          disabled={orders.length === 0}
          onClick={onGenerate}
          type="button"
        >
          Generate Shipment
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded border border-outline p-4 text-sm font-medium">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function ProcessingStep({ activeStep }: { activeStep: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded border border-outline bg-surface-low p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium">Shipment records are being generated.</p>
      </div>

      <ol className="space-y-3">
        {processingSteps.map((step, index) => {
          const done = index < activeStep;

          return (
            <li key={step} className="flex items-center gap-3 rounded border border-outline p-4">
              <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-success text-white' : 'bg-surface-low text-muted'}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CompletionStep({ shipments, onClose }: { shipments: GeneratedShipment[]; onClose: () => void }) {
  const successCount = shipments.filter((shipment) => shipment.status === 'Success').length;
  const failedCount = shipments.length - successCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-outline p-4">
          <p className="text-sm text-muted">Success count</p>
          <p className="mt-2 text-2xl font-semibold text-success">{successCount}</p>
        </div>
        <div className="rounded border border-outline p-4">
          <p className="text-sm text-muted">Failed count</p>
          <p className="mt-2 text-2xl font-semibold text-error">{failedCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-outline">
        <table className="w-full text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Tracking number</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {shipments.map((shipment) => (
              <tr key={shipment.orderId}>
                <td className="px-4 py-3 font-mono text-sm font-semibold">{shipment.orderId}</td>
                <td className="px-4 py-3 text-sm">{shipment.trackingNumber}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={shipment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button className="inline-flex items-center gap-2 rounded border border-outline px-4 py-2 text-sm hover:bg-surface-low" type="button">
          <Download className="h-4 w-4" />
          Download all waybills
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline px-4 py-2 text-sm hover:bg-surface-low" type="button">
          <Eye className="h-4 w-4" />
          View all shipments
        </button>
        <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onClose} type="button">
          Done
        </button>
      </div>
    </div>
  );
}
