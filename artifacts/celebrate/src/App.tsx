import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { NewEvent } from '@/pages/NewEvent';
import { EventHub } from '@/pages/EventHub';
import { EventChat } from '@/pages/EventChat';
import { EventGuests } from '@/pages/EventGuests';
import { EventDiscover } from '@/pages/EventDiscover';
import { EventInvites } from '@/pages/EventInvites';
import { Profile } from '@/pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/events/new" component={NewEvent} />
        <Route path="/events/:eventId" component={EventHub} />
        <Route path="/events/:eventId/plan" component={EventChat} />
        <Route path="/events/:eventId/guests" component={EventGuests} />
        <Route path="/events/:eventId/discover" component={EventDiscover} />
        <Route path="/events/:eventId/invites" component={EventInvites} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
