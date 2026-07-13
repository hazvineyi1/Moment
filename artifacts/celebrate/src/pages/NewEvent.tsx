import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateEvent } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Loader2, MapPin, Calendar, Users, Sparkles, Check } from 'lucide-react';

/* ─── Step 1: Occasion ──────────────────────────────────────────────── */
const OCCASIONS = [
  { id: 'birthday',    label: 'Birthday',          icon: '🎂', desc: 'Marking another year in style' },
  { id: 'anniversary', label: 'Anniversary',        icon: '🥂', desc: 'Milestones, renewals, romantic escapes' },
  { id: 'wedding',     label: 'Wedding',            icon: '💍', desc: 'Elopements to grand destination ceremonies' },
  { id: 'graduation',  label: 'Graduation',         icon: '🎓', desc: 'The end of one chapter, the start of another' },
  { id: 'retirement',  label: 'Retirement',         icon: '🌅', desc: 'A send-off worthy of a life well-worked' },
  { id: 'babymoon',    label: 'Babymoon',           icon: '🌙', desc: 'A last great escape before the family grows' },
  { id: 'reunion',     label: 'Reunion',            icon: '🫂', desc: 'Old friends, family, people who matter' },
  { id: 'corporate',   label: 'Team / Corporate',   icon: '🏢', desc: 'Retreats, offsites, incentive trips' },
  { id: 'other',       label: 'No special reason',  icon: '✨', desc: "Just want to do something worth remembering" },
];

/* ─── Step 2: Experience (multi-select) ─────────────────────────────── */
const EXPERIENCES = [
  { id: 'adventure',   label: 'Adventure',          icon: '⛰️',  examples: 'Hiking, safari, cycling, climbing' },
  { id: 'food-wine',   label: 'Food & Wine',        icon: '🍷',  examples: 'Winery, chef\'s table, distillery, culinary tour' },
  { id: 'on-water',    label: 'On the Water',       icon: '🚢',  examples: 'Cruise, sailing, island, houseboat' },
  { id: 'wellness',    label: 'Wellness',           icon: '🧘',  examples: 'Spa, yoga retreat, thermal baths, forest cabin' },
  { id: 'arts',        label: 'Arts & Culture',     icon: '🎨',  examples: 'Galleries, festivals, architecture, music' },
  { id: 'beach',       label: 'Beach & Sun',        icon: '🏖️',  examples: 'Tropical escapes, reef days, poolside' },
  { id: 'snow',        label: 'Snow & Mountains',   icon: '🎿',  examples: 'Ski resort, alpine lodge, mountain hut' },
  { id: 'nightlife',   label: 'Nightlife & Dining', icon: '🕯️',  examples: 'Dinner parties, rooftop bars, city weekends' },
  { id: 'big-trip',    label: 'Big Trip',           icon: '✈️',  examples: 'Multi-destination, long-haul, bucket list' },
  { id: 'staycation',  label: 'Stay Local',         icon: '🏡',  examples: 'Nearby escapes, country house, city hotels' },
];

/* ─── Step 3: Vibe (multi-select, pick 1-2) ─────────────────────────── */
const VIBES = [
  { id: 'intimate',    label: 'Intimate',       icon: '🤍', desc: 'Small, meaningful, nothing performative' },
  { id: 'adventurous', label: 'Adventurous',    icon: '⚡', desc: 'Push limits and earn the stories' },
  { id: 'luxurious',   label: 'Luxurious',      icon: '✨', desc: 'Elevated, thoughtful, no detail left to chance' },
  { id: 'wild',        label: 'Wild',           icon: '🔥', desc: "High energy, late nights, the ones you'll talk about" },
  { id: 'restorative', label: 'Restorative',    icon: '🌿', desc: 'Slow down, breathe, leave feeling genuinely better' },
  { id: 'cultural',    label: 'Cultural',       icon: '🗺️', desc: 'Curious, immersive, leaves you knowing more' },
];

/* ─── Step 4: Group makeup ──────────────────────────────────────────── */
const GROUP_TYPES = [
  { id: 'just-us',     label: 'Just the two of us',   icon: '👫', desc: 'Couples travel, romantic escape' },
  { id: 'close',       label: 'Close friends',         icon: '🥂', desc: 'Small tight-knit group, 3–8 people' },
  { id: 'large-group', label: 'Large friend group',    icon: '🎉', desc: '10 or more, high energy, logistics matter' },
  { id: 'family',      label: 'Family (all ages)',     icon: '👨‍👩‍👧', desc: 'Multiple generations, kids likely in the mix' },
  { id: 'adult-fam',   label: 'Adults-only family',   icon: '🍷', desc: 'No little ones — grown-up version of family' },
  { id: 'colleagues',  label: 'Work / colleagues',    icon: '💼', desc: 'Team retreat, offsite, incentive trip' },
  { id: 'mixed',       label: 'Mixed crowd',           icon: '🌐', desc: "Friends, partners, plus-ones — everyone's there" },
  { id: 'solo',        label: 'Solo trip',             icon: '🎒', desc: "Just me — celebrating on my own terms" },
];

/* ─── Step 5: Must-haves ────────────────────────────────────────────── */
const MUST_HAVES = [
  { id: 'private',       label: 'Private / exclusive',   icon: '🔐', desc: 'No sharing venues with strangers' },
  { id: 'all-inclusive', label: 'All-inclusive',          icon: '🍽️', desc: 'Food, drink, activities — covered' },
  { id: 'no-flights',    label: 'No flights',             icon: '🚗', desc: 'Driveable or train, please' },
  { id: 'kid-friendly',  label: 'Kid-friendly',           icon: '🧒', desc: 'Little ones need to be catered for' },
  { id: 'accessible',    label: 'Fully accessible',       icon: '♿', desc: 'Mobility needs in the group' },
  { id: 'vegan',         label: 'Dietary options',        icon: '🥗', desc: 'Vegan, halal, gluten-free, or other' },
  { id: 'turnkey',       label: 'Turnkey / minimal work', icon: '🎁', desc: 'I want to show up and it just works' },
  { id: 'surprise',      label: "It's a surprise",        icon: '🤫', desc: "Guests don't know what's happening" },
  { id: 'pet',           label: 'Pet-friendly',           icon: '🐶', desc: 'At least one four-legged attendee' },
  { id: 'outdoors',      label: 'Must be outdoors',       icon: '🌿', desc: 'Fresh air, nature, no ballrooms' },
];

/* ─── Budget tiers ──────────────────────────────────────────────────── */
const BUDGETS = [
  { id: 'budget',       label: 'Budget-conscious', desc: 'Smart value, no waste' },
  { id: 'mid-range',    label: 'Mid-range',         desc: 'Comfortable and considered' },
  { id: 'luxury',       label: 'Luxury',             desc: 'Premium experiences' },
  { id: 'ultra-luxury', label: 'Ultra-luxury',       desc: 'Money is not the constraint' },
];

/* ─── Group sizes ───────────────────────────────────────────────────── */
const GROUP_SIZES = [
  { label: 'Just us 2', value: '2' },
  { label: '3–5', value: '4' },
  { label: '6–10', value: '8' },
  { label: '11–20', value: '15' },
  { label: '20–50', value: '35' },
  { label: '50+', value: '60' },
];

/* ─── UI primitives ─────────────────────────────────────────────────── */
function ExperienceChip({
  item, selected, onClick,
}: { item: typeof EXPERIENCES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/60 hover:border-primary/40 bg-card'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
      <div className="min-w-0">
        <div className="font-medium text-sm">{item.label}</div>
        <div className="text-xs text-muted-foreground leading-snug mt-0.5">{item.examples}</div>
      </div>
    </button>
  );
}

function VibeChip({
  item, selected, onClick,
}: { item: typeof VIBES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/60 hover:border-primary/40 bg-card'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <div className="text-2xl mb-1.5">{item.icon}</div>
      <div className="font-semibold text-sm">{item.label}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</div>
    </button>
  );
}

/* ─── Who is this for? ───────────────────────────────────────────────── */
const PLANNING_FOR = [
  { id: 'myself',   label: 'Myself',             icon: '🙋', desc: "I'm celebrating — or I'm part of the group" },
  { id: 'someone',  label: 'Someone else',        icon: '🎁', desc: "I'm organising it for them — they may not know yet" },
  { id: 'together', label: "We're planning together", icon: '🤝', desc: "Collaborating with the person being celebrated" },
];

/* ─── Main component ─────────────────────────────────────────────────── */
export function NewEvent() {
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState(0);
  // Step 0: who is this for
  const [planningFor, setPlanningFor] = useState('');
  const [celebrantName, setCelebrantName] = useState('');
  // Step 1: occasion (single)
  const [occasion, setOccasion] = useState('');
  // Step 2: experiences (multi)
  const [experiences, setExperiences] = useState<string[]>([]);
  // Step 3: vibe (multi, soft max 2)
  const [vibes, setVibes] = useState<string[]>([]);
  // Step 4: group type (single)
  const [groupType, setGroupType] = useState('');
  // Step 5: must-haves (multi)
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  // Step 6: details
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    isInternational: false,
    startDate: '',
    endDate: '',
    guestCount: '',
    budget: '',
  });

  const update = (key: string, value: any) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const toggleExperience = (id: string) =>
    setExperiences((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleVibe = (id: string) =>
    setVibes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleMustHave = (id: string) =>
    setMustHaves((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /* derive the event "type" — occasion wins, else primary experience */
  const derivedType = occasion || experiences[0] || 'other';

  const buildDescription = () => {
    const parts: string[] = [];
    if (planningFor && planningFor !== 'myself') {
      const pf = PLANNING_FOR.find((x) => x.id === planningFor);
      if (pf) parts.push(`Planning role: ${pf.label}${celebrantName ? ` (for ${celebrantName})` : ''}`);
    }
    if (occasion) {
      const o = OCCASIONS.find((x) => x.id === occasion);
      if (o) parts.push(`Occasion: ${o.label}`);
    }
    if (experiences.length > 0) {
      const labels = experiences.map((e) => EXPERIENCES.find((x) => x.id === e)?.label ?? e);
      parts.push(`Experience: ${labels.join(', ')}`);
    }
    if (vibes.length > 0) {
      const labels = vibes.map((v) => VIBES.find((x) => x.id === v)?.label ?? v);
      parts.push(`Vibe: ${labels.join(' + ')}`);
    }
    if (groupType) {
      const g = GROUP_TYPES.find((x) => x.id === groupType);
      if (g) parts.push(`Group: ${g.label}`);
    }
    if (mustHaves.length > 0) {
      const labels = mustHaves.map((m) => MUST_HAVES.find((x) => x.id === m)?.label ?? m);
      parts.push(`Must-haves: ${labels.join(', ')}`);
    }
    return parts.join(' · ') || undefined;
  };

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

  const handleSubmit = () => {
    const occasionLabel = OCCASIONS.find((x) => x.id === occasion)?.label;
    const experienceLabel = EXPERIENCES.find((x) => x.id === experiences[0])?.label;
    const celebrantPart = planningFor === 'someone' && celebrantName ? `${celebrantName}'s ` : '';
    const fallbackTitle = occasionLabel
      ? `${celebrantPart}${occasionLabel} ${new Date().getFullYear()}`
      : experienceLabel
      ? `${celebrantPart}${experienceLabel} ${new Date().getFullYear()}`
      : `${celebrantPart}Celebration ${new Date().getFullYear()}`;

    createEvent.mutate(
      {
        data: {
          type: derivedType,
          title: formData.title.trim() || fallbackTitle,
          location: formData.location || undefined,
          isInternational: formData.isInternational,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          guestCount: formData.guestCount ? parseInt(formData.guestCount, 10) : undefined,
          budget: formData.budget || undefined,
          description: buildDescription(),
        },
      },
      {
        onSuccess: (event) => setLocation(`/events/${event.id}/options`),
      }
    );
  };

  const totalSteps = 7;
  const progress = ((step + 1) / totalSteps) * 100;

  const canProceedStep0 = !!planningFor;
  const canProceedStep2 = experiences.length > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Progress bar */}
      <div className="h-1 bg-border/30">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-14 max-w-4xl">

        {/* ── Step 0: Who is this for? ─────────────────────────────── */}
        {step === 1 && false && null}
        {step === 0 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 1 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">Who are you planning this for?</h1>
              <p className="text-base text-muted-foreground">Cele plans very differently depending on your role.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 max-w-2xl">
              {PLANNING_FOR.map((pf) => (
                <button
                  key={pf.id}
                  onClick={() => setPlanningFor(planningFor === pf.id ? '' : pf.id)}
                  className={`relative p-5 text-left rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                    planningFor === pf.id
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 bg-card'
                  }`}
                >
                  {planningFor === pf.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div className="text-3xl mb-3">{pf.icon}</div>
                  <div className="font-semibold text-sm leading-snug">{pf.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{pf.desc}</div>
                </button>
              ))}
            </div>

            {planningFor === 'someone' && (
              <div className="max-w-sm mb-6 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Their name <span className="font-normal">(optional — helps Cele personalise)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah"
                  value={celebrantName}
                  onChange={(e) => setCelebrantName(e.target.value)}
                  className="w-full text-lg bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors placeholder:text-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  After you create the event, you'll get a shareable link you can send them — a short questionnaire that feeds their preferences directly into Cele.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Occasion ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 2 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">What's the occasion?</h1>
              <p className="text-base text-muted-foreground">Pick one — or skip if it's just a great excuse to celebrate.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-6">
              {OCCASIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOccasion(occasion === o.id ? '' : o.id)}
                  className={`relative p-4 text-left rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                    occasion === o.id
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 bg-card'
                  }`}
                >
                  {occasion === o.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <div className="font-medium text-sm leading-snug">{o.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{o.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
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
                {occasion ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Experiences ──────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 3 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">What kind of experience?</h1>
              <p className="text-base text-muted-foreground">
                Pick as many as you like — Cele can mix and match.
                {occasion && (
                  <span className="ml-1 text-primary font-medium">
                    ({OCCASIONS.find((o) => o.id === occasion)?.label} + …)
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
              {EXPERIENCES.map((e) => (
                <ExperienceChip
                  key={e.id}
                  item={e}
                  selected={experiences.includes(e.id)}
                  onClick={() => toggleExperience(e.id)}
                />
              ))}
            </div>

            {experiences.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {experiences.map((id) => {
                  const e = EXPERIENCES.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {e.icon} {e.label}
                      <button onClick={() => toggleExperience(id)} className="hover:opacity-60 ml-0.5">×</button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={false}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
              >
                {canProceedStep2 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Vibe ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 4 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">What's the energy?</h1>
              <p className="text-base text-muted-foreground">
                Pick one or two. These aren't mutually exclusive.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 pb-2">
              {VIBES.map((v) => (
                <VibeChip
                  key={v.id}
                  item={v}
                  selected={vibes.includes(v.id)}
                  onClick={() => toggleVibe(v.id)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(4)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {vibes.length > 0 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Group makeup ─────────────────────────────────── */}
        {step === 4 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 5 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">Who's coming?</h1>
              <p className="text-base text-muted-foreground">Cele plans very differently for couples vs. large groups vs. families.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-6">
              {GROUP_TYPES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroupType(groupType === g.id ? '' : g.id)}
                  className={`relative p-4 text-left rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                    groupType === g.id
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 bg-card'
                  }`}
                >
                  {groupType === g.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div className="text-2xl mb-2">{g.icon}</div>
                  <div className="font-medium text-sm leading-snug">{g.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{g.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(5)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skip →</button>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {groupType ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Must-haves ────────────────────────────────────── */}
        {step === 5 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(4)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 6 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">Any dealbreakers?</h1>
              <p className="text-base text-muted-foreground">Non-negotiables Cele needs to know before suggesting anything. Pick as many as apply.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-6">
              {MUST_HAVES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMustHave(m.id)}
                  className={`relative p-4 text-left rounded-2xl border-2 transition-all duration-150 ${
                    mustHaves.includes(m.id)
                      ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                      : 'border-border/50 hover:border-primary/40 bg-card'
                  }`}
                >
                  {mustHaves.includes(m.id) && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="font-medium text-sm leading-snug">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.desc}</div>
                </button>
              ))}
            </div>

            {mustHaves.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {mustHaves.map((id) => {
                  const m = MUST_HAVES.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {m.icon} {m.label}
                      <button onClick={() => toggleMustHave(id)} className="hover:opacity-60 ml-0.5">×</button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(6)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skip →</button>
              <button
                onClick={() => setStep(6)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {mustHaves.length > 0 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Details ──────────────────────────────────────── */}
        {step === 6 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(5)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-8">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 7 of 7</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">Last few things.</h1>
              <p className="text-base text-muted-foreground">
                Rough is fine — Cele will fill in the rest.
              </p>
            </div>

            {/* Summary pill */}
            {(occasion || experiences.length > 0 || vibes.length > 0 || groupType || mustHaves.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-8">
                {occasion && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {OCCASIONS.find((o) => o.id === occasion)?.icon} {OCCASIONS.find((o) => o.id === occasion)?.label}
                  </span>
                )}
                {experiences.map((id) => {
                  const e = EXPERIENCES.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                      {e.icon} {e.label}
                    </span>
                  );
                })}
                {vibes.map((id) => {
                  const v = VIBES.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      {v.icon} {v.label}
                    </span>
                  );
                })}
                {groupType && (() => {
                  const g = GROUP_TYPES.find((x) => x.id === groupType)!;
                  return (
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      {g.icon} {g.label}
                    </span>
                  );
                })()}
                {mustHaves.map((id) => {
                  const m = MUST_HAVES.find((x) => x.id === id)!;
                  return (
                    <span key={id} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm dark:bg-orange-950 dark:text-orange-300">
                      {m.icon} {m.label}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="max-w-xl space-y-7">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Give it a name <span className="font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder={
                    occasion
                      ? `e.g., Priscilla's 60th, The Big One`
                      : experiences[0]
                      ? `e.g., The Winery Weekend, Alps Trip`
                      : 'e.g., The Big Trip, Summer 2026'
                  }
                  value={formData.title}
                  onChange={(e) => update('title', e.target.value)}
                  className="w-full text-2xl md:text-3xl font-serif bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors placeholder:text-muted"
                  autoFocus
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Where? <span className="font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave blank and Cele will suggest"
                  value={formData.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="w-full text-lg bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors placeholder:text-muted"
                />
                <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                  <div
                    onClick={() => update('isInternational', !formData.isInternational)}
                    className={`w-10 h-6 rounded-full flex items-center transition-all duration-200 px-0.5 ${
                      formData.isInternational ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${formData.isInternational ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Open to international destinations</span>
                </label>
              </div>

              {/* Dates */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> When? <span className="font-normal">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start</p>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => update('startDate', e.target.value)}
                      className="w-full text-base bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End</p>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => update('endDate', e.target.value)}
                      className="w-full text-base bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Group size */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Roughly how many people?
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_SIZES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => update('guestCount', formData.guestCount === g.value ? '' : g.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.guestCount === g.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">Budget feel <span className="font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => update('budget', formData.budget === b.id ? '' : b.id)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.budget === b.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-12 flex flex-col items-end gap-2">
              <button
                onClick={handleSubmit}
                disabled={createEvent.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-9 py-4 rounded-full font-medium text-base hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
              >
                {createEvent.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Building your options…</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Show me my options</>
                )}
              </button>
              <p className="text-xs text-muted-foreground">Cele will propose 6 plans — you pick one, then refine it in conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
