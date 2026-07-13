import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetEvent, useUpdateEvent } from '@workspace/api-client-react';
import { useAuth } from '@clerk/react';
import { ArrowRight, ChevronDown, ChevronUp, Sparkles, MapPin, Clock, Users, RefreshCw } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  tagline: string;
  destination: string;
  venue: string;
  duration: string;
  priceRange: { perPersonMin: number; perPersonMax: number };
  highlights: string[];
  addOns: string[];
  whyThisWorks: string;
  vibe?: string;
}

const LOADING_LINES = [
  "Consulting my contact at the Aman…",
  "Checking availability on the Amalfi in August…",
  "Weighing your group against three very different itineraries…",
  "Ruling out the obvious. Finding the interesting.",
  "Matching venue character to your specific crowd…",
  "Nearly there. Six options worth your time.",
];

function PlanCard({
  option,
  index,
  onChoose,
  isChoosing,
}: {
  option: PlanOption;
  index: number;
  onChoose: (option: PlanOption) => void;
  isChoosing: boolean;
}) {
  const [showAddOns, setShowAddOns] = useState(false);

  const formatPrice = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

  return (
    <div className="group relative bg-card border border-border/60 rounded-3xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Header band */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Option {index + 1}
          </span>
          {option.vibe && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
              {option.vibe}
            </span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-medium leading-tight mb-1">{option.name}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{option.tagline}</p>
      </div>

      {/* Meta row */}
      <div className="px-6 pb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.destination}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.duration}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {option.venue}
        </span>
      </div>

      {/* Price */}
      <div className="px-6 pb-4">
        <div className="inline-flex items-baseline gap-1 bg-primary/8 rounded-2xl px-4 py-2">
          <span className="text-2xl font-semibold text-primary">
            {formatPrice(option.priceRange.perPersonMin)}–{formatPrice(option.priceRange.perPersonMax)}
          </span>
          <span className="text-sm text-muted-foreground">per person</span>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="h-px bg-border/50" />
      </div>

      {/* Highlights */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">What's included</p>
        <ul className="space-y-2">
          {option.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Add-ons toggle */}
      {option.addOns?.length > 0 && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowAddOns((p) => !p)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAddOns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAddOns ? 'Hide' : 'Show'} optional upgrades ({option.addOns.length})
          </button>
          {showAddOns && (
            <ul className="mt-3 space-y-1.5">
              {option.addOns.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 flex-shrink-0">+</span> {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Why this works */}
      <div className="px-6 pb-5">
        <div className="bg-muted/50 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">Cele's take</p>
          <p className="text-sm leading-relaxed italic text-foreground/80">{option.whyThisWorks}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onChoose(option)}
          disabled={isChoosing}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 font-medium text-sm hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
        >
          {isChoosing ? 'Locking in your plan…' : <>Choose this plan <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLineIdx((p) => (p + 1 < LOADING_LINES.length ? p + 1 : p));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8 relative">
        <Sparkles className="w-7 h-7 text-primary" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-3">Cele is thinking.</h2>
      <p
        key={lineIdx}
        className="text-muted-foreground text-base max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {LOADING_LINES[lineIdx]}
      </p>
    </div>
  );
}

export function EventOptions() {
  const { eventId } = useParams<{ eventId: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);

  const { data: event } = useGetEvent(id, { query: { enabled: !!id } });
  const { getToken } = useAuth();

  const updateEvent = useUpdateEvent();

  const [options, setOptions] = useState<PlanOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState(false);

  const loadOptions = async (force = false) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setOptions(null);
    try {
      const token = await getToken();
      const url = `/api/events/${id}/plan-options${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.options) || data.options.length === 0) {
        throw new Error('No options returned');
      }
      setOptions(data.options);
    } catch (e: any) {
      console.error('plan-options fetch error:', e);
      setError(e.message ?? 'Something went wrong. Try again?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadOptions();
  }, [id]);

  const handleChoose = async (option: PlanOption) => {
    if (!id || choosing) return;
    setChoosing(true);

    // Build a new description: preserve everything before __CHOSEN_PLAN__ marker
    const existingDesc = event?.description ?? '';
    const baseDesc = existingDesc.includes('__CHOSEN_PLAN__:')
      ? existingDesc.slice(0, existingDesc.indexOf('__CHOSEN_PLAN__:')).trim()
      : existingDesc;

    const newDescription = `${baseDesc}${baseDesc ? '\n' : ''}__CHOSEN_PLAN__:${JSON.stringify(option)}`;

    updateEvent.mutate(
      { eventId: id, data: { description: newDescription } },
      {
        onSuccess: () => setLocation(`/events/${id}/plan`),
        onError: () => setChoosing(false),
      }
    );
  };

  const handleRetry = () => loadOptions(true);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Progress — step 5 of 5 conceptually, just a full bar */}
      <div className="h-1 bg-primary" />

      <div className="flex-1 container mx-auto px-4 py-8 md:py-14 max-w-5xl">
        {loading && <LoadingState />}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {options && !loading && (
          <>
            <div className="mb-10">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Your options</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-3">
                Six directions.{' '}
                <span className="text-muted-foreground">Pick one.</span>
              </h1>
              <p className="text-base text-muted-foreground max-w-lg">
                Each is a real, specific plan. Once you choose, Cele will help you lock in every detail inside the conversation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {options.map((opt, i) => (
                <PlanCard
                  key={opt.id}
                  option={opt}
                  index={i}
                  onChoose={handleChoose}
                  isChoosing={choosing}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> None of these — show me different options
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
