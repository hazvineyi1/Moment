import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';

type Tone = 'excited' | 'elegant' | 'intriguing';

const TONES: { id: Tone; label: string; emoji: string; desc: string }[] = [
  { id: 'excited',   label: 'Excited',   emoji: '🌟', desc: 'High energy & enthusiastic' },
  { id: 'elegant',   label: 'Elegant',   emoji: '✨', desc: 'Refined & understated'       },
  { id: 'intriguing',label: 'Intriguing',emoji: '👀', desc: 'Teasing & mysterious'         },
];

function buildMessage(tone: Tone, eventTitle: string, url: string): string {
  const title = eventTitle ? `"${eventTitle}"` : 'something special';
  switch (tone) {
    case 'excited':
      return `🌟 Okay, I've been quietly putting something incredible together for ${title} and I just have to show you. I've curated a whole set of options — venues, experiences, all of it. Have a look and tell me what you think:\n\n${url}`;
    case 'elegant':
      return `I've been working on something for ${title} and I think you'll appreciate what I've put together. I've curated a selection of experiences worth seeing.\n\n${url}`;
    case 'intriguing':
      return `👀 Don't read too much into this, but I may have found some extraordinary options for ${title}. Just... take a look.\n\n${url}`;
  }
}

function buildShortMessage(tone: Tone, eventTitle: string, url: string): string {
  const title = eventTitle ? `"${eventTitle}"` : 'something special';
  switch (tone) {
    case 'excited':
      return `🌟 I've been quietly planning ${title} and I want to show you what I've put together. Take a look! ${url}`;
    case 'elegant':
      return `I've curated some options for ${title} worth your attention. ${url}`;
    case 'intriguing':
      return `👀 I may have found some extraordinary options for ${title}. Just look. ${url}`;
  }
}

interface Props { eventId: string }

export function ShareExperiences({ eventId }: Props) {
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, { query: { enabled: !!id } });

  const [tone, setTone] = useState<Tone>('excited');
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/i/${eventId}`;
  const fullMsg  = buildMessage(tone, event?.title ?? '', inviteUrl);
  const shortMsg = buildShortMessage(tone, event?.title ?? '', inviteUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const handleWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`, '_blank');
  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shortMsg)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col container mx-auto px-6 py-12 max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-medium mb-2">Show what you've built</h1>
          <p className="text-muted-foreground leading-relaxed max-w-sm">
            Share a link to your curated plan so someone can see what you have in mind
            before you commit.
          </p>
        </div>

        {/* Tone picker */}
        <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>
          Message tone
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
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
                <span className="text-xs font-medium leading-tight" style={{ color: active ? '#c9a96e' : '#f5f0e8' }}>
                  {t.label}
                </span>
                <span className="text-[9px] leading-tight" style={{ color: '#8a7a65' }}>{t.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div
          className="rounded-xl px-4 py-4 mb-6"
          style={{ background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.12)' }}
        >
          <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: '#8a7a65' }}>Preview</p>
          <p className="text-xs font-light leading-relaxed whitespace-pre-wrap" style={{ color: '#f5f0e8' }}>
            {fullMsg}
          </p>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
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
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all mb-8 ${
            copied ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy message</>}
        </button>

        <button
          onClick={() => setLocation(`/events/${eventId}`)}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Back to event hub
        </button>
      </div>
    </div>
  );
}
