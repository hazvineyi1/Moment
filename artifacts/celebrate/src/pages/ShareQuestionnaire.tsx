import React, { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Check, Copy, Link, ArrowRight, ChevronDown } from 'lucide-react';
import { QUESTIONS } from '../lib/questionnaire-questions';
import { SharePageShell } from '../components/share/SharePageShell';
import { TonePicker, type ToneOption } from '../components/share/TonePicker';
import { MessagePreview } from '../components/share/MessagePreview';
import { ShareButtons } from '../components/share/ShareButtons';

function extractPlanningForName(description: string | null | undefined): string {
  if (!description) return '';
  const idx = description.indexOf('__PLANNING_FOR__:someone:');
  if (idx === -1) return '';
  return description.slice(idx + '__PLANNING_FOR__:someone:'.length).split('\n')[0].trim();
}

type Tone = 'fun' | 'heartfelt' | 'mysterious';

const TONES: ToneOption[] = [
  { id: 'fun',        label: 'Fun',        emoji: '🎉', desc: 'Playful & excited'    },
  { id: 'heartfelt',  label: 'Heartfelt',  emoji: '💛', desc: 'Warm & personal'      },
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
    case 'fun':        return `Okay ${n}, don't ask questions 👀 Just fill this in and trust the process 😏 ${url}`;
    case 'heartfelt':  return `Hi ${n} — I'm creating something just for you and your input will make all the difference. ${url}`;
    case 'mysterious': return `${n}. A secret is taking shape. Your mission: ${url} 🕵️`;
  }
}

export function ShareQuestionnaire({ eventId }: { eventId: string }) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const tokenFromUrl = new URLSearchParams(search).get('token') ?? '';

  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, {
    query: { enabled: !!id && !tokenFromUrl },
  });

  const token = tokenFromUrl || ((event as any)?.questionnaireToken ?? '');
  const celebrantName = extractPlanningForName(event?.description);
  const questionnaireUrl = token ? `${window.location.origin}/q/${token}` : '';

  const [copied, setCopied] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [tone, setTone] = useState<Tone>('fun');

  const fullMsg  = buildMessage(tone, celebrantName, questionnaireUrl);
  const shortMsg = buildShortMessage(tone, celebrantName, questionnaireUrl);

  return (
    <SharePageShell
      isLoading={isLoading && !tokenFromUrl}
      icon={<Check className="w-10 h-10 text-primary" />}
      title={celebrantName ? `${celebrantName}'s event is ready` : 'Event created'}
      subtitle={`Send ${celebrantName || 'them'} this link. A short questionnaire that feeds their preferences straight into A-Moment. Takes less than a minute.`}
    >
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
            onClick={async () => { await navigator.clipboard.writeText(questionnaireUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
          </button>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-2xl p-5 mb-6 text-center text-sm text-muted-foreground">
          Questionnaire link unavailable. Find it in the event hub.
        </div>
      )}

      {/* Tone picker + preview + share */}
      {questionnaireUrl && (
        <>
          <TonePicker tones={TONES} value={tone} onChange={v => setTone(v as Tone)} />
          <MessagePreview message={fullMsg} />
          <ShareButtons
            fullMessage={fullMsg}
            shortMessage={shortMsg}
            copyContent={questionnaireUrl}
            copyLabel="Copy link"
          />
        </>
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

      {/* Actions */}
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
    </SharePageShell>
  );
}
