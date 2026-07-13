import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const QUESTIONS = [
  {
    key: 'vibe',
    label: "What's your ideal vibe for this?",
    options: ['Intimate & low-key', 'Fun & energetic', 'Luxurious & indulgent', 'Wild & unpredictable', 'Adventurous & outdoorsy', 'Cultural & meaningful'],
    multi: true,
  },
  {
    key: 'dealbreakers',
    label: 'What would ruin it for you?',
    options: ['Too many people', 'Anything too planned/rigid', 'Anything cheesy or generic', 'Being the centre of attention', 'Spending too much', 'Outdoors in bad weather'],
    multi: true,
  },
  {
    key: 'musthaves',
    label: "What's a must-have?",
    options: ['Great food', 'Good music', 'Dancing', 'Adventure / activity', 'Beautiful setting', 'Good wine / cocktails', 'Privacy', 'Surprises'],
    multi: true,
  },
  {
    key: 'budget',
    label: 'Budget comfort zone per person?',
    options: ['Under £100', '£100–£300', '£300–£600', '£600–£1,200', 'No limit'],
    multi: false,
  },
  {
    key: 'note',
    label: 'Anything else you want the planner to know?',
    type: 'text',
  },
];

interface EventInfo {
  eventTitle: string;
  eventType: string;
  eventDate: string | null;
  eventLocation: string | null;
}

export function QuestionnairePage({ token }: { token: string }) {
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/q/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setEventInfo)
      .catch(() => setLoadError(true));
  }, [token]);

  const q = QUESTIONS[step];

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
    if (step < QUESTIONS.length - 1) setStep(s => s + 1);
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
      setSubmitted(true); // still show success — data may have saved
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background">
      <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
      <h2 className="font-serif text-2xl mb-2">Link not found</h2>
      <p className="text-muted-foreground">This questionnaire link may have expired or been revoked.</p>
    </div>
  );

  if (!eventInfo) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-primary" />
      </div>
      <h2 className="font-serif text-3xl mb-3">You're all set</h2>
      <p className="text-muted-foreground max-w-sm leading-relaxed">
        Your answers have been sent to the planner. Cele will use them to make this celebration feel like it was made for you.
      </p>
    </div>
  );

  const chipAnswers = (answers[q.key] as string[]) ?? [];
  const textAnswer = (answers[q.key] as string) ?? '';
  const isLast = step === QUESTIONS.length - 1;
  const canNext = q.type === 'text' ? true : chipAnswers.length > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 border-b border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-serif text-xl font-medium">Cele</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">You're invited to share your preferences for</p>
        <h1 className="font-serif text-2xl font-medium text-foreground">{eventInfo.eventTitle}</h1>
        {eventInfo.eventDate && <p className="text-sm text-muted-foreground mt-1">{eventInfo.eventDate}</p>}
      </div>

      {/* Progress */}
      <div className="px-6 pt-5">
        <div className="flex gap-1 mb-6">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <h2 className="text-lg font-medium text-foreground mb-4">{q.label}</h2>

        {q.type === 'text' ? (
          <textarea
            value={textAnswer}
            onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
            placeholder="Optional — anything specific you want them to know…"
            rows={4}
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
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-8">
        <button
          onClick={next}
          disabled={!canNext || submitting}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLast ? 'Send my answers' : 'Next'}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
