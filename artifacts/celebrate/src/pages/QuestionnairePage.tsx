import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { QUESTIONS } from '../lib/questionnaire-questions';
import type { Question } from '../lib/questionnaire-questions';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ─── Balloon animation styles ─────────────────────────────────────────────────
const BALLOON_STYLES = `
@keyframes floatUp {
  0%   { transform: translateY(0) rotate(var(--r)); opacity: 0.95; }
  100% { transform: translateY(-110vh) rotate(calc(var(--r) + 15deg)); opacity: 0; }
}
@keyframes sway {
  0%, 100% { margin-left: 0; }
  50%       { margin-left: var(--sway); }
}
.balloon {
  position: absolute;
  bottom: -10%;
  animation:
    floatUp var(--dur) var(--delay) linear forwards,
    sway    calc(var(--dur) * 0.4) var(--delay) ease-in-out infinite alternate;
  will-change: transform;
}
.balloon-body {
  width: var(--size);
  height: calc(var(--size) * 1.2);
  border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
  background: var(--color);
  position: relative;
  box-shadow: inset -6px -6px 12px rgba(0,0,0,.12), inset 4px 4px 8px rgba(255,255,255,.35);
}
.balloon-knot {
  width: 6px;
  height: 6px;
  background: var(--color);
  border-radius: 50% 50% 0 0 / 60% 60% 0 0;
  margin: 0 auto;
}
.balloon-string {
  width: 1px;
  height: 60px;
  background: rgba(0,0,0,.2);
  margin: 0 auto;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-text { animation: fadeSlideUp .7s ease both; }
.hero-text-2 { animation: fadeSlideUp .7s .15s ease both; }
.hero-text-3 { animation: fadeSlideUp .7s .3s ease both; }
.hero-btn   { animation: fadeSlideUp .7s .5s ease both; }
`;

const BALLOON_DATA = [
  { color: '#F4A261', size: '56px', left: '8%',  dur: '7s',  delay: '0s',    sway: '18px', r: '-6deg' },
  { color: '#E76F51', size: '44px', left: '22%', dur: '8.5s',delay: '0.4s',  sway: '-14px',r: '4deg'  },
  { color: '#2A9D8F', size: '62px', left: '38%', dur: '6.8s',delay: '0.1s',  sway: '12px', r: '2deg'  },
  { color: '#9B5DE5', size: '48px', left: '55%', dur: '9s',  delay: '0.6s',  sway: '-20px',r: '-3deg' },
  { color: '#F72585', size: '52px', left: '70%', dur: '7.5s',delay: '0.2s',  sway: '16px', r: '5deg'  },
  { color: '#F4D35E', size: '40px', left: '84%', dur: '8s',  delay: '0.8s',  sway: '-12px',r: '-7deg' },
  { color: '#3A86FF', size: '58px', left: '92%', dur: '7.2s',delay: '0.35s', sway: '10px', r: '3deg'  },
  { color: '#06D6A0', size: '46px', left: '14%', dur: '9.5s',delay: '1s',    sway: '-18px',r: '6deg'  },
  { color: '#FF6B6B', size: '50px', left: '47%', dur: '7.8s',delay: '0.7s',  sway: '22px', r: '-4deg' },
];

interface EventInfo {
  eventTitle: string;
  eventType: string;
  eventDate: string | null;
  eventLocation: string | null;
  disabledKeys: string[];
  customQuestions: string[];
}

// ─── Balloon scene ─────────────────────────────────────────────────────────────
function BalloonScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BALLOON_DATA.map((b, i) => (
        <div
          key={i}
          className="balloon"
          style={{
            left: b.left,
            '--dur': b.dur,
            '--delay': b.delay,
            '--sway': b.sway,
            '--r': b.r,
            '--color': b.color,
            '--size': b.size,
          } as React.CSSProperties}
        >
          <div className="balloon-body" />
          <div className="balloon-knot" />
          <div className="balloon-string" />
        </div>
      ))}
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────────────────
function IntroScreen({ eventInfo, onStart }: { eventInfo: EventInfo; onStart: () => void }) {
  const occasion = eventInfo.eventType
    ? eventInfo.eventType.charAt(0).toUpperCase() + eventInfo.eventType.slice(1)
    : 'Celebration';

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-8 text-center overflow-hidden bg-background">
      <BalloonScene />

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-xs">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Check className="w-8 h-8 text-primary" />
        </div>

        <div className="hero-text">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
            You&apos;re being celebrated
          </p>
          <h1 className="font-serif text-3xl font-medium text-foreground leading-snug">
            {eventInfo.eventTitle}
          </h1>
        </div>

        <p className="hero-text-2 text-muted-foreground text-sm leading-relaxed">
          Someone is planning a {occasion.toLowerCase()} just for you. Answer a few questions so they can make it perfect.
        </p>

        {eventInfo.eventDate && (
          <p className="hero-text-3 text-xs text-muted-foreground/70 font-medium tracking-wide">
            {eventInfo.eventDate}
            {eventInfo.eventLocation ? ` · ${eventInfo.eventLocation}` : ''}
          </p>
        )}

        <button
          onClick={onStart}
          className="hero-btn mt-4 w-full py-4 bg-primary text-primary-foreground rounded-full font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Let&apos;s go 🎉
        </button>

        <p className="hero-btn text-xs text-muted-foreground/50">Takes about 2 minutes</p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function QuestionnairePage({ token }: { token: string }) {
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/q/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setEventInfo)
      .catch(() => setLoadError(true));
  }, [token]);

  // Build the active question list from server config
  const activeQuestions = [
    ...QUESTIONS.filter(q => !(eventInfo?.disabledKeys ?? []).includes(q.key)),
    ...(eventInfo?.customQuestions ?? []).map((text, i) => ({
      key: `custom_${i}`,
      label: text,
      hint: 'Your answer',
      type: 'text' as const,
      optional: true,
    })),
  ];

  const q = activeQuestions[step] ?? activeQuestions[0];

  const toggleChip = (key: string, val: string, multi: boolean) => {
    setAnswers(prev => {
      const cur = (prev[key] as string[]) ?? [];
      if (multi) {
        return { ...prev, [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      }
      return { ...prev, [key]: [val] };
    });
  };

  const next = () => {
    if (step < activeQuestions.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(answers)) {
      flat[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
    try {
      await fetch(`${BASE}/api/q/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flat),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Error state ────────────────────────────────────────────────────────────
  if (loadError) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background">
      <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
      <h2 className="font-serif text-2xl mb-2">Link not found</h2>
      <p className="text-muted-foreground">This questionnaire link may have expired or been revoked.</p>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!eventInfo) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) return (
    <>
      <style>{BALLOON_STYLES}</style>
      <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background overflow-hidden">
        <BalloonScene />
        <div className="relative z-10 flex flex-col items-center gap-4 max-w-xs">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-3xl">You&apos;re all set 🎊</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your answers have been sent to the planner. A-Moment will use them to make this celebration feel like it was made for you.
          </p>
        </div>
      </div>
    </>
  );

  // ── Intro screen ───────────────────────────────────────────────────────────
  if (!started) return (
    <>
      <style>{BALLOON_STYLES}</style>
      <IntroScreen eventInfo={eventInfo} onStart={() => setStarted(true)} />
    </>
  );

  // ── Question step ──────────────────────────────────────────────────────────
  const chipAnswers = (answers[q.key] as string[]) ?? [];
  const textAnswer = (answers[q.key] as string) ?? '';
  const isLast = step === activeQuestions.length - 1;
  const hasAnswer = q.type === 'text' ? true : chipAnswers.length > 0;
  const canNext = q.optional ? true : hasAnswer;

  return (
    <>
      <style>{BALLOON_STYLES}</style>
      <div className="min-h-[100dvh] flex flex-col bg-background">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex items-center gap-2">
          <span className="font-serif text-base font-medium text-foreground">A-Moment</span>
        </div>

        {/* Progress bar */}
        <div className="px-6">
          <div className="flex gap-1 mb-1">
            {activeQuestions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {step + 1} of {activeQuestions.length}
          </p>
        </div>

        {/* Question */}
        <div className="px-6 pt-6 flex-1">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-1 leading-snug">{q.label}</h2>
          {q.hint && <p className="text-sm text-muted-foreground mb-5">{q.hint}</p>}

          {q.type === 'text' ? (
            <textarea
              value={textAnswer}
              onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              placeholder="Optional: anything specific you want them to know…"
              rows={5}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary resize-none leading-relaxed placeholder:text-muted-foreground/60"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {q.options!.map(opt => {
                const sel = chipAnswers.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleChip(q.key, opt, q.multi!)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                      sel
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                        : 'bg-card border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.optional && !hasAnswer && (
            <p className="text-xs text-muted-foreground mt-3 italic">Optional, skip if not applicable</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-8 mt-auto">
          <button
            onClick={next}
            disabled={!canNext || submitting}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/15"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLast ? 'Send my answers 🎉' : 'Next →'}
          </button>
          <div className="flex items-center justify-between mt-3">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            ) : <span />}
            <button
              onClick={() => { setStep(0); setAnswers({}); setStarted(false); }}
              className="py-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
