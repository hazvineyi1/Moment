import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetEvent, useUpdateEvent } from '@workspace/api-client-react';
import { useAuth } from '@clerk/react';
import { ChevronDown, ChevronUp, Loader2, MapPin, Clock, Users, RefreshCw, Plane, Bus, Copy, Check, MessageSquare, Sparkles, CalendarDays } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  tagline: string;
  destination: string;
  venue: string;
  duration: string;
  priceRange: { perPersonMin: number; perPersonMax: number };
  flightEstimate?: { perPersonMin: number; perPersonMax: number; carriers: string[] };
  localTransport?: string[];
  highlights: string[];
  addOns: string[];
  whyThisWorks: string;
  vibe?: string;
  travelStyleMatch?: string;
  optimalTiming?: string;
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
    <div
      className="group relative overflow-hidden transition-all duration-300"
      style={{ border: '1px solid rgba(201,169,110,0.12)', background: '#141414' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.12)')}
    >
      {/* Header band */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-[9px] tracking-[0.22em] uppercase" style={{ color: '#8a7a65' }}>
            Option {index + 1}
          </span>
          {option.vibe && (
            <span
              className="text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 flex-shrink-0"
              style={{ border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
            >
              {option.vibe}
            </span>
          )}
        </div>
        <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-2" style={{ color: '#f5f0e8' }}>{option.name}</h2>
        <p className="text-sm font-light leading-relaxed" style={{ color: '#8a7a65' }}>{option.tagline}</p>

        {/* Personalisation indicator */}
        {option.travelStyleMatch && (
          <div className="mt-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: '#c9a96e' }} />
            <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#c9a96e' }}>
              Matched to your style —{' '}
              <span className="font-medium">{option.travelStyleMatch}</span>
            </span>
          </div>
        )}
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
        {option.optimalTiming && (
          <span className="flex items-center gap-1.5" style={{ color: '#c9a96e' }}>
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            {option.optimalTiming}
          </span>
        )}
      </div>

      {/* Pricing block */}
      <div className="px-6 pb-4 space-y-2">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#8a7a65' }}>Stay + experiences</span>
          <span className="font-serif text-xl" style={{ color: '#c9a96e' }}>
            {formatPrice(option.priceRange.perPersonMin)}–{formatPrice(option.priceRange.perPersonMax)}
            <span className="text-xs font-light ml-1" style={{ color: '#8a7a65' }}>pp</span>
          </span>
        </div>

        {option.flightEstimate && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'rgba(10,10,10,0.5)', border: '1px solid rgba(201,169,110,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <Plane className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8a7a65' }} />
              <div>
                <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#8a7a65' }}>Flights (round-trip)</span>
                {option.flightEstimate.carriers?.length > 0 && (
                  <p className="text-[9px] leading-tight mt-0.5" style={{ color: 'rgba(138,122,101,0.6)' }}>
                    {option.flightEstimate.carriers.join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <span className="text-base font-light" style={{ color: '#f5f0e8' }}>
              {formatPrice(option.flightEstimate.perPersonMin)}–{formatPrice(option.flightEstimate.perPersonMax)}
              <span className="text-xs ml-1" style={{ color: '#8a7a65' }}>pp</span>
            </span>
          </div>
        )}
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

      {/* Local transport */}
      {option.localTransport && option.localTransport.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">Getting around</p>
          <ul className="space-y-1.5">
            {option.localTransport.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Bus className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

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
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">A-Moment's take</p>
          <p className="text-sm leading-relaxed italic text-foreground/80">{option.whyThisWorks}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onChoose(option)}
          disabled={isChoosing}
          className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-50"
          style={{
            border: '1px solid rgba(201,169,110,0.3)',
            color: '#c9a96e',
            background: 'rgba(201,169,110,0.04)',
          }}
        >
          <span>{isChoosing ? 'Locking in your plan…' : 'Choose this plan'}</span>
          <span className="font-light tracking-[-0.08em] text-base">→</span>
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
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-3">A-Moment is thinking.</h2>
      <p
        key={lineIdx}
        className="text-muted-foreground text-base max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {LOADING_LINES[lineIdx]}
      </p>
    </div>
  );
}

function formatOptionsMessage(eventTitle: string, options: PlanOption[]): string {
  const lines: string[] = [
    `🎉 6 ideas for ${eventTitle}:`,
    '',
  ];
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
  options.forEach((opt, i) => {
    lines.push(`${i + 1}. ${opt.name}`);
    lines.push(`   ${opt.tagline}`);
    lines.push(`   📍 ${opt.destination} · ${opt.duration} · ${fmt(opt.priceRange.perPersonMin)}–${fmt(opt.priceRange.perPersonMax)} pp`);
    if (i < options.length - 1) lines.push('');
  });
  lines.push('');
  lines.push('Which catches your eye?');
  return lines.join('\n');
}

function ShareOptionsBar({ options, eventTitle }: { options: PlanOption[]; eventTitle: string }) {
  const [copied, setCopied] = useState(false);

  const message = formatOptionsMessage(eventTitle, options);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  return (
    <div
      className="mt-12 p-6"
      style={{ border: '1px solid rgba(201,169,110,0.18)', background: 'rgba(201,169,110,0.03)' }}
    >
      <p className="uppercase text-[10px] tracking-[0.22em] mb-4" style={{ color: '#8a7a65', borderBottom: '1px solid rgba(201,169,110,0.1)', paddingBottom: '12px' }}>
        Share these options
      </p>
      <p className="text-sm font-light mb-5" style={{ color: '#8a7a65' }}>
        Send all 6 plans to a friend or partner so they can weigh in before you decide.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{
            border: '1px solid rgba(201,169,110,0.35)',
            color: copied ? '#c9a96e' : '#f5f0e8',
            background: copied ? 'rgba(201,169,110,0.08)' : 'transparent',
          }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.2)', color: '#8a7a65' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a7a65')}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={handleSMS}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{ border: '1px solid rgba(201,169,110,0.2)', color: '#8a7a65' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a7a65')}
        >
          <MessageSquare className="w-4 h-4" />
          iMessage / SMS
        </button>
      </div>
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
      {/* Progress — gold hairline at top */}
      <div className="h-px" style={{ background: '#c9a96e' }} />

      <div className="flex-1 mx-auto px-8 md:px-16 py-12 md:py-20 max-w-7xl w-full">
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
            <div className="mb-12">
              <p className="uppercase text-[10px] tracking-[0.22em] mb-5" style={{ color: '#8a7a65' }}>
                Your options
              </p>
              <h1 className="font-serif text-4xl md:text-6xl mb-4" style={{ color: '#f5f0e8' }}>
                Six directions.{' '}
                <span className="italic" style={{ color: '#8a7a65' }}>Pick one.</span>
              </h1>
              <p className="text-sm font-light max-w-lg leading-relaxed" style={{ color: '#8a7a65' }}>
                Each is a real, specific plan. Once you choose, A-Moment will help you lock in every detail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

            <div className="mt-10 flex justify-center">
              <button
                onClick={handleRetry}
                className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-colors"
                style={{ color: '#8a7a65' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a96e')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a7a65')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>None of these. Show me different options</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
