import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Download,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Wand2,
  X,
} from 'lucide-react';
import { ApiError } from '../../api/http';
import { fetchMarketingWorkspace, queueBroadcast, queueRecoveryReminder, saveMarketingCollection } from '../../api/marketing';
import {
  automationRulesSeed,
  broadcastsSeed,
  discountsSeed,
  funnelStepsSeed,
  overviewMetrics,
  recoverySeed,
  topCampaigns,
  upsellsSeed,
} from './data';
import type {
  AbandonedCheckout,
  AutomationRule,
  BroadcastCampaign,
  DiscountCampaign,
  FunnelStepNode,
  MarketingMetric,
  MarketingTab,
  UpsellOffer,
} from './types';

interface MarketingModuleProps {
  section?: string;
  subSection?: string;
}

interface BannerState {
  title: string;
  description: string;
}

interface DialogState {
  title: string;
  description: string;
  ctaLabel: string;
}

interface FunnelDraft {
  name: string;
  objective: 'Sell Product' | 'Increase AOV' | 'Generate Leads' | 'Recover Carts';
  trafficSource: 'Meta Ads' | 'TikTok Ads' | 'Google Ads' | 'Organic';
  template: 'High-Converting Product Funnel' | 'Simple Checkout Funnel' | 'Product + Upsell Funnel' | 'Recovery Funnel';
}

const marketingTabs: Array<{ key: MarketingTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'upsells', label: 'Upsells' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'broadcasts', label: 'Broadcasts' },
  { key: 'funnels', label: 'Funnels' },
];

export function MarketingModule({ section, subSection }: MarketingModuleProps) {
  const activeTab = normalizeMarketingTab(section);

  const [banner, setBanner] = useState<BannerState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const [discounts, setDiscounts] = useState(discountsSeed);
  const [upsells, setUpsells] = useState(upsellsSeed);
  const [recoveryRows, setRecoveryRows] = useState(recoverySeed);
  const [broadcasts, setBroadcasts] = useState(broadcastsSeed);
  const [funnelSteps] = useState(funnelStepsSeed);
  const [automationRules, setAutomationRules] = useState(automationRulesSeed);
  const marketingHydratedRef = useRef(false);

  const [showFunnelWizard, setShowFunnelWizard] = useState(false);
  const [funnelWizardStep, setFunnelWizardStep] = useState<1 | 2 | 3>(1);
  const [funnelDraft, setFunnelDraft] = useState<FunnelDraft>({
    name: '',
    objective: 'Increase AOV',
    trafficSource: 'TikTok Ads',
    template: 'Product + Upsell Funnel',
  });

  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  useEffect(() => {
    fetchMarketingWorkspace()
      .then((workspace) => {
        if (workspace.initialized) {
          setDiscounts(workspace.discounts);
          setUpsells(workspace.upsells);
          setRecoveryRows(workspace.recovery);
          setBroadcasts(workspace.broadcasts);
          setAutomationRules(workspace.automationRules);
        }
        marketingHydratedRef.current = true;
      })
      .catch(() => {
        marketingHydratedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (marketingHydratedRef.current) void saveMarketingCollection('discounts', discounts);
  }, [discounts]);

  useEffect(() => {
    if (marketingHydratedRef.current) void saveMarketingCollection('upsells', upsells);
  }, [upsells]);

  useEffect(() => {
    if (marketingHydratedRef.current) void saveMarketingCollection('recovery', recoveryRows);
  }, [recoveryRows]);

  useEffect(() => {
    if (marketingHydratedRef.current) void saveMarketingCollection('broadcasts', broadcasts);
  }, [broadcasts]);

  useEffect(() => {
    if (marketingHydratedRef.current) void saveMarketingCollection('automation-rules', automationRules);
  }, [automationRules]);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setBanner(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const notify = (title: string, description: string) => {
    setBanner({ title, description });
  };

  const openDialog = (title: string, description: string, ctaLabel = 'Close') => {
    setDialog({ title, description, ctaLabel });
  };

  const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : 'Check API connection and provider setup before trying again.');

  return (
    <>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-on-surface-variant">Marketing Module</p>
          <h1 className="text-4xl font-semibold tracking-tight text-on-surface">Marketing</h1>
          <p className="max-w-3xl text-sm text-on-surface-variant">
            Manage campaigns, discounts, upsells, recovery sequences, and funnels from one growth workspace.
          </p>
        </header>

        <nav className="border-b border-outline-variant/20">
          <ul className="flex flex-wrap gap-1">
            {marketingTabs.map((tab) => (
              <li key={tab.key}>
                <a
                  className={`inline-flex rounded-t px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  href={tab.key === 'overview' ? '#/marketing' : `#/marketing/${tab.key}`}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {banner ? <Banner title={banner.title} description={banner.description} /> : null}

        {activeTab === 'overview' ? (
          <OverviewPage
            onCreateDiscount={() => (window.location.hash = '/marketing/discounts/new')}
            onCreateUpsell={() => (window.location.hash = '/marketing/upsells/new')}
            onSendBroadcast={() => (window.location.hash = '/marketing/broadcasts/new')}
            onExport={() => notify('Marketing report exported', 'Campaign performance export is ready for review.')}
          />
        ) : null}

        {activeTab === 'discounts' ? (
          subSection === 'new' ? (
            <CreateDiscountPage
              onCancel={() => (window.location.hash = '/marketing/discounts')}
              onSave={(newDiscount) => {
                setDiscounts((current) => [newDiscount, ...current]);
                notify('Discount created', `${newDiscount.code} has been saved with schedule and status rules.`);
                window.location.hash = '/marketing/discounts';
              }}
            />
          ) : (
            <DiscountsPage
              discounts={discounts}
              onCreate={() => (window.location.hash = '/marketing/discounts/new')}
              onExport={() => notify('Discount report ready', 'Promotional report has been prepared.')}
              onPowerToggle={(id) =>
                setDiscounts((current) =>
                  current.map((discount) =>
                    discount.id === id
                      ? {
                          ...discount,
                          isEnabled: !discount.isEnabled,
                        }
                      : discount,
                  ),
                )
              }
              onUseOnce={(id) =>
                setDiscounts((current) =>
                  current.map((discount) =>
                    discount.id === id
                      ? {
                          ...discount,
                          usage: Math.min(discount.usage + 1, discount.usageCap),
                        }
                      : discount,
                  ),
                )
              }
              onDelete={(id) => {
                setDiscounts((current) => current.filter((discount) => discount.id !== id));
                notify('Discount removed', 'Selected discount was removed from current list.');
              }}
            />
          )
        ) : null}

        {activeTab === 'upsells' ? (
          subSection === 'new' ? (
            <CreateUpsellPage
              onCancel={() => (window.location.hash = '/marketing/upsells')}
              onSave={(offer) => {
                setUpsells((current) => [offer, ...current]);
                notify('Upsell offer saved', `${offer.name} is now available in the offer list.`);
                window.location.hash = '/marketing/upsells';
              }}
            />
          ) : (
            <UpsellsPage
              offers={upsells}
              onCreate={() => (window.location.hash = '/marketing/upsells/new')}
              onApplyStrategy={() =>
                notify('Strategy applied', 'Recommended post-purchase upsell strategy has been applied.')
              }
              onToggleStatus={(id) =>
                setUpsells((current) =>
                  current.map((offer) =>
                    offer.id === id
                      ? {
                          ...offer,
                          status: offer.status === 'Active' ? 'Draft' : 'Active',
                        }
                      : offer,
                  ),
                )
              }
            />
          )
        ) : null}

        {activeTab === 'recovery' ? (
          subSection === 'flow-builder' ? (
            <RecoveryFlowBuilderPage
              onBack={() => (window.location.hash = '/marketing/recovery')}
              onPublish={() => notify('Recovery flow published', 'Flow is active and will trigger for abandoned carts.')}
              onSaveDraft={() => notify('Recovery flow saved', 'Draft saved for further edits.')}
            />
          ) : subSection === 'templates' ? (
            <TemplateBuilderPage
              onBack={() => (window.location.hash = '/marketing/recovery')}
              onSaveTemplate={() =>
                notify('Template updated', 'Recovery message template is ready for automation flows.')
              }
            />
          ) : (
            <RecoveryPage
              rows={recoveryRows}
              onOpenFlowBuilder={() => (window.location.hash = '/marketing/recovery/flow-builder')}
              onOpenTemplates={() => (window.location.hash = '/marketing/recovery/templates')}
              onRemind={(id) => {
                queueRecoveryReminder(id)
                  .then((workspace) => {
                    setRecoveryRows(workspace.recovery);
                    notify('Reminder queued', `Recovery reminder queued for ${id}.`);
                  })
                  .catch((error) => notify('Reminder not queued', errorMessage(error)));
              }}
              onMarkRecovered={(id) => {
                setRecoveryRows((current) =>
                  current.map((row) => (row.id === id ? { ...row, status: 'Recovered' } : row)),
                );
                notify('Marked recovered', `${id} has been marked as recovered.`);
              }}
            />
          )
        ) : null}

        {activeTab === 'broadcasts' ? (
          subSection === 'new' ? (
            <CreateBroadcastPage
              onCancel={() => (window.location.hash = '/marketing/broadcasts')}
              onSave={(campaign) => {
                setBroadcasts((current) => [campaign, ...current]);
                notify('Broadcast scheduled', `${campaign.name} has been queued successfully.`);
                window.location.hash = '/marketing/broadcasts';
              }}
            />
          ) : (
            <BroadcastsPage
              campaigns={broadcasts}
              onCreate={() => (window.location.hash = '/marketing/broadcasts/new')}
              onExport={() => notify('Broadcast export ready', 'Campaign delivery export has been generated.')}
              onQueue={(campaign) => {
                queueBroadcast(campaign.id)
                  .then((response) => notify('Broadcast queued', `${campaign.name} queued for ${response.queued} customers.`))
                  .catch((error) => notify('Broadcast not queued', errorMessage(error)));
              }}
              onDuplicate={(campaign) => {
                const duplicate: BroadcastCampaign = {
                  ...campaign,
                  id: `${campaign.id}-copy-${Date.now()}`,
                  name: `${campaign.name} (Copy)`,
                  status: 'Draft',
                  schedule: 'Draft',
                };
                setBroadcasts((current) => [duplicate, ...current]);
                notify('Campaign duplicated', `${duplicate.name} created as draft.`);
              }}
            />
          )
        ) : null}

        {activeTab === 'funnels' ? (
          subSection === 'automations' ? (
            <FunnelsAutomationPage
              rules={automationRules}
              onBackToBuilder={() => (window.location.hash = '/marketing/funnels')}
              onCreateRule={() => setShowRuleBuilder(true)}
              onToggleRule={(id) =>
                setAutomationRules((current) =>
                  current.map((rule) =>
                    rule.id === id
                      ? {
                          ...rule,
                          status: rule.status === 'Active' ? 'Draft' : 'Active',
                        }
                      : rule,
                  ),
                )
              }
            />
          ) : (
            <FunnelsBuilderPage
              steps={funnelSteps}
              onGoAutomation={() => (window.location.hash = '/marketing/funnels/automations')}
              onDuplicate={() => notify('Funnel duplicated', 'A cloned funnel draft is ready for edits.')}
              onCreate={() => {
                setFunnelWizardStep(1);
                setShowFunnelWizard(true);
              }}
            />
          )
        ) : null}
      </section>

      {dialog ? (
        <DialogModal
          ctaLabel={dialog.ctaLabel}
          description={dialog.description}
          onClose={() => setDialog(null)}
          title={dialog.title}
        />
      ) : null}

      {showFunnelWizard ? (
        <CreateFunnelWizard
          draft={funnelDraft}
          step={funnelWizardStep}
          onClose={() => setShowFunnelWizard(false)}
          onCreate={() => {
            setShowFunnelWizard(false);
            notify('Funnel created', `${funnelDraft.name || 'New funnel'} is ready in builder.`);
          }}
          onDraftChange={(next) => setFunnelDraft(next)}
          onNext={() => setFunnelWizardStep((current) => (current === 3 ? current : ((current + 1) as 2 | 3)))}
          onPrev={() => setFunnelWizardStep((current) => (current === 1 ? current : ((current - 1) as 1 | 2)))}
        />
      ) : null}

      {showRuleBuilder ? (
        <AutomationRuleBuilderModal
          onClose={() => setShowRuleBuilder(false)}
          onSave={(rule) => {
            setAutomationRules((current) => [rule, ...current]);
            setShowRuleBuilder(false);
            notify('Automation rule saved', `${rule.name} has been added to the rule library.`);
          }}
        />
      ) : null}
    </>
  );
}

function OverviewPage({
  onCreateDiscount,
  onCreateUpsell,
  onSendBroadcast,
  onExport,
}: {
  onCreateDiscount: () => void;
  onCreateUpsell: () => void;
  onSendBroadcast: () => void;
  onExport: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Panel
          title="Marketing Performance"
          subtitle="Revenue trend across campaigns (last 30 days)"
          action={
            <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={onExport} type="button">
              <span className="inline-flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                Export Report
              </span>
            </button>
          }
        >
          <BarMiniChart values={[45, 58, 52, 69, 72, 64, 80]} />
        </Panel>

        <Panel title="Refine Strategy" subtitle="Execute growth actions quickly">
          <div className="space-y-2">
            <ActionButton icon={Plus} label="Create Discount" onClick={onCreateDiscount} />
            <ActionButton icon={Sparkles} label="Create Upsell" onClick={onCreateUpsell} />
            <ActionButton icon={Send} label="Send Broadcast" onClick={onSendBroadcast} />
          </div>
        </Panel>
      </section>

      <Panel title="Top Performing Campaigns">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Campaign</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Reach</th>
                <th className="px-4 py-3 text-left">Clicks</th>
                <th className="px-4 py-3 text-left">Conv.</th>
                <th className="px-4 py-3 text-left">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {topCampaigns.map((campaign) => (
                <tr className="hover:bg-surface-low" key={campaign.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={campaign.name} className="h-10 w-10 rounded object-cover" src={campaign.imageUrl} />
                      <span className="font-medium">{campaign.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{campaign.type}</td>
                  <td className="px-4 py-3">{campaign.reach.toLocaleString()}</td>
                  <td className="px-4 py-3">{campaign.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">{campaign.conversionRate.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-medium">{formatRM(campaign.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DiscountsPage({
  discounts,
  onCreate,
  onExport,
  onPowerToggle,
  onUseOnce,
  onDelete,
}: {
  discounts: DiscountCampaign[];
  onCreate: () => void;
  onExport: () => void;
  onPowerToggle: (id: string) => void;
  onUseOnce: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const activeCount = discounts.filter((discount) => getDiscountLiveState(discount) === 'Active').length;
  const totalRevenue = discounts.reduce((sum, discount) => sum + discount.usage * discount.value, 0);
  const usageRate = discounts.length > 0 ? discounts.reduce((sum, discount) => sum + discount.usage / discount.usageCap, 0) / discounts.length : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Manage discount codes and promotional campaigns.</p>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
            Export
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreate} type="button">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Discount
            </span>
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard metric={{ label: 'Total Discount Revenue', value: formatRM(totalRevenue), helper: 'From active and past campaigns' }} />
        <MetricCard metric={{ label: 'Active Discounts', value: `${activeCount} Codes`, helper: 'Currently available for shoppers' }} />
        <MetricCard metric={{ label: 'Usage Rate', value: `${(usageRate * 100).toFixed(1)}%`, helper: 'Average redemption per code' }} />
      </section>

      <Panel title="Discount Codes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Eligibility</th>
                <th className="px-4 py-3 text-left">Distribution</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Valid Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {discounts.map((discount) => (
                <tr className="hover:bg-surface-low" key={discount.id}>
                  <td className="px-4 py-3 font-medium">{discount.code}</td>
                  <td className="px-4 py-3">{discount.type}</td>
                  <td className="px-4 py-3">{discount.type === 'Percentage' ? `${discount.value}%` : formatRM(discount.value)}</td>
                  <td className="px-4 py-3">{discount.audience}</td>
                  <td className="px-4 py-3">
                    {discount.codeAccess === 'Public'
                      ? 'Public'
                      : `Direct (${discount.deliveryChannels.join(', ') || 'No channel'})`}
                  </td>
                  <td className="px-4 py-3">
                    {discount.usage}/{discount.usageCap}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={getDiscountLiveState(discount) === 'Active' ? 'success' : getDiscountLiveState(discount) === 'Scheduled' ? 'warning' : 'neutral'}
                    >
                      {getDiscountLiveState(discount)}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDateTime(discount.startsAt)} - {formatDateTime(discount.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                        onClick={() => onPowerToggle(discount.id)}
                        type="button"
                      >
                        {discount.isEnabled ? 'Turn Off' : 'Turn On'}
                      </button>
                      <button
                        className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low"
                        onClick={() => onUseOnce(discount.id)}
                        type="button"
                      >
                        Use +1
                      </button>
                      <button
                        className="rounded border border-error/30 px-3 py-1.5 text-xs text-error hover:bg-error/5"
                        onClick={() => onDelete(discount.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
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

function CreateDiscountPage({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (discount: DiscountCampaign) => void;
}) {
  const [code, setCode] = useState('EID2026');
  const [type, setType] = useState<DiscountCampaign['type']>('Percentage');
  const [value, setValue] = useState('15');
  const [appliesTo, setAppliesTo] = useState<NonNullable<DiscountCampaign['appliesTo']>>('All Products');
  const [minimumRequirementType, setMinimumRequirementType] = useState<NonNullable<DiscountCampaign['minimumRequirementType']>>('None');
  const [minimumRequirementValue, setMinimumRequirementValue] = useState('');
  const [customerEligibility, setCustomerEligibility] = useState<NonNullable<DiscountCampaign['customerEligibility']>>('Everyone');
  const [customerTarget, setCustomerTarget] = useState('');
  const [limitDiscountValueEnabled, setLimitDiscountValueEnabled] = useState(false);
  const [limitDiscountValue, setLimitDiscountValue] = useState('');
  const [usageLimitTotalEnabled, setUsageLimitTotalEnabled] = useState(false);
  const [usageLimitPerCustomerEnabled, setUsageLimitPerCustomerEnabled] = useState(false);
  const [usageLimitTotal, setUsageLimitTotal] = useState('300');
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState('1');
  const [isEnabled, setIsEnabled] = useState(true);
  const [startDate, setStartDate] = useState('2026-04-21T09:00');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('2026-05-30T23:59');
  const canSave =
    code.trim().length > 0 &&
    (minimumRequirementType === 'None' || minimumRequirementValue.trim().length > 0) &&
    (!limitDiscountValueEnabled || limitDiscountValue.trim().length > 0) &&
    (!usageLimitTotalEnabled || usageLimitTotal.trim().length > 0) &&
    (!usageLimitPerCustomerEnabled || usageLimitPerCustomer.trim().length > 0) &&
    (customerEligibility === 'Everyone' || customerTarget.trim().length > 0);
  const previewEndDate = hasEndDate ? endDate : '2099-12-31T23:59';
  const previewUsageCap = usageLimitTotalEnabled ? Number(usageLimitTotal || 0) : 999999;
  const previewState = getDiscountLiveState({
    id: 'preview',
    code,
    type,
    value: Number(value || 0),
    audience:
      customerEligibility === 'Specific Customer'
        ? 'Returning Customers'
        : 'All Customers',
    codeAccess: 'Public',
    deliveryChannels: [],
    usage: 0,
    usageCap: previewUsageCap,
    status: 'Active',
    isEnabled,
    startsAt: startDate,
    endsAt: previewEndDate,
    appliesTo,
    minimumRequirementType,
    minimumRequirementValue: Number(minimumRequirementValue || 0),
    customerEligibility,
    customerTarget,
    limitDiscountValueEnabled,
    limitDiscountValue: Number(limitDiscountValue || 0),
    usageLimitTotalEnabled,
    usageLimitPerCustomerEnabled,
    usageLimitPerCustomer: Number(usageLimitPerCustomer || 0),
    hasEndDate,
  });
  const sectionCard = 'rounded-2xl border border-outline-variant/20 bg-surface-low p-5 space-y-4';

  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={onCancel} type="button">
        Back to Discounts
      </button>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Create Discount" subtitle="Configure your promotion and usage rules">
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(255,255,255,0.85))] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Discount Setup</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Start with the basic promo rule first. Turn on extra limits only when seller really needs them.
                    </p>
                  </div>
                  <StatusPill tone={previewState === 'Active' ? 'success' : previewState === 'Scheduled' ? 'warning' : 'neutral'}>{previewState}</StatusPill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip active={type === 'Percentage'} label={type} onClick={() => setType('Percentage')} />
                  <Chip active={appliesTo === 'All Products'} label={appliesTo} onClick={() => setAppliesTo('All Products')} />
                  <Chip
                    active={customerEligibility === 'Everyone'}
                    label={customerEligibility === 'Everyone' ? 'Everyone' : 'Targeted'}
                    onClick={() => {
                      setCustomerEligibility('Everyone');
                      setCustomerTarget('');
                    }}
                  />
                </div>
              </div>

              <div className={sectionCard}>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Core Setup</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Set the code, discount type, and what shoppers actually get.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Discount Code">
                    <input className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setCode(event.target.value.toUpperCase())} value={code} />
                  </Field>
                  <Field label="Discount Type">
                    <select className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setType(event.target.value as DiscountCampaign['type'])} value={type}>
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed">Fixed Amount</option>
                      <option value="Free Shipping">Free Shipping</option>
                      <option value="Fixed Shipping">Fixed Shipping</option>
                    </select>
                  </Field>
                </div>
                {type !== 'Free Shipping' ? (
                  <Field label="Discount Value">
                    <div className="grid grid-cols-[minmax(0,1fr)_60px]">
                      <input className="w-full rounded-l-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setValue(event.target.value)} value={value} />
                      <div className="grid place-items-center rounded-r-xl border border-l-0 border-outline-variant/30 bg-white/70 text-sm font-medium text-on-surface-variant">
                        {type === 'Percentage' ? '%' : 'MYR'}
                      </div>
                    </div>
                  </Field>
                ) : null}
                {type === 'Percentage' ? (
                  <div className="rounded-2xl border border-outline-variant/20 bg-white/70 p-4">
                    <button
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        limitDiscountValueEnabled ? 'border-primary/30 bg-primary/5 text-on-surface' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                      onClick={() => setLimitDiscountValueEnabled((current) => !current)}
                      type="button"
                    >
                      <span>Limit discount value</span>
                      <span className="text-xs font-semibold">{limitDiscountValueEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    {limitDiscountValueEnabled ? (
                      <div className="mt-3">
                        <Field label="Max Discount Cap">
                          <div className="grid grid-cols-[60px_minmax(0,1fr)]">
                            <div className="grid place-items-center rounded-l-xl border border-outline-variant/30 bg-white/70 text-sm font-medium text-on-surface-variant">MYR</div>
                            <input className="w-full rounded-r-xl border border-l-0 border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setLimitDiscountValue(event.target.value)} value={limitDiscountValue} />
                          </div>
                        </Field>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className={sectionCard}>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Scope & Eligibility</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Choose what this discount applies to and who should be allowed to use it.</p>
                </div>
                <Field label="Applies To">
                  <select className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setAppliesTo(event.target.value as NonNullable<DiscountCampaign['appliesTo']>)} value={appliesTo}>
                    <option value="All Products">All Products</option>
                    <option value="Specific Categories">Specific Categories</option>
                    <option value="Specific Products">Specific Products</option>
                  </select>
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/20 bg-white/70 p-4">
                    <p className="text-sm font-medium">Minimum Requirements</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {[
                        { value: 'None', label: 'None' },
                        { value: 'Minimum Purchase Amount', label: 'Minimum purchase amount (MYR)' },
                        { value: 'Minimum Quantity', label: 'Minimum quantity of items' },
                      ].map((option) => (
                        <label className="flex items-center gap-2" key={option.value}>
                          <input checked={minimumRequirementType === option.value} name="minimumRequirementType" onChange={() => setMinimumRequirementType(option.value as NonNullable<DiscountCampaign['minimumRequirementType']>)} type="radio" />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {minimumRequirementType !== 'None' ? (
                      <input
                        className="mt-3 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm"
                        onChange={(event) => setMinimumRequirementValue(event.target.value)}
                        placeholder={minimumRequirementType === 'Minimum Purchase Amount' ? 'Minimum purchase amount' : 'Minimum quantity'}
                        value={minimumRequirementValue}
                      />
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-white/70 p-4">
                    <p className="text-sm font-medium">Customer Eligibility</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {[
                        { value: 'Everyone', label: 'Everyone' },
                        { value: 'Specific Customer', label: 'Specific customer' },
                      ].map((option) => (
                        <label className="flex items-center gap-2" key={option.value}>
                          <input checked={customerEligibility === option.value} name="customerEligibility" onChange={() => setCustomerEligibility(option.value as NonNullable<DiscountCampaign['customerEligibility']>)} type="radio" />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {customerEligibility === 'Specific Customer' ? (
                      <input
                        className="mt-3 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm"
                        onChange={(event) => setCustomerTarget(event.target.value)}
                        placeholder="Search customer name..."
                        value={customerTarget}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={sectionCard}>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Usage & Schedule</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Add guardrails only when needed, then decide when the code should be live.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/20 bg-white/70 p-4 space-y-3">
                    <p className="text-sm font-medium">Usage Limits</p>
                    <button
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        usageLimitTotalEnabled ? 'border-primary/30 bg-primary/5 text-on-surface' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                      onClick={() => setUsageLimitTotalEnabled((current) => !current)}
                      type="button"
                    >
                      <span>Total usage limit</span>
                      <span className="text-xs font-semibold">{usageLimitTotalEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    {usageLimitTotalEnabled ? (
                      <input className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setUsageLimitTotal(event.target.value)} value={usageLimitTotal} />
                    ) : null}

                    <button
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        usageLimitPerCustomerEnabled ? 'border-primary/30 bg-primary/5 text-on-surface' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                      onClick={() => setUsageLimitPerCustomerEnabled((current) => !current)}
                      type="button"
                    >
                      <span>Per customer limit</span>
                      <span className="text-xs font-semibold">{usageLimitPerCustomerEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    {usageLimitPerCustomerEnabled ? (
                      <input className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setUsageLimitPerCustomer(event.target.value)} value={usageLimitPerCustomer} />
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-outline-variant/20 bg-white/70 p-4 space-y-3">
                    <p className="text-sm font-medium">Active Dates</p>
                    <Field label="Start Date & Time">
                      <input className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setStartDate(event.target.value)} type="datetime-local" value={startDate} />
                    </Field>
                    <button
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        hasEndDate ? 'border-primary/30 bg-primary/5 text-on-surface' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                      onClick={() => setHasEndDate((current) => !current)}
                      type="button"
                    >
                      <span>Enable end date</span>
                      <span className="text-xs font-semibold">{hasEndDate ? 'ON' : 'OFF'}</span>
                    </button>
                    {hasEndDate ? (
                      <Field label="End Date & Time">
                        <input className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm shadow-sm" onChange={(event) => setEndDate(event.target.value)} type="datetime-local" value={endDate} />
                      </Field>
                    ) : null}
                    <button
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        isEnabled ? 'border-success/40 bg-success/10 text-success' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                      onClick={() => setIsEnabled((current) => !current)}
                      type="button"
                    >
                      <span>Set this discount active</span>
                      <span className="text-xs font-semibold">{isEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Discount Preview">
            <div className="space-y-2 text-sm">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">Customer sees</p>
                <p className="mt-2 text-lg font-semibold">{code || 'DISCOUNTCODE'}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {type === 'Percentage'
                    ? `${value || 0}% off`
                    : type === 'Free Shipping'
                      ? 'Free shipping'
                      : `${formatRM(Number(value || 0))} off`}
                </p>
              </div>
              <p className="text-on-surface-variant">Code</p>
              <p className="font-semibold">{code || '-'}</p>
              <p className="text-on-surface-variant">Value</p>
              <p className="font-semibold">
                {type === 'Percentage'
                  ? `${value || 0}%`
                  : type === 'Free Shipping'
                    ? 'Free Shipping'
                    : formatRM(Number(value || 0))}
              </p>
              <p className="text-on-surface-variant">Validity</p>
              <p className="font-semibold">
                {formatDateTime(startDate)} - {hasEndDate ? formatDateTime(endDate) : 'No end date'}
              </p>
              <p className="text-on-surface-variant">Live State</p>
              <p className="font-semibold">{previewState}</p>
              <p className="text-on-surface-variant">Eligibility</p>
              <p className="font-semibold">{customerEligibility === 'Specific Customer' ? `Specific: ${customerTarget || 'Not selected yet'}` : 'Everyone'}</p>
              <p className="text-on-surface-variant">Applies To</p>
              <p className="font-semibold">{appliesTo}</p>
              <p className="text-on-surface-variant">Rules</p>
              <p className="font-semibold">
                {minimumRequirementType === 'None'
                  ? 'No minimum requirement'
                  : minimumRequirementType === 'Minimum Purchase Amount'
                    ? `Min order ${formatRM(Number(minimumRequirementValue || 0))}`
                    : `Min quantity ${minimumRequirementValue || 0}`}
              </p>
            </div>
          </Panel>
          <button
            className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: `disc-${Date.now()}`,
                code,
                type,
                value: Number(value || 0),
                audience:
                  customerEligibility === 'Specific Customer'
                    ? 'Returning Customers'
                    : 'All Customers',
                codeAccess: 'Public',
                deliveryChannels: [],
                usage: 0,
                usageCap: usageLimitTotalEnabled ? Number(usageLimitTotal || 0) : 999999,
                status: 'Active',
                isEnabled,
                startsAt: startDate,
                endsAt: hasEndDate ? endDate : '2099-12-31T23:59',
                appliesTo,
                minimumRequirementType,
                minimumRequirementValue: minimumRequirementType === 'None' ? undefined : Number(minimumRequirementValue || 0),
                customerEligibility,
                customerTarget: customerEligibility === 'Specific Customer' ? customerTarget : undefined,
                limitDiscountValueEnabled,
                limitDiscountValue: limitDiscountValueEnabled ? Number(limitDiscountValue || 0) : undefined,
                usageLimitTotalEnabled,
                usageLimitPerCustomerEnabled,
                usageLimitPerCustomer: usageLimitPerCustomerEnabled ? Number(usageLimitPerCustomer || 0) : undefined,
                hasEndDate,
              })
            }
            type="button"
          >
            Save Discount
          </button>
          <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function UpsellsPage({
  offers,
  onCreate,
  onApplyStrategy,
  onToggleStatus,
}: {
  offers: UpsellOffer[];
  onCreate: () => void;
  onApplyStrategy: () => void;
  onToggleStatus: (id: string) => void;
}) {
  const revenue = offers.reduce((sum, offer) => sum + offer.revenue, 0);
  const avgConversion = offers.length > 0 ? offers.reduce((sum, offer) => sum + offer.conversionRate, 0) / offers.length : 0;
  const activeOffers = offers.filter((offer) => offer.status === 'Active').length;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Manage bump offers and one-time offers to increase AOV.</p>
        <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreate} type="button">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Offer
          </span>
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard metric={{ label: 'Upsell Revenue', value: formatRM(revenue), helper: 'Revenue attributed to offers' }} />
        <MetricCard metric={{ label: 'Average Conversion Rate', value: `${avgConversion.toFixed(1)}%`, helper: 'Across all active and draft offers' }} />
        <MetricCard metric={{ label: 'Active Offers', value: String(activeOffers), helper: 'Offers currently live' }} />
      </section>

      <Panel title="Offers">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Offer</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Trigger</th>
                <th className="px-4 py-3 text-left">Conversion</th>
                <th className="px-4 py-3 text-left">Revenue</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {offers.map((offer) => (
                <tr className="hover:bg-surface-low" key={offer.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={offer.name} className="h-10 w-10 rounded object-cover" src={offer.imageUrl} />
                      <span className="font-medium">{offer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{offer.type}</td>
                  <td className="px-4 py-3">{offer.trigger}</td>
                  <td className="px-4 py-3">{offer.conversionRate.toFixed(1)}%</td>
                  <td className="px-4 py-3">{formatRM(offer.revenue)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={offer.status === 'Active' ? 'success' : 'neutral'}>{offer.status}</StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onToggleStatus(offer.id)} type="button">
                        {offer.status === 'Active' ? 'Set Draft' : 'Set Active'}
                      </button>
                      <a className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" href="#/marketing/upsells/new">
                        Edit
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Strategic Insight">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Post-purchase one-time offer for accessories can increase average order value by 24% on average.
          </p>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onApplyStrategy} type="button">
            Apply Strategy
          </button>
        </div>
      </Panel>
    </div>
  );
}

function CreateUpsellPage({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (offer: UpsellOffer) => void;
}) {
  const [type, setType] = useState<UpsellOffer['type']>('Bump Offer');
  const [name, setName] = useState('Premium Hijab Fin Set');
  const [trigger, setTrigger] = useState('Cart Trigger');
  const [basePrice, setBasePrice] = useState('49');
  const [offerPrice, setOfferPrice] = useState('29');
  const [message, setMessage] = useState('Limited-time offer for your cart.');

  useEffect(() => {
    if (type === 'Bump Offer') {
      setTrigger('Cart Trigger');
      setMessage('Limited-time offer for your cart before checkout.');
      return;
    }

    setTrigger('Post Purchase Trigger');
    setMessage('Exclusive one-time offer after payment completion.');
  }, [type]);

  const discountPct = useMemo(() => {
    const base = Number(basePrice || 0);
    const offer = Number(offerPrice || 0);
    if (base <= 0 || offer >= base) {
      return 0;
    }
    return Math.round(((base - offer) / base) * 100);
  }, [basePrice, offerPrice]);

  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={onCancel} type="button">
        Back to Upsells
      </button>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Create New Offer" subtitle="Configure bump or one-time offers for your checkout flow">
            <div className="grid gap-4">
              <Field label="Offer Type">
                <div className="flex gap-2">
                  <Chip active={type === 'Bump Offer'} label="Bump Offer" onClick={() => setType('Bump Offer')} />
                  <Chip active={type === 'One-Time Offer'} label="One-Time Offer" onClick={() => setType('One-Time Offer')} />
                </div>
              </Field>
              <div className="rounded border border-outline-variant/20 bg-surface-low px-3 py-2 text-xs text-on-surface-variant">
                {type === 'Bump Offer'
                  ? 'Bump Offer appears before payment inside checkout.'
                  : 'One-Time Offer appears after payment in post-purchase flow.'}
              </div>
              <Field label="Offer Name">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setName(event.target.value)} value={name} />
              </Field>
              <Field label="Trigger">
                <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setTrigger(event.target.value)} value={trigger}>
                  {type === 'Bump Offer' ? (
                    <>
                      <option>Cart Trigger</option>
                      <option>Checkout Step</option>
                    </>
                  ) : (
                    <>
                      <option>Post Purchase Trigger</option>
                      <option>Thank You Page Trigger</option>
                    </>
                  )}
                </select>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Base Price (RM)">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setBasePrice(event.target.value)} value={basePrice} />
                </Field>
                <Field label="Offer Price (RM)">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setOfferPrice(event.target.value)} value={offerPrice} />
                </Field>
              </div>
              <Field label="Offer Message">
                <textarea className="min-h-[88px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setMessage(event.target.value)} value={message} />
              </Field>
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Offer Preview">
            <div className="rounded border border-outline-variant/20 p-3">
              <img alt="Offer preview" className="h-40 w-full rounded object-cover" src="https://picsum.photos/seed/offer-preview/420/300" />
              <p className="mt-3 text-sm font-medium">{name}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {type === 'Bump Offer' ? 'Shown before payment on checkout' : 'Shown after payment as one-time post-purchase offer'}
              </p>
              <p className="text-xs text-on-surface-variant">{message}</p>
              <p className="mt-2 text-sm font-semibold">
                {formatRM(Number(offerPrice || 0))}
                <span className="ml-2 text-xs font-normal text-on-surface-variant line-through">{formatRM(Number(basePrice || 0))}</span>
              </p>
              <p className="mt-1 text-xs text-success">{discountPct}% discount</p>
            </div>
          </Panel>
          <button
            className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
            onClick={() =>
              onSave({
                id: `upsell-${Date.now()}`,
                name,
                type,
                trigger,
                conversionRate: 0,
                revenue: 0,
                status: 'Draft',
                imageUrl: 'https://picsum.photos/seed/upsell-new/72/72',
              })
            }
            type="button"
          >
            Save Offer
          </button>
          <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RecoveryPage({
  rows,
  onOpenFlowBuilder,
  onOpenTemplates,
  onRemind,
  onMarkRecovered,
}: {
  rows: AbandonedCheckout[];
  onOpenFlowBuilder: () => void;
  onOpenTemplates: () => void;
  onRemind: (id: string) => void;
  onMarkRecovered: (id: string) => void;
}) {
  const recoveredRevenue = rows.filter((row) => row.status === 'Recovered').reduce((sum, row) => sum + row.cartValue, 0);
  const recoveredOrders = rows.filter((row) => row.status === 'Recovered').length;
  const pendingCarts = rows.filter((row) => row.status !== 'Recovered').length;
  const recoveryRate = rows.length > 0 ? (recoveredOrders / rows.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Automate abandoned cart reminders and recovery journeys.</p>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onOpenTemplates} type="button">
            Template Builder
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onOpenFlowBuilder} type="button">
            Create Recovery Flow
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard metric={{ label: 'Recovered Revenue', value: formatRM(recoveredRevenue), helper: 'Recovered from abandoned carts' }} />
        <MetricCard metric={{ label: 'Recovered Orders', value: String(recoveredOrders), helper: 'Orders converted from reminders' }} />
        <MetricCard metric={{ label: 'Recovery Rate', value: `${recoveryRate.toFixed(1)}%`, helper: 'Conversion from abandoned checkouts' }} />
        <MetricCard metric={{ label: 'Pending Carts', value: `${pendingCarts} Carts`, helper: 'Need follow-up action' }} />
      </section>

      <Panel title="Abandoned Checkouts">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Cart Value</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Last Activity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((row) => (
                <tr className="hover:bg-surface-low" key={row.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img alt={row.customer} className="h-9 w-9 rounded object-cover" src={row.imageUrl} />
                      <div>
                        <p className="font-medium">{row.customer}</p>
                        <p className="text-xs text-on-surface-variant">{row.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{formatRM(row.cartValue)}</td>
                  <td className="px-4 py-3">{row.cartItems}</td>
                  <td className="px-4 py-3">{row.lastActivity}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={row.status === 'Recovered' ? 'success' : row.status === 'Contacted' ? 'warning' : 'neutral'}>
                      {row.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onRemind(row.id)} type="button">
                        Send Reminder
                      </button>
                      <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onMarkRecovered(row.id)} type="button">
                        Mark Recovered
                      </button>
                    </div>
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

function RecoveryFlowBuilderPage({
  onBack,
  onPublish,
  onSaveDraft,
}: {
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  type RecoveryNodeType = 'trigger' | 'delay' | 'email' | 'whatsapp' | 'sms' | 'condition' | 'discount' | 'end';
  interface RecoveryNode {
    id: string;
    type: RecoveryNodeType;
    label: string;
    delayMinutes?: number;
    template?: string;
    message?: string;
    condition?: string;
  }

  const createNodeFromType = (type: RecoveryNodeType): RecoveryNode => {
    if (type === 'trigger') {
      return { id: `node-${Date.now()}`, type, label: 'Trigger: Cart Abandoned' };
    }
    if (type === 'delay') {
      return { id: `node-${Date.now()}`, type, label: 'Delay: Wait 30 minutes', delayMinutes: 30 };
    }
    if (type === 'email') {
      return {
        id: `node-${Date.now()}`,
        type,
        label: 'Email Reminder',
        template: 'Abandoned Cart Welcome',
        message: 'Hi {{customer_name}}, your cart is still waiting for you.',
      };
    }
    if (type === 'whatsapp') {
      return {
        id: `node-${Date.now()}`,
        type,
        label: 'WhatsApp Reminder',
        template: 'Abandoned Cart Welcome',
        message: 'Hi {{customer_name}}, we noticed you left something in your cart.',
      };
    }
    if (type === 'sms') {
      return {
        id: `node-${Date.now()}`,
        type,
        label: 'SMS Reminder',
        template: 'High Intent Reminder',
        message: 'Complete checkout now: {{checkout_link}}',
      };
    }
    if (type === 'condition') {
      return {
        id: `node-${Date.now()}`,
        type,
        label: 'Condition: Cart > RM150',
        condition: 'Cart Value > RM150',
      };
    }
    if (type === 'discount') {
      return { id: `node-${Date.now()}`, type, label: 'Discount Offer: 10% OFF' };
    }
    return { id: `node-${Date.now()}`, type, label: 'End Flow' };
  };

  const [nodes, setNodes] = useState<RecoveryNode[]>([
    createNodeFromType('trigger'),
    createNodeFromType('delay'),
    createNodeFromType('whatsapp'),
    { ...createNodeFromType('delay'), label: 'Delay: Wait 12 hours', delayMinutes: 720 },
    createNodeFromType('email'),
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[2].id);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];

  const addNode = (type: RecoveryNodeType) => {
    const node = createNodeFromType(type);
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
  };

  const updateSelectedNode = (updater: (node: RecoveryNode) => RecoveryNode) => {
    setNodes((current) => current.map((node) => (node.id === selectedNodeId ? updater(node) : node)));
  };

  const removeSelectedNode = () => {
    if (nodes.length <= 1) {
      return;
    }

    const index = nodes.findIndex((node) => node.id === selectedNodeId);
    const nextNodes = nodes.filter((node) => node.id !== selectedNodeId);
    setNodes(nextNodes);
    setSelectedNodeId(nextNodes[Math.max(0, index - 1)].id);
  };

  const channelOrDelay = selectedNode.type === 'delay' || selectedNode.type === 'email' || selectedNode.type === 'whatsapp' || selectedNode.type === 'sms';

  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        Back to Recovery
      </button>
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <Panel title="Flow Components">
          <div className="space-y-2 text-sm">
            {[
              { key: 'trigger', label: 'Trigger' },
              { key: 'delay', label: 'Delay' },
              { key: 'email', label: 'Email' },
              { key: 'whatsapp', label: 'WhatsApp' },
              { key: 'sms', label: 'SMS' },
              { key: 'condition', label: 'Condition' },
              { key: 'discount', label: 'Discount Offer' },
              { key: 'end', label: 'End Flow' },
            ].map((item) => (
              <button
                className="w-full rounded border border-outline-variant/20 px-3 py-2 text-left hover:bg-surface-low"
                key={item.key}
                onClick={() => addNode(item.key as RecoveryNodeType)}
                type="button"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Recovery Flow Builder">
          <div className="space-y-3">
            {nodes.map((node) => (
              <button
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedNodeId === node.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : node.type === 'whatsapp' || node.type === 'email' || node.type === 'sms'
                      ? 'border-success/30 bg-success/5 text-success'
                      : 'border-outline-variant/20 bg-surface-low text-on-surface'
                }`}
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                type="button"
              >
                {node.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Node Configuration">
          <div className="space-y-3 text-sm">
            <Field label="Selected Node">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => updateSelectedNode((node) => ({ ...node, label: event.target.value }))}
                value={selectedNode.label}
              />
            </Field>
            {selectedNode.type === 'delay' ? (
              <Field label="Delay (Minutes)">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  min={1}
                  onChange={(event) =>
                    updateSelectedNode((node) => ({ ...node, delayMinutes: Number(event.target.value || 1) }))
                  }
                  type="number"
                  value={selectedNode.delayMinutes ?? 30}
                />
              </Field>
            ) : null}
            {selectedNode.type === 'condition' ? (
              <Field label="Condition Rule">
                <input
                  className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                  onChange={(event) => updateSelectedNode((node) => ({ ...node, condition: event.target.value }))}
                  value={selectedNode.condition ?? ''}
                />
              </Field>
            ) : null}
            <Field label="Template">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                disabled={!channelOrDelay || selectedNode.type === 'delay' || selectedNode.type === 'condition'}
                onChange={(event) => updateSelectedNode((node) => ({ ...node, template: event.target.value }))}
                value={selectedNode.template ?? 'Abandoned Cart Welcome'}
              >
                <option>Abandoned Cart Welcome</option>
                <option>High Intent Reminder</option>
              </select>
            </Field>
            <Field label="Message">
              <textarea
                className="min-h-[120px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                disabled={!channelOrDelay || selectedNode.type === 'delay' || selectedNode.type === 'condition'}
                onChange={(event) => updateSelectedNode((node) => ({ ...node, message: event.target.value }))}
                value={selectedNode.message ?? ''}
              />
            </Field>
            <div className="flex gap-2">
              <button
                className="rounded border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/5"
                onClick={removeSelectedNode}
                type="button"
              >
                Remove Node
              </button>
              <button className="flex-1 rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onSaveDraft} type="button">
                Save Flow
              </button>
              <button className="flex-1 rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onPublish} type="button">
                Publish
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TemplateBuilderPage({
  onBack,
  onSaveTemplate,
}: {
  onBack: () => void;
  onSaveTemplate: () => void;
}) {
  const templatePresets = [
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart Reminder',
      channel: 'WhatsApp',
      message: 'Hello {{customer_name}}, your selection in {{cart_title}} is waiting for you. Complete order today for exclusive gift wrapping.',
      cta: 'Complete Order',
      previewImage: 'https://picsum.photos/seed/template-mobile-preview/340/700',
    },
    {
      id: 'high-intent',
      name: 'High Intent Reminder',
      channel: 'Email',
      message: 'Hi {{customer_name}}, we saved your cart items. Checkout now to secure your size before it sells out.',
      cta: 'Resume Checkout',
      previewImage: 'https://picsum.photos/seed/template-mobile-preview-2/340/700',
    },
    {
      id: 'discount-followup',
      name: 'Discount Follow-up',
      channel: 'WhatsApp',
      message: 'A special code is ready for you: {{discount_code}}. Tap below and complete your purchase today.',
      cta: 'Apply Discount',
      previewImage: 'https://picsum.photos/seed/template-mobile-preview-3/340/700',
    },
  ] as const;

  const [selectedTemplateId, setSelectedTemplateId] = useState<(typeof templatePresets)[number]['id']>(
    templatePresets[0].id,
  );
  const selectedTemplate =
    templatePresets.find((template) => template.id === selectedTemplateId) ?? templatePresets[0];

  const [publicName, setPublicName] = useState<string>(selectedTemplate.name);
  const [channel, setChannel] = useState<'WhatsApp' | 'Email'>(selectedTemplate.channel as 'WhatsApp' | 'Email');
  const [message, setMessage] = useState<string>(selectedTemplate.message);
  const [cta, setCta] = useState<string>(selectedTemplate.cta);

  useEffect(() => {
    setPublicName(selectedTemplate.name);
    setChannel(selectedTemplate.channel as 'WhatsApp' | 'Email');
    setMessage(selectedTemplate.message);
    setCta(selectedTemplate.cta);
  }, [selectedTemplate]);

  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        Back to Recovery
      </button>
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Panel title="Templates">
          <div className="space-y-2">
            {templatePresets.map((template) => (
              <button
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/20 hover:bg-surface-low'
                }`}
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                type="button"
              >
                {template.name}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Template Editor" subtitle="Design and refine your automation message">
          <div className="space-y-4">
            <Field label="Public Name">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => setPublicName(event.target.value)}
                value={publicName}
              />
            </Field>
            <Field label="Channel">
              <select
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => setChannel(event.target.value as 'WhatsApp' | 'Email')}
                value={channel}
              >
                <option>WhatsApp</option>
                <option>Email</option>
              </select>
            </Field>
            <Field label="Message">
              <textarea
                className="min-h-[180px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => setMessage(event.target.value)}
                value={message}
              />
            </Field>
            <Field label="CTA Label">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => setCta(event.target.value)}
                value={cta}
              />
            </Field>
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onSaveTemplate} type="button">
              Save Template
            </button>
          </div>
        </Panel>

        <Panel title="Live Mobile Preview">
          <img alt={`${publicName} preview`} className="h-[420px] w-full rounded object-cover" src={selectedTemplate.previewImage} />
          <div className="mt-3 rounded border border-outline-variant/20 p-3 text-xs">
            <p className="font-medium">{publicName}</p>
            <p className="mt-1 text-on-surface-variant">{message.slice(0, 120)}...</p>
            <p className="mt-2 inline-flex rounded bg-primary/10 px-2 py-1 text-primary">{cta}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BroadcastsPage({
  campaigns,
  onCreate,
  onExport,
  onQueue,
  onDuplicate,
}: {
  campaigns: BroadcastCampaign[];
  onCreate: () => void;
  onExport: () => void;
  onQueue: (campaign: BroadcastCampaign) => void;
  onDuplicate: (campaign: BroadcastCampaign) => void;
}) {
  const totalSent = campaigns.filter((campaign) => campaign.status === 'Sent').reduce((sum) => sum + 400000, 0) + 400000;
  const openRate = campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length : 0;
  const clickRate = campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.clickRate, 0) / campaigns.length : 0;
  const revenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Manage cross-channel broadcasts and performance from one console.</p>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onExport} type="button">
            Export Data
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreate} type="button">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Broadcast
            </span>
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard metric={{ label: 'Total Sent', value: `${(totalSent / 1000000).toFixed(1)}M`, helper: 'Messages delivered' }} />
        <MetricCard metric={{ label: 'Open Rate', value: `${openRate.toFixed(1)}%`, helper: 'Average open across channels' }} />
        <MetricCard metric={{ label: 'Click Rate', value: `${clickRate.toFixed(1)}%`, helper: 'Average CTR across campaigns' }} />
        <MetricCard metric={{ label: 'Revenue Influenced', value: formatRM(revenue), helper: 'Attributed campaign revenue' }} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <Panel title="Campaigns">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Audience</th>
                  <th className="px-4 py-3 text-left">Schedule</th>
                  <th className="px-4 py-3 text-left">Performance</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {campaigns.map((campaign) => (
                  <tr className="hover:bg-surface-low" key={campaign.id}>
                    <td className="px-4 py-3 font-medium">{campaign.name}</td>
                    <td className="px-4 py-3">{campaign.channel}</td>
                    <td className="px-4 py-3">{campaign.audience}</td>
                    <td className="px-4 py-3">{campaign.schedule}</td>
                    <td className="px-4 py-3">
                      {campaign.openRate.toFixed(1)}% / {campaign.clickRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">{formatRM(campaign.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onQueue(campaign)} type="button">
                          Queue
                        </button>
                        <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onDuplicate(campaign)} type="button">
                          Duplicate
                        </button>
                        <a className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" href="#/marketing/broadcasts/new">
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Broadcast Preview">
          <img alt="Broadcast campaign preview" className="h-64 w-full rounded object-cover" src="https://picsum.photos/seed/broadcast-preview/420/340" />
          <p className="mt-3 text-sm text-on-surface-variant">Friday evening broadcast generated 20% higher click-through versus weekday sends.</p>
        </Panel>
      </div>
    </div>
  );
}

function CreateBroadcastPage({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (campaign: BroadcastCampaign) => void;
}) {
  const [name, setName] = useState('Eid Collection 2026 Launch');
  const [channel, setChannel] = useState<BroadcastCampaign['channel']>('Email');
  const [audience, setAudience] = useState('VIP Customers');
  const [scheduleMode, setScheduleMode] = useState<'Send Now' | 'Schedule'>('Schedule');
  const [dateTime, setDateTime] = useState('Apr 25, 2026 09:00 AM');
  const [message, setMessage] = useState('Discover the new Eid Collection now with exclusive early access.');

  return (
    <div className="space-y-6">
      <button className="text-sm font-medium text-primary hover:underline" onClick={onCancel} type="button">
        Back to Broadcasts
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Create Broadcast" subtitle="Configure campaign, audience, template, and scheduling">
            <div className="grid gap-4">
              <Field label="Campaign Name">
                <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setName(event.target.value)} value={name} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Channel">
                  <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setChannel(event.target.value as BroadcastCampaign['channel'])} value={channel}>
                    <option>Email</option>
                    <option>WhatsApp</option>
                    <option>SMS</option>
                  </select>
                </Field>
                <Field label="Audience Segment">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setAudience(event.target.value)} value={audience} />
                </Field>
              </div>
              <Field label="Message Template">
                <textarea className="min-h-[120px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setMessage(event.target.value)} value={message} />
              </Field>
              <Field label="Scheduling">
                <div className="flex gap-2">
                  <Chip active={scheduleMode === 'Send Now'} label="Send Now" onClick={() => setScheduleMode('Send Now')} />
                  <Chip active={scheduleMode === 'Schedule'} label="Schedule Later" onClick={() => setScheduleMode('Schedule')} />
                </div>
              </Field>
              {scheduleMode === 'Schedule' ? (
                <Field label="Date & Time">
                  <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setDateTime(event.target.value)} value={dateTime} />
                </Field>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Live Preview">
            <img alt="Broadcast preview" className="h-56 w-full rounded object-cover" src="https://picsum.photos/seed/broadcast-live-preview/420/320" />
            <p className="mt-3 text-sm font-medium">{name}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{message}</p>
          </Panel>
          <button
            className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
            onClick={() =>
              onSave({
                id: `bc-${Date.now()}`,
                name,
                channel,
                audience,
                schedule: scheduleMode === 'Send Now' ? 'Now' : dateTime,
                openRate: 0,
                clickRate: 0,
                revenue: 0,
                status: scheduleMode === 'Send Now' ? 'Sent' : 'Scheduled',
              })
            }
            type="button"
          >
            Launch Broadcast
          </button>
          <button className="w-full rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FunnelsBuilderPage({
  steps,
  onGoAutomation,
  onDuplicate,
  onCreate,
}: {
  steps: FunnelStepNode[];
  onGoAutomation: () => void;
  onDuplicate: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded border border-outline-variant/20 p-1">
          <span className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary">
            Builder
          </span>
          <button className="rounded px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-low" onClick={onGoAutomation} type="button">
            Automations
          </button>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onDuplicate} type="button">
            Duplicate Funnel
          </button>
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreate} type="button">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Funnel
            </span>
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_300px]">
        <Panel title="Step Library">
          <div className="space-y-2">
            {['Landing Page', 'Product Page', 'Checkout', 'Order Bump', 'One-Time Offer', 'Downsell', 'Thank You'].map((item) => (
              <div className="rounded border border-outline-variant/20 px-3 py-2 text-sm" key={item}>
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Funnel Canvas">
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <div className="rounded border border-outline-variant/20 p-3" key={step.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{step.label}</p>
                  <StatusPill tone={step.status === 'active' ? 'success' : 'neutral'}>
                    {step.status === 'active' ? 'Active' : 'Optional'}
                  </StatusPill>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Conversion: <span className="font-medium text-on-surface">{step.conversionRate.toFixed(1)}%</span>
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Step Settings">
          <div className="space-y-3 text-sm">
            <Field label="Selected Step">
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm">
                <option>One-Time Offer</option>
                <option>Order Bump</option>
              </select>
            </Field>
            <Field label="Offer Product">
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm">
                <option>Silk Evening Scarf</option>
                <option>Premium Modal Hijab</option>
              </select>
            </Field>
            <Field label="Discount Type">
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm">
                <option>Percentage</option>
                <option>Fixed Amount</option>
              </select>
            </Field>
            <Field label="Discount">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" defaultValue="35" />
            </Field>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FunnelsAutomationPage({
  rules,
  onBackToBuilder,
  onCreateRule,
  onToggleRule,
}: {
  rules: AutomationRule[];
  onBackToBuilder: () => void;
  onCreateRule: () => void;
  onToggleRule: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded border border-outline-variant/20 p-1">
          <button className="rounded px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-low" onClick={onBackToBuilder} type="button">
            Builder
          </button>
          <span className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-on-primary">
            Automations
          </span>
        </div>
        <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreateRule} type="button">
          <span className="inline-flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            Create Automation Rule
          </span>
        </button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <Panel title="Rule Library">
          <div className="space-y-3">
            {rules.map((rule) => (
              <div className="rounded border border-outline-variant/20 p-3" key={rule.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <StatusPill tone={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</StatusPill>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">{rule.condition}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{rule.action}</p>
                <p className="mt-2 text-xs font-medium text-success">+{rule.estUplift.toFixed(1)}% estimated uplift</p>
                <button className="mt-2 rounded border border-outline-variant/30 px-2 py-1 text-xs hover:bg-surface-low" onClick={() => onToggleRule(rule.id)} type="button">
                  {rule.status === 'Active' ? 'Set Draft' : 'Set Active'}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Automation Canvas">
          <div className="space-y-4 rounded border border-outline-variant/20 p-4">
            <FlowNode label="Condition: Cart Value > RM150" tone="neutral" />
            <FlowNode label="AI Decision Node" tone="neutral" />
            <FlowNode label="Action: Show One-Time Offer A" tone="success" />
          </div>
        </Panel>

        <Panel title="Performance Core">
          <div className="space-y-3 text-sm">
            <StatItem label="Conversion Lift" value="+18.4%" />
            <StatItem label="OTO Acceptance" value="12.2%" />
            <StatItem label="Drop-off Reduction" value="9.5%" />
          </div>
          <img alt="AI automation preview" className="mt-4 h-44 w-full rounded object-cover" src="https://picsum.photos/seed/automation-preview/420/260" />
        </Panel>
      </div>
    </div>
  );
}

function CreateFunnelWizard({
  step,
  draft,
  onClose,
  onDraftChange,
  onNext,
  onPrev,
  onCreate,
}: {
  step: 1 | 2 | 3;
  draft: FunnelDraft;
  onClose: () => void;
  onDraftChange: (next: FunnelDraft) => void;
  onNext: () => void;
  onPrev: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl rounded-lg border border-outline-variant/30 bg-surface-lowest p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Step {step} of 3</p>
            <p className="text-lg font-semibold">Create New Funnel</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Funnel Name">
              <input
                className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
                placeholder="e.g. Autumn Elegance Collection"
                value={draft.name}
              />
            </Field>
            <Field label="Primary Objective">
              <div className="grid gap-2 sm:grid-cols-2">
                {(['Sell Product', 'Increase AOV', 'Recover Carts', 'Generate Leads'] as const).map((objective) => (
                  <Chip
                    active={draft.objective === objective}
                    key={objective}
                    label={objective}
                    onClick={() => onDraftChange({ ...draft, objective })}
                  />
                ))}
              </div>
            </Field>
            <Field label="Traffic Source">
              <div className="flex flex-wrap gap-2">
                {(['Meta Ads', 'TikTok Ads', 'Google Ads', 'Organic'] as const).map((trafficSource) => (
                  <Chip
                    active={draft.trafficSource === trafficSource}
                    key={trafficSource}
                    label={trafficSource}
                    onClick={() => onDraftChange({ ...draft, trafficSource })}
                  />
                ))}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">Template Selection</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  'High-Converting Product Funnel',
                  'Simple Checkout Funnel',
                  'Product + Upsell Funnel',
                  'Recovery Funnel',
                ] as const
              ).map((template) => (
                <button
                  className={`rounded border p-3 text-left text-sm ${
                    draft.template === template
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/30 hover:bg-surface-low'
                  }`}
                  key={template}
                  onClick={() => onDraftChange({ ...draft, template })}
                  type="button"
                >
                  <p className="font-medium">{template}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">Optimized structure for conversion and order value growth.</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-3">
              <p className="text-sm font-medium">Funnel Generation Summary</p>
              <SummaryItem label="Funnel Name" value={draft.name || 'Untitled Funnel'} />
              <SummaryItem label="Objective" value={draft.objective} />
              <SummaryItem label="Traffic Source" value={draft.trafficSource} />
              <SummaryItem label="Template" value={draft.template} />
              <SummaryItem label="Planned Architecture" value="Landing > Checkout > OTO > Downsell > Thank You" />
            </div>
            <img alt="Funnel visual preview" className="h-56 w-full rounded object-cover" src="https://picsum.photos/seed/funnel-preview/320/420" />
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <button
            className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50"
            disabled={step === 1}
            onClick={onPrev}
            type="button"
          >
            Back
          </button>
          {step < 3 ? (
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onNext} type="button">
              Continue
            </button>
          ) : (
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreate} type="button">
              Create Funnel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AutomationRuleBuilderModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (rule: AutomationRule) => void;
}) {
  const [name, setName] = useState('High Intent Upsell Boost');
  const [priority, setPriority] = useState<AutomationRule['priority']>('High');
  const [condition, setCondition] = useState('Cart Value > RM150 and Customer Type = Returning');
  const [action, setAction] = useState('Show OTO A with premium scarf bundle recommendation');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-4xl rounded-lg border border-outline-variant/30 bg-surface-lowest p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Create Automation Rule</p>
            <p className="text-sm text-on-surface-variant">Design AI-assisted customer journey logic.</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <Field label="Rule Name">
              <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setName(event.target.value)} value={name} />
            </Field>
            <Field label="Priority">
              <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setPriority(event.target.value as AutomationRule['priority'])} value={priority}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
            <Field label="Condition">
              <textarea className="min-h-[88px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setCondition(event.target.value)} value={condition} />
            </Field>
            <Field label="Action">
              <textarea className="min-h-[88px] w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setAction(event.target.value)} value={action} />
            </Field>
            <div className="flex gap-2">
              <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">
                Cancel
              </button>
              <button
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim"
                onClick={() =>
                  onSave({
                    id: `rule-${Date.now()}`,
                    name,
                    priority,
                    condition,
                    action,
                    estUplift: 12.4,
                    status: 'Active',
                  })
                }
                type="button"
              >
                Save & Activate Rule
              </button>
            </div>
          </div>

          <Panel title="Execution Preview">
            <div className="space-y-3 text-sm">
              <StatItem label="Impact Prediction" value="+14.8% Conversion Lift" />
              <StatItem label="Risk Mode" value="Balanced" />
              <StatItem label="Confidence Score" value="94%" />
              <div className="rounded border border-outline-variant/20 bg-surface-low p-3 text-xs text-on-surface-variant">
                Customers with cart value above RM150 and returning history are highly responsive to premium add-on offers.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DialogModal({
  title,
  description,
  ctaLabel,
  onClose,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded border border-outline-variant/30 bg-surface-lowest p-5">
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
        <button className="mt-5 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onClose} type="button">
          {ctaLabel}
        </button>
      </div>
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

function Banner({ title, description }: BannerState) {
  return (
    <div className="rounded border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
      <p className="font-medium">{title}</p>
      <p className="text-xs">{description}</p>
    </div>
  );
}

function MetricCard({ metric }: { metric: MarketingMetric }) {
  return (
    <article className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{metric.helper}</p>
    </article>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs uppercase tracking-wide text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded border px-3 py-1.5 text-xs ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="flex w-full items-center justify-between rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onClick} type="button">
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-on-surface-variant" />
    </button>
  );
}

function FlowNode({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'neutral';
}) {
  return (
    <div
      className={`rounded border px-3 py-2 text-sm ${
        tone === 'success'
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-outline-variant/20 bg-surface-low text-on-surface'
      }`}
    >
      {label}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-outline-variant/20 px-3 py-2">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-outline-variant/20 px-3 py-2 text-sm">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function BarMiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="h-56">
      <div className="flex h-full items-end gap-3 rounded border border-outline-variant/20 px-4 py-3">
        {values.map((value, index) => (
          <div className="flex h-full flex-1 flex-col justify-end gap-2" key={`${value}-${index}`}>
            <div className="rounded bg-primary/75" style={{ height: `${(value / max) * 100}%` }} />
            <span className="text-center text-[11px] text-on-surface-variant">D{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeMarketingTab(section?: string): MarketingTab {
  if (!section || section === 'overview') {
    return 'overview';
  }

  if (
    section === 'discounts' ||
    section === 'upsells' ||
    section === 'recovery' ||
    section === 'broadcasts' ||
    section === 'funnels'
  ) {
    return section;
  }

  return 'overview';
}

function getDiscountLiveState(discount: DiscountCampaign): 'Active' | 'Scheduled' | 'Expired' | 'Off' | 'Auto Off' {
  if (!discount.isEnabled) {
    return 'Off';
  }

  if (discount.usage >= discount.usageCap) {
    return 'Auto Off';
  }

  const now = new Date();
  const start = new Date(discount.startsAt);
  const end = new Date(discount.endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return discount.status;
  }

  if (now < start) {
    return 'Scheduled';
  }

  if (now > end) {
    return 'Expired';
  }

  return 'Active';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRM(value: number) {
  return `RM ${value.toLocaleString()}`;
}
