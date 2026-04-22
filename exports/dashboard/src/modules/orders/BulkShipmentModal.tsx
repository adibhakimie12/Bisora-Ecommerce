import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, Eye, Loader2, X } from 'lucide-react';
import type { BulkShipmentConfig, GeneratedShipment, Order } from './types';
import { getCourierSettingByName, getEnabledCourierSettings } from './shippingSettings';
import { StatusBadge } from './StatusBadge';

type FlowStep = 'configure' | 'processing' | 'complete';

const processingSteps = [
  'Validating orders',
  'Assigning courier',
  'Generating tracking',
  'Sending notifications',
];

export function BulkShipmentModal({ orders, onClose }: { orders: Order[]; onClose: () => void }) {
  const enabledCouriers = useMemo(() => getEnabledCourierSettings(), []);
  const defaultCourier = enabledCouriers[0]?.name ?? '';
  const defaultShippingMethod = enabledCouriers[0]?.serviceTypes[0] ?? '';

  const [flowStep, setFlowStep] = useState<FlowStep>('configure');
  const [activeProcessingStep, setActiveProcessingStep] = useState(0);
  const [config, setConfig] = useState<BulkShipmentConfig>({
    courier: defaultCourier,
    packageType: 'Parcel',
    shippingMethod: defaultShippingMethod,
    autoTracking: true,
    autoMarkShipped: true,
  });

  useEffect(() => {
    const courier = getCourierSettingByName(config.courier);
    if (!courier) {
      if (config.courier === defaultCourier && config.shippingMethod === defaultShippingMethod) {
        return;
      }

      setConfig((current) => ({
        ...current,
        courier: defaultCourier,
        shippingMethod: defaultShippingMethod,
      }));
      return;
    }

    if (!courier.serviceTypes.includes(config.shippingMethod)) {
      setConfig((current) => ({
        ...current,
        shippingMethod: courier.serviceTypes[0] ?? '',
      }));
    }
  }, [config.courier, config.shippingMethod, defaultCourier, defaultShippingMethod]);

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
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 p-5">
          <div>
            <p className="text-sm text-on-surface-variant">Bulk Shipment Flow</p>
            <h2 className="text-xl font-semibold">
              {flowStep === 'configure' && 'Configure shipment'}
              {flowStep === 'processing' && 'Generating shipments'}
              {flowStep === 'complete' && 'Shipment generation complete'}
            </h2>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded text-on-surface-variant hover:bg-surface-low hover:text-on-surface" onClick={onClose} type="button">
            <span className="sr-only">Close shipment modal</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {flowStep === 'configure' && (
            <ConfigureStep config={config} enabledCouriers={enabledCouriers} orders={orders} onConfigChange={setConfig} onGenerate={startProcessing} />
          )}
          {flowStep === 'processing' && <ProcessingStep activeStep={activeProcessingStep} />}
          {flowStep === 'complete' && <CompletionStep shipments={shipments} onClose={onClose} />}
        </div>
      </section>
    </div>
  );
}

function ConfigureStep({
  config,
  enabledCouriers,
  orders,
  onConfigChange,
  onGenerate,
}: {
  config: BulkShipmentConfig;
  enabledCouriers: ReturnType<typeof getEnabledCourierSettings>;
  orders: Order[];
  onConfigChange: (config: BulkShipmentConfig) => void;
  onGenerate: () => void;
}) {
  const selectedCourier = getCourierSettingByName(config.courier);
  const shippingMethodOptions = selectedCourier?.serviceTypes ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded border border-outline-variant/20 bg-surface-low p-4">
        <p className="text-sm font-medium">{orders.length} selected orders</p>
        <p className="mt-1 text-sm text-on-surface-variant">{orders.map((order) => order.id).join(', ')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          disabled={enabledCouriers.length === 0}
          label="Courier"
          onChange={(courier) => onConfigChange({ ...config, courier })}
          options={enabledCouriers.map((courier) => courier.name)}
          value={config.courier}
        />
        <SelectField label="Package type" value={config.packageType} options={['Parcel', 'Box']} onChange={(packageType) => onConfigChange({ ...config, packageType })} />
        <SelectField
          disabled={shippingMethodOptions.length === 0}
          label="Shipping method"
          onChange={(shippingMethod) => onConfigChange({ ...config, shippingMethod })}
          options={shippingMethodOptions}
          value={config.shippingMethod}
        />
      </div>

      {enabledCouriers.length === 0 && (
        <p className="text-xs text-warning">
          No active courier in Settings. Enable at least one courier before generating bulk shipment.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Toggle checked={config.autoTracking} label="Auto tracking" onChange={(autoTracking) => onConfigChange({ ...config, autoTracking })} />
        <Toggle checked={config.autoMarkShipped} label="Auto mark shipped" onChange={(autoMarkShipped) => onConfigChange({ ...config, autoMarkShipped })} />
      </div>

      <div className="flex justify-end">
        <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50" disabled={orders.length === 0 || enabledCouriers.length === 0} onClick={onGenerate} type="button">
          Generate Shipment
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded border border-outline-variant/20 p-4 text-sm font-medium">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function ProcessingStep({ activeStep }: { activeStep: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded border border-outline-variant/20 bg-surface-low p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium">Shipment records are being generated.</p>
      </div>

      <ol className="space-y-3">
        {processingSteps.map((step, index) => {
          const done = index < activeStep;

          return (
            <li key={step} className="flex items-center gap-3 rounded border border-outline-variant/20 p-4">
              <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-success text-white' : 'bg-surface-low text-on-surface-variant'}`}>
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
        <div className="rounded border border-outline-variant/20 p-4">
          <p className="text-sm text-on-surface-variant">Success count</p>
          <p className="mt-2 text-2xl font-semibold text-success">{successCount}</p>
        </div>
        <div className="rounded border border-outline-variant/20 p-4">
          <p className="text-sm text-on-surface-variant">Failed count</p>
          <p className="mt-2 text-2xl font-semibold text-error">{failedCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-outline-variant/20">
        <table className="w-full text-left">
          <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Tracking number</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
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
        <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" type="button">
          <Download className="h-4 w-4" />
          Download all waybills
        </button>
        <button className="inline-flex items-center gap-2 rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" type="button">
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
