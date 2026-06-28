import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, CheckCircle2, LayoutTemplate, ShoppingBag, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import { categories } from '../products/data';
import type { Product } from '../products/types';
import { syncCanonicalUrl, resolveCanonicalPathFromHash } from '../seo/canonical';
import { getImagePerformanceProps, type ImageSurface } from '../seo/performance';
import { syncProductSchema } from '../seo/productSchema';
import { loadBlogPosts, saveBlogPosts } from '../storefront/blogStore';
import { useStorefrontProducts } from '../storefront/productStore';
import { useStorefrontPages } from '../storefront/websitePagesStore';

type FrontendSection =
  | 'overview'
  | 'homepage'
  | 'collection'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'thank-you'
  | 'blog';

const frontendTabs: Array<{ key: FrontendSection; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'homepage', label: 'Homepage' },
  { key: 'collection', label: 'Collection' },
  { key: 'product', label: 'Product' },
  { key: 'cart', label: 'Cart' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'thank-you', label: 'Thank You' },
  { key: 'blog', label: 'Blog / Journal' },
];

export function FrontendModule({ section, slug }: { section?: string; slug?: string }) {
  const activeSection = normalizeFrontendSection(section);
  const [blogPosts, setBlogPosts] = useState(loadBlogPosts);
  const [productRecords] = useStorefrontProducts();
  const [pageRecords] = useStorefrontPages();
  const publishedPosts = blogPosts.filter((post) => post.status === 'Published');

  useEffect(() => {
    const activeProduct =
      activeSection === 'product'
        ? productRecords.find((item) => item.slug === slug) ??
          productRecords.find((item) => item.status === 'Active') ??
          productRecords[0]
        : null;

    const fallbackMap: Record<Exclude<FrontendSection, 'product'>, { title: string; description: string }> = {
      overview: {
        title: 'Frontstore Preview | Bisora',
        description: 'Preview buyer-facing runtime surfaces from homepage to checkout.',
      },
      homepage: {
        title: 'Homepage Preview | Bisora',
        description: 'Preview the published storefront homepage structure and buyer-first layout.',
      },
      collection: {
        title: 'Collection Preview | Bisora',
        description: 'Preview collection browsing, product grid layout, and collection SEO context.',
      },
      cart: {
        title: 'Cart Preview | Bisora',
        description: 'Preview cart and cart drawer experience before buyer checkout.',
      },
      checkout: {
        title: 'Checkout Preview | Bisora',
        description: 'Preview shipping, payment, and order summary flow for the storefront checkout.',
      },
      'thank-you': {
        title: 'Thank You Preview | Bisora',
        description: 'Preview post-purchase thank-you flow, order summary, and retention area.',
      },
      blog: {
        title: 'Blog Preview | Bisora',
        description: 'Preview published journal content and SEO-supporting storefront articles.',
      },
    };

    const nextTitle = activeProduct
      ? buildProductSeoTitle(activeProduct)
      : fallbackMap[activeSection as Exclude<FrontendSection, 'product'>]?.title ?? 'Bisora';
    const nextDescription = activeProduct
      ? buildProductSeoDescription(activeProduct)
      : fallbackMap[activeSection as Exclude<FrontendSection, 'product'>]?.description ?? 'Bisora storefront preview.';

    document.title = nextTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', nextDescription);
    syncCanonicalUrl(
      resolveCanonicalPathFromHash(window.location.hash, {
        products: productRecords,
        categories,
        pages: pageRecords,
      }),
    );
    syncProductSchema(activeProduct, { currency: 'MYR' });
  }, [activeSection, pageRecords, productRecords, slug]);

  useEffect(() => {
    saveBlogPosts(blogPosts);
  }, [blogPosts]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Frontstore Preview</p>
            <h1 className="text-3xl font-semibold text-on-surface">Buyer-Facing Runtime</h1>
            <p className="max-w-3xl text-sm leading-6 text-on-surface-variant">
              Most sellers should build inside `Website Builder` first. This area is the buyer-facing runtime and preview layer that should consume what the builder prepares from landing to purchase and post-purchase.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard title="Customer Journey" value="7 Steps" note="Homepage to thank-you page." />
            <MetricCard title="SEO Content Path" value="Blog Active" note="Journal route added for organic search support." />
            <MetricCard title="Runtime Status" value="Mapped" note="Ready to connect with builder output." />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-900">Seller path should stay simple</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              If you are setting up the website, stay in `Website Builder`. Come here only to review how buyers will actually experience the published storefront.
            </p>
          </div>
          <a
            href="#/website-builder"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm text-on-surface shadow-sm transition-colors hover:bg-surface-low"
          >
            Back to Website Builder
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {frontendTabs.map((tab) => (
            <a
              key={tab.key}
              href={`#/frontend/${tab.key}`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                tab.key === activeSection ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      {activeSection === 'overview' && <FrontendOverview />}
      {activeSection === 'homepage' && <HomepageRuntime productRecords={productRecords} />}
      {activeSection === 'collection' && <CollectionRuntime productRecords={productRecords} />}
      {activeSection === 'product' && <ProductRuntime productRecords={productRecords} slug={slug} />}
      {activeSection === 'cart' && <CartRuntime productRecords={productRecords} />}
      {activeSection === 'checkout' && <CheckoutRuntime productRecords={productRecords} />}
      {activeSection === 'thank-you' && <ThankYouRuntime productRecords={productRecords} />}
      {activeSection === 'blog' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-on-surface-variant">Blog / Journal</p>
                <h2 className="mt-2 text-2xl font-semibold text-on-surface">Published articles buyers should see on the frontstore</h2>
              </div>
              <a
                href="#/website-builder/blog"
                className="rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim"
              >
                Open Blog Editor
              </a>
            </div>

            <div className="mt-6 space-y-4">
              {publishedPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <OptimizedImage
                        alt={post.title}
                        className="h-24 w-24 rounded-2xl object-cover"
                        src={post.coverImagePreview ?? categories[0]?.coverUrl}
                        surface="thumbnail"
                      />
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-on-surface">{post.title}</h3>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Published</span>
                        </div>
                        <p className="text-sm text-on-surface-variant">Primary keyword: {post.keyword}</p>
                        <p className="text-sm leading-6 text-on-surface-variant">{post.summary}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface">Buyer-facing preview</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BookOpenText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-on-surface-variant">Blog Publishing Logic</p>
                <h3 className="mt-2 text-xl font-semibold text-on-surface">Edit blog in builder, review published result here</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium text-on-surface">What should happen here</p>
                <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                  <p>Seller writes and manages articles inside `Website Builder {'>'} Blog`.</p>
                  <p>`Frontstore Preview` should only reflect what is already published, just like buyers would see it.</p>
                  <p>This keeps the product model simple: builder = edit, preview = review.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
                <p className="text-sm font-medium text-on-surface">Why blog matters here</p>
                <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
                  <p>Blog should exist on the frontstore so Google can index helpful content and category-supporting articles.</p>
                  <p>It does not guarantee number one ranking, but it gives the store more search-entry pages beyond products only.</p>
                  <p>Best use: educational, styling, category, and buying-guide content tied back to products and collections.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 bg-white p-4">
                <p className="text-sm font-medium text-on-surface">Published Blog Preview</p>
                <div className="mt-4 space-y-4">
                  {publishedPosts.map((post) => (
                    <article key={post.id} className="overflow-hidden rounded-[24px] border border-outline-variant/20 bg-surface-low">
                      <OptimizedImage alt={post.title} className="h-44 w-full object-cover" src={post.coverImagePreview ?? categories[0]?.coverUrl} surface="card" />
                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{post.keyword}</p>
                        <h4 className="mt-2 text-lg font-semibold text-on-surface">{post.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{post.summary}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FrontendOverview() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">How Frontend should connect</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">Builder output feeds this buyer-facing runtime</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard title="Website Builder" text="This is the main seller workspace for theme, sections, header, footer, branding, menus, and store pages." />
          <InfoCard title="Frontstore Preview" text="This should show the actual buyer journey: homepage, collection, product, cart, checkout, and thank-you." />
          <InfoCard title="Product + Settings Link" text="Shipping, payments, and notifications should flow into checkout and post-purchase behavior here." />
          <InfoCard title="Blog / Journal" text="Supports SEO content so the store can rank for informational searches, not only product searches." />
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">What we should build from here</p>
        <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
          <FlowStep title="Homepage Runtime" text="Consume builder sections and render the published theme live." />
          <FlowStep title="Collection + Product" text="Connect product catalog, filters, variant logic, and trust blocks." />
          <FlowStep title="Cart + Checkout" text="Use shipping/payment logic already configured in admin settings." />
          <FlowStep title="Thank You + Blog" text="Support retention after purchase and organic content before purchase." />
        </div>
      </section>
    </div>
  );
}

function RuntimeShell({
  title,
  icon,
  note,
  children,
  bullets,
}: {
  title: string;
  icon: React.ReactNode;
  note: string;
  children: React.ReactNode;
  bullets: string[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <article className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <header className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Frontend Surface</p>
            <h2 className="mt-2 text-2xl font-semibold text-on-surface">{title}</h2>
          </div>
        </header>
        <div className="mt-6 rounded-[28px] border border-outline-variant/20 bg-surface-low p-6">
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{title}</span>
              <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">Frontstore preview shell</span>
            </header>
            <p className="mb-4 text-sm leading-6 text-on-surface-variant">{note}</p>
            {children}
          </div>
        </div>
      </article>

      <aside className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Why this page matters</p>
        <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
          {bullets.map((point, index) => (
            <FlowStep key={point} title={`Priority ${index + 1}`} text={point} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function OptimizedImage({
  surface,
  alt,
  className,
  referrerPolicy = 'no-referrer',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { surface: ImageSurface }) {
  const imageProps = getImagePerformanceProps(surface);

  return (
    <img
      alt={alt}
      className={className}
      decoding={imageProps.decoding}
      fetchPriority={imageProps.fetchPriority}
      loading={imageProps.loading}
      referrerPolicy={referrerPolicy}
      sizes={imageProps.sizes}
      {...props}
    />
  );
}

function HomepageRuntime({ productRecords }: { productRecords: Product[] }) {
  const publishedCategories = categories.filter((item) => item.status === 'Published').slice(0, 3);
  const activeProducts = productRecords.filter((item) => item.status === 'Active').slice(0, 4);

  return (
    <RuntimeShell
      title="Homepage"
      icon={<LayoutTemplate className="h-5 w-5 text-primary" />}
      note="Homepage should feel like the published theme result: strong hero, clear collection path, and curated products instead of random clutter."
      bullets={[
        'Hero should pull the strongest builder headline, image, and CTA path.',
        'Categories should guide buyers into the right collection quickly.',
        'Featured product rows should use actual catalog images, not fake placeholders.',
      ]}
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-[#f7f3ed]">
          <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Lumiere Noor</p>
              <h3 className="mt-3 text-4xl font-semibold text-on-surface">Define Your Grace</h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-on-surface-variant">
                Editorial hero from the active storefront theme should lead with a single premium message and one clear CTA.
              </p>
              <div className="mt-5">
                <button className="rounded-full bg-[#8a7b6c] px-5 py-2.5 text-sm text-white">Shop The Edit</button>
              </div>
            </div>
            <OptimizedImage alt="Homepage hero" className="h-full min-h-[260px] w-full object-cover" src={publishedCategories[0]?.coverUrl ?? activeProducts[0]?.thumbnailUrl} surface="hero" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {publishedCategories.map((category) => (
            <article key={category.id} className="overflow-hidden rounded-[24px] border border-outline-variant/20 bg-white">
              <OptimizedImage alt={category.name} className="h-36 w-full object-cover" src={category.coverUrl} surface="card" />
              <div className="p-4">
                <h3 className="font-medium text-on-surface">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{category.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {activeProducts.map((product) => (
            <article key={product.id} className="rounded-[24px] border border-outline-variant/20 bg-white p-4">
              <OptimizedImage alt={product.title} className="aspect-square w-full rounded-[20px] object-cover" src={product.thumbnailUrl} surface="card" />
              <h3 className="mt-3 font-medium text-on-surface">{product.title}</h3>
              <p className="mt-1 text-xs text-on-surface-variant">{product.categoryName}</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">MYR {product.price.toFixed(2)}</p>
            </article>
          ))}
        </div>
      </div>
    </RuntimeShell>
  );
}

function CollectionRuntime({ productRecords }: { productRecords: Product[] }) {
  const activeProducts = productRecords.filter((item) => item.status === 'Active');

  return (
    <RuntimeShell
      title="Collection Page"
      icon={<Sparkles className="h-5 w-5 text-primary" />}
      note="Collection should feel easy to browse: filter left, clear category context up top, then product grid with real catalog items."
      bullets={[
        'Filters and sorting should stay easy to scan on desktop and collapse well on mobile.',
        'Category metadata helps SEO and buyer confidence.',
        'Product cards should use real product thumbnails and prices from the catalog.',
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="rounded-[24px] border border-outline-variant/20 bg-surface-low p-4 text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">Filters</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white p-3">Category</div>
            <div className="rounded-2xl bg-white p-3">Price Range</div>
            <div className="rounded-2xl bg-white p-3">Color</div>
            <div className="rounded-2xl bg-white p-3">Size</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[24px] bg-surface-low p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Collection Intro</p>
            <h3 className="mt-2 text-3xl font-semibold text-on-surface">Evening Collection</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              SEO-friendly collection description should sit here so buyers and search engines both understand the page.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {activeProducts.map((product) => (
              <article key={product.id} className="rounded-[24px] border border-outline-variant/20 bg-white p-4">
                <OptimizedImage alt={product.title} className="aspect-square w-full rounded-[20px] object-cover" src={product.thumbnailUrl} surface="card" />
                <h3 className="mt-3 font-medium text-on-surface">{product.title}</h3>
                <p className="mt-2 text-sm font-semibold text-on-surface">MYR {product.price.toFixed(2)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </RuntimeShell>
  );
}

function ProductRuntime({
  productRecords,
  slug,
}: {
  productRecords: Product[];
  slug?: string;
}) {
  const activeProducts = useMemo(
    () => productRecords.filter((item) => item.status === 'Active'),
    [productRecords],
  );
  const product = activeProducts.find((item) => item.slug === slug) ?? activeProducts[0] ?? productRecords[0];

  if (!product) {
    return null;
  }

  return (
    <RuntimeShell
      title="Product Page"
      icon={<ShoppingBag className="h-5 w-5 text-primary" />}
      note="Product page is where trust, gallery, price, variants, and add-to-cart must feel calm and premium."
      bullets={[
        'Gallery should prioritize real product images and mobile usability.',
        'Variant and CTA hierarchy must stay obvious.',
        'Product details and trust blocks should support conversion without making the page noisy.',
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
          <div className="space-y-3" aria-label="Product gallery thumbnails">
            {Array.from({ length: 3 }).map((_, index) => (
              <OptimizedImage key={index} alt="" aria-hidden="true" className="h-20 w-20 rounded-2xl object-cover" src={product.thumbnailUrl} surface="thumbnail" />
            ))}
          </div>
          <OptimizedImage alt={product.title} className="w-full rounded-[28px] object-cover" src={product.thumbnailUrl} surface="feature" />
        </div>
        <article className="space-y-5">
          <header>
            <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{product.categoryName}</p>
            <h3 className="mt-2 text-3xl font-semibold text-on-surface">{product.title}</h3>
            <p className="mt-2 text-sm font-semibold text-on-surface">MYR {product.price.toFixed(2)}</p>
            <p className="mt-2 text-xs text-on-surface-variant">/products/{product.slug}</p>
          </header>
          <p className="text-sm leading-6 text-on-surface-variant">{product.description}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {product.variants.map((variant) => (
              <article key={variant.id} className="rounded-2xl border border-outline-variant/20 bg-surface-low px-3 py-3 text-sm text-on-surface">
                {variant.name}
              </article>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="rounded-full bg-primary px-5 py-3 text-sm text-on-primary">Add to Cart</button>
            <button className="rounded-full border border-outline-variant/20 px-5 py-3 text-sm text-on-surface">Buy Now</button>
          </div>
        </article>
      </div>
    </RuntimeShell>
  );
}

function CartRuntime({ productRecords }: { productRecords: Product[] }) {
  const cartItems = productRecords.filter((item) => item.status === 'Active').slice(0, 2);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <RuntimeShell
      title="Cart + Cart Drawer"
      icon={<ShoppingCart className="h-5 w-5 text-primary" />}
      note="Cart should stay friction-light: clear line items, update quantity fast, and move buyer toward checkout without clutter."
      bullets={[
        'Drawer should be fast for quick conversion.',
        'Full cart should help review, not distract.',
        'Order summary should stay visible and trustworthy.',
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-[24px] border border-outline-variant/20 bg-white p-4">
              <OptimizedImage alt={item.title} className="h-24 w-24 rounded-2xl object-cover" src={item.thumbnailUrl} surface="thumbnail" />
              <div className="flex-1">
                <p className="font-medium text-on-surface">{item.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{item.categoryName}</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">MYR {item.price.toFixed(2)}</p>
              </div>
              <div className="rounded-full border border-outline-variant/20 px-3 py-2 text-sm text-on-surface">Qty 1</div>
            </div>
          ))}
        </div>
        <div className="rounded-[24px] border border-outline-variant/20 bg-surface-low p-5">
          <p className="text-lg font-semibold text-on-surface">Order Summary</p>
          <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>MYR {subtotal.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span>Shipping</span><span>Calculated later</span></div>
            <div className="flex items-center justify-between font-medium text-on-surface"><span>Total</span><span>MYR {subtotal.toFixed(2)}</span></div>
          </div>
          <button className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm text-on-primary">Proceed to Checkout</button>
        </div>
      </div>
    </RuntimeShell>
  );
}

function CheckoutRuntime({ productRecords }: { productRecords: Product[] }) {
  const cartItems = productRecords.filter((item) => item.status === 'Active').slice(0, 2);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <RuntimeShell
      title="Checkout"
      icon={<Truck className="h-5 w-5 text-primary" />}
      note="Checkout should stay minimal and trustworthy because shipping and payment choices from settings must feel clean here."
      bullets={[
        'Shipping methods should follow seller shipping setup.',
        'Payment methods should follow gateway/manual method setup.',
        'Friction should stay low and trust signals high.',
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-outline-variant/20 bg-white p-5">
            <p className="font-medium text-on-surface">Contact Information</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-low p-3 text-sm text-on-surface-variant">Email</div>
              <div className="rounded-2xl bg-surface-low p-3 text-sm text-on-surface-variant">Phone</div>
            </div>
          </div>
          <div className="rounded-[24px] border border-outline-variant/20 bg-white p-5">
            <p className="font-medium text-on-surface">Shipping Method</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-primary bg-surface-low px-4 py-3 text-sm text-on-surface">Standard Delivery · MYR 8.00</div>
              <div className="rounded-2xl border border-outline-variant/20 px-4 py-3 text-sm text-on-surface">Express Delivery · MYR 18.00</div>
            </div>
          </div>
          <div className="rounded-[24px] border border-outline-variant/20 bg-white p-5">
            <p className="font-medium text-on-surface">Payment Method</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-primary bg-surface-low px-4 py-3 text-sm text-on-surface">SecurePay / Card</div>
              <div className="rounded-2xl border border-outline-variant/20 px-4 py-3 text-sm text-on-surface">Bank Transfer</div>
              <div className="rounded-2xl border border-outline-variant/20 px-4 py-3 text-sm text-on-surface">Cash on Delivery</div>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-outline-variant/20 bg-surface-low p-5">
          <p className="text-lg font-semibold text-on-surface">Order Summary</p>
          <div className="mt-4 space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <OptimizedImage alt={item.title} className="h-12 w-12 rounded-xl object-cover" src={item.thumbnailUrl} surface="thumbnail" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant">MYR {item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-outline-variant/20 pt-4 text-sm text-on-surface">
            <div className="flex items-center justify-between"><span>Total</span><span>MYR {subtotal.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </RuntimeShell>
  );
}

function ThankYouRuntime({ productRecords }: { productRecords: Product[] }) {
  const product = productRecords.find((item) => item.status === 'Active') ?? productRecords[0];

  if (!product) {
    return null;
  }

  return (
    <RuntimeShell
      title="Thank You Page"
      icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
      note="Thank-you page should confirm the order, reduce buyer anxiety, and gently show the next best action."
      bullets={[
        'Buyer should see payment confirmation and delivery summary immediately.',
        'Tracking and next-step actions should stay clear.',
        'Any retention CTA should be soft, not aggressive.',
      ]}
    >
      <div className="space-y-5">
        <div className="rounded-[28px] bg-surface-low p-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Order Confirmed</p>
          <h3 className="mt-3 text-3xl font-semibold text-on-surface">Thank You For Choosing Bisora</h3>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">Your order has been placed successfully and payment confirmation is already in motion.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="rounded-[24px] border border-outline-variant/20 bg-white p-5">
            <p className="font-medium text-on-surface">Delivery Timeline</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {['Confirmed', 'Processed', 'Shipped', 'Delivered'].map((step, index) => (
                <div key={step} className={`rounded-2xl px-3 py-4 text-center text-sm ${index === 0 ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant'}`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-outline-variant/20 bg-surface-low p-5">
            <p className="font-medium text-on-surface">Order Summary</p>
            <div className="mt-4 flex items-center gap-3">
              <OptimizedImage alt={product.title} className="h-14 w-14 rounded-xl object-cover" src={product.thumbnailUrl} surface="thumbnail" />
              <div>
                <p className="text-sm font-medium text-on-surface">{product.title}</p>
                <p className="text-xs text-on-surface-variant">MYR {product.price.toFixed(2)}</p>
              </div>
            </div>
            <button className="mt-5 w-full rounded-full border border-outline-variant/20 px-5 py-3 text-sm text-on-surface">Track Order</button>
          </div>
        </div>
      </div>
    </RuntimeShell>
  );
}

function MetricCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-surface-low px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-low p-4">
      <p className="text-sm font-medium text-on-surface">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>
    </div>
  );
}

function FlowStep({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-on-surface">{title}</p>
      <p className="mt-1 leading-6">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      {children}
    </label>
  );
}

function normalizeFrontendSection(section?: string): FrontendSection {
  if (
    section === 'overview' ||
    section === 'homepage' ||
    section === 'collection' ||
    section === 'product' ||
    section === 'cart' ||
    section === 'checkout' ||
    section === 'thank-you' ||
    section === 'blog'
  ) {
    return section;
  }

  return 'overview';
}

function buildProductSeoTitle(product: Product) {
  return product.seoTitle?.trim() || product.title.trim() || 'Product | Bisora';
}

function buildProductSeoDescription(product: Product) {
  if (product.seoDescription?.trim()) {
    return product.seoDescription.trim();
  }

  const normalized = product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return `Shop ${product.title} from Bisora.`;
  }

  return normalized.length > 160 ? `${normalized.slice(0, 157).trim()}...` : normalized;
}
