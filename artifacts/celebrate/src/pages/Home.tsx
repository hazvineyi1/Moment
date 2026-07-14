import React from 'react';
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
      className="uppercase text-[9px] tracking-[0.2em] px-2.5 py-1 flex-shrink-0"
      style={{ border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
    >
      {label}
    </span>
  );
}

/* ─── Type → Unsplash photo pool ─────────────────────────────────────── */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const TYPE_POOLS: Record<string, string[]> = {
  birthday: [
    u('1513151233558-d860c5398176'), // colourful party lights
    u('1530103862676-de8c9debad1d'), // birthday cake sparklers
    u('1467810563316-b5476525c0f9'), // bokeh celebration
    u('1464349153735-7db50ed83c84'), // birthday candles close-up
    u('1533174072545-7a4b6ad7a6c3'), // champagne pop
    u('1519671282429-b8058da34eb1'), // rooftop party at night
  ],
  wedding: [
    u('1519741497674-611481863552'), // outdoor ceremony aisle
    u('1522673607200-164d1b6ce486'), // arch of flowers
    u('1511285560929-80b199cd3e94'), // elegant table setting
    u('1465495976277-4387d4b0b4c6'), // venue exterior golden hour
    u('1606800052052-a08af7148866'), // reception hall chandeliers
    u('1529636798458-92182e662485'), // bride bouquet close-up
  ],
  anniversary: [
    u('1414235077428-338989a2e8c0'), // candlelit restaurant table
    u('1551218808-94e220e084d2'), // fine-dining place setting
    u('1528605248644-14dd04022da1'), // champagne glasses clinking
    u('1559329007-35b6f8498b26'), // rose petals romantic setup
    u('1424847651672-bf20a4b0982b'), // couple travel sunset
    u('1481833761820-0509d3217039'), // city lights romantic night
  ],
  graduation: [
    u('1523050854058-8df90110c9f1'), // caps thrown in air
    u('1541339907198-e08756dedf3f'), // ceremony hall
    u('1627556592933-b1f58e89babe'), // graduates celebrating outdoors
    u('1571260899304-425eee4c7efc'), // diploma handshake moment
    u('1434030216411-0b793f4b6901'), // academic campus green
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

/* ─── Event card ──────────────────────────────────────────────────────── */
function EventCard({ event, index }: { event: any; index: number }) {
  const hour = new Date().getHours();
  const label = event.guestCount
    ? `${event.guestCount} guests`
    : event.status === 'planning'
    ? 'Planning'
    : 'Draft';

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{
        backgroundColor: '#141414',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Image — 70% of card */}
      <div className="relative overflow-hidden" style={{ height: '70%', minHeight: '220px' }}>
        <img
          src={eventCoverImage(event)}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle scrim at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/80 via-transparent to-transparent" />
      </div>

      {/* Info panel — 30% */}
      <div className="px-5 py-4 flex items-end justify-between" style={{ backgroundColor: '#141414' }}>
        <div className="min-w-0 mr-3">
          <h3
            className="font-serif text-xl mb-1 truncate transition-colors"
            style={{ color: '#f5f0e8' }}
          >
            {event.title}
          </h3>
          {(event.location || event.startDate) && (
            <p
              className="uppercase text-[9px] tracking-[0.18em] truncate"
              style={{ color: '#8a7a65' }}
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
    </Link>
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
            className="text-sm font-light tracking-wide"
            style={{ color: '#8a7a65' }}
          >
            {dashboard?.upcomingEvents ?? 0}{' '}
            {(dashboard?.upcomingEvents ?? 0) === 1 ? 'celebration' : 'celebrations'} in motion
            {(dashboard?.totalGuests ?? 0) > 0 &&
              ` — ${dashboard?.totalGuests} people expecting something remarkable`}
          </p>
        )}
      </header>

      {/* ── Events ────────────────────────────────────────────────────── */}
      {hasEvents ? (
        <section>
          <p
            className="uppercase text-[10px] tracking-[0.22em] mb-8"
            style={{ color: '#8a7a65' }}
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
                className="font-light tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300"
                style={{ color: '#c9a96e' }}
              >
                ———›
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
              className="uppercase text-[10px] tracking-[0.22em] mb-6"
              style={{ color: '#8a7a65' }}
            >
              Where to begin
            </p>
            <p
              className="font-serif italic text-3xl md:text-4xl mb-6 leading-snug"
              style={{ color: '#f5f0e8' }}
            >
              A-Moment plans 24 types of celebrations — from intimate winery weekends to
              month-long sailing expeditions.
            </p>
            <p className="text-sm font-light leading-relaxed mb-10" style={{ color: '#8a7a65' }}>
              Tell it what you have in mind. No forms, no agencies, no chasing quotes.
            </p>

            <Link
              href="/events/new"
              className="group inline-flex items-center gap-4 text-xs tracking-[0.2em] uppercase transition-colors"
              style={{ color: '#c9a96e' }}
            >
              <span>Start planning</span>
              <span
                className="font-light tracking-[-0.08em] text-base transition-transform group-hover:translate-x-2 duration-300"
              >
                ———›
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
                style={{ color: '#8a7a65', borderRight: '1px solid rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.08)' }}
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
