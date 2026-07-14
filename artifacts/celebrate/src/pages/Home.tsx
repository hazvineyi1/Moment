import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useGetDashboard } from '@workspace/api-client-react';
import { useUser } from '@clerk/react';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/* ─── Gold hairline separator ─────────────────────────────────────────── */
const GoldRule = () => (
  <div
    className="w-full h-px my-20"
    style={{ background: 'linear-gradient(90deg, rgba(201,169,110,0) 0%, rgba(201,169,110,0.4) 50%, rgba(201,169,110,0) 100%)' }}
  />
);

/* ─── Status pill ─────────────────────────────────────────────────────── */
function StatusPill({ label }: { label: string }) {
  return (
    <span
      className="uppercase text-[11px] tracking-[0.2em] px-2.5 py-1 flex-shrink-0"
      style={{ border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
    >
      {label}
    </span>
  );
}

/* ─── Type → Unsplash photo pool ─────────────────────────────────────── */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

// All IDs below verified 200 via curl — no 404s
const TYPE_POOLS: Record<string, string[]> = {
  'date-night': [
    u('1414235077428-338989a2e8c0'), // candlelit restaurant
    u('1551218808-94e220e084d2'), // fine-dining place setting
    u('1481833761820-0509d3217039'), // city lights romantic night
    u('1528605248644-14dd04022da1'), // champagne glasses
    u('1424847651672-bf20a4b0982b'), // couple at sunset
  ],
  birthday: [
    u('1513151233558-d860c5398176'), // colourful party lights
    u('1530103862676-de8c9debad1d'), // birthday cake sparklers
    u('1467810563316-b5476525c0f9'), // bokeh celebration
    u('1464349153735-7db50ed83c84'), // birthday candles close-up
    u('1533174072545-7a4b6ad7a6c3'), // champagne pop
  ],
  wedding: [
    u('1519741497674-611481863552'), // outdoor ceremony aisle
    u('1522673607200-164d1b6ce486'), // arch of flowers
    u('1465495976277-4387d4b0b4c6'), // venue exterior golden hour
    u('1606800052052-a08af7148866'), // reception hall chandeliers
    u('1529636798458-92182e662485'), // bride bouquet close-up
  ],
  anniversary: [
    u('1414235077428-338989a2e8c0'), // candlelit restaurant table
    u('1551218808-94e220e084d2'), // fine-dining place setting
    u('1528605248644-14dd04022da1'), // champagne glasses clinking
    u('1424847651672-bf20a4b0982b'), // couple travel sunset
    u('1481833761820-0509d3217039'), // city lights romantic night
  ],
  graduation: [
    u('1541339907198-e08756dedf3f'), // ceremony hall
    u('1571260899304-425eee4c7efc'), // diploma handshake moment
    u('1503676382389-4809596d5290'), // graduates celebrating
    u('1614850523296-d8c1af93d400'), // graduation outdoors
    u('1532012197267-da84d127e765'), // graduation ceremony
  ],
  other: [
    u('1492684223066-81342ee5ff30'), // festival lights crowd
    u('1516450360452-9312f5e86fc7'), // celebration venue interior
    u('1533174072545-7a4b6ad7a6c3'), // champagne celebration
    u('1481833761820-0509d3217039'), // night-time event lights
  ],
};

function eventCoverImage(event: any): string {
  if (event.coverImage) return event.coverImage;
  const pool = TYPE_POOLS[event.type] ?? TYPE_POOLS.other;
  return pool[event.id % pool.length];
}

// Subtle permanent tilts — like photos tossed onto a table (desktop only)
const CARD_TILTS = [-1.8, 1.2, -0.9, 2.1, -1.4, 0.8, -2.2, 1.6];
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

/* ─── Celebrant-answered helpers ──────────────────────────────────────── */
const PLANNING_FOR_MARKER = '__PLANNING_FOR__:';
const CELEBRANT_MARKER = '__CELEBRANT__:';

function parseCelebrantStatus(description: string | null | undefined): {
  planningForSomeone: boolean;
  celebrantName: string;
  celebrantAnswered: boolean;
} {
  if (!description) return { planningForSomeone: false, celebrantName: '', celebrantAnswered: false };
  const idx = description.indexOf(PLANNING_FOR_MARKER);
  if (idx === -1) return { planningForSomeone: false, celebrantName: '', celebrantAnswered: false };
  const value = description.slice(idx + PLANNING_FOR_MARKER.length).split('\n')[0].trim();
  if (!value.startsWith('someone')) return { planningForSomeone: false, celebrantName: '', celebrantAnswered: false };
  const namePart = value.slice('someone'.length).replace(/^:/, '').trim();
  const celebrantAnswered = description.includes(CELEBRANT_MARKER);
  return { planningForSomeone: true, celebrantName: namePart, celebrantAnswered };
}

/* ─── Event card ──────────────────────────────────────────────────────── */
function EventCard({ event, index }: { event: any; index: number }) {
  const [placed, setPlaced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setPlaced(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tilt = isMobile() ? 0 : CARD_TILTS[index % CARD_TILTS.length];
  const delay = index * 90; // ms

  const label = event.guestCount
    ? `${event.guestCount} guests`
    : event.status === 'planning'
    ? 'Planning'
    : 'Draft';

  const { planningForSomeone, celebrantName, celebrantAnswered } = parseCelebrantStatus(event.description);
  const showAnsweredBadge = planningForSomeone && celebrantAnswered;

  return (
    <div ref={ref} style={{ perspective: '800px' }}>
      <Link
        href={`/events/${event.id}`}
        className="group block relative overflow-hidden"
        style={{
          backgroundColor: '#141414',
          transform: placed
            ? `rotate(${tilt}deg) translateY(0) scale(1)`
            : `rotate(${tilt * 2.5}deg) translateY(-40px) scale(0.93)`,
          opacity: placed ? 1 : 0,
          transition: `transform ${600 + delay}ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, opacity 500ms ease ${delay}ms`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
          willChange: 'transform',
        }}
      >
        {/* Image — 70% of card */}
        <div className="relative overflow-hidden" style={{ height: '70%', minHeight: '220px' }}>
          <img
            src={eventCoverImage(event)}
            alt={event.title}
            onError={(e) => {
              const fallback = `/images/type-${event.type in TYPE_POOLS ? event.type : 'other'}.jpg`;
              if (e.currentTarget.src !== window.location.origin + fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transform: placed ? 'scale(1)' : 'scale(1.08)',
              transition: `transform 800ms ease ${delay + 200}ms`,
            }}
          />
          {/* Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/80 via-transparent to-transparent" />
          {/* Photo-developing shimmer overlay — fades out as image loads */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(20,14,8,0.9) 0%, rgba(20,14,8,0.4) 50%, transparent 100%)',
              opacity: placed ? 0 : 1,
              transition: `opacity 1s ease ${delay + 300}ms`,
              pointerEvents: 'none',
            }}
          />
          {/* Celebrant-answered badge — top-right corner */}
          {showAnsweredBadge && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1"
              style={{
                background: 'rgba(20,16,10,0.82)',
                border: '1px solid rgba(201,169,110,0.45)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {/* Pulsing dot */}
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ backgroundColor: '#c9a96e' }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: '#c9a96e' }}
                />
              </span>
              <span
                className="uppercase text-[8px] tracking-[0.18em] whitespace-nowrap"
                style={{ color: '#c9a96e' }}
              >
                {celebrantName ? `${celebrantName} answered` : 'Celebrant answered'}
              </span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="px-5 py-4 flex items-end justify-between" style={{ backgroundColor: '#141414' }}>
          <div className="min-w-0 mr-3">
            <h3
              className="font-serif italic text-xl mb-1 truncate"
              style={{ color: '#f5f0e8' }}
            >
              {event.title}
            </h3>
            {(event.location || event.startDate) && (
              <p
                className="uppercase text-[11px] tracking-[0.18em] truncate"
                style={{ color: '#a89880' }}
              >
                {[
                  event.location,
                  event.startDate ? format(parseISO(event.startDate), 'MMM yyyy') : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          <StatusPill label={label} />
        </div>

        {/* Hover lift — separate from the tilt transform */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(201,169,110,0.12)' }}
        />
      </Link>
    </div>
  );
}

/* ─── Home ────────────────────────────────────────────────────────────── */
export function Home() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9a96e' }} />
      </div>
    );
  }

  const events = dashboard?.events ?? [];
  const hasEvents = events.length > 0;
  const firstName = user?.firstName ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto w-full max-w-7xl px-8 md:px-16 py-12 md:py-20 animate-in fade-in duration-700">

      {/* ── Hero greeting ─────────────────────────────────────────────── */}
      <header className="mb-16 md:mb-24">
        <h1
          className="font-serif italic leading-[1.0] mb-4"
          style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            color: '#f5f0e8',
          }}
        >
          {greeting}
          {firstName ? `,\n${firstName}.` : '.'}
        </h1>
        {hasEvents && (
          <p
            className="text-sm font-normal tracking-wide"
            style={{ color: '#a89880' }}
          >
            {dashboard?.upcomingEvents ?? 0}{' '}
            {(dashboard?.upcomingEvents ?? 0) === 1 ? 'celebration' : 'celebrations'} in motion
            {(dashboard?.totalGuests ?? 0) > 0 &&
              `, ${dashboard?.totalGuests} people expecting something remarkable`}
          </p>
        )}
      </header>

      {/* ── Events ────────────────────────────────────────────────────── */}
      {hasEvents ? (
        <section>
          <p
            className="uppercase text-xs tracking-[0.22em] mb-8"
            style={{ color: '#a89880' }}
          >
            Upcoming Celebrations
          </p>

          {/* Cards grid — portrait aspect 4/5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {events.map((event, i) => (
              <div key={event.id} className="aspect-[4/5]">
                <EventCard event={event} index={i} />
              </div>
            ))}

            {/* Add new — minimal */}
            <div className="aspect-[4/5]">
              <Link
                href="/events/new"
                className="group flex flex-col items-center justify-center w-full h-full transition-colors"
                style={{
                  border: '1px solid rgba(201,169,110,0.15)',
                  backgroundColor: 'transparent',
                }}
              >
                <span
                  className="font-sans text-xs tracking-[0.22em] uppercase transition-colors group-hover:opacity-100"
                  style={{ color: '#c9a96e', opacity: 0.6 }}
                >
                  + New celebration
                </span>
              </Link>
            </div>
          </div>

          {/* CTA link */}
          <div>
            <Link
              href="/events/new"
              className="group inline-flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-colors"
              style={{ color: '#c9a96e' }}
            >
              <span>Begin planning something extraordinary</span>
              <span
                className="font-normal tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300"
                style={{ color: '#c9a96e' }}
              >
                →
              </span>
            </Link>
          </div>
        </section>
      ) : (
        /* ── Empty state ─────────────────────────────────────────────── */
        <section>
          <GoldRule />

          <div className="max-w-2xl">
            <p
              className="uppercase text-xs tracking-[0.22em] mb-6"
              style={{ color: '#a89880' }}
            >
              Where to begin
            </p>
            <p
              className="font-serif italic text-3xl md:text-4xl mb-6 leading-snug"
              style={{ color: '#f5f0e8' }}
            >
              A-Moment plans 24 types of celebrations, from intimate winery weekends to
              month-long sailing expeditions.
            </p>
            <p className="text-sm font-normal leading-relaxed mb-10" style={{ color: '#a89880' }}>
              Tell it what you have in mind. No forms, no agencies, no chasing quotes.
            </p>

            <Link
              href="/events/new"
              className="group inline-flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-colors"
              style={{ color: '#c9a96e' }}
            >
              <span>Start planning</span>
              <span
                className="font-normal tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300"
              >
                →
              </span>
            </Link>
          </div>

          <GoldRule />

          {/* Celebration types — minimal grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ border: '1px solid rgba(201,169,110,0.1)' }}>
            {[
              'Birthday', 'Wedding', 'Anniversary', 'Reunion',
              'Safari', 'Sailing', 'Winery', 'Ski Trip',
            ].map((t) => (
              <div
                key={t}
                className="px-4 py-5 text-xs tracking-[0.12em] uppercase"
                style={{ color: '#a89880', borderRight: '1px solid rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.08)' }}
              >
                {t}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
