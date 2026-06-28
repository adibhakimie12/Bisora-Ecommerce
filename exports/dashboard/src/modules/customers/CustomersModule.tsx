import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, Mail, MoreHorizontal, Plus, Search, Star, X } from 'lucide-react';
import { API_STORAGE_KEYS } from '../../api/http';
import {
  addCustomerNote as addCustomerNoteApi,
  contactCustomer as contactCustomerApi,
  createCustomer as createCustomerApi,
  deactivateCustomer as deactivateCustomerApi,
  deleteCustomer as deleteCustomerApi,
  deleteReview as deleteReviewApi,
  exportReviewReport,
  fetchCustomers,
  fetchReviews,
  updateCustomer as updateCustomerApi,
  updateReviewStatus as updateReviewStatusApi,
} from '../../api/commerce';
import { initialCustomers, initialReviews } from './data';
import type { Customer, CustomerOrderHistory, CustomerTag, ReviewRecord, ReviewStatus } from './types';

interface CustomersModuleProps {
  section?: string;
  customerId?: string;
}

interface BannerState {
  title: string;
  description: string;
}

type CustomerActionMode = 'create' | 'edit';

const customerTabs = ['All Customers', 'Reviews'] as const;

function hasApiToken() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(API_STORAGE_KEYS.token));
}

export function CustomersModule({ section, customerId }: CustomersModuleProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [reviews, setReviews] = useState<ReviewRecord[]>(initialReviews);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [activeMenuCustomerId, setActiveMenuCustomerId] = useState<string | null>(null);
  const [showModerationReviewId, setShowModerationReviewId] = useState<string | null>(null);
  const [customerAction, setCustomerAction] = useState<{ mode: CustomerActionMode; customer?: Customer } | null>(null);
  const [noteDraftForCustomerId, setNoteDraftForCustomerId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const activeTab = section === 'reviews' ? 'Reviews' : 'All Customers';
  const selectedCustomer = customerId ? customers.find((customer) => customer.id === customerId) : undefined;
  const selectedReview = showModerationReviewId ? reviews.find((review) => review.id === showModerationReviewId) : undefined;
  const trimmedNoteDraft = noteDraft.trim();

  useEffect(() => {
    if (!hasApiToken()) return;

    fetchCustomers()
      .then((items) => {
        if (items.length > 0) {
          setCustomers(items);
        }
      })
      .catch(() => {
        // Keep bundled demo customers available when backend is offline.
      });

    fetchReviews()
      .then((items) => {
        if (items.length > 0) {
          setReviews(items);
        }
      })
      .catch(() => {
        // Keep bundled demo reviews available when backend is offline.
      });
  }, []);

  const showBanner = (title: string, description: string) => {
    setBanner({ title, description });
    window.setTimeout(() => setBanner(null), 2600);
  };

  const updateReviewStatus = (reviewId: string, status: ReviewStatus) => {
    setReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, status } : review)));

    if (hasApiToken()) {
      updateReviewStatusApi(reviewId, status)
        .then((updatedReview) => {
          setReviews((current) => current.map((review) => (review.id === reviewId ? updatedReview : review)));
        })
        .catch(() => {
          // Optimistic review moderation remains visible until next backend sync.
        });
    }
  };

  const removeReview = async (reviewId: string) => {
    if (hasApiToken()) {
      try {
        await deleteReviewApi(reviewId);
      } catch {
        showBanner('Review delete failed', 'Backend could not delete this review. Local list was updated only.');
      }
    }

    setReviews((current) => current.filter((review) => review.id !== reviewId));
  };

  const addCustomerNote = async (targetCustomerId: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (hasApiToken()) {
      try {
        const updatedCustomer = await addCustomerNoteApi(targetCustomerId, trimmedMessage);
        setCustomers((current) => current.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer)));
        return;
      } catch {
        showBanner('Note sync failed', 'Backend could not save this note. It will stay local until the next refresh.');
      }
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === targetCustomerId ? { ...customer, notes: [trimmedMessage, ...customer.notes] } : customer,
      ),
    );
  };

  const contactCustomer = async (targetCustomer: Customer, channel: 'Email' | 'WhatsApp') => {
    if (!hasApiToken()) {
      showBanner(`${channel} queued locally`, `${channel} action will sync after API login is active.`);
      return;
    }

    try {
      await contactCustomerApi(targetCustomer.id, channel, `Hi ${targetCustomer.name}, your store has an update for you.`);
      showBanner(`${channel} queued`, `${channel} notification was added to the automation queue.`);
    } catch {
      showBanner(`${channel} failed`, `Backend could not queue ${channel}. Check package and provider settings.`);
    }
  };

  const deactivateCustomer = async (targetCustomer: Customer) => {
    if (hasApiToken()) {
      try {
        const updatedCustomer = await deactivateCustomerApi(targetCustomer.id);
        setCustomers((current) => current.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer)));
        showBanner('Account deactivated', `${updatedCustomer.name} is now inactive.`);
        return;
      } catch {
        showBanner('Deactivate sync failed', 'Backend could not deactivate this customer. Local view was updated only.');
      }
    }

    setCustomers((current) => current.map((customer) => (customer.id === targetCustomer.id ? { ...customer, status: 'Inactive' } : customer)));
    showBanner('Account deactivated', `${targetCustomer.name} is now inactive locally.`);
  };

  const upsertCustomer = async (payload: { mode: CustomerActionMode; customer?: Customer; name: string; email: string; status: CustomerTag }) => {
    const { mode, customer, name, email, status } = payload;
    if (mode === 'create') {
      if (hasApiToken()) {
        try {
          const createdCustomer = await createCustomerApi({ name, email, status });
          setCustomers((current) => [createdCustomer, ...current]);
          showBanner('Customer created', `${createdCustomer.name} was added to CRM records.`);
          return;
        } catch {
          showBanner('Customer sync failed', 'Backend could not create this customer. A local draft was added instead.');
        }
      }

      const id = `cust-${slugify(name)}-${Date.now().toString().slice(-4)}`;
      const newCustomer: Customer = {
        id,
        name,
        email,
        avatarUrl: `https://picsum.photos/seed/${id}/64/64`,
        status,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: 'No order yet',
        memberSince: 'Today',
        shippingAddress: ['No address yet'],
        notes: [],
        orderHistory: [],
        recentPurchases: [],
      };
      setCustomers((current) => [newCustomer, ...current]);
      showBanner('Customer created', `${newCustomer.name} was added to CRM records.`);
      return;
    }

    if (!customer) return;

    if (hasApiToken()) {
      try {
        const updatedCustomer = await updateCustomerApi(customer.id, { name, email, status });
        setCustomers((current) => current.map((item) => (item.id === customer.id ? updatedCustomer : item)));
        showBanner('Customer updated', `${updatedCustomer.name} profile was updated.`);
        return;
      } catch {
        showBanner('Customer sync failed', 'Backend could not update this customer. Local view was updated only.');
      }
    }

    setCustomers((current) =>
      current.map((item) =>
        item.id === customer.id
          ? { ...item, name, email, status }
          : item,
      ),
    );
    showBanner('Customer updated', `${name} profile was updated.`);
  };

  const content = useMemo(() => {
    if (selectedCustomer) {
      return (
        <CustomerProfilePage
          customer={selectedCustomer}
          onAddNote={(message) => {
            void addCustomerNote(selectedCustomer.id, message);
            showBanner('Internal note added', `New CRM note saved for ${selectedCustomer.name}.`);
          }}
          onBack={() => (window.location.hash = '/customers')}
          onDeactivate={() => void deactivateCustomer(selectedCustomer)}
          onSendEmail={() => void contactCustomer(selectedCustomer, 'Email')}
          onSendWhatsapp={() => void contactCustomer(selectedCustomer, 'WhatsApp')}
        />
      );
    }

    if (activeTab === 'Reviews') {
      return (
        <ReviewsPage
          reviews={reviews}
          onExportReport={async () => {
            if (!hasApiToken()) {
              showBanner('Report exported locally', 'Review report generated from demo data.');
              return;
            }

            try {
              const report = await exportReviewReport();
              setReviews(report.reviews);
              showBanner('Report exported', `${report.summary.total} reviews exported. Average rating ${report.summary.average_rating}.`);
            } catch {
              showBanner('Report export failed', 'Backend could not export review report.');
            }
          }}
          onModerate={(reviewId) => setShowModerationReviewId(reviewId)}
        />
      );
    }

    return (
      <AllCustomersPage
        customers={customers}
        activeMenuCustomerId={activeMenuCustomerId}
        noteDraft={noteDraft}
        noteDraftForCustomerId={noteDraftForCustomerId}
        onClearNoteDraft={() => {
          setNoteDraft('');
          setNoteDraftForCustomerId(null);
        }}
        onCreateCustomer={() => setCustomerAction({ mode: 'create' })}
        onDeleteCustomer={(targetCustomer) => {
          if (hasApiToken()) {
            void deleteCustomerApi(targetCustomer.id).catch(() => {
              showBanner('Delete sync failed', 'Backend could not delete this customer. Local list was updated only.');
            });
          }
          setCustomers((current) => current.filter((customer) => customer.id !== targetCustomer.id));
          showBanner('Customer deleted', `${targetCustomer.name} was removed from CRM listing.`);
        }}
        onEditCustomer={(targetCustomer) => setCustomerAction({ mode: 'edit', customer: targetCustomer })}
        onOpenCustomer={(targetCustomerId) => (window.location.hash = `/customers/${targetCustomerId}`)}
        onOpenMenu={setActiveMenuCustomerId}
        onOpenNoteDraft={(targetCustomerId) => {
          setNoteDraft('');
          setNoteDraftForCustomerId(targetCustomerId);
        }}
        onSaveNote={(targetCustomerId) => {
          if (!trimmedNoteDraft) return;
          void addCustomerNote(targetCustomerId, trimmedNoteDraft);
          showBanner('Internal note added', 'Customer note added from All Customers table.');
          setNoteDraft('');
          setNoteDraftForCustomerId(null);
        }}
        onUpdateNoteDraft={setNoteDraft}
      />
    );
  }, [selectedCustomer, activeTab, customers, reviews, activeMenuCustomerId, noteDraftForCustomerId, noteDraft, trimmedNoteDraft]);

  return (
    <div className="space-y-6">
      {!selectedCustomer && (
        <>
          <section className="flex flex-col gap-2">
            <p className="text-sm text-on-surface-variant">Customers Module</p>
            <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
            <p className="text-sm text-on-surface-variant">Manage your customers and relationships.</p>
          </section>

          {banner && <InlineBanner title={banner.title} description={banner.description} />}

          <div className="flex gap-2 overflow-x-auto border-b border-outline-variant/20">
            {customerTabs.map((tab) => (
              <button
                key={tab}
                className={`min-w-max border-b-2 px-3 py-3 text-sm font-medium ${
                  tab === activeTab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => {
                  if (tab === 'All Customers') window.location.hash = '/customers';
                  if (tab === 'Reviews') window.location.hash = '/customers/reviews';
                }}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedCustomer && banner && <InlineBanner title={banner.title} description={banner.description} />}
      {content}

      {customerAction && (
        <CustomerActionModal
          mode={customerAction.mode}
          customer={customerAction.customer}
          onClose={() => setCustomerAction(null)}
          onSave={(payload) => {
            void upsertCustomer({ ...payload, mode: customerAction.mode, customer: customerAction.customer });
            setCustomerAction(null);
          }}
        />
      )}

      {selectedReview && (
        <ReviewModerationModal
          review={selectedReview}
          onApprove={() => {
            updateReviewStatus(selectedReview.id, 'Approved');
            showBanner('Review approved', `${selectedReview.customerName} review approved.`);
            setShowModerationReviewId(null);
          }}
          onClose={() => setShowModerationReviewId(null)}
          onDelete={() => {
            void removeReview(selectedReview.id);
            showBanner('Review deleted', 'Review removed from records.');
            setShowModerationReviewId(null);
          }}
          onFeature={() => {
            updateReviewStatus(selectedReview.id, 'Featured');
            showBanner('Review featured', `${selectedReview.customerName} review marked as featured.`);
            setShowModerationReviewId(null);
          }}
          onHide={() => {
            updateReviewStatus(selectedReview.id, 'Hidden');
            showBanner('Review hidden', `${selectedReview.customerName} review hidden from storefront.`);
            setShowModerationReviewId(null);
          }}
        />
      )}
    </div>
  );
}

function AllCustomersPage({
  customers,
  activeMenuCustomerId,
  noteDraftForCustomerId,
  noteDraft,
  onOpenCustomer,
  onOpenMenu,
  onCreateCustomer,
  onEditCustomer,
  onOpenNoteDraft,
  onUpdateNoteDraft,
  onSaveNote,
  onClearNoteDraft,
  onDeleteCustomer,
}: {
  customers: Customer[];
  activeMenuCustomerId: string | null;
  noteDraftForCustomerId: string | null;
  noteDraft: string;
  onOpenCustomer: (customerId: string) => void;
  onOpenMenu: (customerId: string | null) => void;
  onCreateCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenNoteDraft: (customerId: string) => void;
  onUpdateNoteDraft: (value: string) => void;
  onSaveNote: (customerId: string) => void;
  onClearNoteDraft: () => void;
  onDeleteCustomer: (customer: Customer) => void;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CustomerTag>('All');

  const filteredCustomers = customers.filter((customer) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q
      ? true
      : customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' ? true : customer.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-3 rounded border border-outline-variant/20 bg-surface-lowest p-4">
        <label className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Search customers..." value={query} />
        </label>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setStatusFilter(event.target.value as 'All' | CustomerTag)} value={statusFilter}>
          <option value="All">All Status</option>
          <option value="VIP">VIP</option>
          <option value="Returning">Returning</option>
          <option value="New">New</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onCreateCustomer} type="button">
          <Plus className="h-4 w-4" />
          New Customer
        </button>
      </section>

      <section className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredCustomers.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-on-surface-variant" colSpan={6}>
                    No customers match the current search or status filter.
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-surface-low">
                  <td className="px-4 py-4">
                    <button className="flex items-center gap-3 text-left" onClick={() => onOpenCustomer(customer.id)} type="button">
                      <img alt="" className="h-10 w-10 rounded object-cover" referrerPolicy="no-referrer" src={customer.avatarUrl} />
                      <span>
                        <span className="block text-sm font-semibold text-primary">{customer.name}</span>
                        <span className="block text-xs text-on-surface-variant">{customer.email}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">{customer.ordersCount}</td>
                  <td className="px-4 py-4 text-sm font-semibold">${customer.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-4"><CustomerTagBadge status={customer.status} /></td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.lastOrderDate}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative inline-flex">
                      <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low hover:text-primary" onClick={() => onOpenMenu(activeMenuCustomerId === customer.id ? null : customer.id)} type="button">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeMenuCustomerId === customer.id && (
                        <div className="absolute right-0 top-10 z-10 min-w-44 rounded border border-outline-variant/20 bg-surface-lowest p-1 shadow-lg">
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => onOpenCustomer(customer.id)} type="button">View Profile</button>
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => onEditCustomer(customer)} type="button">Edit Customer</button>
                          <button className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-surface-low" onClick={() => onOpenNoteDraft(customer.id)} type="button">Add Note</button>
                          <button className="block w-full rounded px-3 py-2 text-left text-xs text-error hover:bg-error/5" onClick={() => onDeleteCustomer(customer)} type="button">Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {noteDraftForCustomerId && (
        <section className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
          <p className="text-sm font-semibold">Add Internal Note</p>
          <textarea className="mt-3 min-h-24 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => onUpdateNoteDraft(event.target.value)} placeholder="Write CRM note..." value={noteDraft} />
          <div className="mt-3 flex justify-end gap-2">
            <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClearNoteDraft} type="button">Cancel</button>
            <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60" disabled={!noteDraft.trim()} onClick={() => onSaveNote(noteDraftForCustomerId)} type="button">Save Note</button>
          </div>
        </section>
      )}
    </div>
  );
}

function CustomerProfilePage({
  customer,
  onBack,
  onAddNote,
  onSendWhatsapp,
  onSendEmail,
  onDeactivate,
}: {
  customer: Customer;
  onBack: () => void;
  onAddNote: (message: string) => void;
  onSendWhatsapp: () => void;
  onSendEmail: () => void;
  onDeactivate: () => void;
}) {
  const [noteDraft, setNoteDraft] = useState('');
  const averageOrderValue = customer.ordersCount === 0 ? 0 : customer.totalSpent / customer.ordersCount;
  const trimmedNoteDraft = noteDraft.trim();

  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </button>

      <section className="flex flex-col gap-2">
        <p className="text-sm text-on-surface-variant">Customers / {customer.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{customer.name}</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Spent" value={`$${customer.totalSpent.toLocaleString()}`} />
        <MetricCard label="Total Orders" value={String(customer.ordersCount)} />
        <MetricCard label="AOV" value={`$${averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <MetricCard label="Lifetime Value" value={`$${customer.totalSpent.toLocaleString()}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6">
          <Panel title="Order History">
            <OrderHistoryTable orderHistory={customer.orderHistory} />
            <div className="mt-3 text-right">
              <a className="text-sm font-medium text-primary hover:underline" href="#/orders">View all history</a>
            </div>
          </Panel>

          <Panel title="Recent Purchases">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {customer.recentPurchases.map((purchase) => (
                <article key={purchase.id} className="rounded border border-outline-variant/20 p-3">
                  <img alt="" className="h-24 w-full rounded object-cover" src={purchase.imageUrl} />
                  <p className="mt-2 text-xs font-medium">{purchase.name}</p>
                  <p className="text-xs text-on-surface-variant">${purchase.price.toLocaleString()}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Customer Card">
            <div className="flex flex-col items-start gap-3">
              <img alt="" className="h-16 w-16 rounded object-cover" src={customer.avatarUrl} />
              <div>
                <p className="text-lg font-semibold">{customer.name}</p>
                <p className="text-xs text-on-surface-variant">{customer.email}</p>
                <p className="mt-1 text-xs text-on-surface-variant">Member since {customer.memberSince}</p>
              </div>
              <div className="flex gap-2">
                <CustomerTagBadge status={customer.status} />
              </div>
            </div>
          </Panel>

          <Panel title="Shipping Address">
            <div className="space-y-1 text-sm text-on-surface-variant">
              {customer.shippingAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </Panel>

          <Panel title="Internal Notes">
            <textarea className="min-h-24 w-full rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type internal note..." value={noteDraft} />
            <button className="mt-3 w-full rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60" disabled={!trimmedNoteDraft} onClick={() => {
              onAddNote(trimmedNoteDraft);
              setNoteDraft('');
            }} type="button">
              Add Note
            </button>
            <div className="mt-3 space-y-2 text-xs text-on-surface-variant">
              {customer.notes.slice(0, 3).map((note) => (
                <p key={note} className="rounded bg-surface-low p-2">{note}</p>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-2">
              <button className="w-full rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onSendWhatsapp} type="button">Send WhatsApp</button>
              <button className="w-full rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onSendEmail} type="button">Send Email</button>
              <button className="w-full rounded border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/5" onClick={onDeactivate} type="button">Deactivate Account</button>
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function ReviewsPage({
  reviews,
  onExportReport,
  onModerate,
}: {
  reviews: ReviewRecord[];
  onExportReport: () => void | Promise<void>;
  onModerate: (reviewId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'All' | ReviewStatus>('All');
  const [ratingFilter, setRatingFilter] = useState<'All' | '4+' | '3+'>('All');
  const [productFilter, setProductFilter] = useState('All Products');
  const [query, setQuery] = useState('');

  const filteredReviews = reviews.filter((review) => {
    const matchStatus = statusFilter === 'All' ? true : review.status === statusFilter;
    const matchRating = ratingFilter === 'All' ? true : ratingFilter === '4+' ? review.rating >= 4 : review.rating >= 3;
    const matchProduct = productFilter === 'All Products' ? true : review.productName === productFilter;
    const q = query.trim().toLowerCase();
    const matchSearch = !q
      ? true
      : review.customerName.toLowerCase().includes(q) ||
        review.customerEmail.toLowerCase().includes(q) ||
        review.productName.toLowerCase().includes(q);
    return matchStatus && matchRating && matchProduct && matchSearch;
  });

  const averageRating = reviews.length === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const pendingCount = reviews.filter((review) => review.status === 'Pending').length;
  const productOptions = Array.from(new Set(reviews.map((review) => review.productName)));

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap justify-between gap-3 rounded border border-outline-variant/20 bg-surface-lowest p-4">
        <div>
          <h2 className="text-lg font-semibold">Reviews</h2>
          <p className="text-sm text-on-surface-variant">Manage and moderate customer feedback across your collection.</p>
        </div>
        <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={() => void onExportReport()} type="button">
          Export Report
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Average Rating" value={`${averageRating.toFixed(1)} ★`} />
        <MetricCard label="Total Reviews" value={String(reviews.length)} />
        <MetricCard label="Pending Moderation" value={String(pendingCount)} />
      </section>

      <section className="flex flex-wrap gap-2 rounded border border-outline-variant/20 bg-surface-lowest p-4">
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setRatingFilter(event.target.value as 'All' | '4+' | '3+')} value={ratingFilter}>
          <option value="All">Rating (All)</option>
          <option value="4+">Rating 4+</option>
          <option value="3+">Rating 3+</option>
        </select>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setStatusFilter(event.target.value as 'All' | ReviewStatus)} value={statusFilter}>
          <option value="All">Status (All)</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Hidden">Hidden</option>
          <option value="Featured">Featured</option>
        </select>
        <select className="rounded border border-outline-variant/30 bg-surface px-3 py-2 text-sm" onChange={(event) => setProductFilter(event.target.value)} value={productFilter}>
          <option>All Products</option>
          {productOptions.map((product) => <option key={product}>{product}</option>)}
        </select>
        <label className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-2 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or product..." value={query} />
        </label>
      </section>

      <section className="overflow-hidden rounded border border-outline-variant/20 bg-surface-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredReviews.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-on-surface-variant" colSpan={7}>
                    No reviews match the current search or filter selection.
                  </td>
                </tr>
              )}
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-surface-low">
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium">{review.customerName}</p>
                    <p className="text-xs text-on-surface-variant">{review.customerEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <img alt="" className="h-9 w-9 rounded object-cover" src={review.productImageUrl} />
                      <p className="text-sm">{review.productName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-warning">{renderStars(review.rating)}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{review.excerpt}</td>
                  <td className="px-4 py-4"><ReviewStatusBadge status={review.status} /></td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{review.date}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="rounded border border-outline-variant/30 px-3 py-1.5 text-xs hover:bg-surface-low" onClick={() => onModerate(review.id)} type="button">
                      Moderate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReviewModerationModal({
  review,
  onClose,
  onApprove,
  onFeature,
  onHide,
  onDelete,
}: {
  review: ReviewRecord;
  onClose: () => void;
  onApprove: () => void;
  onFeature: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-lg rounded bg-surface-lowest p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img alt="" className="h-12 w-12 rounded object-cover" src={`https://picsum.photos/seed/${review.customerId}/64/64`} />
            <div>
              <p className="font-semibold">{review.customerName}</p>
              <p className="text-xs text-on-surface-variant">
                {review.date} · {review.verifiedPurchase ? 'Verified Purchase' : 'Unverified'}
              </p>
            </div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded border border-outline-variant/20 p-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Product</p>
          <div className="mt-2 flex items-center gap-3">
            <img alt="" className="h-14 w-14 rounded object-cover" src={review.productImageUrl} />
            <div>
              <p className="text-sm font-medium">{review.productName}</p>
              <p className="text-warning">{renderStars(review.rating)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Full Review</p>
          <p className="mt-2 text-sm text-on-surface-variant">{review.fullReview}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="rounded bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim" onClick={onApprove} type="button">Approve Review</button>
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onFeature} type="button">Mark as Featured</button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="rounded border border-outline-variant/30 px-3 py-2 text-sm hover:bg-surface-low" onClick={onHide} type="button">Hide</button>
          <button className="rounded border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/5" onClick={onDelete} type="button">Delete</button>
        </div>
      </section>
    </div>
  );
}

function CustomerActionModal({
  mode,
  customer,
  onSave,
  onClose,
}: {
  mode: CustomerActionMode;
  customer?: Customer;
  onSave: (payload: { name: string; email: string; status: CustomerTag }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [status, setStatus] = useState<CustomerTag>(customer?.status ?? 'New');
  const canSave = name.trim().length > 1 && email.trim().length > 3;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-md rounded bg-surface-lowest p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">{mode === 'create' ? 'Create Customer' : 'Edit Customer'}</h2>
          <button className="grid h-8 w-8 place-items-center rounded text-on-surface-variant hover:bg-surface-low" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Full Name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} />
          <label className="block space-y-2 text-sm font-medium">
            <span>Status</span>
            <select className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => setStatus(event.target.value as CustomerTag)} value={status}>
              <option value="VIP">VIP</option>
              <option value="Returning">Returning</option>
              <option value="New">New</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded border border-outline-variant/30 px-4 py-2 text-sm hover:bg-surface-low" onClick={onClose} type="button">Cancel</button>
          <button className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSave} onClick={() => onSave({ name: name.trim(), email: email.trim(), status })} type="button">Save</button>
        </div>
      </section>
    </div>
  );
}

function OrderHistoryTable({ orderHistory }: { orderHistory: CustomerOrderHistory[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="bg-surface-low text-xs uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Fulfillment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {orderHistory.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-sm">{order.id}</td>
              <td className="px-4 py-3 text-sm">{order.date}</td>
              <td className="px-4 py-3 text-sm font-semibold">${order.total.toLocaleString()}</td>
              <td className="px-4 py-3"><PaymentBadge status={order.paymentStatus} /></td>
              <td className="px-4 py-3"><FulfillmentBadge status={order.fulfillmentStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-outline-variant/20 bg-surface-lowest p-4">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-2" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function CustomerTagBadge({ status }: { status: CustomerTag }) {
  const classes: Record<CustomerTag, string> = {
    VIP: 'bg-warning/15 text-warning',
    Returning: 'bg-secondary/15 text-secondary',
    New: 'bg-surface-low text-on-surface-variant',
    Inactive: 'bg-error/10 text-error',
  };
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${classes[status]}`}>{status}</span>;
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const classes: Record<ReviewStatus, string> = {
    Pending: 'bg-warning/15 text-warning',
    Approved: 'bg-success/15 text-success',
    Hidden: 'bg-surface-low text-on-surface-variant',
    Featured: 'bg-primary/15 text-primary',
  };
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${classes[status]}`}>{status}</span>;
}

function PaymentBadge({ status }: { status: 'Paid' | 'Pending' }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${status === 'Paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
      {status}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: 'Shipped' | 'Delivered' | 'Processing' }) {
  const classes: Record<'Shipped' | 'Delivered' | 'Processing', string> = {
    Shipped: 'bg-primary/15 text-primary',
    Delivered: 'bg-success/15 text-success',
    Processing: 'bg-warning/15 text-warning',
  };
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${classes[status]}`}>{status}</span>;
}

function renderStars(rating: number) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-3.5 w-3.5 ${index < rating ? 'fill-current text-warning' : 'text-outline-variant'}`} />
      ))}
    </span>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
