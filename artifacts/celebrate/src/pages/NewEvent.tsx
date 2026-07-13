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

/* ─── Main component ─────────────────────────────────────────────────── */
export function NewEvent() {
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState(0);
  // Step 0: occasion (single)
  const [occasion, setOccasion] = useState('');
  // Step 1: experiences (multi)
  const [experiences, setExperiences] = useState<string[]>([]);
  // Step 2: vibe (multi, soft max 2)
  const [vibes, setVibes] = useState<string[]>([]);
  // Step 3: details
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

  /* derive the event "type" — occasion wins, else primary experience */
  const derivedType = occasion || experiences[0] || 'other';

  const buildDescription = () => {
    const parts: string[] = [];
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
    return parts.join(' · ') || undefined;
  };

  const handleSubmit = () => {
    const occasionLabel = OCCASIONS.find((x) => x.id === occasion)?.label;
    const experienceLabel = EXPERIENCES.find((x) => x.id === experiences[0])?.label;
    const fallbackTitle = occasionLabel
      ? `${occasionLabel} ${new Date().getFullYear()}`
      : experienceLabel
      ? `${experienceLabel} ${new Date().getFullYear()}`
      : `My celebration ${new Date().getFullYear()}`;

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
        onSuccess: (event) => setLocation(`/events/${event.id}/plan`),
      }
    );
  };

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const canProceedStep1 = experiences.length > 0;
  const canSubmit = derivedType !== '' || formData.title.trim() !== '';

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

        {/* ── Step 0: Occasion ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 1 of 4</p>
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
                onClick={() => setStep(1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {occasion ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Experiences ──────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 2 of 4</p>
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
                onClick={() => setStep(2)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={false}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
              >
                {canProceedStep1 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Vibe ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 3 of 4</p>
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
                onClick={() => setStep(3)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {vibes.length > 0 ? 'Continue' : 'Skip'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Details ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="mb-8">
              <p className="text-xs font-semibold text-primary mb-2 tracking-widest uppercase">Step 4 of 4</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium mb-2">A few quick details.</h1>
              <p className="text-base text-muted-foreground">
                Rough is fine — Cele will fill in the gaps.
              </p>
            </div>

            {/* Summary pill */}
            {(occasion || experiences.length > 0 || vibes.length > 0) && (
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
                  <><Loader2 className="w-5 h-5 animate-spin" /> Starting your plan…</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Start planning with Cele</>
                )}
              </button>
              <p className="text-xs text-muted-foreground">You'll go straight into the planning conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
