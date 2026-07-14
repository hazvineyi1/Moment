import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Users, Crown } from 'lucide-react';
import { SharePageShell } from '../components/share/SharePageShell';
import { TonePicker, type ToneOption } from '../components/share/TonePicker';
import { MessagePreview } from '../components/share/MessagePreview';
import { ShareButtons } from '../components/share/ShareButtons';

type Mode = 'collaborate' | 'takeover';
type Tone = 'warm' | 'direct' | 'playful';

const TONES: ToneOption[] = [
  { id: 'warm',    label: 'Warm',    emoji: '💛' },
  { id: 'direct',  label: 'Direct',  emoji: '✅' },
  { id: 'playful', label: 'Playful', emoji: '😄' },
];

function buildCollabMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'something special';
  switch (tone) {
    case 'warm':    return `Hey ${n} 💛 I'm planning ${title} and I'd really love your input. You always have great taste — come help me shape this:\n\n${url}`;
    case 'direct':  return `Hey ${n} — I'm planning ${title} and could use a second set of eyes. Want to jump in and help me pull this together?\n\n${url}`;
    case 'playful': return `Okay ${n}, I need your help 😅 I'm planning ${title} and honestly, you'd be way better at some of this than me. Let's do this together:\n\n${url}`;
  }
}

function buildTakeoverMessage(tone: Tone, name: string, eventTitle: string, url: string): string {
  const n = name || 'you';
  const title = eventTitle ? `"${eventTitle}"` : 'this event';
  switch (tone) {
    case 'warm':    return `Hey ${n} 💛 I'm handing over the planning for ${title} to you. Everything's already set up — you just need to take it from here. I trust you completely:\n\n${url}`;
    case 'direct':  return `${n} — I'm passing ${title} to you. It's all set up and ready. Here's everything you need:\n\n${url}`;
    case 'playful': return `${n}! I'm officially passing the baton 🎉 ${title} is yours now — everything's in here and I'll cheer you on from the sidelines:\n\n${url}`;
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

export function ShareCollab({ eventId }: { eventId: string }) {
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, { query: { enabled: !!id } });

  const [mode, setMode]               = useState<Mode>('collaborate');
  const [tone, setTone]               = useState<Tone>('warm');
  const [recipientName, setRecipientName] = useState('');

  const inviteUrl = `${window.location.origin}/i/${eventId}`;

  const fullMsg  = mode === 'collaborate'
    ? buildCollabMessage(tone, recipientName, event?.title ?? '', inviteUrl)
    : buildTakeoverMessage(tone, recipientName, event?.title ?? '', inviteUrl);

  const shortMsg = mode === 'collaborate'
    ? buildShortCollabMessage(tone, recipientName, event?.title ?? '', inviteUrl)
    : buildShortTakeoverMessage(tone, recipientName, event?.title ?? '', inviteUrl);

  return (
    <SharePageShell
      isLoading={isLoading}
      icon={<Users className="w-9 h-9 text-primary" />}
      title="Bring someone in"
      subtitle="Invite a co-planner to help you shape this event, or hand the whole thing over to someone else."
    >
      {/* Mode picker */}
      <p className="text-xs tracking-[0.18em] uppercase mb-3" style={{ color: '#a89880' }}>
        What are you doing?
      </p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { id: 'collaborate' as Mode, label: 'Collaborate', sub: 'Plan together',      Icon: Users  },
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
              <Icon className="w-6 h-6" style={{ color: active ? '#c9a96e' : '#a89880' }} />
              <span className="text-sm font-medium" style={{ color: active ? '#c9a96e' : '#f5f0e8' }}>{label}</span>
              <span className="text-xs" style={{ color: '#a89880' }}>{sub}</span>
            </button>
          );
        })}
      </div>

      {/* Recipient name */}
      <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: '#a89880' }}>
        Their name (optional)
      </p>
      <input
        type="text"
        value={recipientName}
        onChange={e => setRecipientName(e.target.value)}
        placeholder="e.g. Jamie"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6 transition-all"
        style={{ background: '#242424', border: '1px solid rgba(201,169,110,0.15)', color: '#f5f0e8' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)')}
      />

      <TonePicker label="Tone" tones={TONES} value={tone} onChange={v => setTone(v as Tone)} />
      <MessagePreview message={fullMsg} />

      {/* Take-over note */}
      {mode === 'takeover' && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex gap-3 items-start"
          style={{ background: 'rgba(201,169,110,0.03)', border: '1px solid rgba(201,169,110,0.1)' }}
        >
          <Crown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#c9a96e' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#a89880' }}>
            The recipient will need to sign into A-Moment to access the event. Once they're in, you can share
            your login details or set up a shared account so they can pick up exactly where you left off.
          </p>
        </div>
      )}

      <ShareButtons fullMessage={fullMsg} shortMessage={shortMsg} />

      <button
        onClick={() => setLocation(`/events/${eventId}`)}
        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        Back to event hub
      </button>
    </SharePageShell>
  );
}
