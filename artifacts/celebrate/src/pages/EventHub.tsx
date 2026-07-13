import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetEvent, useGetEventSummary, useListGuests } from '@workspace/api-client-react';
import {
  MessageSquare, Users, Sparkles, Send, MapPin, Calendar as CalendarIcon,
  CheckCircle2, ChevronRight, Loader2, DollarSign, TrendingUp, RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function EventTabs({ activeTab, eventId }: { activeTab: string; eventId: string }) {
  const [, setLocation] = useLocation();
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'chat',     label: 'Chat' },
    { id: 'guests',   label: 'Guests' },
    { id: 'discover', label: 'Discover' },
    { id: 'invites',  label: 'Invites' },
  ];
  return (
    <div className="flex items-center overflow-x-auto no-scrollbar border-b border-border/60 pb-px mb-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const href = tab.id === 'overview'
          ? `/events/${eventId}`
          : `/events/${eventId}/${tab.id === 'chat' ? 'plan' : tab.id}`;
        return (
          <button
            key={tab.id}
            onClick={() => setLocation(href)}
            className={`whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Attendance teaser ─────────────────────────────────────────────── */
interface GuestLike { rsvpStatus: string; personality?: string | null }

function parsePersonality(raw?: string | null) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function AttendanceSummary({ guests, total, onManage }: { guests: GuestLike[]; total: number; onManage: () => void }) {
  const confirmed = guests.filter((g) => {
    const p = parsePersonality(g.personality);
    return g.rsvpStatus === 'confirmed' || p.likelihood === 'Definitely in';
  }).length;
  const probable = guests.filter((g) => {
    const p = parsePersonality(g.personality);
    return p.likelihood === 'Probably';
  }).length;
  const likely = confirmed + probable;
  const pct = guests.length > 0 ? Math.round((likely / guests.length) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" /> Attendance forecast
        </h3>
        <button onClick={onManage} className="text-xs text-primary hover:underline">Manage</button>
      </div>
      {guests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add guests to see who's likely to show up.</p>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-serif font-medium text-primary">{likely}</span>
            <span className="text-muted-foreground text-sm mb-0.5">of {guests.length} likely</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{confirmed} confirmed</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{probable} probable</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />{guests.length - likely} uncertain</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Cost estimate widget ──────────────────────────────────────────── */
interface CostLine {
  category: string;
  perPersonMin: number;
  perPersonMax: number;
  notes: string;
}

interface CostData {
  currency: string;
  currencyCode: string;
  perPersonMin: number;
  perPersonMax: number;
  totalMin: number;
  totalMax: number;
  guestCount: number;
  breakdown: CostLine[];
  assumptions: string;
  insiderTip: string;
}

function fmt(n: number, code: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${code} ${n.toLocaleString()}`;
  }
}

function CostEstimateWidget({ eventId }: { eventId: number }) {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    setError(false);
    try {
      const base = (window as any).__VITE_BASE__ ?? import.meta.env.BASE_URL ?? '/';
      const apiBase = base.replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/events/${eventId}/cost-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50">
      <h3 className="font-medium flex items-center gap-2 text-sm mb-3">
        <DollarSign className="w-4 h-4 text-primary" /> Cost snapshot
      </h3>

      {!data && !loading && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Get a real-world cost breakdown based on your location and event type.
          </p>
          <button
            onClick={fetch_}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Estimate costs
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs text-muted-foreground">Pricing it out...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Could not generate estimate.</p>
          <button onClick={fetch_} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Headline */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Per person</p>
              <p className="text-2xl font-serif font-medium text-primary">
                {fmt(data.perPersonMin, data.currencyCode)} – {fmt(data.perPersonMax, data.currencyCode)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total ({data.guestCount} guests)</p>
              <p className="text-sm font-medium">{fmt(data.totalMin, data.currencyCode)} – {fmt(data.totalMax, data.currencyCode)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {data.breakdown.map((line) => (
              <div key={line.category} className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-border/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{line.category}</span>
                  {line.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{line.notes}</p>
                  )}
                </div>
                <span className="text-muted-foreground whitespace-nowrap text-xs pt-0.5">
                  {fmt(line.perPersonMin, data.currencyCode)}–{fmt(line.perPersonMax, data.currencyCode)}<span className="text-muted-foreground/60">/pp</span>
                </span>
              </div>
            ))}
          </div>

          {/* Insider tip */}
          {data.insiderTip && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground leading-relaxed">
              <span className="font-medium text-primary">Insider tip: </span>{data.insiderTip}
            </div>
          )}

          {/* Assumptions */}
          {data.assumptions && (
            <p className="text-xs text-muted-foreground italic leading-relaxed">{data.assumptions}</p>
          )}

          <button
            onClick={fetch_}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh estimate
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export function EventHub() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = useGetEvent(id, {
    query: { enabled: !!id, queryKey: ['events', id] },
  });
  const { data: summary, isLoading: summaryLoading } = useGetEventSummary(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'summary'] },
  });
  const { data: guests } = useListGuests(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'guests'] },
  });

  if (eventLoading || summaryLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!event || !summary) return <div className="p-8">Event not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 mb-8">
        <div className="h-48 md:h-64 bg-muted relative">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 right-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md">
                {event.type.toUpperCase()}
              </span>
              <span className="bg-black/40 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                {event.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-white mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm md:text-base">
              {event.startDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{format(parseISO(event.startDate), 'MMMM d, yyyy')}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventTabs activeTab="overview" eventId={eventId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: progress + next steps */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" /> Planning progress
            </h2>
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-5xl font-serif font-medium text-primary mb-2">
                    {summary.completionPercent}%
                  </div>
                  <p className="text-muted-foreground">Ready to celebrate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{summary.confirmedGuests} / {summary.guestCount} confirmed</p>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${summary.completionPercent}%` }}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">Next steps</h2>
            <div className="space-y-3">
              {summary.nextSteps && summary.nextSteps.length > 0 ? (
                summary.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground leading-relaxed">{step}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground bg-card rounded-xl border border-border/50">
                  <p>All caught up. Chat with Cele to figure out what's next.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setLocation(`/events/${eventId}/plan`)}
              className="w-full mt-6 flex items-center justify-between p-4 bg-foreground text-background rounded-xl hover:bg-primary transition-colors group"
            >
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Ask Cele what to do next
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>
        </div>

        {/* Right: stats, predictions, cost, quick actions */}
        <div className="space-y-5">
          {/* At a glance */}
          <div className="bg-card rounded-2xl p-5 border border-border/50">
            <h3 className="font-medium text-sm border-b border-border/50 pb-3 mb-4">At a glance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Guests</p>
                <p className="text-2xl font-medium">{summary.guestCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Venues saved</p>
                <p className="text-2xl font-medium">{summary.savedSuggestions}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Chats</p>
                <p className="text-2xl font-medium">{summary.sessionCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Invites</p>
                <p className="text-2xl font-medium">{summary.inviteCount}</p>
              </div>
            </div>
          </div>

          {/* Attendance forecast */}
          <AttendanceSummary
            guests={guests ?? []}
            total={summary.guestCount}
            onManage={() => setLocation(`/events/${eventId}/guests`)}
          />

          {/* Cost snapshot */}
          <CostEstimateWidget eventId={id} />

          {/* Quick nav */}
          <div className="space-y-2">
            {[
              { icon: <Users className="w-5 h-5" />, label: 'Manage Guests', color: 'bg-primary/10 text-primary', href: `guests` },
              { icon: <MapPin className="w-5 h-5" />, label: 'Discover Venues', color: 'bg-accent/10 text-accent', href: `discover` },
              { icon: <Send className="w-5 h-5" />, label: 'Send Invites', color: 'bg-secondary text-secondary-foreground', href: `invites` },
              { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat with Cele', color: 'bg-muted text-muted-foreground', href: `plan` },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setLocation(`/events/${eventId}/${item.href}`)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
