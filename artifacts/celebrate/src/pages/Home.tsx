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

/* ─── Type → venue photo map ──────────────────────────────────────────── */
const TYPE_IMAGES: Record<string, string> = {
  birthday:    '/images/type-birthday.jpg',
  wedding:     '/images/type-wedding.jpg',
  anniversary: '/images/type-anniversary.jpg',
  graduation:  '/images/type-graduation.jpg',
};

function eventCoverImage(event: any): string | null {
  if (event.coverImage) return event.coverImage;
  return TYPE_IMAGES[event.type] ?? '/images/type-other.jpg';
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
