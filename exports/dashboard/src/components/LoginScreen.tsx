import { useState } from 'react';
import { LockKeyhole, Store, UserRound } from 'lucide-react';
import { createApiClient } from '../api/http';
import { getStoredSession, type AdminSession } from '../api/authSession';

export function LoginScreen({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [email, setEmail] = useState('owner@bisora.my');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await createApiClient().auth.login({ email, password });
      const session = getStoredSession();

      if (!session) {
        throw new Error('Login session could not be saved.');
      }

      window.location.hash = result.user.is_platform_owner ? '/superadmin' : '/dashboard';
      onLogin(session);
    } catch {
      setError('Login failed. Check email, password, and API connection.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-surface text-on-surface lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <section className="hidden bg-primary px-12 py-14 text-on-primary lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-lg font-semibold">Bisora Admin</p>
          <p className="mt-2 text-sm uppercase tracking-[0.24em] opacity-80">Ecommerce SaaS</p>
        </div>
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Store className="h-4 w-4" />
            Laravel backend connected
          </p>
          <h1 className="mt-8 text-5xl font-semibold leading-tight">Control storefront, products, storage, and platform owner tools from one workspace.</h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded border border-outline-variant/20 bg-surface-lowest p-6 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold">Login</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Use your Bisora owner or seller account.</p>

          <label className="mt-6 block space-y-2 text-sm font-medium">
            <span>Email</span>
            <span className="relative block">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded border border-outline-variant/30 bg-surface px-9 py-3 outline-none focus:border-primary"
                type="email"
              />
            </span>
          </label>

          <label className="mt-4 block space-y-2 text-sm font-medium">
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-outline-variant/30 bg-surface px-3 py-3 outline-none focus:border-primary"
              type="password"
            />
          </label>

          {error && <p className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

          <button
            disabled={submitting}
            className="mt-6 w-full rounded bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
