import React, { useEffect, useRef } from 'react';
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

// Simple landing for unauthenticated visitors
function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-8">
        <img src={`${basePath}/logo.svg`} alt="A-Moment" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-5xl font-serif font-medium text-foreground mb-3">A-Moment</h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
          One app for every kind of planning. Celebrations, trips, surprises — whatever you are building, A-Moment handles it.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setLocation('/sign-up')}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Get started
        </button>
        <button
          onClick={() => setLocation('/sign-in')}
          className="w-full py-3.5 border border-border rounded-full font-medium hover:bg-muted transition-colors text-foreground"
        >
          Sign in
        </button>
      </div>
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
            {/* Protected app routes */}
            <Route path="/events/new">{() => <Protected><NewEvent /></Protected>}</Route>
            <Route path="/events/:eventId/share">{(p) => <Protected><ShareQuestionnaire eventId={p.eventId} /></Protected>}</Route>
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
