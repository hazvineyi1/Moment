import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const TYPE_LABEL: Record<string, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  anniversary: 'Anniversary',
  graduation: 'Graduation',
  'date-night': 'Date Night',
  other: 'Celebration',
};

const COVER_POOLS: Record<string, string[]> = {
  birthday:      ['1513151233558-d860c5398176','1530103862676-de8c9debad1d','1467810563316-b5476525c0f9','1464349153735-7db50ed83c84','1533174072545-7a4b6ad7a6c3'],
  wedding:       ['1519741497674-611481863552','1522673607200-164d1b6ce486','1465495976277-4387d4b0b4c6','1606800052052-a08af7148866','1529636798458-92182e662485'],
  anniversary:   ['1414235077428-338989a2e8c0','1551218808-94e220e084d2','1528605248644-14dd04022da1','1424847651672-bf20a4b0982b','1481833761820-0509d3217039'],
  graduation:    ['1541339907198-e08756dedf3f','1571260899304-425eee4c7efc','1503676382389-4809596d5290','1614850523296-d8c1af93d400','1532012197267-da84d127e765'],
  'date-night':  ['1414235077428-338989a2e8c0','1551218808-94e220e084d2','1481833761820-0509d3217039','1528605248644-14dd04022da1','1424847651672-bf20a4b0982b'],
  other:         ['1492684223066-81342ee5ff30','1516450360452-9312f5e86fc7','1533174072545-7a4b6ad7a6c3','1481833761820-0509d3217039'],
};

function coverPhoto(event: { id: number; type: string; coverImage?: string | null }) {
  if (event.coverImage) return event.coverImage;
  const pool = COVER_POOLS[event.type] ?? COVER_POOLS.other;
  const id = pool[event.id % pool.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;
}

interface PublicEvent {
  id: number;
  title: string;
  type: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  guestCount: number | null;
  coverImage: string | null;
}

export function EventInvitePage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch(`${BASE}/api/events/${eventId}/public`)
      .then(r => {
        if (!r.ok) throw new Error('Event not found');
        return r.json();
      })
      .then((data: PublicEvent) => {
        setEvent(data);
        document.title = `${data.title} | A-Moment`;
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    return () => { document.title = 'A-Moment | Celebration Planning, Reimagined'; };
  }, [eventId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ color: '#c9a96e', width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100dvh', background: '#060606', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Outfit', sans-serif" }}>
        <p style={{ color: '#a89880', fontSize: 14, letterSpacing: '0.1em' }}>This celebration could not be found.</p>
        <button onClick={() => setLocation('/')} style={{ color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Return to A-Moment →
        </button>
      </div>
    );
  }

  const photo = coverPhoto(event);
  const label = TYPE_LABEL[event.type] ?? 'Celebration';
  const dateStr = event.startDate ? format(parseISO(event.startDate), 'MMMM d, yyyy') : null;
  const dateRange = event.startDate && event.endDate && event.startDate !== event.endDate
    ? `${format(parseISO(event.startDate), 'MMM d')} – ${format(parseISO(event.endDate), 'MMM d, yyyy')}`
    : dateStr;

  return (
    <div style={{ minHeight: '100dvh', background: '#060606', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes invite-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Full-bleed hero photo */}
      <div style={{ position: 'relative', height: '65vh', minHeight: 400, overflow: 'hidden' }}>
        <img
          src={photo}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Gradient scrim — heavy at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(6,6,6,0.2) 0%, rgba(6,6,6,0.0) 40%, rgba(6,6,6,0.7) 75%, rgba(6,6,6,1) 100%)',
        }} />

        {/* Brand watermark top-left */}
        <div style={{ position: 'absolute', top: 24, left: 32 }}>
          <button
            onClick={() => setLocation('/')}
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 20, color: '#f5f0e8', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
          >
            A-Moment
          </button>
        </div>
      </div>

      {/* Event info card */}
      <div style={{
        maxWidth: 680,
        margin: '-80px auto 0',
        padding: '0 24px 80px',
        position: 'relative',
        animation: 'invite-up 0.8s ease 0.2s both',
      }}>
        {/* Type badge */}
        <span style={{
          display: 'inline-block',
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: '#c9a96e', border: '1px solid rgba(201,169,110,0.35)',
          padding: '6px 14px', marginBottom: 20,
        }}>
          {label}
        </span>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(40px, 7vw, 72px)',
          lineHeight: 1.0,
          color: '#f5f0e8',
          marginBottom: 24,
        }}>
          {event.title}
        </h1>

        {/* Meta details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
          {dateRange && (
            <p style={{ fontSize: 13, color: '#a89880', letterSpacing: '0.08em' }}>
              {dateRange}
            </p>
          )}
          {event.location && (
            <p style={{ fontSize: 13, color: '#a89880', letterSpacing: '0.08em' }}>
              {event.location}
            </p>
          )}
          {event.guestCount && (
            <p style={{ fontSize: 13, color: '#a89880', letterSpacing: '0.08em' }}>
              {event.guestCount} guests
            </p>
          )}
        </div>

        {/* Gold hairline */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,169,110,0.4) 0%, rgba(201,169,110,0) 100%)', marginBottom: 40 }} />

        {/* Invitation copy */}
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.8, color: '#c5bdb0', marginBottom: 48, maxWidth: 540 }}>
          This celebration is being planned with A-Moment, a concierge planning experience that crafts extraordinary occasions, down to the last detail.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <button
            onClick={() => setLocation('/sign-up')}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <span>Plan your own celebration</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          <button
            onClick={() => setLocation('/sign-in')}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#a89880', background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a89880')}
          >
            Sign in to A-Moment
          </button>
        </div>
      </div>
    </div>
  );
}
