import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Sparkles } from 'lucide-react';
import { SharePageShell } from '../components/share/SharePageShell';
import { TonePicker, type ToneOption } from '../components/share/TonePicker';
import { MessagePreview } from '../components/share/MessagePreview';
import { ShareButtons } from '../components/share/ShareButtons';

type Tone = 'excited' | 'elegant' | 'intriguing';

const TONES: ToneOption[] = [
  { id: 'excited',    label: 'Excited',    emoji: '🌟', desc: 'High energy & enthusiastic' },
  { id: 'elegant',    label: 'Elegant',    emoji: '✨', desc: 'Refined & understated'       },
  { id: 'intriguing', label: 'Intriguing', emoji: '👀', desc: 'Teasing & mysterious'         },
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
    case 'excited':    return `🌟 I've been quietly planning ${title} and I want to show you what I've put together. Take a look! ${url}`;
    case 'elegant':    return `I've curated some options for ${title} worth your attention. ${url}`;
    case 'intriguing': return `👀 I may have found some extraordinary options for ${title}. Just look. ${url}`;
  }
}

export function ShareExperiences({ eventId }: { eventId: string }) {
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);
  const { data: event, isLoading } = useGetEvent(id, { query: { enabled: !!id } });

  const [tone, setTone] = useState<Tone>('excited');

  const inviteUrl = `${window.location.origin}/i/${eventId}`;
  const fullMsg  = buildMessage(tone, event?.title ?? '', inviteUrl);
  const shortMsg = buildShortMessage(tone, event?.title ?? '', inviteUrl);

  return (
    <SharePageShell
      isLoading={isLoading}
      icon={<Sparkles className="w-9 h-9 text-primary" />}
      title="Show what you've built"
      subtitle="Share a link to your curated plan so someone can see what you have in mind before you commit."
    >
      <TonePicker tones={TONES} value={tone} onChange={v => setTone(v as Tone)} />
      <MessagePreview message={fullMsg} />
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
