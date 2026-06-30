import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Minus, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart, Truck } from 'lucide-react';
import { fetchPublicOrder, fetchPublicStorefront, submitPublicCheckout, type PublicOrder, type PublicStorefront } from '../../api/storefront';
import { buildPublicStorefrontViewModel, type PublicStorefrontProductCard } from './publicStorefrontViewModel';
import { buildPreviewStorefrontFallback } from './publicStorefrontFallback';

interface CartLine {
  product: PublicStorefrontProductCard;
  quantity: number;
}

export function PublicStorefrontRuntime({
  store,
  productSlug,
  orderNumber,
  orderEmail,
}: {
  store: string;
  productSlug?: string;
  orderNumber?: string;
  orderEmail?: string;
}) {
  const [storefront, setStorefront] = useState<PublicStorefront | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trackedOrder, setTrackedOrder] = useState<PublicOrder | null>(null);
  const [trackStatus, setTrackStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<PublicOrder | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    postcode: '',
    country: 'Malaysia',
  });

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    fetchPublicStorefront(store)
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setStorefront(payload);
        setStatus('ready');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        const fallback = buildPreviewStorefrontFallback(store);
        if (fallback) {
          setStorefront(fallback);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [store]);

  useEffect(() => {
    if (!orderNumber || !orderEmail) {
      setTrackedOrder(null);
      setTrackStatus('idle');
      return;
    }

    let isMounted = true;
    setTrackStatus('loading');
    fetchPublicOrder(store, orderNumber, orderEmail)
      .then((order) => {
        if (!isMounted) {
          return;
        }
        setTrackedOrder(order);
        setTrackStatus('idle');
      })
      .catch(() => {
        if (isMounted) {
          setTrackStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderEmail, orderNumber, store]);

  const viewModel = useMemo(() => (storefront ? buildPublicStorefrontViewModel(storefront) : null), [storefront]);
  const selectedProduct = viewModel?.products.find((product) => product.slug === productSlug);
  const featuredProduct = selectedProduct ?? viewModel?.products[0];
  const subtotal = cart.reduce((sum, line) => {
    const amount = Number(line.product.priceLabel.replace(/^[^\d]+/, ''));
    return sum + amount * line.quantity;
  }, 0);

  const addToCart = (product: PublicStorefrontProductCard) => {
    if (!product.isInStock) {
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }

      return [...current, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const updateCheckoutField = (key: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((current) => ({ ...current, [key]: value }));
  };

  const submitCheckout = async () => {
    if (!viewModel || cart.length === 0 || checkoutStatus === 'submitting') {
      return;
    }

    setCheckoutStatus('submitting');
    setCheckoutError('');

    try {
      const order = await submitPublicCheckout(storefront?.store.slug ?? store, {
        customer: {
          name: checkoutForm.name,
          email: checkoutForm.email,
          phone: checkoutForm.phone,
        },
        shippingAddress: {
          addressLine1: checkoutForm.addressLine1,
          city: checkoutForm.city,
          postcode: checkoutForm.postcode,
          country: checkoutForm.country,
        },
        paymentMethod: 'manual_bank_transfer',
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      });

      setPlacedOrder(order);
      setCart([]);
      setCheckoutStatus('success');
    } catch {
      setCheckoutStatus('error');
      setCheckoutError('Order could not be submitted. Please check the details and try again.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-on-surface">
        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading storefront
        </div>
      </div>
    );
  }

  if (status === 'error' || !viewModel || !featuredProduct) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-5 text-on-surface">
        <section className="max-w-md rounded border border-outline-variant/20 bg-surface-lowest p-6 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Storefront not available</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            This store is not published yet, or the public storefront API cannot be reached.
          </p>
          <a className="mt-5 inline-flex rounded bg-primary px-4 py-2 text-sm text-on-primary" href="#/login">
            Admin login
          </a>
        </section>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950" style={{ backgroundColor: viewModel.theme.neutralColor }}>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex min-w-0 items-center gap-3" href={`#/store/${storefront?.store.slug ?? store}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-slate-950 text-sm font-semibold text-white">
              {viewModel.brandName.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{viewModel.brandName}</span>
              <span className="block truncate text-xs text-slate-500">{viewModel.domainLabel}</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{viewModel.productCountLabel}</span>
            <a className="rounded border border-black/10 px-3 py-2 text-sm hover:bg-slate-50" href="#/login">
              Seller login
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:px-8">
        <div className="space-y-8">
          {orderNumber && (
            <OrderTrackingPanel
              email={orderEmail}
              order={trackedOrder}
              orderNumber={orderNumber}
              status={trackStatus}
              storeSlug={storefront?.store.slug ?? store}
              themeColor={viewModel.theme.primaryColor}
            />
          )}

          <article className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="grid lg:grid-cols-[1fr_0.95fr]">
              <div className="flex min-h-[420px] flex-col justify-center p-6 sm:p-10">
                {selectedProduct && (
                  <a className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950" href={`#/store/${storefront?.store.slug ?? store}`}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to storefront
                  </a>
                )}
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{selectedProduct ? featuredProduct.categoryName : 'Live Storefront'}</p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                  {selectedProduct ? featuredProduct.title : viewModel.brandName}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  {selectedProduct ? featuredProduct.description || viewModel.tagline : viewModel.tagline}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex items-center gap-2 rounded px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!featuredProduct.isInStock}
                    onClick={() => addToCart(featuredProduct)}
                    style={{ backgroundColor: viewModel.theme.primaryColor }}
                    type="button"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </button>
                  <span className="text-lg font-semibold">{featuredProduct.priceLabel}</span>
                  {featuredProduct.compareAtPriceLabel && (
                    <span className="text-sm text-slate-400 line-through">{featuredProduct.compareAtPriceLabel}</span>
                  )}
                </div>
              </div>
              <ProductImage product={featuredProduct} accentColor={viewModel.theme.accentColor} isHero />
            </div>
          </article>

          <section>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-slate-500">Collection</p>
                <h2 className="mt-1 text-2xl font-semibold">Shop available products</h2>
              </div>
              <p className="text-sm text-slate-500">{viewModel.productCountLabel}</p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {viewModel.products.map((product) => (
                <article key={product.id} className="overflow-hidden rounded border border-black/10 bg-white">
                  <a href={product.href}>
                    <ProductImage product={product} accentColor={viewModel.theme.accentColor} />
                  </a>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{product.categoryName || product.vendor}</p>
                        <a className="mt-2 block font-semibold hover:text-primary" href={product.href}>
                          {product.title}
                        </a>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">{product.priceLabel}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={`text-xs ${product.isInStock ? 'text-emerald-700' : 'text-red-600'}`}>{product.stockLabel}</span>
                      <button
                        className="rounded border border-black/10 px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!product.isInStock}
                        onClick={() => addToCart(product)}
                        type="button"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded border border-black/10 bg-white p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Cart</p>
              <h2 className="mt-1 text-xl font-semibold">{cart.reduce((sum, line) => sum + line.quantity, 0)} items</h2>
            </div>
            <ShoppingCart className="h-5 w-5 text-slate-500" />
          </div>

          <div className="mt-5 space-y-4">
            {cart.length === 0 && <p className="rounded bg-slate-50 p-4 text-sm text-slate-500">Your cart is empty.</p>}
            {cart.map((line) => (
              <div key={line.product.id} className="flex gap-3">
                <ProductImage product={line.product} accentColor={viewModel.theme.accentColor} isThumb />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.product.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{line.product.priceLabel}</p>
                  <div className="mt-2 inline-flex items-center rounded border border-black/10">
                    <button className="grid h-8 w-8 place-items-center" onClick={() => updateCartQuantity(line.product.id, -1)} type="button">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm">{line.quantity}</span>
                    <button className="grid h-8 w-8 place-items-center" onClick={() => updateCartQuantity(line.product.id, 1)} type="button">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-black/10 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{storefront?.store.currency ?? 'MYR'} {subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-5 space-y-3">
              <CheckoutInput
                label="Full name"
                onChange={(value) => updateCheckoutField('name', value)}
                required
                value={checkoutForm.name}
              />
              <CheckoutInput
                label="Email"
                onChange={(value) => updateCheckoutField('email', value)}
                required
                type="email"
                value={checkoutForm.email}
              />
              <CheckoutInput
                label="Phone"
                onChange={(value) => updateCheckoutField('phone', value)}
                value={checkoutForm.phone}
              />
              <CheckoutInput
                label="Address"
                onChange={(value) => updateCheckoutField('addressLine1', value)}
                required
                value={checkoutForm.addressLine1}
              />
              <div className="grid grid-cols-2 gap-3">
                <CheckoutInput
                  label="City"
                  onChange={(value) => updateCheckoutField('city', value)}
                  required
                  value={checkoutForm.city}
                />
                <CheckoutInput
                  label="Postcode"
                  onChange={(value) => updateCheckoutField('postcode', value)}
                  value={checkoutForm.postcode}
                />
              </div>
              <CheckoutInput
                label="Country"
                onChange={(value) => updateCheckoutField('country', value)}
                required
                value={checkoutForm.country}
              />
            </div>
            {checkoutError && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{checkoutError}</p>}
            {placedOrder && checkoutStatus === 'success' && (
              <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <p>Order {placedOrder.number} received. Payment is pending manual confirmation.</p>
                <a
                  className="mt-2 inline-flex font-semibold underline"
                  href={`#/store/${storefront?.store.slug ?? store}/orders/${placedOrder.number}?email=${encodeURIComponent(placedOrder.customer.email)}`}
                >
                  Track this order
                </a>
              </div>
            )}
            <button
              className="mt-4 w-full rounded px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                cart.length === 0 ||
                checkoutStatus === 'submitting' ||
                !checkoutForm.name.trim() ||
                !checkoutForm.email.trim() ||
                !checkoutForm.addressLine1.trim() ||
                !checkoutForm.city.trim() ||
                !checkoutForm.country.trim()
              }
              onClick={submitCheckout}
              style={{ backgroundColor: viewModel.theme.primaryColor }}
              type="button"
            >
              {checkoutStatus === 'submitting' ? 'Submitting order' : 'Place order'}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function OrderTrackingPanel({
  email,
  order,
  orderNumber,
  status,
  storeSlug,
  themeColor,
}: {
  email?: string;
  order: PublicOrder | null;
  orderNumber: string;
  status: 'idle' | 'loading' | 'error';
  storeSlug: string;
  themeColor: string;
}) {
  if (!email) {
    return (
      <section className="rounded border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Add the buyer email to view order {orderNumber}.
      </section>
    );
  }

  if (status === 'loading') {
    return (
      <section className="flex items-center gap-3 rounded border border-black/10 bg-white p-5 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading order status
      </section>
    );
  }

  if (status === 'error' || !order) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Order status is unavailable. Check the order number and buyer email.
      </section>
    );
  }

  const steps = [
    { label: 'Order received', active: true },
    { label: 'Payment', active: order.paymentStatus === 'paid' },
    { label: 'Processing', active: ['processing', 'shipped', 'delivered'].includes(order.fulfillmentStatus) },
    { label: 'Shipped', active: ['shipped', 'delivered'].includes(order.fulfillmentStatus) },
    { label: 'Delivered', active: order.fulfillmentStatus === 'delivered' },
  ];

  return (
    <section className="rounded border border-black/10 bg-white p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-slate-500">Order tracking</p>
          <h1 className="mt-1 text-2xl font-semibold">{order.number}</h1>
          <p className="mt-2 text-sm text-slate-500">{order.customer.email}</p>
        </div>
        <a className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm hover:bg-slate-50" href={`#/store/${storeSlug}`}>
          <Search className="h-4 w-4" />
          Continue shopping
        </a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {steps.map((step) => (
          <div key={step.label} className={`rounded border p-3 text-sm ${step.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-black/10 bg-slate-50 text-slate-500'}`}>
            <PackageCheck className="mb-2 h-4 w-4" />
            {step.label}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <TrackingInfo label="Payment" value={order.paymentStatus} />
        <TrackingInfo label="Fulfillment" value={order.fulfillmentStatus} />
        <TrackingInfo label="Total" value={`MYR ${order.total.toFixed(2)}`} />
      </div>

      <div className="mt-5 rounded border border-black/10 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5" style={{ color: themeColor }} />
          <div>
            <p className="text-sm font-semibold">Shipment</p>
            <p className="mt-1 text-sm text-slate-600">
              {order.shipment.trackingNumber
                ? `${order.shipment.courier || 'Courier'} tracking ${order.shipment.trackingNumber}`
                : 'Tracking will appear here once the seller ships the order.'}
            </p>
            {order.shipment.trackingLocation && <p className="mt-1 text-xs text-slate-500">{order.shipment.trackingLocation}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackingInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-black/10 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize">{value || 'Pending'}</p>
    </div>
  );
}

function CheckoutInput({
  label,
  onChange,
  required = false,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block space-y-1 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <input
        className="w-full rounded border border-black/10 px-3 py-2 text-sm text-slate-950 outline-none transition-colors focus:border-slate-400"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function ProductImage({
  product,
  accentColor,
  isHero = false,
  isThumb = false,
}: {
  product: PublicStorefrontProductCard;
  accentColor: string;
  isHero?: boolean;
  isThumb?: boolean;
}) {
  const className = isThumb
    ? 'h-16 w-16 shrink-0 rounded object-cover'
    : isHero
      ? 'h-full min-h-[420px] w-full object-cover'
      : 'aspect-square w-full object-cover';

  if (product.imageUrl) {
    return <img alt={product.title} className={className} decoding="async" loading={isHero ? 'eager' : 'lazy'} src={product.imageUrl} />;
  }

  return (
    <div className={`${className} grid place-items-center`} style={{ backgroundColor: accentColor }}>
      <ShoppingBag className={isThumb ? 'h-5 w-5 text-slate-600' : 'h-10 w-10 text-slate-600'} />
    </div>
  );
}
