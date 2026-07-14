import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Check, Copy, Loader2, Users, Crown } from 'lucide-react';

type Mode = 'collaborate' | 'takeover';
type Tone = 'warm' | 'direct' | 'playful';

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: 'warm',    label: 'Warm',    emoji: '💛' },
  { id: 'direct',  label: 'Direct',  emoji: '✅' },
  { id: 'playful', label: 'Playful', emoji: '😄' },
];

function buildCollabMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'something special';
  switch (tone) {
    case 'warm':
      return `Hey ${n} 💛 I'm planning ${title} and I'd really love your input. You always have great taste — come help me shape this:\n\n${url}`;
    case 'direct':
      return `Hey ${n} — I'm planning ${title} and could use a second set of eyes. Want to jump in and help me pull this together?\n\n${url}`;
    case 'playful':
      return `Okay ${n}, I need your help 😅 I'm planning ${title} and honestly, you'd be way better at some of this than me. Let's do this together:\n\n${url}`;
  }
}

function buildTakeoverMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'this event';
  switch (tone) {
    case 'warm':
      return `Hey ${n} 💛 I'm handing over the planning for ${title} to you. Everything's already set up — you just need to take it from here. I trust you completely:\n\n${url}`;
    case 'direct':
      return `${n} — I'm passing ${title} to you. It's all set up and ready. Here's everything you need:\n\n${url}`;
    case 'playful':
      return `${n}! I'm officially passing the baton 🎉 ${title} is yours now — everything's in here and I'll cheer you on from the sidelines:\n\n${url}`;
  }
}

function buildShortCollabMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'something special';
  switch (tone) {
    case 'warm':    return `Hey ${n} 💛 I'm planning ${title} and would love your help. Come see what I've got: ${url}`;
    case 'direct':  return `Hey ${n} — planning ${title} and could use your input. Jump in: ${url}`;
    case 'playful': return `${n} I need you 😅 Help me plan ${title}: ${url}`;
  }
}

function buildShortTakeoverMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'this event';
  switch (tone) {
    case 'warm':    return `Hey ${n} 💛 I'm handing ${title} over to you — everything's ready. ${url}`;
    case 'direct':  return `${n} — ${title} is yours now. Here's everything: ${url}`;
    case 'playful': return `${n} — the baton is yours 🎉 ${title} is all set up: ${url}`;
  }
}

interface Props { eventId: string }

export function ShareCollab({ eventId }: Props) {
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, { query: { enabled: !!id } });

  const [mode, setMode] = useState<Mode>('collaborate');
  const [tone, setTone] = useState<Tone>('warm');
  const [recipientName, setRecipientName] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/i/${eventId}`;

  const fullMsg = mode === 'collaborate'
    ? buildCollabMessage(tone, recipientName, event?.title ?? '', inviteUrl)
    : buildTakeoverMessage(tone, recipientName, event?.title ?? '', inviteUrl);

  const shortMsg = mode === 'collaborate'
    ? buildShortCollabMessage(tone, recipientName, event?.title ?? '', inviteUrl)
    : buildShortTakeoverMessage(tone, recipientName, event?.title ?? '', inviteUrl);

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
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Users className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-medium mb-2">Bring someone in</h1>
          <p className="text-muted-foreground leading-relaxed max-w-sm">
            Invite a co-planner to help you shape this event, or hand the whole thing over to someone else.
          </p>
        </div>

        {/* Mode picker */}
        <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>
          What are you doing?
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([
            { id: 'collaborate' as Mode, label: 'Collaborate', sub: 'Plan together', Icon: Users },
            { id: 'takeover'   as Mode, label: 'Hand it over', sub: 'They take the reins', Icon: Crown },
          ] as const).map(({ id: mId, label, sub, Icon }) => {
            const active = mode === mId;
            return (
              <button
                key={mId}
                onClick={() => setMode(mId)}
                className="flex flex-col items-center gap-2 py-5 px-3 rounded-xl transition-all text-center"
                style={{
                  border: `1px solid ${active ? 'rgba(201,169,110,0.6)' : 'rgba(201,169,110,0.15)'}`,
                  background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
                }}
              >
                <Icon className="w-6 h-6" style={{ color: active ? '#c9a96e' : '#8a7a65' }} />
                <span className="text-sm font-medium" style={{ color: active ? '#c9a96e' : '#f5f0e8' }}>{label}</span>
                <span className="text-[10px]" style={{ color: '#8a7a65' }}>{sub}</span>
              </button>
            );
          })}
        </div>

        {/* Recipient name */}
        <p className="text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: '#8a7a65' }}>
          Their name (optional)
        </p>
        <input
          type="text"
          value={recipientName}
          onChange={e => setRecipientName(e.target.value)}
          placeholder="e.g. Jamie"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6 transition-all"
          style={{
            background: '#141414',
            border: '1px solid rgba(201,169,110,0.15)',
            color: '#f5f0e8',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)')}
        />

        {/* Tone picker */}
        <p className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: '#8a7a65' }}>
          Tone
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {TONES.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all"
                style={{
                  border: `1px solid ${active ? 'rgba(201,169,110,0.6)' : 'rgba(201,169,110,0.15)'}`,
                  background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
                }}
              >
                <span className="text-base leading-none">{t.emoji}</span>
                <span className="text-xs font-medium" style={{ color: active ? '#c9a96e' : '#f5f0e8' }}>
                  {t.label}
                </span>
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

        {/* Take-over note */}
        {mode === 'takeover' && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex gap-3 items-start"
            style={{ background: 'rgba(201,169,110,0.03)', border: '1px solid rgba(201,169,110,0.1)' }}
          >
            <Crown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#c9a96e' }} />
            <p className="text-[10px] leading-relaxed" style={{ color: '#8a7a65' }}>
              The recipient will need to sign into A-Moment to access the event. Once they're in, you can share your login details or set up a shared account so they can pick up exactly where you left off.
            </p>
          </div>
        )}

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
