import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateEvent } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Loader2, MapPin, Calendar, Users, Sparkles, Check } from 'lucide-react';

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
      className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
          : 'border-border/50 hover:border-primary/40 bg-card'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className="font-medium text-sm leading-snug">{label}</div>
      {desc && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>}
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
      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border bg-card hover:border-primary/50 text-foreground'
      }`}
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
      {/* Progress bar */}
      <div className="h-1 bg-border/30">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-14 max-w-4xl">

        {/* ══════════ STEP 0: Who & What ══════════════════════════════ */}
        {step === 0 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 1 of 3</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">Who & what?</h1>
              <p className="text-base text-muted-foreground">Who is this for, and what are you celebrating?</p>
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
                    After creating the event you can send them a short questionnaire — their answers feed straight into Cele.
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
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 1: Experience & Vibe ═══════════════════════ */}
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 2 of 3</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">What kind of experience?</h1>
              <p className="text-base text-muted-foreground">Pick what resonates — Cele can mix and match.</p>
            </div>

            {/* Experience types */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Experience type <span className="font-normal">(pick as many as you like)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EXPERIENCES.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleExp(e.id)}
                    className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                      experiences.includes(e.id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/60 hover:border-primary/40 bg-card'
                    }`}
                  >
                    {experiences.includes(e.id) && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-2xl flex-shrink-0 mt-0.5">{e.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{e.label}</div>
                      <div className="text-xs text-muted-foreground leading-snug mt-0.5">{e.examples}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe */}
            <div className="mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-3">Energy / vibe <span className="font-normal">(pick one or two)</span></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                      vibes.includes(v.id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/60 hover:border-primary/40 bg-card'
                    }`}
                  >
                    {vibes.includes(v.id) && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div className="text-2xl mb-1.5">{v.icon}</div>
                    <div className="font-semibold text-sm">{v.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {experiences.length > 0 || vibes.length > 0 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 2: The Details ══════════════════════════════ */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-8">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 3 of 3</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">The details.</h1>
              <p className="text-base text-muted-foreground">Rough is fine — Cele fills in the rest.</p>
            </div>

            <div className="max-w-xl space-y-8">

              {/* Date — fixed vs flexible toggle */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Calendar className="w-3.5 h-3.5" /> When?
                </label>
                {/* Toggle */}
                <div className="inline-flex rounded-full border border-border bg-muted p-0.5 mb-4">
                  {(['fixed', 'flexible'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDateType(t)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        dateType === t
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
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
                      className="text-base bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors"
                    />
                  </div>
                )}

                {dateType === 'flexible' && (
                  <div className="animate-in fade-in duration-200 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Around which month?</p>
                      <div className="flex flex-wrap gap-2">
                        {MONTHS.map((m) => (
                          <Pill key={m} label={m} selected={flexMonth === m} onClick={() => setFlexMonth(flexMonth === m ? '' : m)} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">How long?</p>
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
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
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
                <label className="text-sm font-medium text-muted-foreground block mb-3">
                  Budget feel <span className="font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudget(budget === b.id ? '' : b.id)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        budget === b.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <span className="font-medium">{b.label}</span>
                      <span className="text-xs ml-1.5 opacity-70">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality section — only for "myself" path */}
              {planningFor === 'myself' && (
                <div className="border-t border-border/40 pt-7 space-y-6 animate-in fade-in duration-300">
                  <div>
                    <p className="text-sm font-medium mb-0.5">A couple of things about you</p>
                    <p className="text-xs text-muted-foreground">Optional — helps Cele curate for you specifically, not just the event.</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">How do you travel?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TRAVEL_STYLES.map((ts) => (
                        <button
                          key={ts.id}
                          type="button"
                          onClick={() => setTravelStyle(travelStyle === ts.id ? '' : ts.id)}
                          className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                            travelStyle === ts.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50 hover:border-primary/40 bg-card'
                          }`}
                        >
                          {travelStyle === ts.id && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span className="text-lg">{ts.icon}</span>
                          <div className="font-medium text-sm mt-1">{ts.label}</div>
                          <div className="text-xs text-muted-foreground">{ts.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">What kills a trip for you?</p>
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
            <div className="mt-12 flex flex-col items-end gap-2">
              <button
                onClick={handleSubmit}
                disabled={createEvent.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-9 py-4 rounded-full font-medium text-base hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
              >
                {createEvent.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {planningFor === 'someone' ? 'Creating...' : 'Building your options...'}</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> {planningFor === 'someone' ? 'Create event' : 'Show me my options'}</>
                )}
              </button>
              {createEvent.isError && (
                <p className="text-xs text-destructive">Something went wrong — please try again.</p>
              )}
              <p className="text-xs text-muted-foreground">
                {planningFor === 'someone'
                  ? "You'll get a link to share with them — their answers feed straight into Cele."
                  : 'Cele will propose 6 plans — pick one, then refine it in conversation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
