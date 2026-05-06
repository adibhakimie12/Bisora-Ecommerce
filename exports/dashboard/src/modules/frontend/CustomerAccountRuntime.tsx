import { Heart, MapPin, PackageCheck, RotateCcw, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { StorefrontTheme } from '../websiteBuilder/themeCatalog';

export type CustomerAccountSection = 'account-login' | 'account-register' | 'account' | 'account-orders' | 'account-wishlist' | 'account-addresses';

const accountModules = [
  { label: 'Order tracking', value: '3 active', icon: PackageCheck },
  { label: 'Wishlist', value: '12 saved', icon: Heart },
  { label: 'Loyalty points', value: '1,240 pts', icon: Sparkles },
  { label: 'Return requests', value: '1 open', icon: RotateCcw },
];

export function CustomerAccountRuntime({ theme, section }: { theme: StorefrontTheme; section: CustomerAccountSection }) {
  const isSoft = theme.id === 'soft-feminine-luxe';
  const shellClass = isSoft ? 'bg-[#fff9f4] text-[#34241f]' : 'bg-[#fbf7f0] text-[#211712]';
  const accentClass = isSoft ? 'text-[#bc8f7f]' : 'text-[#9c7b52]';
  const buttonClass = isSoft ? 'bg-[#3b2821] text-white' : 'bg-[#211712] text-white';
  const surfaceClass = isSoft ? 'bg-[#fff0e9]' : 'bg-[#eadfce]';
  const loginPath = theme.account.loginPath;
  const registerPath = theme.account.registerPath;
  const dashboardPath = theme.account.dashboardPath;

  return (
    <div className={`min-h-[760px] ${shellClass}`}>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-inherit/90 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <a href={`#/frontend/theme-demo/${theme.id}`} className="text-sm">Shop</a>
          <div className="text-center">
            <p className="font-serif text-2xl font-semibold">{theme.name}</p>
            <p className={`text-[10px] uppercase tracking-[0.28em] ${accentClass}`}>Customer Account</p>
          </div>
          <a href={loginPath} className="rounded-full bg-white/70 px-4 py-2 text-sm shadow-sm">Login</a>
        </div>
      </header>

      {section === 'account-login' && (
        <AuthPanel
          accentClass={accentClass}
          buttonClass={buttonClass}
          mode="login"
          registerPath={registerPath}
          dashboardPath={dashboardPath}
          title={isSoft ? 'Welcome back, muse.' : 'Welcome back to your wardrobe.'}
          subtitle="Login to track orders, save addresses, review wishlist items, and continue checkout faster."
        />
      )}

      {section === 'account-register' && (
        <AuthPanel
          accentClass={accentClass}
          buttonClass={buttonClass}
          mode="register"
          loginPath={loginPath}
          dashboardPath={dashboardPath}
          title={isSoft ? 'Create your muse account.' : 'Create your private account.'}
          subtitle="Register once and keep your purchases, rewards, addresses, and wishlist connected."
        />
      )}

      {section !== 'account-login' && section !== 'account-register' && (
        <main className="px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] ${accentClass}`}>Customer dashboard</p>
                <h1 className="mt-3 font-serif text-5xl font-semibold">{isSoft ? 'Muse Dashboard' : 'Private Wardrobe'}</h1>
                <p className="mt-4 max-w-2xl leading-7 opacity-75">A buyer-facing account area inside the storefront, styled by the published theme.</p>
              </div>
              <nav className="flex flex-wrap gap-2">
                <AccountLink href={dashboardPath} active={section === 'account'} label="Overview" />
                <AccountLink href={`#/frontend/account-orders/${theme.id}`} active={section === 'account-orders'} label="Orders" />
                <AccountLink href={`#/frontend/account-wishlist/${theme.id}`} active={section === 'account-wishlist'} label="Wishlist" />
                <AccountLink href={`#/frontend/account-addresses/${theme.id}`} active={section === 'account-addresses'} label="Addresses" />
              </nav>
            </div>

            {section === 'account' && <AccountOverview surfaceClass={surfaceClass} buttonClass={buttonClass} themeId={theme.id} />}
            {section === 'account-orders' && <OrdersView surfaceClass={surfaceClass} buttonClass={buttonClass} />}
            {section === 'account-wishlist' && <WishlistView surfaceClass={surfaceClass} buttonClass={buttonClass} />}
            {section === 'account-addresses' && <AddressesView surfaceClass={surfaceClass} buttonClass={buttonClass} />}
          </div>
        </main>
      )}
    </div>
  );
}

function AuthPanel({
  accentClass,
  buttonClass,
  mode,
  title,
  subtitle,
  loginPath,
  registerPath,
  dashboardPath,
}: {
  accentClass: string;
  buttonClass: string;
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  loginPath?: string;
  registerPath?: string;
  dashboardPath: string;
}) {
  return (
    <main className="grid min-h-[680px] items-center px-6 py-12 lg:grid-cols-[1fr_440px]">
      <div className="max-w-2xl">
        <p className={`text-xs uppercase tracking-[0.3em] ${accentClass}`}>Buyer account</p>
        <h1 className="mt-4 font-serif text-6xl font-semibold leading-tight">{title}</h1>
        <p className="mt-6 max-w-xl leading-8 opacity-75">{subtitle}</p>
      </div>
      <section className="rounded-[32px] bg-white/88 p-6 shadow-2xl shadow-black/5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-black/5 p-3"><UserRound className="h-5 w-5" /></span>
          <div>
            <p className="font-medium">{mode === 'login' ? 'Login' : 'Register'}</p>
            <p className="text-sm opacity-65">Mock frontstore account flow</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {mode === 'register' && <input className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none" placeholder="Full name" />}
          <input className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none" placeholder="Email address" />
          <input className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none" placeholder="Password" type="password" />
          <a href={dashboardPath} className={`block rounded-full px-5 py-3 text-center text-sm ${buttonClass}`}>{mode === 'login' ? 'Login' : 'Create Account'}</a>
        </div>
        <p className="mt-5 text-center text-sm opacity-70">
          {mode === 'login' ? (
            <>New customer? <a className="underline" href={registerPath}>Create account</a></>
          ) : (
            <>Already registered? <a className="underline" href={loginPath}>Login</a></>
          )}
        </p>
      </section>
    </main>
  );
}

function AccountLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return <a href={href} className={`rounded-full px-4 py-2 text-sm ${active ? 'bg-white text-black shadow-sm' : 'bg-white/50 text-black/65'}`}>{label}</a>;
}

function AccountOverview({ surfaceClass, buttonClass, themeId }: { surfaceClass: string; buttonClass: string; themeId: string }) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-4">
      {accountModules.map((module) => {
        const Icon = module.icon;
        return (
          <div key={module.label} className={`rounded-[28px] ${surfaceClass} p-5`}>
            <Icon className="h-5 w-5" />
            <p className="mt-4 text-sm opacity-70">{module.label}</p>
            <p className="mt-1 text-2xl font-semibold">{module.value}</p>
          </div>
        );
      })}
      <div className="rounded-[28px] bg-white p-5 md:col-span-4">
        <p className="font-medium">Recent order</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm opacity-70">Order #MN1024</p>
            <p className="mt-1 text-xl font-semibold">Preparing for shipment</p>
          </div>
          <a href={`#/frontend/account-orders/${themeId}`} className={`rounded-full px-5 py-3 text-sm ${buttonClass}`}>Track order</a>
        </div>
      </div>
    </div>
  );
}

function OrdersView({ surfaceClass, buttonClass }: { surfaceClass: string; buttonClass: string }) {
  return (
    <div className="mt-8 space-y-4">
      {['Order #MN1024', 'Order #AM8801', 'Order #BN4407'].map((order, index) => (
        <div key={order} className="rounded-[28px] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm opacity-70">{order}</p>
              <p className="mt-1 text-xl font-semibold">{index === 0 ? 'Preparing for shipment' : 'Delivered'}</p>
              <div className={`mt-4 grid gap-2 rounded-2xl ${surfaceClass} p-3 sm:grid-cols-4`}>
                {['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, stepIndex) => <span key={step} className={`rounded-full px-3 py-2 text-center text-xs ${stepIndex <= index + 1 ? 'bg-white' : 'bg-white/40'}`}>{step}</span>)}
              </div>
            </div>
            <button className={`rounded-full px-5 py-3 text-sm ${buttonClass}`}>View details</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistView({ surfaceClass, buttonClass }: { surfaceClass: string; buttonClass: string }) {
  const items = ['Noor Silk Abaya', 'Nude Satin Shawl', 'Velvet Aura Perfume'];
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item} className={`rounded-[28px] ${surfaceClass} p-5`}>
          <Heart className="h-5 w-5" />
          <p className="mt-5 text-xl font-semibold">{item}</p>
          <p className="mt-2 text-sm opacity-70">Saved for later from the storefront.</p>
          <button className={`mt-5 rounded-full px-5 py-3 text-sm ${buttonClass}`}>Move to cart</button>
        </div>
      ))}
    </div>
  );
}

function AddressesView({ surfaceClass, buttonClass }: { surfaceClass: string; buttonClass: string }) {
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className={`rounded-[28px] ${surfaceClass} p-5`}>
        <MapPin className="h-5 w-5" />
        <p className="mt-5 text-xl font-semibold">Default delivery address</p>
        <p className="mt-2 leading-7 opacity-75">12 Jalan Anggun, Seksyen 7, 40000 Shah Alam, Selangor</p>
      </div>
      <div className="rounded-[28px] bg-white p-5">
        <p className="font-medium">Add new address</p>
        <div className="mt-4 space-y-3">
          {['Full name', 'Phone number', 'Address'].map((field) => <input key={field} className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none" placeholder={field} />)}
          <button className={`w-full rounded-full px-5 py-3 text-sm ${buttonClass}`}>Save address</button>
        </div>
      </div>
      <div className="rounded-[28px] bg-white p-5 lg:col-span-2">
        <div className="flex items-center gap-2 text-sm opacity-70"><ShieldCheck className="h-4 w-4" />Saved addresses will autofill checkout after login.</div>
      </div>
    </div>
  );
}
