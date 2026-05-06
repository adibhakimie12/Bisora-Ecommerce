import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { ChevronDown, Heart, Minus, Plus, Search, ShieldCheck, ShoppingBag, Star, User, X } from 'lucide-react';
import { luxuryMuslimahTemplate } from './luxuryMuslimahTemplate';
import type { LuxuryTemplateProduct } from './luxuryMuslimahTemplate';
import type { ThemeDraftContent } from './themeBuilderModel';

export type LuxuryPreviewMode = 'storefront' | 'product' | 'cart' | 'checkout' | 'thankYou' | 'account';
export type LuxuryPreviewAction = 'logo' | 'account' | 'buy-now';

export const luxuryTemplateHeroImage = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80';

const collectionImages = [
  luxuryTemplateHeroImage,
  'https://images.unsplash.com/photo-1583391733975-6c78276477e2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
];

export function normalizePreviewMode(mode?: string): LuxuryPreviewMode {
  if (mode === 'product' || mode === 'cart' || mode === 'checkout' || mode === 'thankYou' || mode === 'account') {
    return mode;
  }

  return 'storefront';
}

export function getPreviewModeFromAction(action: LuxuryPreviewAction): LuxuryPreviewMode {
  if (action === 'account') {
    return 'account';
  }

  if (action === 'buy-now') {
    return 'checkout';
  }

  return 'storefront';
}

export function LuxuryMuslimahTemplatePreview({
  mode = 'storefront',
  draftContent,
  focusSection,
  editorPreview = false,
}: {
  mode?: LuxuryPreviewMode;
  draftContent?: ThemeDraftContent;
  focusSection?: string;
  editorPreview?: boolean;
}) {
  const [activeMode, setActiveMode] = useState<LuxuryPreviewMode>(normalizePreviewMode(mode));
  const [cartOpen, setCartOpen] = useState(false);
  const focusRefs = {
    homepage: useRef<HTMLElement | null>(null),
    collections: useRef<HTMLElement | null>(null),
    footer: useRef<HTMLElement | null>(null),
  };

  useEffect(() => {
    const nextMode = normalizePreviewMode(mode);
    setActiveMode(nextMode);
    setCartOpen(nextMode === 'cart');
  }, [mode]);

  useEffect(() => {
    if (activeMode !== 'storefront') {
      return;
    }

    const target = focusSection === 'collections' ? focusRefs.collections.current : focusSection === 'footer' ? focusRefs.footer.current : focusRefs.homepage.current;
    window.setTimeout(() => target?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  }, [activeMode, focusSection]);

  return (
    <div className={`relative min-h-[780px] overflow-hidden bg-[#fbf7f0] text-[#211712] ${editorPreview ? 'text-[92%]' : ''}`}>
      <LuxuryHeader
        activeMode={activeMode}
        editorPreview={editorPreview}
        logoText={draftContent?.logoText ?? 'Maison Noor'}
        onGoHome={() => setActiveMode(getPreviewModeFromAction('logo'))}
        onOpenAccount={() => setActiveMode(getPreviewModeFromAction('account'))}
        onOpenCart={() => setCartOpen(true)}
      />
      {activeMode === 'storefront' && (
        <StorefrontPreview
          draftContent={draftContent}
          editorPreview={editorPreview}
          focusRefs={focusRefs}
          onOpenCart={() => setCartOpen(true)}
          onOpenProduct={() => setActiveMode('product')}
        />
      )}
      {activeMode === 'product' && (
        <ProductPagePreview
          onOpenCart={() => setCartOpen(true)}
          onBuyNow={() => setActiveMode(getPreviewModeFromAction('buy-now'))}
        />
      )}
      {activeMode === 'cart' && (
        <StorefrontPreview
          draftContent={draftContent}
          editorPreview={editorPreview}
          focusRefs={focusRefs}
          onOpenCart={() => setCartOpen(true)}
          onOpenProduct={() => setActiveMode('product')}
        />
      )}
      {activeMode === 'checkout' && <CheckoutPreview />}
      {activeMode === 'thankYou' && <ThankYouPreview />}
      {activeMode === 'account' && <AccountPreview />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function LuxuryHeader({
  activeMode,
  editorPreview,
  logoText,
  onGoHome,
  onOpenAccount,
  onOpenCart,
}: {
  activeMode: LuxuryPreviewMode;
  editorPreview: boolean;
  logoText: string;
  onGoHome: () => void;
  onOpenAccount: () => void;
  onOpenCart: () => void;
}) {
  const modes: Array<{ key: LuxuryPreviewMode; label: string }> = [
    { key: 'storefront', label: 'Storefront' },
    { key: 'product', label: 'Product' },
    { key: 'cart', label: 'Cart' },
    { key: 'checkout', label: 'Checkout' },
    { key: 'thankYou', label: 'Thank You' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-[#d8c7af]/50 bg-[#fbf7f0]/82 px-5 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4">
        {!editorPreview && (
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => (
              <span
                key={item.key}
                className={`rounded-full px-3 py-1 text-xs ${
                  item.key === activeMode ? 'bg-[#211712] text-white' : 'bg-white/75 text-[#5f4b3e]'
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
        <nav className="hidden items-center gap-5 text-sm text-[#5f4b3e] lg:flex">
          <span className="group inline-flex items-center gap-1">
            Collections <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
          </span>
          <span>Beauty</span>
          <span>Perfume</span>
        </nav>
        <button onClick={onGoHome} className="text-center">
          <p className="font-serif text-2xl font-semibold">{logoText}</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#9c7b52]">Editorial Atelier</p>
        </button>
        <div className="flex items-center gap-2 text-[#5f4b3e]">
          <IconButton label="Search" icon={<Search className="h-4 w-4" />} />
          <IconButton label="Wishlist" icon={<Heart className="h-4 w-4" />} />
          <a href={`#/frontend/account-login/${luxuryMuslimahTemplate.id}`} className="rounded-full bg-white/70 p-2 transition-colors hover:bg-white" aria-label="Account" title="Account">
            <User className="h-4 w-4" />
          </a>
          <IconButton label="Cart" icon={<ShoppingBag className="h-4 w-4" />} onClick={onOpenCart} />
        </div>
      </div>
      </div>
    </header>
  );
}

function StorefrontPreview({
  draftContent,
  editorPreview,
  focusRefs,
  onOpenCart,
  onOpenProduct,
}: {
  draftContent?: ThemeDraftContent;
  editorPreview: boolean;
  focusRefs: {
    homepage: MutableRefObject<HTMLElement | null>;
    collections: MutableRefObject<HTMLElement | null>;
    footer: MutableRefObject<HTMLElement | null>;
  };
  onOpenCart: () => void;
  onOpenProduct: () => void;
}) {
  return (
    <>
      <section
        ref={focusRefs.homepage}
        className={`relative bg-cover bg-center px-6 ${editorPreview ? 'min-h-[520px] py-12' : 'min-h-[620px] py-16'}`}
        style={{ backgroundImage: `linear-gradient(90deg, rgba(251,247,240,0.98), rgba(251,247,240,0.62), rgba(251,247,240,0.08)), url(${collectionImages[0]})` }}
      >
        <div className="max-w-2xl animate-[fadeIn_700ms_ease-out]">
          <p className="text-xs uppercase tracking-[0.32em] text-[#9c7b52]">{draftContent?.announcementText ?? 'Ramadan capsule now live'}</p>
          <h2 className={`mt-5 font-serif font-semibold leading-[0.98] text-[#231811] ${editorPreview ? 'text-5xl' : 'text-6xl'}`}>{draftContent?.heroHeading ?? 'Luxury Muslimah Fashion'}</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#5f4b3e]">
            {draftContent?.heroSubtitle ?? 'Editorial modestwear, perfume, beauty and feminine rituals composed for soft luxury living.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-[#211712] px-6 py-3 text-sm text-white transition-transform hover:-translate-y-0.5">Shop The Edit</button>
            <button className="rounded-full border border-[#9c7b52]/40 bg-white/70 px-6 py-3 text-sm text-[#211712] backdrop-blur">View Lookbook</button>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden w-72 rounded-3xl border border-white/60 bg-white/78 p-4 shadow-2xl backdrop-blur-xl lg:block">
          <img className="aspect-[4/5] w-full rounded-2xl object-cover" src={luxuryMuslimahTemplate.bestSellers[0].image} alt="Noor Silk Abaya" />
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Noor Silk Abaya</p>
              <p className="text-xs text-[#7d6859]">MYR 289</p>
            </div>
            <button onClick={onOpenCart} className="rounded-full bg-[#9c7b52] px-3 py-1.5 text-xs text-white">Add</button>
          </div>
        </div>
      </section>

      <CollectionGrid sectionRef={focusRefs.collections} collections={draftContent?.collections ?? luxuryMuslimahTemplate.collections} />
      <ProductRail title="Luxury Best Sellers" products={luxuryMuslimahTemplate.bestSellers} onOpenCart={onOpenCart} onOpenProduct={onOpenProduct} />
      <EditorialBanner />
      <ProductRail title="Trending Now" products={luxuryMuslimahTemplate.trending} onOpenCart={onOpenCart} grid />
      <ReviewsSection />
      <InstagramFeed />
      <NewsletterSection sectionRef={focusRefs.footer} />
    </>
  );
}

function CollectionGrid({ sectionRef, collections }: { sectionRef: MutableRefObject<HTMLElement | null>; collections: string[] }) {
  return (
    <section ref={sectionRef} className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Curated departments</p>
      <h3 className="mt-2 font-serif text-4xl font-semibold">Featured Collections</h3>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((item, index) => (
          <div key={item} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#eadfce]">
            <img className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={collectionImages[index % collectionImages.length]} alt={item} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/54 via-black/8 to-transparent" />
            <p className="absolute bottom-5 left-5 font-serif text-3xl font-semibold text-white">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductRail({
  title,
  products,
  onOpenCart,
  onOpenProduct,
  grid = false,
}: {
  title: string;
  products: LuxuryTemplateProduct[];
  onOpenCart: () => void;
  onOpenProduct?: () => void;
  grid?: boolean;
}) {
  return (
    <section className="px-6 py-14">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Premium commerce</p>
          <h3 className="mt-2 font-serif text-4xl font-semibold">{title}</h3>
        </div>
        <button className="rounded-full border border-[#9c7b52]/30 px-4 py-2 text-sm">View all</button>
      </div>
      <div className={`grid gap-4 ${grid ? 'sm:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-4'}`}>
        {products.map((product) => <ProductCard key={product.name} product={product} onOpenCart={onOpenCart} />)}
      </div>
      {!grid && onOpenProduct && (
        <div className="mt-5">
          <button onClick={onOpenProduct} className="rounded-full border border-[#9c7b52]/30 bg-white px-4 py-2 text-sm text-[#211712]">
            Open product experience
          </button>
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, onOpenCart }: { product: LuxuryTemplateProduct; onOpenCart: () => void }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <img className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" src={product.image} alt={product.name} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/86 px-3 py-1 text-xs text-[#5f4b3e]">{product.badge}</span>}
        <button className="absolute right-4 top-4 rounded-full bg-white/86 p-2 text-[#5f4b3e] opacity-0 transition-opacity group-hover:opacity-100" aria-label="Wishlist">
          <Heart className="h-4 w-4" />
        </button>
        <button onClick={onOpenCart} className="absolute bottom-4 left-4 right-4 translate-y-4 rounded-full bg-[#211712] px-4 py-3 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          Quick view and add
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9c7b52]">{product.category}</p>
        <p className="mt-1 font-medium">{product.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[#5f4b3e]">{product.price}</p>
          <div className="flex gap-1">
            {product.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}
          </div>
        </div>
        <p className="mt-3 text-xs text-[#7d6859]">XS S M L XL</p>
      </div>
    </article>
  );
}

function EditorialBanner() {
  return (
    <section className="grid min-h-[420px] items-center bg-[#302218] px-6 py-16 text-white lg:grid-cols-[1fr_0.9fr]">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[#d8bc82]">Fashion editorial</p>
        <h3 className="mt-4 font-serif text-5xl font-semibold leading-tight">A softer ritual for modern feminine elegance.</h3>
        <p className="mt-5 leading-8 text-white/70">Build a brand moment with lifestyle imagery, emotional storytelling, and premium white space.</p>
      </div>
      <img className="mt-8 aspect-[5/4] w-full rounded-3xl object-cover lg:mt-0" src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80" alt="Luxury editorial fashion" />
    </section>
  );
}

function ReviewsSection() {
  const reviews = ['TikTok try-on review', 'Image review with abaya fit', 'Perfume unboxing story'];
  return (
    <section className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Social proof</p>
      <h3 className="mt-2 font-serif text-4xl font-semibold">Customer Reviews</h3>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {reviews.map((review, index) => (
          <div key={review} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="aspect-[9/14] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${collectionImages[index + 1]})` }} />
            <div className="mt-4 flex gap-1 text-[#c59b50]">{Array.from({ length: 5 }).map((_, starIndex) => <Star key={starIndex} className="h-4 w-4 fill-current" />)}</div>
            <p className="mt-3 text-sm font-medium">{review}</p>
            <p className="mt-2 text-sm leading-6 text-[#6e5b4c]">Feels premium, modest, and elegant enough for special occasions.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InstagramFeed() {
  return (
    <section className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Instagram mood</p>
      <h3 className="mt-2 font-serif text-4xl font-semibold">@maisonnoor</h3>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-6">
        {collectionImages.map((image) => <img key={image} className="aspect-square rounded-2xl object-cover" src={image} alt="Instagram feed" />)}
      </div>
    </section>
  );
}

function NewsletterSection({ sectionRef }: { sectionRef: MutableRefObject<HTMLElement | null> }) {
  return (
    <section ref={sectionRef} className="bg-[#eadfce] px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Private list</p>
      <h3 className="mx-auto mt-2 max-w-2xl font-serif text-5xl font-semibold">Join the first look for new drops.</h3>
      <div className="mx-auto mt-7 flex max-w-xl flex-col gap-3 rounded-full bg-white p-2 shadow-sm sm:flex-row">
        <input className="min-w-0 flex-1 rounded-full px-5 py-3 text-sm outline-none" placeholder="Email address" />
        <button className="rounded-full bg-[#211712] px-6 py-3 text-sm text-white">Subscribe</button>
      </div>
    </section>
  );
}

function ProductPagePreview({ onOpenCart, onBuyNow }: { onOpenCart: () => void; onBuyNow: () => void }) {
  const product = luxuryMuslimahTemplate.bestSellers[0];
  return (
    <section className="grid gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {[product.image, collectionImages[2], collectionImages[3], collectionImages[4]].map((image) => <img key={image} className="aspect-[4/5] rounded-3xl object-cover" src={image} alt={product.name} />)}
      </div>
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">{product.category}</p>
        <h2 className="mt-3 font-serif text-5xl font-semibold">{product.name}</h2>
        <p className="mt-3 text-xl text-[#5f4b3e]">{product.price}</p>
        <p className="mt-5 leading-8 text-[#6e5b4c]">Premium silk-touch drape with modest coverage, soft lining, and an elegant editorial fall.</p>
        <OptionRow title="Color" values={['Ivory', 'Mocha', 'Black']} />
        <OptionRow title="Size" values={['XS', 'S', 'M', 'L', 'XL']} />
        <div className="mt-5 rounded-3xl bg-white p-4 text-sm leading-7 shadow-sm">
          <p>Fabric: premium satin blend</p>
          <p>Shipping estimate: 2-4 working days</p>
          <p>Includes care card and luxury dust bag</p>
        </div>
        <div className="sticky bottom-4 mt-6 grid gap-3 rounded-3xl bg-white/90 p-3 shadow-xl backdrop-blur sm:grid-cols-2">
          <button onClick={onOpenCart} className="rounded-full bg-[#211712] px-5 py-3 text-sm text-white">Add to cart</button>
          <button onClick={onBuyNow} className="rounded-full border border-[#9c7b52]/40 px-5 py-3 text-sm">Buy now</button>
        </div>
      </div>
    </section>
  );
}

function OptionRow({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} className="rounded-full border border-[#9c7b52]/30 bg-white px-4 py-2 text-sm">{value}</button>)}</div>
    </div>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/30">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#fbf7f0] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#d8c7af]/50 p-5">
          <p className="font-serif text-2xl font-semibold">Your Cart</p>
          <button onClick={onClose} className="rounded-full bg-white p-2" aria-label="Close cart"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium">Free shipping progress</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadfce]"><div className="h-full w-2/3 rounded-full bg-[#9c7b52]" /></div>
            <p className="mt-2 text-xs text-[#6e5b4c]">MYR 72 away from free shipping.</p>
          </div>
          <div className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm">
            <img className="h-24 w-20 rounded-2xl object-cover" src={luxuryMuslimahTemplate.bestSellers[0].image} alt="Cart item" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Noor Silk Abaya</p>
              <p className="mt-1 text-sm text-[#6e5b4c]">Mocha / M</p>
              <div className="mt-3 flex w-fit items-center gap-3 rounded-full bg-[#fbf7f0] px-3 py-1"><Minus className="h-3.5 w-3.5" /><span className="text-sm">1</span><Plus className="h-3.5 w-3.5" /></div>
            </div>
            <p className="text-sm">MYR 289</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-sm font-medium">One time offer</p><p className="mt-2 text-sm text-[#6e5b4c]">Add Velvet Rose Lipmatte for MYR 39 only.</p></div>
          <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-sm font-medium">Frequently bought together</p><p className="mt-2 text-sm text-[#6e5b4c]">Abaya + Shawl + Perfume bundle save 15%.</p></div>
        </div>
        <div className="border-t border-[#d8c7af]/50 p-5"><button className="w-full rounded-full bg-[#211712] px-5 py-3 text-sm text-white">Checkout Securely</button></div>
      </aside>
    </div>
  );
}

function CheckoutPreview() {
  const accountLoginPath = `#/frontend/account-login/${luxuryMuslimahTemplate.id}`;
  return (
    <section className="grid gap-6 px-6 py-12 lg:grid-cols-[1fr_420px]">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Secure checkout</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h2 className="font-serif text-4xl font-semibold">Delivery Details</h2>
          <a href={accountLoginPath} className="text-sm text-[#6e5b4c] underline">Already have account? Login</a>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {['Full name', 'Email', 'Phone number', 'Address', 'Postcode', 'State'].map((field) => <input key={field} className="rounded-2xl border border-[#d8c7af]/60 px-4 py-3 text-sm outline-none" placeholder={field} />)}
          <textarea className="rounded-2xl border border-[#d8c7af]/60 px-4 py-3 text-sm outline-none sm:col-span-2" rows={4} placeholder="Notes" />
        </div>
        <div className="mt-6 rounded-3xl bg-[#fbf7f0] p-4">
          <p className="font-medium">Payment methods</p>
          <div className="mt-3 flex flex-wrap gap-2">{['Online Banking', 'Card', 'COD', 'E-Wallet'].map((method) => <button key={method} className="rounded-full bg-white px-4 py-2 text-sm">{method}</button>)}</div>
        </div>
      </div>
      <aside className="h-fit rounded-3xl bg-[#211712] p-6 text-white shadow-xl">
        <p className="font-serif text-3xl font-semibold">Order Summary</p>
        <div className="mt-6 space-y-3 text-sm text-white/75"><p>Noor Silk Abaya - MYR 289</p><p>Shipping - MYR 8</p><p>Coupon section ready</p></div>
        <div className="mt-6 border-t border-white/15 pt-5"><p className="text-xl font-semibold">Total MYR 297</p><button className="mt-5 w-full rounded-full bg-[#d8bc82] px-5 py-3 text-sm text-[#211712]">Pay securely</button></div>
        <div className="mt-6 flex items-center gap-2 text-sm text-white/70"><ShieldCheck className="h-4 w-4" />Secure payment badges and estimated delivery included.</div>
      </aside>
    </section>
  );
}

function ThankYouPreview() {
  return (
    <section className="grid gap-6 px-6 py-12 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Order confirmed</p>
        <h2 className="mt-2 font-serif text-5xl font-semibold">Thank you, Aina.</h2>
        <p className="mt-4 max-w-xl leading-8 text-[#6e5b4c]">
          Your Maison Noor order has been received. We sent the receipt and tracking link to your email.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {['Order #MN1024', 'Paid securely', 'Delivery 2-4 days'].map((item) => (
            <div key={item} className="rounded-3xl bg-[#fbf7f0] p-4 text-sm font-medium text-[#5f4b3e]">{item}</div>
          ))}
        </div>
      </div>
      <aside className="h-fit rounded-3xl bg-[#211712] p-6 text-white shadow-xl">
        <p className="font-serif text-3xl font-semibold">Order Summary</p>
        <div className="mt-6 space-y-3 text-sm text-white/75">
          <p>Noor Silk Abaya - MYR 289</p>
          <p>Shipping - MYR 8</p>
          <p>Total - MYR 297</p>
        </div>
        <button className="mt-6 w-full rounded-full bg-[#d8bc82] px-5 py-3 text-sm text-[#211712]">Track order</button>
      </aside>
    </section>
  );
}

function AccountPreview() {
  const modules = ['Login / Register', 'Order Tracking', 'Reward Points', 'Wishlist', 'Order History', 'Saved Addresses', 'Reorder Button', 'Profile Settings'];
  return (
    <section className="px-6 py-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9c7b52]">Customer account</p>
        <h2 className="mt-2 font-serif text-4xl font-semibold">Private Wardrobe</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{modules.map((module) => <div key={module} className="rounded-3xl bg-[#fbf7f0] p-4"><p className="text-sm font-medium">{module}</p><p className="mt-2 text-xs leading-5 text-[#6e5b4c]">Luxury account module placeholder for this template.</p></div>)}</div>
      </div>
    </section>
  );
}

function IconButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="rounded-full bg-white/70 p-2 transition-colors hover:bg-white" aria-label={label} title={label}>{icon}</button>;
}
