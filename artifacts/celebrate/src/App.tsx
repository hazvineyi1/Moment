import React, { useEffect, useRef, useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from '@clerk/react';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { Loader2 } from 'lucide-react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';

import { AppLayout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { NewEvent } from '@/pages/NewEvent';
import { EventHub } from '@/pages/EventHub';
import { EventOptions } from '@/pages/EventOptions';
import { EventChat } from '@/pages/EventChat';
import { EventGuests } from '@/pages/EventGuests';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { GuestQuestionnairePage } from '@/pages/GuestQuestionnairePage';
import { ShareQuestionnaire } from '@/pages/ShareQuestionnaire';
import { ShareExperiences } from '@/pages/ShareExperiences';
import { ShareCollab } from '@/pages/ShareCollab';
import { EventInspirations } from '@/pages/EventInspirations';
import { EventInvitePage } from '@/pages/EventInvitePage';
import { EventMemories } from '@/pages/EventMemories';

// ── Clerk setup ────────────────────────────────────────────────────────────
// Copy verbatim — resolves correct key for dev and prod custom domains
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

// Empty in dev (intentional), auto-set in prod — do NOT gate on NODE_ENV
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

// ── Appearance ─────────────────────────────────────────────────────────────
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#C9A96E',
    colorForeground: '#1a1714',
    colorMutedForeground: '#78716c',
    colorDanger: '#dc2626',
    colorBackground: '#faf9f7',
    colorInput: '#f5f3f0',
    colorInputForeground: '#1a1714',
    colorNeutral: '#e7e5e4',
    fontFamily: "'Outfit', sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#faf9f7] rounded-3xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#e7e5e4]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-serif text-[#1a1714]',
    headerSubtitle: 'text-[#78716c]',
    socialButtonsBlockButtonText: 'text-[#1a1714] font-medium',
    socialButtonsBlockButton: 'border-[#e7e5e4] bg-white hover:bg-[#f5f3f0]',
    formFieldLabel: 'text-[#1a1714] font-medium text-sm',
    formFieldInput: 'bg-[#f5f3f0] border-[#e7e5e4] text-[#1a1714] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20',
    footerActionLink: 'text-[#C9A96E] hover:text-[#b8924f]',
    footerActionText: 'text-[#78716c]',
    footerAction: 'bg-transparent',
    dividerText: 'text-[#78716c]',
    dividerLine: 'bg-[#e7e5e4]',
    formButtonPrimary: 'bg-[#C9A96E] hover:bg-[#b8924f] text-white font-medium',
    identityPreviewEditButton: 'text-[#C9A96E]',
    formFieldSuccessText: 'text-green-600',
    alertText: 'text-[#1a1714]',
    alert: 'bg-red-50 border-red-200',
    logoBox: 'mb-2',
    logoImage: 'w-10 h-10',
    otpCodeFieldInput: 'border-[#e7e5e4] bg-[#f5f3f0] text-[#1a1714]',
    formFieldRow: 'gap-3',
    main: 'gap-4',
  },
};

// ── QueryClient ────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

// ── Sign-in / sign-up pages ────────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// ── Shared loading spinner ─────────────────────────────────────────────────
function AuthLoading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
    </div>
  );
}

// ── Landing / home redirect ────────────────────────────────────────────────
function HomeRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  return isSignedIn
    ? <AppLayout><Home /></AppLayout>
    : <LandingPage />;
}

// Protected route wrapper
function Protected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <AppLayout>{children}</AppLayout>;
}

// ── Landing background photos ──────────────────────────────────────────────
const LANDING_PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=88', top: '2%',  left: '-9%',  w: 300, h: 390, tilt: -11, delay: 0.1 },
  { src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=88', top: '55%', left: '-7%',  w: 250, h: 310, tilt:   7, delay: 0.3 },
  { src: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=900&q=88', top: '3%',  left: '76%',  w: 280, h: 370, tilt:   9, delay: 0.2 },
  { src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=88', top: '57%', left: '79%',  w: 230, h: 290, tilt:  -6, delay: 0.4 },
];

const STEPS = [
  { n: '01', title: 'Tell us about the occasion', desc: 'The event, the person, and the vibe. We take it from there. No planning experience required.' },
  { n: '02', title: 'Six curated plans, instantly', desc: "From intimate to extraordinary. Each plan is a complete itinerary built around who you are celebrating." },
  { n: '03', title: 'Refine with your concierge', desc: 'Chat to adjust every detail until it feels exactly right. Then hand it off.' },
];

const OCCASIONS = ['Birthday', 'Date Night', 'Wedding', 'Anniversary', 'Graduation', 'Surprise', 'Retreat', 'Engagement', 'Farewell', 'Milestone'];

// Landing page — scrollable marketing page for unauthenticated visitors
function LandingPage() {
  const [, setLocation] = useLocation();
  const [alive, setAlive] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAlive(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const t = (delay: number) => ({
    opacity:    alive ? 1 : 0,
    transform:  alive ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 1s ease ${delay}s, transform 1s ease ${delay}s`,
  });

  const eyebrow: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
    color: '#a89880', margin: 0,
  };
  const body: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 300, fontSize: 14, lineHeight: 1.75, color: '#a89880', margin: 0,
  };
  const goldRule: React.CSSProperties = {
    height: 1,
    background: 'linear-gradient(90deg,rgba(201,169,110,0) 0%,rgba(201,169,110,0.4) 50%,rgba(201,169,110,0) 100%)',
  };

  return (
    <div style={{ background: '#060606', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes ripple-out {
          0%   { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(4);   opacity: 0;   }
        }
        @keyframes photo-breathe {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100dvh' }}>
        {LANDING_PHOTOS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', top: p.top, left: p.left, width: p.w, height: p.h,
            transform: `rotate(${p.tilt}deg)`,
            opacity: alive ? 0.3 : 0,
            transition: `opacity 2s ease ${p.delay + 0.5}s`,
            boxShadow: '0 28px 90px rgba(0,0,0,0.75)', pointerEvents: 'none',
          }}>
            <div style={{ width: '100%', height: '100%', animation: `photo-breathe ${5.5 + i * 0.8}s ease-in-out ${i * 0.9}s infinite` }}>
              <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        ))}

        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 120, height: 120, marginTop: -60, marginLeft: -60,
            borderRadius: '50%', border: '1px solid rgba(201,169,110,0.3)',
            animation: `ripple-out 5.5s ease-out ${i * 1.35}s infinite`, pointerEvents: 'none',
          }} />
        ))}

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 55% 65% at 50% 50%, rgba(6,6,6,0.25) 0%, rgba(6,6,6,0.82) 60%, rgba(6,6,6,0.97) 100%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 10, minHeight: '100dvh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '32px',
        }}>
          <p style={{ ...eyebrow, marginBottom: 36, ...t(0.25) }}>Every celebration deserves a memory</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
            fontSize: 'clamp(64px, 10vw, 118px)', lineHeight: 0.92,
            color: '#f5f0e8', marginBottom: 28, ...t(0.5),
          }}>A-Moment</h1>
          <p style={{ ...body, maxWidth: 340, marginBottom: 60, ...t(0.75) }}>
            From intimate winery weekends to month-long sailing expeditions.
            Whatever you are celebrating, we plan it. Beautifully.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, ...t(1.0) }}>
            <button onClick={() => setLocation('/sign-up')} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <span>Begin your story</span>
              <span style={{ fontSize: 17 }}>→</span>
            </button>
            <button onClick={() => setLocation('/sign-in')} style={{
              fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#a89880', background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a89880')}
            >Already have an account? Sign in</button>
          </div>
        </div>
      </div>

      {/* ── QUOTE ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', textAlign: 'center', borderTop: '1px solid rgba(201,169,110,0.08)' }}>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
          fontSize: 'clamp(20px, 3.5vw, 40px)', color: '#f5f0e8',
          lineHeight: 1.35, maxWidth: 680, margin: '0 auto', opacity: 0.85,
        }}>
          "The kind of planning that used to take weeks. Done in an evening."
        </p>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 120px' }}>
        <p style={{ ...eyebrow, marginBottom: 56 }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px 64px' }}>
          {STEPS.map(step => (
            <div key={step.n}>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 60, color: 'rgba(201,169,110,0.15)',
                lineHeight: 1, marginBottom: 20,
              }}>{step.n}</p>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                fontSize: 22, color: '#f5f0e8', marginBottom: 14, lineHeight: 1.2,
              }}>{step.title}</h3>
              <p style={{ ...body }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OCCASIONS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', borderTop: '1px solid rgba(201,169,110,0.08)', textAlign: 'center' }}>
        <p style={{ ...eyebrow, marginBottom: 48 }}>Built for every kind of celebration</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 14px' }}>
          {OCCASIONS.map(occ => (
            <span key={occ} style={{
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#a89880', border: '1px solid rgba(201,169,110,0.18)',
              padding: '10px 22px', display: 'inline-block',
            }}>{occ}</span>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 32px 100px', textAlign: 'center', borderTop: '1px solid rgba(201,169,110,0.08)' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
          fontSize: 'clamp(40px, 6vw, 80px)', color: '#f5f0e8',
          lineHeight: 1.05, marginBottom: 52,
        }}>
          Your next celebration<br />starts here.
        </h2>
        <button onClick={() => setLocation('/sign-up')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 16,
          fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: 80,
        }}>
          <span>Begin your story</span>
          <span style={{ fontSize: 17 }}>→</span>
        </button>
        <div style={{ ...goldRule, maxWidth: 400, margin: '0 auto 32px' }} />
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(138,122,101,0.45)' }}>
          © {new Date().getFullYear()} A-Moment
        </p>
      </section>
    </div>
  );
}

// ── Auth token bridge — wires customFetch to Clerk's getToken ─────────────
function ClerkAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

// ── Cache invalidator on user switch ──────────────────────────────────────
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

// ── Router ─────────────────────────────────────────────────────────────────
function AppRouter() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={`${basePath || '/'}`}
      afterSignInUrl={`${basePath || '/'}`}
      afterSignUpUrl={`${basePath || '/'}`}
      localization={{
        signIn: { start: { title: 'Welcome back to A-Moment', subtitle: 'Sign in to your planning workspace' } },
        signUp: { start: { title: 'Start planning with A-Moment', subtitle: 'Create your account to get started' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkAuthBridge />
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            {/* Public questionnaires — no auth */}
            <Route path="/q/:token">{(p) => <QuestionnairePage token={p.token} />}</Route>
            <Route path="/gq/:token" component={GuestQuestionnairePage} />
            {/* Public shareable event invite page */}
            <Route path="/i/:eventId">{(p) => <EventInvitePage eventId={p.eventId} />}</Route>
            {/* Protected app routes */}
            <Route path="/events/new">{() => <Protected><NewEvent /></Protected>}</Route>
            <Route path="/events/:eventId/share">{(p) => <Protected><ShareQuestionnaire eventId={p.eventId} /></Protected>}</Route>
            <Route path="/events/:eventId/share-experiences">{(p) => <Protected><ShareExperiences eventId={p.eventId} /></Protected>}</Route>
            <Route path="/events/:eventId/share-collab">{(p) => <Protected><ShareCollab eventId={p.eventId} /></Protected>}</Route>
            <Route path="/events/:eventId/inspirations">{(p) => <Protected><EventInspirations eventId={p.eventId} /></Protected>}</Route>
            <Route path="/events/:eventId/memories">{(p) => <Protected><EventMemories eventId={p.eventId} /></Protected>}</Route>
            <Route path="/events/:eventId">{(p) => <Protected><EventHub /></Protected>}</Route>
            <Route path="/events/:eventId/options">{() => <Protected><EventOptions /></Protected>}</Route>
            <Route path="/events/:eventId/plan">{() => <Protected><EventChat /></Protected>}</Route>
            <Route path="/events/:eventId/guests">{() => <Protected><EventGuests /></Protected>}</Route>
            <Route path="/events/:eventId/discover">{(p) => <Redirect to={`/events/${p.eventId}`} />}</Route>
            <Route path="/events/:eventId/invites">{(p) => <Redirect to={`/events/${p.eventId}`} />}</Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRouter />
    </WouterRouter>
  );
}
