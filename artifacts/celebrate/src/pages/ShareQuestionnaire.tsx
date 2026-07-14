import React, { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Check, Copy, Link, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { QUESTIONS } from '../lib/questionnaire-questions';

function extractPlanningForName(description: string | null | undefined): string {
  if (!description) return '';
  const idx = description.indexOf('__PLANNING_FOR__:someone:');
  if (idx === -1) return '';
  const rest = description.slice(idx + '__PLANNING_FOR__:someone:'.length);
  return rest.split('\n')[0].trim();
}

type Tone = 'fun' | 'heartfelt' | 'mysterious';

const TONES: { id: Tone; label: string; emoji: string; desc: string }[] = [
  { id: 'fun',        label: 'Fun',        emoji: '🎉', desc: 'Playful & excited' },
  { id: 'heartfelt',  label: 'Heartfelt',  emoji: '💛', desc: 'Warm & personal'   },
  { id: 'mysterious', label: 'Mysterious', emoji: '🔐', desc: 'Intriguing & cryptic' },
];

function buildMessage(tone: Tone, name: string, url: string): string {
  const n = name || 'you';
  switch (tone) {
    case 'fun':
      return `🎉 Psst, ${n}! Something BIG is being planned just for you and I need your help to make it absolutely perfect. It takes 60 seconds, I promise — just answer a few questions and trust the process 👀\n\n${url}`;
    case 'heartfelt':
      return `Hey ${n} 💛\n\nI'm planning something really special for you and I want every detail to feel truly you. Could you take a moment to fill this in? Your answers will shape the whole thing.\n\n${url}`;
    case 'mysterious':
      return `${n}.\n\nSomething is being arranged. I can't say more right now. But I need one thing from you — fill this in and all will be revealed in time. 🔐\n\n${url}`;
  }
}

function buildShortMessage(tone: Tone, name: string, url: string): string {
  const n = name || 'you';
  switch (tone) {
    case 'fun':
      return `Okay ${n}, don't ask questions 👀 Just fill this in and trust the process 😏 ${url}`;
    case 'heartfelt':
      return `Hi ${n} — I'm creating something just for you and your input will make all the difference. ${url}`;
    case 'mysterious':
      return `${n}. A secret is taking shape. Your mission: ${url} 🕵️`;
  }
}

interface ShareQuestionnaireProps {
  eventId: string;
}

export function ShareQuestionnaire({ eventId }: ShareQuestionnaireProps) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tokenFromUrl = params.get('token') ?? '';

  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, {
    query: { enabled: !!id && !tokenFromUrl, queryKey: ['events', id] },
  });

  const token = tokenFromUrl || ((event as any)?.questionnaireToken ?? '');
  const celebrantName = extractPlanningForName(event?.description);
  const questionnaireUrl = token
    ? `${window.location.origin}/q/${token}`
    : '';

  const [copied, setCopied] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [tone, setTone] = useState<Tone>('fun');

  const fullMsg   = buildMessage(tone, celebrantName, questionnaireUrl);
  const shortMsg  = buildShortMessage(tone, celebrantName, questionnaireUrl);

  const handleCopy = async () => {
    if (!questionnaireUrl) return;
    await navigator.clipboard.writeText(questionnaireUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
  };

  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shortMsg)}`;
  };

  if (isLoading && !tokenFromUrl) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col container mx-auto px-6 py-12 max-w-lg">

        {/* Success mark */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-medium mb-2">
            {celebrantName ? `${celebrantName}'s event is ready` : 'Event created'}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-sm">
            Send {celebrantName || 'them'} this link. A short questionnaire that
            feeds their preferences straight into A-Moment. Takes less than a minute.
          </p>
        </div>

        {/* Questionnaire link card */}
        {questionnaireUrl ? (
          <div className="bg-card border border-border/60 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Link className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Questionnaire link</p>
            </div>
            <p className="text-sm font-mono break-all text-foreground/80 bg-muted/50 rounded-xl px-3 py-2 mb-4 leading-relaxed">
              {questionnaireUrl}
            </p>
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy link</>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-2xl p-5 mb-6 text-center text-sm text-muted-foreground">
            Questionnaire link unavailable. Find it in the event hub.
          </div>
        )}

        {/* Tone picker + message preview */}
        {questionnaireUrl && (
          <div className="mb-6">
            {/* Tone label */}
            <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>
              Message tone
            </p>

            {/* Tone pills */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {TONES.map((t) => {
                const active = tone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all text-center"
                    style={{
                      border: `1px solid ${active ? 'rgba(201,169,110,0.6)' : 'rgba(201,169,110,0.15)'}`,
                      background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
                    }}
                  >
                    <span className="text-xl leading-none">{t.emoji}</span>
                    <span
                      className="text-xs font-medium leading-tight"
                      style={{ color: active ? '#c9a96e' : '#f5f0e8' }}
                    >
                      {t.label}
                    </span>
                    <span className="text-[9px] leading-tight" style={{ color: '#8a7a65' }}>
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Message preview */}
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.12)' }}
            >
              <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: '#8a7a65' }}>
                Preview
              </p>
              <p
                className="text-xs font-light leading-relaxed whitespace-pre-wrap"
                style={{ color: '#f5f0e8' }}
              >
                {fullMsg}
              </p>
            </div>
          </div>
        )}

        {/* Share buttons */}
        {questionnaireUrl && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <span className="text-lg">💬</span> WhatsApp
            </button>
            <button
              onClick={handleSMS}
              className="flex items-center justify-center gap-2 py-3 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <span className="text-lg">📱</span> iMessage / SMS
            </button>
          </div>
        )}

        {/* Questions preview */}
        <div className="mb-8 border border-border/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowQuestions(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              What {celebrantName || 'they'} will be asked
            </span>
            <ChevronDown
              className="w-4 h-4 text-muted-foreground transition-transform"
              style={{ transform: showQuestions ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {showQuestions && (
            <div className="border-t border-border/60 divide-y divide-border/40">
              {QUESTIONS.map((q, i) => (
                <div key={q.key} className="px-5 py-3.5">
                  <p className="text-xs text-muted-foreground mb-1">Q{i + 1}{q.optional ? ' · optional' : ''}</p>
                  <p className="text-sm text-foreground font-medium leading-snug">{q.label}</p>
                  {q.options && (
                    <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                      {q.options.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skip / continue */}
        <div className="mt-auto space-y-3">
          <button
            onClick={() => setLocation(`/events/${eventId}/options`)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-foreground text-background rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> See plan options
          </button>
          <button
            onClick={() => setLocation(`/events/${eventId}`)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Go to event hub
          </button>
        </div>
      </div>
    </div>
  );
}
