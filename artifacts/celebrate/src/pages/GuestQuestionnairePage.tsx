import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, Heart } from 'lucide-react';
import { useParams } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/* ─── Archetype data ─────────────────────────────────────────────────── */
const ARCHETYPES = [
  { id: 'energiser',       emoji: '🔥', label: 'Energiser',       desc: 'You lift the room' },
  { id: 'flow',            emoji: '🌊', label: 'The Flow',         desc: "Up for anything" },
  { id: 'grounding',       emoji: '🌿', label: 'Steady',           desc: 'Calm, everyone leans on you' },
  { id: 'wild-card',       emoji: '⚡', label: 'Wild Card',        desc: 'Unpredictable. Best stories.' },
  { id: 'life-of-party',   emoji: '🎤', label: 'Life of party',    desc: 'Needs a microphone' },
  { id: 'connector',       emoji: '🤝', label: 'Connector',        desc: 'Introduces everyone to everyone' },
  { id: 'deep-talker',     emoji: '💬', label: 'Deep talker',      desc: 'Hates small talk' },
  { id: 'observer',        emoji: '👀', label: 'Observer',         desc: 'Quiet wit, perfect timing' },
  { id: 'spontaneous',     emoji: '🎲', label: 'Spontaneous',      desc: 'Hates itineraries' },
  { id: 'planner',         emoji: '📋', label: 'The Planner',      desc: 'Secretly wants the schedule' },
  { id: 'luxe-lover',      emoji: '💅', label: 'Luxe lover',       desc: 'Notices the thread count' },
  { id: 'adventure-first', emoji: '🥾', label: 'Adventurer',       desc: "Skip the pool, let's go" },
  { id: 'here-for-laughs', emoji: '😂', label: 'Here for laughs',  desc: 'Making memories, not posh' },
];

const MUST_HAVES = [
  'Great food', 'Dancing', 'Good music', 'Adventure / activity',
  'Beautiful setting', 'Good drinks', 'Privacy / intimacy',
  'Late nights', 'Lots of laughing',
];

const DEALBREAKERS = [
  'Early mornings', 'Being centre of attention', 'Roughing it',
  'Rigid schedules', 'Crowds / strangers', 'Loud music all night', 'No downtime at all',
];

/* ─── Chip ───────────────────────────────────────────────────────────── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border text-foreground hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Archetype card ─────────────────────────────────────────────────── */
function ArchetypeCard({ archetype, selected, onClick }: {
  archetype: typeof ARCHETYPES[0]; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/50 hover:border-primary/40 bg-card'
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-2.5 h-2.5" />
        </span>
      )}
      <div className="text-2xl mb-1">{archetype.emoji}</div>
      <div className="font-semibold text-sm leading-tight">{archetype.label}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{archetype.desc}</div>
    </button>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{current + 1} of {total}</span>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export function GuestQuestionnairePage() {
  const { token } = useParams<{ token: string }>();

  const [phase, setPhase] = useState<'loading' | 'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'submitting' | 'done' | 'error'>('loading');
  const [eventInfo, setEventInfo] = useState<{ guestName: string; eventTitle: string; eventType: string } | null>(null);

  // Answers
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [dietary, setDietary] = useState('');

  useEffect(() => {
    if (!token) { setPhase('error'); return; }
    fetch(`${BASE}/api/gq/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setEventInfo(data);
        setPhase('intro');
      })
      .catch(() => setPhase('error'));
  }, [token]);

  const toggleArchetype = (id: string) =>
    setArchetypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleMustHave = (v: string) =>
    setMustHaves(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleDealbreaker = (v: string) =>
    setDealbreakers(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const handleSubmit = async () => {
    if (!token) return;
    setPhase('submitting');
    try {
      const res = await fetch(`${BASE}/api/gq/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetypes, mustHaves, dealbreakers, dietary }),
      });
      if (!res.ok) throw new Error('failed');
      setPhase('done');
    } catch {
      setPhase('error');
    }
  };

  /* ── Loading ── */
  if (phase === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  /* ── Error ── */
  if (phase === 'error') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="font-serif text-2xl mb-2">Link not found</h2>
          <p className="text-muted-foreground text-sm">This questionnaire link may have expired or been used already. Ask your host for a new one.</p>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (phase === 'done') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="font-serif text-3xl font-medium mb-3">You're all set</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cele has your profile. Your host's planner will use this to make sure the experience feels right for you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-primary">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">See you at the celebration</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Submitting ── */
  if (phase === 'submitting') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Saving your profile…</p>
        </div>
      </div>
    );
  }

  /* ── Intro screen ── */
  if (phase === 'intro') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 py-12 text-center animate-in fade-in duration-500">
        <div className="text-5xl mb-6">🎊</div>
        <p className="text-xs font-semibold text-primary mb-3 tracking-widest uppercase">You're invited</p>
        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-3 max-w-md">
          {eventInfo?.guestName ? `Hey ${eventInfo.guestName}` : 'Hey there'}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-2">
          You're going to <strong>{eventInfo?.eventTitle}</strong>.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-10">
          Answer 4 quick questions and Cele will use your profile to make sure the experience feels right — for you specifically.
        </p>
        <button
          onClick={() => setPhase('q1')}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
        >
          Let's go ✨
        </button>
      </div>
    );
  }

  const STEPS = ['q1', 'q2', 'q3', 'q4'] as const;
  const currentStepIdx = STEPS.indexOf(phase as any);

  /* ── Q1: Archetypes ── */
  if (phase === 'q1') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProgressBar current={0} total={4} />
          <h2 className="font-serif text-2xl md:text-3xl font-medium mb-1">Which of these feel most like you?</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick as many as you want — or as few.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10">
            {ARCHETYPES.map(a => (
              <ArchetypeCard key={a.id} archetype={a} selected={archetypes.includes(a.id)} onClick={() => toggleArchetype(a.id)} />
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/40 p-4 pb-safe">
          <div className="container mx-auto max-w-xl flex justify-between">
            <button onClick={() => setPhase('intro')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
            <button
              onClick={() => setPhase('q2')}
              className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {archetypes.length > 0 ? 'Next →' : 'Skip →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Q2: Must-haves ── */
  if (phase === 'q2') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProgressBar current={1} total={4} />
          <h2 className="font-serif text-2xl md:text-3xl font-medium mb-1">A celebration without ___ isn't a celebration.</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick your non-negotiables.</p>
          <div className="flex flex-wrap gap-2 mb-10">
            {MUST_HAVES.map(v => (
              <Chip key={v} label={v} selected={mustHaves.includes(v)} onClick={() => toggleMustHave(v)} />
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/40 p-4 pb-safe">
          <div className="container mx-auto max-w-xl flex justify-between">
            <button onClick={() => setPhase('q1')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
            <button
              onClick={() => setPhase('q3')}
              className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {mustHaves.length > 0 ? 'Next →' : 'Skip →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Q3: Dealbreakers ── */
  if (phase === 'q3') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProgressBar current={2} total={4} />
          <h2 className="font-serif text-2xl md:text-3xl font-medium mb-1">What completely kills the vibe?</h2>
          <p className="text-sm text-muted-foreground mb-6">Be honest — nobody sees this except Cele.</p>
          <div className="flex flex-wrap gap-2 mb-10">
            {DEALBREAKERS.map(v => (
              <Chip key={v} label={v} selected={dealbreakers.includes(v)} onClick={() => toggleDealbreaker(v)} />
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/40 p-4 pb-safe">
          <div className="container mx-auto max-w-xl flex justify-between">
            <button onClick={() => setPhase('q2')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
            <button
              onClick={() => setPhase('q4')}
              className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {dealbreakers.length > 0 ? 'Next →' : 'Skip →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Q4: Dietary / access ── */
  if (phase === 'q4') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 container mx-auto px-4 py-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProgressBar current={3} total={4} />
          <h2 className="font-serif text-2xl md:text-3xl font-medium mb-1">Any dietary or access needs?</h2>
          <p className="text-sm text-muted-foreground mb-6">Optional — but important to get right.</p>
          <textarea
            value={dietary}
            onChange={e => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, gluten-free, wheelchair access, nut allergy…"
            rows={4}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 focus:border-primary outline-none resize-none text-sm leading-relaxed"
          />
        </div>
        <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/40 p-4 pb-safe">
          <div className="container mx-auto max-w-xl flex justify-between">
            <button onClick={() => setPhase('q3')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
