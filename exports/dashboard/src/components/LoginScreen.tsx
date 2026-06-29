import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { createApiClient } from '../api/http';
import { getStoredSession, saveStoredSession, type AdminSession } from '../api/authSession';
import { createOfflineDemoLoginResponse, resolveLoginCredentials } from '../api/demoCredentials';
import { getAuthErrorMessage, getLoginModeCopy, getPostAuthRoute, type AuthMode } from './loginModeCopy';

type LoginTheme = 'indigo' | 'obsidian' | 'minimalist';

interface ThemeConfig {
  panelBg: string;
  blob1: string;
  blob2: string;
  btnBg: string;
  btnHover: string;
  isLight: boolean;
}

const THEMES: Record<LoginTheme, ThemeConfig> = {
  indigo: {
    panelBg: 'linear-gradient(135deg, #1e1b4b 0%, #0a0a14 55%, #1a1040 100%)',
    blob1: 'rgba(99,102,241,0.10)',
    blob2: 'rgba(139,92,246,0.10)',
    btnBg: '#4f46e5',
    btnHover: '#4338ca',
    isLight: false,
  },
  obsidian: {
    panelBg: 'linear-gradient(135deg, #0c0c0d 0%, #18181b 55%, #1c1917 100%)',
    blob1: 'rgba(120,113,108,0.10)',
    blob2: 'rgba(63,63,70,0.15)',
    btnBg: '#27272a',
    btnHover: '#18181b',
    isLight: false,
  },
  minimalist: {
    panelBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 55%, #f5f5f4 100%)',
    blob1: 'rgba(199,210,254,0.45)',
    blob2: 'rgba(214,211,209,0.45)',
    btnBg: '#0f172a',
    btnHover: '#1e293b',
    isLight: true,
  },
};

function SloganText({ theme }: { theme: LoginTheme }) {
  if (theme === 'obsidian') {
    return (
      <>
        Orchestrate{' '}
        <em style={{ color: '#a8a29e', fontStyle: 'italic', fontWeight: 400 }}>SaaS logistics</em>
        {' '}with raw, absolute precision from an elegant{' '}
        <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(120,113,108,0.3)', textUnderlineOffset: 10 }}>
          unified core
        </span>.
      </>
    );
  }
  if (theme === 'minimalist') {
    return (
      <>
        <span style={{ color: '#4f46e5', fontWeight: 400 }}>Minimal. Pure.</span> Sovereign administration designed solely for{' '}
        <em style={{ color: '#1e293b', fontStyle: 'italic' }}>high performance</em>.
      </>
    );
  }
  return (
    <>
      Control{' '}
      <em style={{ color: '#a5b4fc', fontStyle: 'italic', fontWeight: 400 }}>storefront</em>
      , products, storage, and platform owner tools from{' '}
      <span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(99,102,241,0.25)', textUnderlineOffset: 10 }}>
        one workspace
      </span>.
    </>
  );
}

export function LoginScreen({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('adib.hakimi19@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<LoginTheme>('indigo');
  const [hoverBtn, setHoverBtn] = useState(false);

  const t = THEMES[theme];
  const copy = getLoginModeCopy(mode);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const client = createApiClient();
      const result = mode === 'trial'
        ? await client.auth.startTrial({ name, email, password, storeName })
        : await client.auth.login(resolveLoginCredentials({ email, password }));
      const session = getStoredSession();
      if (!session) throw new Error('Session could not be saved.');
      window.location.hash = getPostAuthRoute({ isPlatformOwner: result.user.is_platform_owner, mode });
      onLogin(session);
    } catch (error) {
      const offlineDemo = mode === 'login' ? createOfflineDemoLoginResponse({ email, password }) : null;
      if (offlineDemo && (error instanceof TypeError || (error instanceof Error && error.message.includes('Unexpected token')))) {
        saveStoredSession(offlineDemo);
        const session = getStoredSession();
        if (!session) throw new Error('Session could not be saved.');
        window.location.hash = getPostAuthRoute({ isPlatformOwner: offlineDemo.user.is_platform_owner, mode });
        onLogin(session);
        return;
      }
      setError(getAuthErrorMessage(mode, error));
    } finally {
      setSubmitting(false);
    }
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    if (nextMode === 'trial') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('adib.hakimi19@gmail.com');
      setPassword('');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
        }

        .ls-root {
          position: fixed;
          inset: 0;
          display: flex;
          font-family: 'Plus Jakarta Sans', 'Manrope', ui-sans-serif, sans-serif;
          overflow: hidden;
        }

        /* LEFT PANEL — hidden on mobile, visible on lg */
        .ls-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 55%;
          flex-shrink: 0;
          position: relative;
          padding: 56px 64px;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.04);
          transition: background 0.7s ease;
        }

        /* RIGHT PANEL — full width on mobile, 45% on lg */
        .ls-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow-y: auto;
          background: #0d0d12;
          padding: 48px 40px;
        }

        @media (min-width: 1024px) {
          .ls-left {
            display: flex;
          }
          .ls-right {
            flex: 0 0 45%;
            padding: 52px 56px;
          }
        }

        .ls-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 13px;
          color: #f1f5f9;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          font-family: inherit;
          box-sizing: border-box;
        }
        .ls-input::placeholder { color: rgba(148,163,184,0.45); }
        .ls-input:focus {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
        }

        @keyframes ls-ping {
          0%   { transform: scale(1); opacity: 0.75; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ls-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-7px); }
        }
        @keyframes ls-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ls-pulse {
          0%,100% { opacity: 0.15; }
          50%     { opacity: 0.28; }
        }

        .ls-float { animation: ls-float 6s ease-in-out infinite; }
        .ls-spin  { animation: ls-spin 1s linear infinite; }
      `}</style>

      <div className="ls-root">

        {/* ══════════════ LEFT BRAND PANEL ══════════════ */}
        <section
          className="ls-left"
          style={{ background: t.panelBg }}
        >
          {/* Ambient blobs */}
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '70%', height: '70%', borderRadius: '50%',
            background: t.blob1, filter: 'blur(130px)',
            pointerEvents: 'none',
            animation: 'ls-pulse 4s ease-in-out infinite',
            transition: 'background 0.7s ease',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: '70%', height: '70%', borderRadius: '50%',
            background: t.blob2, filter: 'blur(130px)',
            pointerEvents: 'none',
            transition: 'background 0.7s ease',
          }} />
          {/* Dot grid overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(transparent 1px, rgba(10,10,12,0.55) 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.12, pointerEvents: 'none',
          }} />

          {/* ── TOP: brand + theme switcher ── */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', flexShrink: 0, display: 'inline-block' }} />
                <span style={{
                  color: t.isLight ? '#0f172a' : '#fff',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.25em', textTransform: 'uppercase',
                }}>
                  Bisora Admin
                </span>
              </div>
              <p style={{
                color: t.isLight ? 'rgba(71,85,105,0.7)' : 'rgba(165,180,252,0.6)',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 4,
              }}>
                Ecommerce SaaS
              </p>
            </div>

            {/* Theme dots */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '5px 8px', borderRadius: 999,
            }}>
              {(['indigo', 'obsidian', 'minimalist'] as LoginTheme[]).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  title={th}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', border: 'none',
                    cursor: 'pointer', transition: 'transform .15s, outline .15s',
                    background: th === 'indigo' ? '#6366f1' : th === 'obsidian' ? '#3f3f46' : '#e2e8f0',
                    outline: theme === th ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    outlineOffset: 1,
                    transform: theme === th ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── MIDDLE: slogan ── */}
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 520 }}>
            {/* Active badge */}
            <div className="ls-float" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.10)',
              border: '1px solid rgba(165,180,252,0.15)',
              borderRadius: 999, padding: '5px 14px', marginBottom: 28,
            }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: '#34d399', opacity: 0.75,
                  animation: 'ls-ping 1.5s ease-in-out infinite',
                }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', position: 'relative' }} />
              </span>
              <Store style={{ width: 11, height: 11, color: '#a5b4fc' }} />
              <span style={{ color: '#c7d2fe', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>
                Active Laravel Engine
              </span>
            </div>

            <h1 style={{
              color: t.isLight ? '#0f172a' : '#f1f5f9',
              fontSize: 'clamp(2.2rem, 3.5vw, 4.8rem)',
              fontWeight: 300, lineHeight: 1.06,
              letterSpacing: '-0.02em',
              fontFamily: '"Noto Serif", "Instrument Serif", Georgia, serif',
              margin: 0,
              transition: 'color 0.5s ease',
            }}>
              <SloganText theme={theme} />
            </h1>

            <p style={{
              color: t.isLight ? '#64748b' : 'rgba(148,163,184,0.75)',
              fontSize: 12.5, marginTop: 20,
              lineHeight: 1.75, fontWeight: 400,
              letterSpacing: '0.02em', maxWidth: 360,
            }}>
              Experience absolute telemetry with zero friction. An exquisitely fast ecommerce cockpit designed to replace
              clutter with modern precision.
            </p>
          </div>

          {/* ── BOTTOM: footer ── */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: t.isLight ? '#94a3b8' : '#475569',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
          }}>
            <p style={{ margin: 0 }}>© 2026 Bisora Inc.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Security', 'System Status'].map((l) => (
                <a key={l} href="#" style={{ color: 'inherit', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#818cf8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = t.isLight ? '#94a3b8' : '#475569'; }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ RIGHT LOGIN PANEL ══════════════ */}
        <section className="ls-right">

          {/* Centered form */}
          <div style={{ width: '100%', maxWidth: 380, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Shield icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(248,250,252,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#818cf8', marginBottom: 20,
            }}>
              <Shield style={{ width: 20, height: 20 }} />
            </div>

            <h2 style={{
              color: '#f1f5f9', fontSize: 30, fontWeight: 700,
              letterSpacing: '-0.02em', margin: '0 0 8px 0',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}>
              {copy.title}
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55, marginBottom: 28 }}>
              {copy.description}
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 4, marginBottom: 18,
            }}>
              {[
                { key: 'login' as const, label: getLoginModeCopy('login').tabLabel },
                { key: 'trial' as const, label: getLoginModeCopy('trial').tabLabel },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => switchMode(item.key)}
                  style={{
                    border: 'none',
                    borderRadius: 9,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                    background: mode === item.key ? '#4f46e5' : 'transparent',
                    color: mode === item.key ? '#fff' : '#64748b',
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '11px 14px', borderRadius: 12,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', fontSize: 12.5,
                marginBottom: 16, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'trial' ? (
                <>
                  <div>
                    <label style={{
                      display: 'block', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: '#475569', marginBottom: 6,
                    }}>
                      Your Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <ShieldCheck style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 14, color: '#475569', pointerEvents: 'none',
                      }} />
                      <input
                        className="ls-input"
                        onChange={e => setName(e.target.value)}
                        placeholder="Aina Merchant"
                        required
                        type="text"
                        value={name}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: '#475569', marginBottom: 6,
                    }}>
                      Store Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Store style={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 14, color: '#475569', pointerEvents: 'none',
                      }} />
                      <input
                        className="ls-input"
                        onChange={e => setStoreName(e.target.value)}
                        placeholder="Aina Raya Store"
                        required
                        type="text"
                        value={storeName}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {/* Email */}
              <div>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: '#475569', marginBottom: 6,
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 14, height: 14, color: '#475569', pointerEvents: 'none',
                  }} />
                  <input
                    className="ls-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={mode === 'trial' ? 'you@example.com' : 'adib.hakimi19@gmail.com'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.2em', textTransform: 'uppercase', color: '#475569',
                  }}>
                    Password
                  </label>
                  <a href="#" style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                    Reset Password
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 14, height: 14, color: '#475569', pointerEvents: 'none',
                  }} />
                  <input
                    className="ls-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'trial' ? 8 : undefined}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'trial' ? 'At least 8 characters' : 'Password'}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', display: 'flex', alignItems: 'center', padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                  </button>
                </div>
              </div>

              {/* Remember + Secure */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{
                    width: 34, height: 20, borderRadius: 999, background: '#4f46e5',
                    position: 'relative', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: 16,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>
                    Remember this system
                  </span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#334155' }}>
                  <Lock style={{ width: 11, height: 11 }} />
                  Secure Port 443
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={() => setHoverBtn(true)}
                onMouseLeave={() => setHoverBtn(false)}
                style={{
                  width: '100%', padding: '13px 16px',
                  background: hoverBtn && !submitting ? '#4338ca' : '#4f46e5',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 13.5, fontWeight: 600, letterSpacing: '0.01em',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4, fontFamily: 'inherit',
                  transition: 'background .2s, box-shadow .2s',
                  boxShadow: hoverBtn && !submitting
                    ? '0 8px 32px rgba(99,102,241,0.28)'
                    : '0 4px 16px rgba(99,102,241,0.14)',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="ls-spin" style={{ width: 15, height: 15 }} />
                    {copy.submittingLabel}
                  </>
                ) : (
                  <>
                    {copy.submitLabel}
                    <ArrowRight style={{ width: 15, height: 15 }} />
                  </>
                )}
              </button>
            </form>

            {/* Demo hint */}
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Info style={{ width: 15, height: 15, color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.55, margin: 0 }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>{copy.helperTitle} </span>
                {mode === 'login' ? (
                  <>
                    Use{' '}
                    <code style={{
                      background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                      padding: '1px 6px', borderRadius: 5,
                      fontFamily: 'monospace', fontSize: 11,
                    }}>
                      adib.hakimi19@gmail.com
                    </code>
                    {' / password for owner login. '}
                  </>
                ) : null}
                {copy.helperText}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)',
            marginTop: 24, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>
              Bisora Admin Platform v4.2
            </span>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#334155', padding: 8, borderRadius: 8,
              display: 'flex', alignItems: 'center',
            }}>
              <ShieldCheck style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
