import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateEvent } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Loader2, MapPin, Calendar, Users, Check } from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────── */
const OCCASIONS = [
  { id: 'birthday',    label: 'Birthday',         icon: '🎂' },
  { id: 'anniversary', label: 'Anniversary',       icon: '🥂' },
  { id: 'wedding',     label: 'Wedding',           icon: '💍' },
  { id: 'graduation',  label: 'Graduation',        icon: '🎓' },
  { id: 'retirement',  label: 'Retirement',        icon: '🌅' },
  { id: 'babymoon',    label: 'Babymoon',          icon: '🌙' },
  { id: 'reunion',     label: 'Reunion',           icon: '🫂' },
  { id: 'corporate',   label: 'Team / Corporate',  icon: '🏢' },
  { id: 'other',       label: 'No special reason', icon: '✨' },
];

const EXPERIENCES = [
  { id: 'adventure',  label: 'Adventure',          icon: '⛰️',  examples: 'Hiking, safari, cycling, climbing' },
  { id: 'food-wine',  label: 'Food & Wine',        icon: '🍷',  examples: 'Winery, chef\'s table, distillery' },
  { id: 'on-water',   label: 'On the Water',       icon: '🚢',  examples: 'Cruise, sailing, island, houseboat' },
  { id: 'wellness',   label: 'Wellness',           icon: '🧘',  examples: 'Spa, yoga retreat, forest cabin' },
  { id: 'arts',       label: 'Arts & Culture',     icon: '🎨',  examples: 'Galleries, festivals, architecture' },
  { id: 'beach',      label: 'Beach & Sun',        icon: '🏖️',  examples: 'Tropical escapes, reef days, poolside' },
  { id: 'snow',       label: 'Snow & Mountains',   icon: '🎿',  examples: 'Ski resort, alpine lodge' },
  { id: 'nightlife',  label: 'Nightlife & Dining', icon: '🕯️',  examples: 'Dinner parties, rooftop bars' },
  { id: 'big-trip',   label: 'Big Trip',           icon: '✈️',  examples: 'Multi-destination, bucket list' },
  { id: 'staycation', label: 'Stay Local',         icon: '🏡',  examples: 'Nearby escapes, city hotels' },
];

const VIBES = [
  { id: 'intimate',    label: 'Intimate',       icon: '🤍', desc: 'Small, meaningful, nothing performative' },
  { id: 'adventurous', label: 'Adventurous',    icon: '⚡', desc: 'Push limits and earn the stories' },
  { id: 'luxurious',   label: 'Luxurious',      icon: '✨', desc: 'Elevated, thoughtful, no detail left to chance' },
  { id: 'wild',        label: 'Wild',           icon: '🔥', desc: 'High energy, late nights' },
  { id: 'restorative', label: 'Restorative',    icon: '🌿', desc: 'Slow down, breathe, leave feeling better' },
  { id: 'cultural',    label: 'Cultural',       icon: '🗺️', desc: 'Curious, immersive, leaves you knowing more' },
];

const BUDGETS = [
  { id: 'budget',       label: 'Budget-conscious', desc: 'Smart value, no waste' },
  { id: 'mid-range',    label: 'Mid-range',         desc: 'Comfortable and considered' },
  { id: 'luxury',       label: 'Luxury',             desc: 'Premium experiences' },
  { id: 'ultra-luxury', label: 'Ultra-luxury',       desc: 'Money is not the constraint' },
];

const GROUP_SIZES = [
  { label: 'Just us 2', value: '2' },
  { label: '3–5',       value: '4' },
  { label: '6–10',      value: '8' },
  { label: '11–20',     value: '15' },
  { label: '20–50',     value: '35' },
  { label: '50+',       value: '60' },
];

const TRAVEL_STYLES = [
  { id: 'luxury',           label: 'Luxury',            icon: '✨', desc: 'Elevated comfort, no compromises' },
  { id: 'adventurous',      label: 'Adventurous',       icon: '⛰️', desc: 'Off the beaten track' },
  { id: 'local-first',      label: 'Local-first',       icon: '🗺️', desc: 'Authentic, neighbourhood-level' },
  { id: 'go-with-the-flow', label: 'Go with the flow',  icon: '🌊', desc: 'Spontaneous, low-planning' },
];

const DEALBREAKERS = [
  { id: 'crowds',                    label: 'Crowds' },
  { id: 'rigid-itineraries',         label: 'Rigid itineraries' },
  { id: 'too-far-from-city',         label: 'Too far from a city' },
  { id: 'roughing-it',               label: 'Roughing it' },
  { id: 'being-centre-of-attention', label: 'Being the centre of attention' },
  { id: 'early-mornings',            label: 'Early mornings' },
];

const AGE_RANGES = ['Under 21', '21–29', '30s', '40s', '50s', '60s', '70+'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DURATIONS = [
  { id: 'day',      label: 'A day trip' },
  { id: 'weekend',  label: 'A long weekend' },
  { id: 'week',     label: 'About a week' },
  { id: 'twoweeks', label: '2 weeks+' },
];

/* ─── Chip primitives ───────────────────────────────────────────────── */
function SelectCard({
  icon, label, desc, selected, onClick,
}: { icon?: string; label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-4 text-left transition-all duration-150"
      style={{
        border: selected ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.12)',
        background: selected ? 'rgba(201,169,110,0.06)' : '#141414',
      }}
    >
      {selected && (
        <span
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center"
          style={{ background: '#c9a96e' }}
        >
          <Check className="w-3 h-3" style={{ color: '#0a0a0a' }} />
        </span>
      )}
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className="text-sm leading-snug font-light" style={{ color: selected ? '#c9a96e' : '#f5f0e8' }}>{label}</div>
      {desc && <div className="text-xs mt-0.5 leading-snug font-light" style={{ color: '#8a7a65' }}>{desc}</div>}
    </button>
  );
}

function Pill({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-sm font-light transition-all"
      style={{
        border: selected ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.15)',
        color: selected ? '#c9a96e' : '#8a7a65',
        background: selected ? 'rgba(201,169,110,0.06)' : 'transparent',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export function NewEvent() {
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState(0);

  // ── Step 0 state
  const [planningFor, setPlanningFor] = useState<'myself' | 'someone' | ''>('');
  const [celebrantName, setCelebrantName] = useState('');
  const [occasion, setOccasion] = useState('');

  const [celebrantAge, setCelebrantAge] = useState('');

  // ── Step 1 state
  const [experiences, setExperiences] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  // ── Step 2 state
  const [dateType, setDateType] = useState<'fixed' | 'flexible'>('fixed');
  const [fixedDate, setFixedDate] = useState('');
  const [flexMonth, setFlexMonth] = useState('');
  const [flexDuration, setFlexDuration] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budget, setBudget] = useState('');
  // Personality (for myself path)
  const [travelStyle, setTravelStyle] = useState('');
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);

  const toggleExp = (id: string) =>
    setExperiences((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleVibe = (id: string) =>
    setVibes((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleDealer = (id: string) =>
    setDealbreakers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const derivedType = occasion || experiences[0] || 'other';

  /* ── Build description with semantic markers ── */
  const buildDescription = (): string | undefined => {
    const lines: string[] = [];

    // Human-readable summary line
    const summary: string[] = [];
    if (planningFor === 'someone' && celebrantName) summary.push(`Planning for ${celebrantName}`);
    if (occasion) {
      const o = OCCASIONS.find((x) => x.id === occasion);
      if (o) summary.push(`Occasion: ${o.label}`);
    }
    if (experiences.length > 0) {
      const labels = experiences.map((e) => EXPERIENCES.find((x) => x.id === e)?.label ?? e);
      summary.push(`Experience: ${labels.join(', ')}`);
    }
    if (vibes.length > 0) {
      const labels = vibes.map((v) => VIBES.find((x) => x.id === v)?.label ?? v);
      summary.push(`Vibe: ${labels.join(' + ')}`);
    }
    if (summary.length > 0) lines.push(summary.join(' · '));

    // Planning for marker
    if (planningFor) {
      lines.push(`__PLANNING_FOR__:${planningFor}${planningFor === 'someone' && celebrantName ? `:${celebrantName}` : ''}`);
    }

    // Date markers
    if (dateType === 'fixed' && fixedDate) {
      lines.push('__DATE_TYPE__:fixed');
    } else if (dateType === 'flexible' && (flexMonth || flexDuration)) {
      lines.push('__DATE_TYPE__:flexible');
      lines.push(`__DATE_FLEXIBLE__:${JSON.stringify({ month: flexMonth, duration: flexDuration })}`);
    }

    // Age / age range
    if (celebrantAge) {
      lines.push(`__AGE__:${celebrantAge}`);
    }

    // Personality (myself path)
    if (planningFor === 'myself' && (travelStyle || dealbreakers.length > 0)) {
      lines.push(`__PERSONALITY__:${JSON.stringify({ travelStyle, dealbreakers })}`);
    }

    return lines.length > 0 ? lines.join('\n') : undefined;
  };

  /* ── Submit ── */
  const handleSubmit = () => {
    const year = new Date().getFullYear();
    const celebrantPart = planningFor === 'someone' && celebrantName ? `${celebrantName}'s ` : '';
    const occasionLabel = OCCASIONS.find((x) => x.id === occasion)?.label;
    const expLabel = EXPERIENCES.find((x) => x.id === experiences[0])?.label;
    const fallbackTitle = occasionLabel
      ? `${celebrantPart}${occasionLabel} ${year}`
      : expLabel
      ? `${celebrantPart}${expLabel} ${year}`
      : `${celebrantPart}Celebration ${year}`;

    const startDate = dateType === 'fixed' && fixedDate
      ? new Date(fixedDate).toISOString()
      : undefined;

    createEvent.mutate(
      {
        data: {
          type: derivedType,
          title: fallbackTitle,
          isInternational: false,
          startDate,
          guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
          budget: budget || undefined,
          description: buildDescription(),
        },
      },
      {
        onSuccess: (event) => {
          const token = (event as any).questionnaireToken ?? '';
          if (planningFor === 'someone') {
            setLocation(`/events/${event.id}/share?token=${token}`);
          } else {
            setLocation(`/events/${event.id}/options`);
          }
        },
      }
    );
  };

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Progress bar — gold hairline */}
      <div className="h-px" style={{ background: 'rgba(201,169,110,0.1)' }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: '#c9a96e', height: '1px' }}
        />
      </div>

      <div className="flex-1 flex flex-col mx-auto px-8 md:px-16 py-12 md:py-20 max-w-4xl w-full">

        {/* ══════════ STEP 0: Who & What ══════════════════════════════ */}
        {step === 0 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-10">
              <p className="uppercase text-[10px] tracking-[0.22em] mb-4" style={{ color: '#8a7a65' }}>Step 1 of 3</p>
              <h1 className="font-serif text-3xl md:text-5xl mb-2" style={{ color: '#f5f0e8' }}>Who & what?</h1>
              <p className="text-sm font-light" style={{ color: '#8a7a65' }}>Who is this for, and what are you celebrating?</p>
            </div>

            {/* Who is this for */}
            <div className="mb-7">
              <p className="text-sm font-medium text-muted-foreground mb-3">Who are you planning this for?</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { id: 'myself',  label: 'Myself',       icon: '🙋', desc: "I\'m the one celebrating" },
                  { id: 'someone', label: 'Someone else', icon: '🎁', desc: "I\'m organising it for them" },
                ].map((pf) => (
                  <SelectCard
                    key={pf.id}
                    icon={pf.icon}
                    label={pf.label}
                    desc={pf.desc}
                    selected={planningFor === pf.id}
                    onClick={() => setPlanningFor(pf.id as 'myself' | 'someone')}
                  />
                ))}
              </div>

              {planningFor === 'someone' && (
                <div className="mt-4 max-w-xs animate-in fade-in duration-300">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Their name <span className="font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah"
                    value={celebrantName}
                    onChange={(e) => setCelebrantName(e.target.value)}
                    className="w-full text-lg bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    After creating the event you can send them a short questionnaire — their answers feed straight into A-Moment.
                  </p>
                </div>
              )}

              {planningFor && (
                <div className="mt-6 max-w-sm animate-in fade-in duration-300">
                  <label className="text-sm font-medium text-muted-foreground block mb-3">
                    {planningFor === 'myself' ? 'Your age range' : 'Their age range'}{' '}
                    <span className="font-normal">(optional — shapes every recommendation)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map(r => (
                      <Pill
                        key={r}
                        label={r}
                        selected={celebrantAge === r}
                        onClick={() => setCelebrantAge(celebrantAge === r ? '' : r)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Occasion */}
            <div className="mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                What is the occasion? <span className="font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {OCCASIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOccasion(occasion === o.id ? '' : o.id)}
                    className={`relative p-3 rounded-2xl border-2 text-center transition-all duration-150 ${
                      occasion === o.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/40 bg-card'
                    }`}
                  >
                    {occasion === o.id && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <div className="text-xl mb-1">{o.icon}</div>
                    <div className="font-medium text-xs leading-snug">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!planningFor}
                className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-30"
                style={{ color: '#c9a96e' }}
              >
                <span>Continue</span>
                <span className="font-light tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300">———›</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 1: Experience & Vibe ═══════════════════════ */}
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-colors mb-8"
              style={{ color: '#8a7a65' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="mb-10">
              <p className="uppercase text-[10px] tracking-[0.22em] mb-4" style={{ color: '#8a7a65' }}>Step 2 of 3</p>
              <h1 className="font-serif text-3xl md:text-5xl mb-2" style={{ color: '#f5f0e8' }}>What kind of experience?</h1>
              <p className="text-sm font-light" style={{ color: '#8a7a65' }}>Pick what resonates — A-Moment can mix and match.</p>
            </div>

            {/* Experience types */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.18em] uppercase mb-4" style={{ color: '#8a7a65' }}>
                Experience type <span className="opacity-60">(pick as many as you like)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EXPERIENCES.map((e) => {
                  const sel = experiences.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleExp(e.id)}
                      className="relative flex items-start gap-3 p-4 text-left transition-all duration-150"
                      style={{
                        border: sel ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.12)',
                        background: sel ? 'rgba(201,169,110,0.06)' : '#141414',
                      }}
                    >
                      {sel && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center"
                          style={{ background: '#c9a96e' }}
                        >
                          <Check className="w-3 h-3" style={{ color: '#0a0a0a' }} />
                        </span>
                      )}
                      <span className="text-2xl flex-shrink-0 mt-0.5">{e.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-light" style={{ color: sel ? '#c9a96e' : '#f5f0e8' }}>{e.label}</div>
                        <div className="text-xs leading-snug mt-0.5 font-light" style={{ color: '#8a7a65' }}>{e.examples}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vibe */}
            <div className="mb-10">
              <p className="text-[10px] tracking-[0.18em] uppercase mb-4" style={{ color: '#8a7a65' }}>
                Energy / vibe <span className="opacity-60">(pick one or two)</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VIBES.map((v) => {
                  const sel = vibes.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVibe(v.id)}
                      className="relative p-4 text-left transition-all duration-150"
                      style={{
                        border: sel ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.12)',
                        background: sel ? 'rgba(201,169,110,0.06)' : '#141414',
                      }}
                    >
                      {sel && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center"
                          style={{ background: '#c9a96e' }}
                        >
                          <Check className="w-3 h-3" style={{ color: '#0a0a0a' }} />
                        </span>
                      )}
                      <div className="text-2xl mb-2">{v.icon}</div>
                      <div className="text-sm font-light" style={{ color: sel ? '#c9a96e' : '#f5f0e8' }}>{v.label}</div>
                      <div className="text-xs font-light mt-0.5 leading-relaxed" style={{ color: '#8a7a65' }}>{v.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-[10px] tracking-[0.15em] uppercase transition-colors"
                style={{ color: '#8a7a65' }}
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(2)}
                className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-all"
                style={{ color: '#c9a96e' }}
              >
                <span>{experiences.length > 0 || vibes.length > 0 ? 'Continue' : 'Skip'}</span>
                <span className="font-light tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300">———›</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 2: The Details ══════════════════════════════ */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-colors mb-8"
              style={{ color: '#8a7a65' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="mb-10">
              <p className="uppercase text-[10px] tracking-[0.22em] mb-4" style={{ color: '#8a7a65' }}>Step 3 of 3</p>
              <h1 className="font-serif text-3xl md:text-5xl mb-2" style={{ color: '#f5f0e8' }}>The details.</h1>
              <p className="text-sm font-light" style={{ color: '#8a7a65' }}>Rough is fine — A-Moment fills in the rest.</p>
            </div>

            <div className="max-w-xl space-y-8">

              {/* Date — fixed vs flexible toggle */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Calendar className="w-3.5 h-3.5" /> When?
                </label>
                {/* Toggle */}
                <div className="inline-flex mb-4" style={{ border: '1px solid rgba(201,169,110,0.15)' }}>
                  {(['fixed', 'flexible'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDateType(t)}
                      className="px-4 py-2 text-xs tracking-[0.12em] uppercase transition-all"
                      style={{
                        background: dateType === t ? 'rgba(201,169,110,0.1)' : 'transparent',
                        color: dateType === t ? '#c9a96e' : '#8a7a65',
                        borderRight: t === 'fixed' ? '1px solid rgba(201,169,110,0.15)' : undefined,
                      }}
                    >
                      {t === 'fixed' ? 'Fixed date' : 'Flexible window'}
                    </button>
                  ))}
                </div>

                {dateType === 'fixed' && (
                  <div className="animate-in fade-in duration-200">
                    <input
                      type="date"
                      value={fixedDate}
                      onChange={(e) => setFixedDate(e.target.value)}
                      className="text-base outline-none py-2 px-0 transition-colors font-light bg-transparent"
                      style={{ borderBottom: '1px solid rgba(201,169,110,0.3)', color: '#f5f0e8' }}
                    />
                  </div>
                )}

                {dateType === 'flexible' && (
                  <div className="animate-in fade-in duration-200 space-y-3">
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: '#8a7a65' }}>Around which month?</p>
                      <div className="flex flex-wrap gap-2">
                        {MONTHS.map((m) => (
                          <Pill key={m} label={m} selected={flexMonth === m} onClick={() => setFlexMonth(flexMonth === m ? '' : m)} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: '#8a7a65' }}>How long?</p>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map((d) => (
                          <Pill key={d.id} label={d.label} selected={flexDuration === d.id} onClick={() => setFlexDuration(flexDuration === d.id ? '' : d.id)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Group size */}
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase flex items-center gap-1.5 mb-4" style={{ color: '#8a7a65' }}>
                  <Users className="w-3.5 h-3.5" /> How many people?
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_SIZES.map((g) => (
                    <Pill key={g.value} label={g.label} selected={guestCount === g.value} onClick={() => setGuestCount(guestCount === g.value ? '' : g.value)} />
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase block mb-4" style={{ color: '#8a7a65' }}>
                  Budget feel <span className="opacity-60">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => {
                    const sel = budget === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBudget(budget === b.id ? '' : b.id)}
                        className="px-4 py-2 text-sm font-light transition-all"
                        style={{
                          border: sel ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.15)',
                          color: sel ? '#c9a96e' : '#8a7a65',
                          background: sel ? 'rgba(201,169,110,0.06)' : 'transparent',
                        }}
                      >
                        <span>{b.label}</span>
                        <span className="text-xs ml-1.5 opacity-60">{b.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personality section — only for "myself" path */}
              {planningFor === 'myself' && (
                <div className="pt-7 space-y-6 animate-in fade-in duration-300" style={{ borderTop: '1px solid rgba(201,169,110,0.1)' }}>
                  <div>
                    <p className="text-sm font-light mb-0.5" style={{ color: '#f5f0e8' }}>A couple of things about you</p>
                    <p className="text-xs font-light" style={{ color: '#8a7a65' }}>Optional — helps A-Moment curate for you specifically, not just the event.</p>
                  </div>

                  <div>
                    <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>How do you travel?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TRAVEL_STYLES.map((ts) => {
                        const sel = travelStyle === ts.id;
                        return (
                          <button
                            key={ts.id}
                            type="button"
                            onClick={() => setTravelStyle(travelStyle === ts.id ? '' : ts.id)}
                            className="relative p-3 text-left transition-all"
                            style={{
                              border: sel ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(201,169,110,0.12)',
                              background: sel ? 'rgba(201,169,110,0.06)' : '#141414',
                            }}
                          >
                            {sel && (
                              <span
                                className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center"
                                style={{ background: '#c9a96e' }}
                              >
                                <Check className="w-2.5 h-2.5" style={{ color: '#0a0a0a' }} />
                              </span>
                            )}
                            <span className="text-lg">{ts.icon}</span>
                            <div className="text-sm font-light mt-1" style={{ color: sel ? '#c9a96e' : '#f5f0e8' }}>{ts.label}</div>
                            <div className="text-xs font-light" style={{ color: '#8a7a65' }}>{ts.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>What kills a trip for you?</p>
                    <div className="flex flex-wrap gap-2">
                      {DEALBREAKERS.map((d) => (
                        <Pill
                          key={d.id}
                          label={d.label}
                          selected={dealbreakers.includes(d.id)}
                          onClick={() => toggleDealer(d.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Submit */}
            <div className="mt-12 flex flex-col items-end gap-3">
              <button
                onClick={handleSubmit}
                disabled={createEvent.isPending}
                className="group flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-40"
                style={{ color: '#c9a96e' }}
              >
                {createEvent.isPending ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {planningFor === 'someone' ? 'Creating...' : 'Building your options...'}
                  </span>
                ) : (
                  <>
                    <span>{planningFor === 'someone' ? 'Create event' : 'Show me my options'}</span>
                    <span className="font-light tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300">———›</span>
                  </>
                )}
              </button>
              {createEvent.isError && (
                <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>Something went wrong — please try again.</p>
              )}
              <p className="text-[10px] font-light text-right max-w-xs" style={{ color: '#8a7a65' }}>
                {planningFor === 'someone'
                  ? "You'll get a link to share with them — their answers feed straight into A-Moment."
                  : 'A-Moment will propose 6 plans — pick one, then refine it in conversation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
