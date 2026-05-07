import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { ChevronDown, Clock3, Heart, Minus, Plus, Search, ShieldCheck, ShoppingBag, Star, User, X } from 'lucide-react';
import { softFeminineTemplate } from './softFeminineTemplate';
import type { LuxuryPreviewMode } from './LuxuryMuslimahTemplatePreview';
import { normalizePreviewMode, getPreviewModeFromAction } from './LuxuryMuslimahTemplatePreview';
import type { LuxuryTemplateProduct } from './luxuryMuslimahTemplate';
import { normalizeSectionSettings, type ThemeDraftContent } from './themeBuilderModel';

export const softFeminineHeroImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1300&q=80';

const softImages = [
  softFeminineHeroImage,
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
];

export function SoftFeminineTemplatePreview({
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
    <div className={`relative min-h-[780px] overflow-hidden bg-[#fff9f4] text-[#34241f] ${editorPreview ? 'text-[92%]' : ''}`}>
      <SoftHeader
        logoText={draftContent?.logoText ?? softFeminineTemplate.name}
        onGoHome={() => setActiveMode(getPreviewModeFromAction('logo'))}
        onOpenAccount={() => setActiveMode(getPreviewModeFromAction('account'))}
        onOpenCart={() => setCartOpen(true)}
      />
      {activeMode === 'storefront' && (
        <SoftStorefront draftContent={draftContent} editorPreview={editorPreview} focusRefs={focusRefs} onOpenCart={() => setCartOpen(true)} onOpenProduct={() => setActiveMode('product')} />
      )}
      {activeMode === 'product' && <SoftProductPage onOpenCart={() => setCartOpen(true)} onBuyNow={() => setActiveMode('checkout')} />}
      {activeMode === 'cart' && <SoftStorefront draftContent={draftContent} editorPreview={editorPreview} focusRefs={focusRefs} onOpenCart={() => setCartOpen(true)} onOpenProduct={() => setActiveMode('product')} />}
      {activeMode === 'checkout' && <SoftCheckout />}
      {activeMode === 'thankYou' && <SoftThankYou />}
      {activeMode === 'account' && <SoftAccount />}
      {cartOpen && <SoftCartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function SoftHeader({ logoText, onGoHome, onOpenAccount, onOpenCart }: { logoText: string; onGoHome: () => void; onOpenAccount: () => void; onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#ead8ce] bg-[#fff9f4]/88 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-5">
        <nav className="hidden items-center gap-5 text-sm text-[#765f55] lg:flex">
          <span className="inline-flex items-center gap-1">Collections <ChevronDown className="h-3.5 w-3.5" /></span>
          <span>New Rituals</span>
          <span>Beauty</span>
        </nav>
        <button onClick={onGoHome} className="text-center">
          <p className="font-serif text-2xl font-semibold text-[#3b2821]">{logoText}</p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#bc8f7f]">Soft Luxe Studio</p>
        </button>
        <div className="flex items-center gap-2 text-[#765f55]">
          <button className="hidden rounded-full bg-white px-4 py-2 text-sm shadow-sm lg:block">Search</button>
          <IconButton label="Search" icon={<Search className="h-4 w-4" />} />
          <IconButton label="Wishlist" icon={<Heart className="h-4 w-4" />} />
          <a href={`#/frontend/account-login/${softFeminineTemplate.id}`} className="rounded-full bg-white p-2 shadow-sm transition-transform hover:-translate-y-0.5" aria-label="Account" title="Account">
            <User className="h-4 w-4" />
          </a>
          <button onClick={onOpenCart} className="relative rounded-full bg-white p-2 shadow-sm" aria-label="Cart">
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#c48d7b] text-[10px] text-white">2</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function SoftStorefront({
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
  const sectionSettings = normalizeSectionSettings(draftContent?.sections);
  const sectionStyle = (key: string) => {
    const index = sectionSettings.findIndex((section) => section.key === key);
    const setting = sectionSettings[index];
    return { order: index < 0 ? 0 : index, display: setting?.visible === false ? 'none' : undefined };
  };

  return (
    <div className="flex flex-col">
      <section ref={focusRefs.homepage} style={sectionStyle('hero')} className={`grid items-center gap-8 bg-gradient-to-br from-[#fff9f4] via-[#f8e8df] to-[#efe0d6] px-6 ${editorPreview ? 'min-h-[520px] py-10' : 'min-h-[640px] py-16'} lg:grid-cols-[0.95fr_1.05fr]`}>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#bc8f7f]">{draftContent?.announcementText ?? 'Soft Muse capsule now open'}</p>
          <h2 className={`mt-5 font-serif font-semibold leading-[1.02] text-[#3b2821] ${editorPreview ? 'text-5xl' : 'text-6xl'}`}>{draftContent?.heroHeading ?? 'Soft Feminine Luxury'}</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#765f55]">
            {draftContent?.heroSubtitle ?? 'A warm, emotional storefront for fashion, beauty, fragrance, and everyday feminine rituals.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-[#3b2821] px-6 py-3 text-sm text-white shadow-lg shadow-[#cda99a]/30">Shop The Mood</button>
            <button className="rounded-full border border-[#cda99a] bg-white/70 px-6 py-3 text-sm text-[#3b2821]">Explore Sets</button>
          </div>
        </div>
        <div className="relative min-h-[440px]">
          <PreviewImage className="h-[440px] w-full rounded-[36px] object-cover shadow-2xl shadow-[#d6b4a7]/35" src={softFeminineHeroImage} fallbackSrc={softImages[1]} alt="Soft feminine lifestyle" />
          <div className="absolute -bottom-5 left-7 w-64 rounded-[28px] bg-white/88 p-4 shadow-2xl backdrop-blur">
            <PreviewImage className="aspect-[4/3] w-full rounded-3xl object-cover" src={softFeminineTemplate.bestSellers[0].image} fallbackSrc={softFeminineHeroImage} alt="Nude Satin Shawl" />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Nude Satin Shawl</p>
                <p className="text-xs text-[#8c7467]">MYR 79</p>
              </div>
              <button onClick={onOpenCart} className="rounded-full bg-[#c48d7b] px-3 py-1.5 text-xs text-white">Add</button>
            </div>
          </div>
        </div>
      </section>
      <div style={sectionStyle('collections')}><SoftCategories sectionRef={focusRefs.collections} collections={draftContent?.collections ?? softFeminineTemplate.collections} /></div>
      <div style={sectionStyle('bestSellers')}><SoftProductRail title="Best Seller Rituals" products={softFeminineTemplate.bestSellers} onOpenCart={onOpenCart} onOpenProduct={onOpenProduct} /></div>
      <div style={sectionStyle('bestSellers')}><LimitedCollection /></div>
      <div style={sectionStyle('reviews')}><SoftReviews /></div>
      <div style={sectionStyle('reviews')}><InspirationCollage /></div>
      <div style={sectionStyle('newsletter')}><SoftNewsletter sectionRef={focusRefs.footer} /></div>
    </div>
  );
}

function SoftCategories({ sectionRef, collections }: { sectionRef: MutableRefObject<HTMLElement | null>; collections: string[] }) {
  return (
    <section ref={sectionRef} className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Shop by category</p>
      <h3 className="mt-2 font-serif text-4xl font-semibold">Soft departments</h3>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((item, index) => (
          <div key={item} className="rounded-[28px] bg-white p-3 shadow-sm">
            <PreviewImage className="aspect-[4/3] w-full rounded-[22px] object-cover" src={softImages[index % softImages.length]} fallbackSrc={softFeminineHeroImage} alt={item} />
            <p className="px-2 py-4 font-serif text-2xl font-semibold">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SoftProductRail({ title, products, onOpenCart, onOpenProduct }: { title: string; products: LuxuryTemplateProduct[]; onOpenCart: () => void; onOpenProduct?: () => void }) {
  return (
    <section className="px-6 py-14">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Customer favourites</p>
          <h3 className="mt-2 font-serif text-4xl font-semibold">{title}</h3>
        </div>
        {onOpenProduct && <button onClick={onOpenProduct} className="rounded-full border border-[#cda99a] bg-white px-4 py-2 text-sm">Open product</button>}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {products.map((product) => <SoftProductCard key={product.name} product={product} onOpenCart={onOpenCart} />)}
      </div>
    </section>
  );
}

function SoftProductCard({ product, onOpenCart }: { product: LuxuryTemplateProduct; onOpenCart: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[28px] bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <PreviewImage className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" src={product.image} fallbackSrc={softFeminineHeroImage} alt={product.name} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs text-[#765f55]">{product.badge}</span>}
        <button onClick={onOpenCart} className="absolute bottom-4 left-4 right-4 translate-y-4 rounded-full bg-[#3b2821] px-4 py-3 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">Quick add</button>
      </div>
      <div className="p-4">
        <div className="flex gap-1 text-[#c48d7b]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}</div>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#bc8f7f]">{product.category}</p>
        <p className="mt-1 font-medium">{product.name}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[#765f55]">{product.price}</p>
          <div className="flex gap-1">{product.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div>
        </div>
      </div>
    </article>
  );
}

function LimitedCollection() {
  return (
    <section className="grid gap-6 bg-[#f2ded4] px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[32px] bg-white/70 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#bc8f7f]">Limited launch</p>
        <h3 className="mt-4 font-serif text-5xl font-semibold">The Blush Edit closes soon.</h3>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {['02', '14', '38', '09'].map((time, index) => <div key={index} className="rounded-2xl bg-white p-3 text-center"><p className="text-xl font-semibold">{time}</p><p className="text-[10px] text-[#8c7467]">LEFT</p></div>)}
        </div>
      </div>
      <PreviewImage className="h-full min-h-[320px] rounded-[32px] object-cover" src={softImages[1]} fallbackSrc={softFeminineHeroImage} alt="Limited collection" />
    </section>
  );
}

function SoftReviews() {
  return (
    <section className="px-6 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Real customer glow</p>
      <h3 className="mt-2 font-serif text-4xl font-semibold">Transformations and reviews</h3>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {['Before after styling', 'TikTok try-on review', 'Skincare ritual story'].map((item, index) => (
          <div key={item} className="rounded-[28px] bg-white p-4 shadow-sm">
            <div className="aspect-[9/13] rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${softImages[index + 2]})` }} />
            <p className="mt-4 font-medium">{item}</p>
            <p className="mt-2 text-sm leading-6 text-[#765f55]">Soft, premium, and feminine enough to make the whole order feel special.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InspirationCollage() {
  return (
    <section className="grid gap-4 px-6 py-14 lg:grid-cols-[1fr_0.8fr_1fr]">
      <PreviewImage className="h-full min-h-[360px] rounded-[32px] object-cover" src={softImages[0]} fallbackSrc={softImages[1]} alt="Fashion inspiration" />
      <div className="rounded-[32px] bg-[#3b2821] p-8 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-[#e7c2b6]">Outfit story</p>
        <h3 className="mt-4 font-serif text-4xl font-semibold">Warm looks for slow luxury days.</h3>
        <p className="mt-5 leading-8 text-white/70">Editorial image collage, outfit combinations, and lifestyle storytelling for emotional commerce.</p>
      </div>
      <PreviewImage className="h-full min-h-[360px] rounded-[32px] object-cover" src={softImages[5]} fallbackSrc={softFeminineHeroImage} alt="Accessories inspiration" />
    </section>
  );
}

function SoftNewsletter({ sectionRef }: { sectionRef: MutableRefObject<HTMLElement | null> }) {
  return (
    <section ref={sectionRef} className="bg-[#fff0e9] px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Private muse list</p>
      <h3 className="mx-auto mt-2 max-w-2xl font-serif text-5xl font-semibold">Receive soft launches first.</h3>
      <div className="mx-auto mt-7 flex max-w-xl flex-col gap-3 rounded-full bg-white p-2 shadow-sm sm:flex-row">
        <input className="min-w-0 flex-1 rounded-full px-5 py-3 text-sm outline-none" placeholder="Email address" />
        <button className="rounded-full bg-[#3b2821] px-6 py-3 text-sm text-white">Join now</button>
      </div>
    </section>
  );
}

function SoftProductPage({ onOpenCart, onBuyNow }: { onOpenCart: () => void; onBuyNow: () => void }) {
  const product = softFeminineTemplate.bestSellers[0];
  return (
    <section className="grid gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {[product.image, softImages[1], softImages[2], softImages[3]].map((image) => <PreviewImage key={image} className="aspect-[4/5] rounded-[30px] object-cover" src={image} fallbackSrc={softFeminineHeroImage} alt={product.name} />)}
      </div>
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">{product.category}</p>
        <h2 className="mt-3 font-serif text-5xl font-semibold">{product.name}</h2>
        <p className="mt-3 text-xl text-[#765f55]">{product.price}</p>
        <p className="mt-5 leading-8 text-[#765f55]">Soft satin drape, premium finish, and everyday elegance for emotional luxury styling.</p>
        <OptionRow title="Shade" values={['Blush', 'Nude', 'Taupe']} />
        <OptionRow title="Size" values={['XS', 'S', 'M', 'L', 'XL']} />
        <div className="mt-5 divide-y divide-[#ead8ce] rounded-[28px] bg-white p-4 text-sm leading-7 shadow-sm">
          {['Fabric and care', 'Shipping estimate', 'Reviews and fit notes'].map((item) => <p key={item} className="py-2">{item}</p>)}
        </div>
        <div className="sticky bottom-4 mt-6 grid gap-3 rounded-[28px] bg-white/90 p-3 shadow-xl backdrop-blur sm:grid-cols-2">
          <button onClick={onOpenCart} className="rounded-full bg-[#3b2821] px-5 py-3 text-sm text-white">Add to cart</button>
          <button onClick={onBuyNow} className="rounded-full border border-[#cda99a] px-5 py-3 text-sm">Buy now</button>
        </div>
      </div>
    </section>
  );
}

function OptionRow({ title, values }: { title: string; values: string[] }) {
  return <div className="mt-6"><p className="text-sm font-medium">{title}</p><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <button key={value} className="rounded-full border border-[#cda99a] bg-white px-4 py-2 text-sm">{value}</button>)}</div></div>;
}

function SoftCartDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 bg-[#3b2821]/30">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#fff9f4] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ead8ce] p-5">
          <p className="font-serif text-2xl font-semibold">Mini Cart</p>
          <button onClick={onClose} className="rounded-full bg-white p-2" aria-label="Close cart"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-[28px] bg-white p-4 shadow-sm"><p className="text-sm font-medium">Free gift progress</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2ded4]"><div className="h-full w-3/4 rounded-full bg-[#c48d7b]" /></div><p className="mt-2 text-xs text-[#765f55]">MYR 40 away from a free mini perfume.</p></div>
          <div className="flex gap-4 rounded-[28px] bg-white p-4 shadow-sm"><PreviewImage className="h-24 w-20 rounded-2xl object-cover" src={softFeminineTemplate.bestSellers[0].image} fallbackSrc={softFeminineHeroImage} alt="Cart item" /><div className="min-w-0 flex-1"><p className="font-medium">Nude Satin Shawl</p><p className="mt-1 text-sm text-[#765f55]">Blush / M</p><div className="mt-3 flex w-fit items-center gap-3 rounded-full bg-[#fff0e9] px-3 py-1"><Minus className="h-3.5 w-3.5" /><span className="text-sm">1</span><Plus className="h-3.5 w-3.5" /></div></div><p className="text-sm">MYR 79</p></div>
          <div className="rounded-[28px] bg-white p-4 shadow-sm"><p className="text-sm font-medium">Add-on bump</p><p className="mt-2 text-sm text-[#765f55]">Add Blush Ritual Lipmatte for MYR 39 only.</p></div>
          <div className="rounded-[28px] bg-white p-4 shadow-sm"><p className="text-sm font-medium">Bundle savings</p><p className="mt-2 text-sm text-[#765f55]">Shawl + Lipmatte + Perfume save 15%.</p></div>
        </div>
        <div className="border-t border-[#ead8ce] p-5"><button className="w-full rounded-full bg-[#3b2821] px-5 py-3 text-sm text-white">Checkout Securely</button></div>
      </aside>
    </div>
  );
}

function SoftCheckout() {
  return (
    <section className="bg-[#fffdf9] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-serif text-5xl font-semibold">Checkout</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <CheckoutGroup title="Contact Information" fields={['Email address', 'Phone number']} />
            <CheckoutGroup title="Shipping Address" fields={['Full name', 'Address line', 'City', 'State / Province', 'Postcode']} />
            <div className="rounded-[2px] border border-[#e8ded7] bg-white p-5">
              <p className="font-medium">Shipping Method</p>
              {['Standard Delivery', 'Express Delivery'].map((method, index) => (
                <label key={method} className="mt-4 flex items-center justify-between rounded-[2px] border border-[#e8ded7] p-4 text-sm">
                  <span><input type="radio" name="shipping" defaultChecked={index === 0} className="mr-3" />{method}</span>
                  <span>MYR {index === 0 ? '8.00' : '15.00'}</span>
                </label>
              ))}
            </div>
            <div className="rounded-[2px] border border-[#e8ded7] bg-white p-5">
              <p className="font-medium">Payment Method</p>
              {['Credit / Debit Card', 'Online Banking', 'Cash on Delivery'].map((method, index) => (
                <label key={method} className="mt-4 block rounded-[2px] border border-[#e8ded7] p-4 text-sm">
                  <input type="radio" name="payment" defaultChecked={index === 0} className="mr-3" />{method}
                  {index === 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="rounded-[2px] border border-[#e8ded7] px-3 py-2" placeholder="Card number" /><input className="rounded-[2px] border border-[#e8ded7] px-3 py-2" placeholder="Expiry / CVC" /></div>}
                </label>
              ))}
            </div>
          </div>
          <aside className="h-fit bg-[#f7f4ef] p-6">
            <p className="font-medium">Order Summary</p>
            {[softFeminineTemplate.bestSellers[0], softFeminineTemplate.bestSellers[1]].map((item) => (
              <div key={item.name} className="mt-5 flex gap-3">
                <PreviewImage className="h-20 w-16 object-cover" src={item.image} fallbackSrc={softFeminineHeroImage} alt={item.name} />
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-[#765f55]">{item.price}</p></div>
              </div>
            ))}
            <div className="mt-6 flex gap-2"><input className="min-w-0 flex-1 border border-[#e0d8d0] bg-white px-3 py-2 text-sm" placeholder="Coupon code" /><button className="bg-[#e7d4c8] px-4 text-sm">Apply</button></div>
            <div className="mt-6 space-y-3 border-t border-[#ded4cc] pt-5 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>MYR 328.00</span></p><p className="flex justify-between"><span>Shipping</span><span>MYR 8.00</span></p><p className="flex justify-between text-lg font-semibold"><span>Total</span><span>MYR 336.00</span></p></div>
            <button className="mt-6 w-full bg-[#5b514b] px-5 py-4 text-sm uppercase tracking-[0.18em] text-white">Complete Order</button>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#765f55]"><ShieldCheck className="h-4 w-4" />Secure payment and buyer protection</div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CheckoutGroup({ title, fields }: { title: string; fields: string[] }) {
  return <div><div className="flex items-center justify-between"><p className="font-medium">{title}</p><a href={`#/frontend/account-login/${softFeminineTemplate.id}`} className="text-xs text-[#8c7467] underline">Already have account? Login</a></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map((field) => <input key={field} className="rounded-[2px] border border-[#e8ded7] bg-white px-4 py-3 text-sm outline-none" placeholder={field} />)}</div></div>;
}

function SoftThankYou() {
  return (
    <section className="px-6 py-12">
      <div className="rounded-[32px] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Order confirmed</p>
        <h2 className="mt-2 font-serif text-5xl font-semibold">Thank you, Sofia.</h2>
        <p className="mt-4 max-w-xl leading-8 text-[#765f55]">Your soft luxury order is confirmed. Tracking and rewards points have been added to your account.</p>
      </div>
    </section>
  );
}

function SoftAccount() {
  const modules = ['Dashboard Overview', 'Track Order', 'Loyalty Points', 'Wishlist', 'Return Requests', 'Saved Cards', 'Purchase History'];
  return (
    <section className="px-6 py-12">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[#bc8f7f]">Customer account</p>
        <h2 className="mt-2 font-serif text-4xl font-semibold">Muse Dashboard</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{modules.map((module) => <div key={module} className="rounded-[24px] bg-[#fff0e9] p-4"><p className="text-sm font-medium">{module}</p><p className="mt-2 text-xs leading-5 text-[#765f55]">Premium account module placeholder.</p></div>)}</div>
      </div>
    </section>
  );
}

function IconButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="rounded-full bg-white p-2 shadow-sm transition-transform hover:-translate-y-0.5" aria-label={label} title={label}>{icon}</button>;
}

function PreviewImage({ src, fallbackSrc, alt, className }: { src: string; fallbackSrc: string; alt: string; className: string }) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return <img className={className} src={imageSrc} alt={alt} onError={() => setImageSrc(fallbackSrc)} />;
}
