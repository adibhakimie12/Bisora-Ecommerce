import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { ChevronDown, Clock3, Heart, Minus, Plus, Search, ShieldCheck, ShoppingBag, Star, Truck, User, X } from 'lucide-react';
import { modernConversionTemplate } from './modernConversionTemplate';
import type { LuxuryPreviewMode } from './LuxuryMuslimahTemplatePreview';
import { getPreviewModeFromAction, normalizePreviewMode } from './LuxuryMuslimahTemplatePreview';
import type { LuxuryTemplateProduct } from './luxuryMuslimahTemplate';
import type { ThemeDraftContent } from './themeBuilderModel';

export const modernConversionHeroImage = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80';

const modernImages = [
  modernConversionHeroImage,
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
];

export function ModernConversionTemplatePreview({
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
    if (activeMode !== 'storefront') return;
    const target = focusSection === 'collections' ? focusRefs.collections.current : focusSection === 'footer' ? focusRefs.footer.current : focusRefs.homepage.current;
    window.setTimeout(() => target?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  }, [activeMode, focusSection]);

  return (
    <div className={`relative min-h-[780px] overflow-hidden bg-[#fffaf3] text-[#201712] ${editorPreview ? 'text-[92%]' : ''}`}>
      <MomentumHeader
        logoText={draftContent?.logoText ?? modernConversionTemplate.name}
        announcementText={draftContent?.announcementText ?? 'Flash capsule live - free shipping above MYR 180'}
        onGoHome={() => setActiveMode(getPreviewModeFromAction('logo'))}
        onOpenCart={() => setCartOpen(true)}
      />
      {activeMode === 'storefront' && (
        <MomentumStorefront draftContent={draftContent} editorPreview={editorPreview} focusRefs={focusRefs} onOpenCart={() => setCartOpen(true)} onOpenProduct={() => setActiveMode('product')} />
      )}
      {activeMode === 'product' && <MomentumProductPage onOpenCart={() => setCartOpen(true)} onBuyNow={() => setActiveMode('checkout')} />}
      {activeMode === 'cart' && <MomentumStorefront draftContent={draftContent} editorPreview={editorPreview} focusRefs={focusRefs} onOpenCart={() => setCartOpen(true)} onOpenProduct={() => setActiveMode('product')} />}
      {activeMode === 'checkout' && <MomentumCheckout />}
      {activeMode === 'thankYou' && <MomentumThankYou />}
      {activeMode === 'account' && <MomentumAccount />}
      {cartOpen && <MomentumCartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function MomentumHeader({ logoText, announcementText, onGoHome, onOpenCart }: { logoText: string; announcementText: string; onGoHome: () => void; onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-[#fffaf3]/90 backdrop-blur-xl">
      <div className="bg-[#201712] px-5 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-[#f5e4c8]">{announcementText}</div>
      <div className="flex items-center justify-between gap-5 px-5 py-4">
        <nav className="hidden items-center gap-5 text-sm text-[#6c5a4b] lg:flex">
          <span className="inline-flex items-center gap-1">Shop <ChevronDown className="h-3.5 w-3.5" /></span>
          <span>Flash Sale</span>
          <span>Reviews</span>
        </nav>
        <button onClick={onGoHome} className="text-center">
          <p className="font-serif text-2xl font-bold text-[#201712]">{logoText}</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b18a57]">Conversion Luxe</p>
        </button>
        <div className="flex items-center gap-2 text-[#55463b]">
          <IconButton label="Search" icon={<Search className="h-4 w-4" />} />
          <IconButton label="Wishlist" icon={<Heart className="h-4 w-4" />} />
          <a href={`#/frontend/account-login/${modernConversionTemplate.id}`} className="rounded-full bg-white p-2 shadow-sm transition-transform hover:-translate-y-0.5" aria-label="Account" title="Account">
            <User className="h-4 w-4" />
          </a>
          <button onClick={onOpenCart} className="relative rounded-full bg-[#201712] p-2 text-white shadow-lg" aria-label="Cart">
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#c5a067] text-[10px] text-white">3</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MomentumStorefront({
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
      <section ref={focusRefs.homepage} className={`relative grid items-center overflow-hidden px-6 ${editorPreview ? 'min-h-[540px] py-10' : 'min-h-[720px] py-16'} lg:grid-cols-[0.9fr_1.1fr]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ead7b8,transparent_34%),linear-gradient(120deg,#fffaf3_0%,#f4eadc_46%,#fff8ee_100%)]" />
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.34em] text-[#b18a57]">Modern Muslimah Power Store</p>
          <h2 className={`${editorPreview ? 'text-5xl' : 'text-7xl'} mt-5 font-serif font-bold leading-[0.98] text-[#201712]`}>
            {draftContent?.heroHeading ?? 'Premium Commerce That Converts'}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#6c5a4b]">
            {draftContent?.heroSubtitle ?? 'Minimal luxury storefront architecture for fashion, beauty, perfume, cosmetics, and lifestyle brands ready to sell fast.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onOpenCart} className="rounded-full bg-[#201712] px-7 py-3 text-sm text-white shadow-xl shadow-[#201712]/20">Shop Best Sellers</button>
            <button onClick={onOpenProduct} className="rounded-full border border-[#ccb38d] bg-white/80 px-7 py-3 text-sm text-[#201712]">View Product</button>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-xs text-[#6c5a4b]">
            <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Secure pay" />
            <TrustPill icon={<Truck className="h-4 w-4" />} label="Fast delivery" />
            <TrustPill icon={<Star className="h-4 w-4" />} label="4.9 reviews" />
          </div>
        </div>
        <div className="relative z-10 mt-8 min-h-[480px] lg:mt-0">
          <img className="h-[500px] w-full rounded-[30px] object-cover shadow-2xl shadow-[#d7c3a5]/40" src={modernConversionHeroImage} alt="Modern luxury Muslimah hero" />
          <div className="absolute -bottom-4 left-5 right-5 rounded-[28px] bg-white/92 p-4 shadow-2xl backdrop-blur md:left-auto md:w-80">
            <div className="flex gap-4">
              <img className="h-28 w-24 rounded-2xl object-cover" src={modernConversionTemplate.bestSellers[0].image} alt="Momentum Satin Shawl" />
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-[#f0dfc2] px-2 py-1 text-[10px] font-semibold text-[#7c5b2e]">Only 12 left</span>
                <p className="mt-3 font-medium">Momentum Satin Shawl</p>
                <p className="mt-1 text-sm text-[#6c5a4b]">MYR 79</p>
                <button onClick={onOpenCart} className="mt-3 rounded-full bg-[#201712] px-4 py-2 text-xs text-white">Add now</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <MomentumCollections sectionRef={focusRefs.collections} collections={draftContent?.collections ?? modernConversionTemplate.collections} />
      <ProductGrid title="Best sellers engineered to sell" products={modernConversionTemplate.bestSellers} onOpenCart={onOpenCart} onOpenProduct={onOpenProduct} />
      <FlashSale onOpenCart={onOpenCart} />
      <SocialProof />
      <ShowcaseSlider />
      <BrandTrust />
      <FaqNewsletter sectionRef={focusRefs.footer} />
    </>
  );
}

function MomentumCollections({ sectionRef, collections }: { sectionRef: MutableRefObject<HTMLElement | null>; collections: string[] }) {
  return (
    <section ref={sectionRef} className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Trending collections</p>
      <h3 className="mt-2 font-serif text-4xl font-bold">Dynamic departments</h3>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((item, index) => (
          <article key={item} className="group overflow-hidden rounded-[24px] bg-white shadow-sm">
            <div className="relative">
              <img className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" src={modernImages[index % modernImages.length]} alt={item} />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs text-[#201712]">Shop now</span>
            </div>
            <p className="p-5 font-serif text-2xl font-bold">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductGrid({ title, products, onOpenCart, onOpenProduct }: { title: string; products: LuxuryTemplateProduct[]; onOpenCart: () => void; onOpenProduct?: () => void }) {
  return (
    <section className="px-6 py-14">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Quick view enabled</p>
          <h3 className="mt-2 font-serif text-4xl font-bold">{title}</h3>
        </div>
        {onOpenProduct && <button onClick={onOpenProduct} className="rounded-full border border-[#ccb38d] bg-white px-4 py-2 text-sm">Open product page</button>}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {products.map((product) => <MomentumProductCard key={product.name} product={product} onOpenCart={onOpenCart} />)}
      </div>
    </section>
  );
}

function MomentumProductCard({ product, onOpenCart }: { product: LuxuryTemplateProduct; onOpenCart: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[24px] bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <img className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" src={product.image} alt={product.name} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#201712] px-3 py-1 text-xs text-white">{product.badge}</span>}
        <button onClick={onOpenCart} className="absolute bottom-4 left-4 right-4 translate-y-4 rounded-full bg-[#201712] px-4 py-3 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">Quick add</button>
      </div>
      <div className="p-4">
        <div className="flex gap-1 text-[#c5a067]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}</div>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#b18a57]">{product.category}</p>
        <p className="mt-1 font-medium">{product.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[#6c5a4b]">{product.price}</p>
          <div className="flex gap-1">{product.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div>
        </div>
      </div>
    </article>
  );
}

function FlashSale({ onOpenCart }: { onOpenCart: () => void }) {
  return (
    <section className="grid gap-6 bg-[#201712] px-6 py-16 text-white lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#d7b875]">Flash sale</p>
        <h3 className="mt-4 font-serif text-5xl font-bold">Urgency without looking cheap.</h3>
        <p className="mt-5 max-w-xl leading-8 text-white/70">Countdown, stock urgency, bestseller tags, and bundle prompts are built into the premium store flow.</p>
        <div className="mt-7 grid max-w-md grid-cols-4 gap-2">
          {['01', '08', '42', '16'].map((time, index) => <div key={index} className="rounded-2xl bg-white/10 p-3 text-center"><p className="text-xl font-semibold">{time}</p><p className="text-[10px] text-white/60">LEFT</p></div>)}
        </div>
      </div>
      <div className="rounded-[28px] bg-white p-4 text-[#201712]">
        <div className="flex gap-4">
          <img className="h-44 w-36 rounded-2xl object-cover" src={modernConversionTemplate.bestSellers[1].image} alt="Flash sale product" />
          <div>
            <span className="rounded-full bg-[#f2dfbd] px-3 py-1 text-xs font-semibold">Bestseller</span>
            <h4 className="mt-4 font-serif text-3xl font-bold">Noir Modest Set</h4>
            <p className="mt-2 text-sm text-[#6c5a4b]">Only 9 units left in popular sizes.</p>
            <button onClick={onOpenCart} className="mt-5 rounded-full bg-[#201712] px-5 py-3 text-sm text-white">Claim offer</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Verified social proof</p>
      <h3 className="mt-2 font-serif text-4xl font-bold">TikTok-style proof that still feels premium</h3>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {['Unboxing review', 'Fit check video', 'Verified beauty ritual'].map((item, index) => (
          <article key={item} className="rounded-[24px] bg-white p-4 shadow-sm">
            <div className="aspect-[9/13] rounded-[22px] bg-cover bg-center" style={{ backgroundImage: `url(${modernImages[index + 2]})` }} />
            <p className="mt-4 font-medium">{item}</p>
            <p className="mt-2 text-sm leading-6 text-[#6c5a4b]">"Premium feel, fast checkout, and the whole order felt trustworthy."</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ShowcaseSlider() {
  return (
    <section className="overflow-hidden bg-[#f2eadc] px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Luxury showcase slider</p>
      <h3 className="mt-2 font-serif text-4xl font-bold">Build desire before checkout</h3>
      <div className="mt-7 flex gap-4 overflow-x-auto pb-3">
        {modernConversionTemplate.trending.map((product) => (
          <article key={product.name} className="min-w-[260px] rounded-[24px] bg-white p-3 shadow-sm">
            <img className="aspect-[4/5] rounded-[20px] object-cover" src={product.image} alt={product.name} />
            <p className="mt-3 font-medium">{product.name}</p>
            <p className="text-sm text-[#6c5a4b]">{product.price}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BrandTrust() {
  return (
    <section className="grid gap-4 px-6 py-14 md:grid-cols-4">
      {[
        ['Secure Payment', 'Payment badges and buyer confidence.'],
        ['Fast Delivery', 'Delivery promise and tracking ready.'],
        ['Return Guarantee', 'Clear return assurance.'],
        ['Customer Support', 'WhatsApp and email support slot.'],
      ].map(([title, text]) => (
        <div key={title} className="rounded-[24px] border border-[#eadfce] bg-white p-5">
          <ShieldCheck className="h-5 w-5 text-[#b18a57]" />
          <p className="mt-4 font-medium">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[#6c5a4b]">{text}</p>
        </div>
      ))}
    </section>
  );
}

function FaqNewsletter({ sectionRef }: { sectionRef: MutableRefObject<HTMLElement | null> }) {
  return (
    <section ref={sectionRef} className="grid gap-6 bg-[#fff5e8] px-6 py-16 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">FAQ</p>
        <h3 className="mt-2 font-serif text-4xl font-bold">Answers before buyer hesitates</h3>
        {['How fast is delivery?', 'Can I return sizing issues?', 'Which payment methods are secure?'].map((faq) => <p key={faq} className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm">{faq}</p>)}
      </div>
      <div className="rounded-[28px] bg-[#201712] p-8 text-white">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d7b875]">Newsletter</p>
        <h3 className="mt-3 font-serif text-4xl font-bold">Join the private launch list.</h3>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input className="min-w-0 flex-1 rounded-full px-5 py-3 text-sm text-[#201712] outline-none" placeholder="Email address" />
          <button className="rounded-full bg-[#d7b875] px-6 py-3 text-sm text-[#201712]">Join</button>
        </div>
      </div>
    </section>
  );
}

function MomentumProductPage({ onOpenCart, onBuyNow }: { onOpenCart: () => void; onBuyNow: () => void }) {
  const product = modernConversionTemplate.bestSellers[0];
  return (
    <section className="grid gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {[product.image, modernImages[0], modernImages[3], modernImages[4]].map((image) => <img key={image} className="aspect-[4/5] rounded-[24px] object-cover" src={image} alt={product.name} />)}
      </div>
      <div className="lg:sticky lg:top-28 lg:h-fit">
        <span className="rounded-full bg-[#f0dfc2] px-3 py-1 text-xs font-semibold text-[#7c5b2e]">Delivery estimate: 2-4 days</span>
        <h2 className="mt-4 font-serif text-5xl font-bold">{product.name}</h2>
        <p className="mt-3 text-xl text-[#6c5a4b]">{product.price}</p>
        <p className="mt-5 leading-8 text-[#6c5a4b]">Premium satin, clean drape, lightweight feel, and conversion-ready recommendations below the fold.</p>
        <OptionRow title="Color" values={['Ivory', 'Nude', 'Black']} />
        <OptionRow title="Size" values={['XS', 'S', 'M', 'L', 'XL']} />
        <div className="mt-5 divide-y divide-[#eadfce] rounded-[24px] bg-white p-4 text-sm leading-7 shadow-sm">
          {['Size guide popup', 'Fabric and care', 'Reviews', 'Smart recommendations'].map((item) => <p key={item} className="py-2">{item}</p>)}
        </div>
        <div className="sticky bottom-4 mt-6 grid gap-3 rounded-[24px] bg-white/92 p-3 shadow-xl backdrop-blur sm:grid-cols-2">
          <button onClick={onOpenCart} className="rounded-full bg-[#201712] px-5 py-3 text-sm text-white">Add to cart</button>
          <button onClick={onBuyNow} className="rounded-full border border-[#ccb38d] px-5 py-3 text-sm">Buy now</button>
        </div>
      </div>
    </section>
  );
}

function MomentumCartDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 bg-[#201712]/40">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#fffaf3] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eadfce] p-5">
          <p className="font-serif text-2xl font-bold">Cart Upgrade</p>
          <button onClick={onClose} className="rounded-full bg-white p-2" aria-label="Close cart"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-[24px] bg-white p-4 shadow-sm"><p className="text-sm font-medium">Free shipping progress</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee2d0]"><div className="h-full w-4/5 rounded-full bg-[#201712]" /></div><p className="mt-2 text-xs text-[#6c5a4b]">MYR 22 away from free shipping.</p></div>
          <div className="flex gap-4 rounded-[24px] bg-white p-4 shadow-sm"><img className="h-24 w-20 rounded-2xl object-cover" src={modernConversionTemplate.bestSellers[0].image} alt="Cart item" /><div className="min-w-0 flex-1"><p className="font-medium">Momentum Satin Shawl</p><p className="mt-1 text-sm text-[#6c5a4b]">Nude / M</p><div className="mt-3 flex w-fit items-center gap-3 rounded-full bg-[#f4eadc] px-3 py-1"><Minus className="h-3.5 w-3.5" /><span className="text-sm">1</span><Plus className="h-3.5 w-3.5" /></div></div><p className="text-sm">MYR 79</p></div>
          {['One time offer: Lip Cream MYR 39', 'Frequently bought together: Perfume + Shawl', 'Cart bump: Premium gift wrap'].map((item) => <div key={item} className="rounded-[24px] bg-white p-4 text-sm shadow-sm">{item}</div>)}
        </div>
        <div className="border-t border-[#eadfce] p-5"><button className="w-full rounded-full bg-[#201712] px-5 py-3 text-sm text-white">Checkout Securely</button></div>
      </aside>
    </div>
  );
}

function MomentumCheckout() {
  return (
    <section className="bg-[#fffdf8] px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Secure checkout</p>
        <h2 className="mt-2 font-serif text-6xl font-bold">Checkout</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <CheckoutGroup title="Contact" fields={['Full name', 'Email', 'Phone']} />
            <CheckoutGroup title="Delivery Address" fields={['Address', 'Postcode', 'State', 'Notes']} />
            <ChoiceBox title="Delivery Options" options={['Standard delivery - MYR 8', 'Express delivery - MYR 15']} />
            <ChoiceBox title="Payment Methods" options={['Online banking', 'Card payment', 'E-wallet']} />
          </div>
          <aside className="h-fit rounded-[2px] bg-[#f4efe7] p-6 lg:sticky lg:top-28">
            <p className="font-medium">Order Summary</p>
            {[modernConversionTemplate.bestSellers[0], modernConversionTemplate.bestSellers[2]].map((item) => (
              <div key={item.name} className="mt-5 flex gap-3">
                <img className="h-20 w-16 object-cover" src={item.image} alt={item.name} />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-[#6c5a4b]">{item.price}</p></div>
              </div>
            ))}
            <div className="mt-6 flex gap-2"><input className="min-w-0 flex-1 border border-[#ddd0bc] bg-white px-3 py-2 text-sm" placeholder="Coupon code" /><button className="bg-[#e5d3b6] px-4 text-sm">Apply</button></div>
            <div className="mt-6 rounded-[2px] bg-white p-4 text-sm leading-6 text-[#6c5a4b]">"Checkout felt clean and secure. I finished my order on mobile in under a minute."</div>
            <div className="mt-6 space-y-3 border-t border-[#ddd0bc] pt-5 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>MYR 228.00</span></p><p className="flex justify-between"><span>Shipping</span><span>MYR 8.00</span></p><p className="flex justify-between text-lg font-semibold"><span>Total</span><span>MYR 236.00</span></p></div>
            <button className="mt-6 w-full bg-[#201712] px-5 py-4 text-sm uppercase tracking-[0.18em] text-white">Complete Order</button>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#6c5a4b]"><ShieldCheck className="h-4 w-4" />Secure checkout badges enabled</div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function MomentumThankYou() {
  return (
    <section className="bg-[#fffaf3] px-5 py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"><ShieldCheck className="h-4 w-4" />Order confirmed</span>
          <h2 className="mt-5 font-serif text-5xl font-bold">Thank you, Aina.</h2>
          <p className="mt-4 max-w-xl leading-8 text-[#6c5a4b]">Your order #LM-2048 is confirmed. We sent the receipt and tracking link to your email.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {['Paid securely', 'Packing today', 'Estimated 2-4 days'].map((step) => <div key={step} className="rounded-2xl bg-[#f4eadc] p-4 text-sm">{step}</div>)}
          </div>
          <button className="mt-7 rounded-full bg-[#201712] px-6 py-3 text-sm text-white">Track order</button>
        </div>
        <aside className="rounded-[28px] bg-[#201712] p-6 text-white">
          <p className="font-medium">Order Summary</p>
          <div className="mt-5 flex gap-3">
            <img className="h-20 w-16 rounded-xl object-cover" src={modernConversionTemplate.bestSellers[0].image} alt="Order item" />
            <div><p className="text-sm">Momentum Satin Shawl</p><p className="text-xs text-white/60">MYR 79</p></div>
          </div>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/75">Reward points added: 236</div>
        </aside>
      </div>
    </section>
  );
}

function MomentumAccount() {
  const modules = ['Dashboard', 'Order Tracking', 'Reward Points', 'Wishlist', 'Saved Addresses', 'Order History', 'Reorder', 'Account Settings'];
  return (
    <section className="px-6 py-12">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#b18a57]">Customer dashboard</p>
        <h2 className="mt-2 font-serif text-4xl font-bold">Momentum Account</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{modules.map((module) => <div key={module} className="rounded-[22px] bg-[#f4eadc] p-4"><p className="text-sm font-medium">{module}</p><p className="mt-2 text-xs leading-5 text-[#6c5a4b]">Buyer-facing account module.</p></div>)}</div>
      </div>
    </section>
  );
}

function OptionRow({ title, values }: { title: string; values: string[] }) {
  return <div className="mt-6"><p className="text-sm font-medium">{title}</p><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} className="rounded-full border border-[#ccb38d] bg-white px-4 py-2 text-sm">{value}</button>)}</div></div>;
}

function CheckoutGroup({ title, fields }: { title: string; fields: string[] }) {
  return <div><div className="flex items-center justify-between"><p className="font-medium">{title}</p><a href={`#/frontend/account-login/${modernConversionTemplate.id}`} className="text-xs text-[#7c5b2e] underline">Already have account? Login</a></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map((field) => <input key={field} className="rounded-[2px] border border-[#e8ddca] bg-white px-4 py-3 text-sm outline-none" placeholder={field} />)}</div></div>;
}

function ChoiceBox({ title, options }: { title: string; options: string[] }) {
  return <div className="rounded-[2px] border border-[#e8ddca] bg-white p-5"><p className="font-medium">{title}</p>{options.map((option, index) => <label key={option} className="mt-4 flex items-center justify-between rounded-[2px] border border-[#e8ddca] p-4 text-sm"><span><input type="radio" name={title} defaultChecked={index === 0} className="mr-3" />{option}</span></label>)}</div>;
}

function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return <span className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">{icon}{label}</span>;
}

function IconButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="rounded-full bg-white p-2 shadow-sm transition-transform hover:-translate-y-0.5" aria-label={label} title={label}>{icon}</button>;
}
