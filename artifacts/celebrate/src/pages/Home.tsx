import React from 'react';
import { Link } from 'wouter';
import { useGetDashboard } from '@workspace/api-client-react';
import { useUser } from '@clerk/react';
import { Plus, Calendar, Users, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function Home() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-ping" />
        </div>
        <p className="text-sm text-muted-foreground">Preparing your dashboard…</p>
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
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-3">
          {greeting}{firstName ? `, ${firstName}` : ''}.{' '}
          <span className="italic text-primary">
            {hasEvents ? 'What are we building today?' : "Let's plan something extraordinary."}
          </span>
        </h1>
        {hasEvents && (
          <p className="text-lg text-muted-foreground font-light">
            {dashboard?.upcomingEvents ?? 0} upcoming {dashboard?.upcomingEvents === 1 ? 'celebration' : 'celebrations'}
            {(dashboard?.totalGuests ?? 0) > 0 && `, ${dashboard?.totalGuests} people expecting something special`}.
          </p>
        )}
      </header>

      {/* First-time empty state nudge */}
      {!hasEvents && (
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-primary/5 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-medium mb-1">Ready when you are.</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Tell A-Moment what you want to plan — it handles the rest. No forms, no agencies, no chasing quotes.
              </p>
            </div>
            <Link
              href="/events/new"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Start planning
            </Link>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {hasEvents ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group block relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Image / Gradient */}
              <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl opacity-30">{getEventEmoji(event.type)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div className="bg-black/30 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10">
                    {formatType(event.type)}
                  </div>
                  {event.status === 'planning' && (
                    <div className="bg-primary/90 backdrop-blur text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                      In progress
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-serif text-xl font-medium mb-2.5 group-hover:text-primary transition-colors line-clamp-1">
                  {event.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {event.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary/60" />
                      <span>{format(parseISO(event.startDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {event.guestCount && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary/60" />
                      <span>{event.guestCount}</span>
                    </div>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Hover CTA */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg text-sm font-medium">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}

          {/* Add new */}
          <Link
            href="/events/new"
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/60 bg-transparent p-8 hover:border-primary/50 hover:bg-primary/3 transition-all duration-300 min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="font-serif text-lg font-medium mb-1">Plan something new</h3>
              <p className="text-sm text-muted-foreground">24 celebration types to choose from</p>
            </div>
          </Link>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mb-8 relative z-10">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-3xl font-serif font-medium mb-4 relative z-10">Your first celebration awaits.</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 relative z-10 max-w-xl w-full">
            {['⛵ Sailing', '🍷 Winery', '⛰️ Hiking', '🚢 Cruise', '💍 Wedding', '🎿 Ski Trip', '🦁 Safari', '🎪 Festival'].map((t) => (
              <div key={t} className="text-sm text-muted-foreground bg-background rounded-xl px-3 py-2 border border-border/40 text-center">
                {t}
              </div>
            ))}
          </div>

          <p className="text-muted-foreground max-w-md mb-8 relative z-10 leading-relaxed">
            A-Moment plans 24 types of celebrations — from intimate winery weekends to month-long sailing expeditions.
            Tell it what you have in mind and it will take it from there.
          </p>

          <Link
            href="/events/new"
            className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-10 py-4 rounded-full font-medium text-base hover:bg-primary/90 transition-colors duration-300 relative z-10 hover:shadow-lg hover:shadow-primary/20"
          >
            <Sparkles className="w-5 h-5" />
            Start planning
          </Link>
        </div>
      )}
    </div>
  );
}

function formatType(type: string) {
  const map: Record<string, string> = {
    hiking: 'Hiking',
    sailing: 'Sailing',
    ski: 'Ski Trip',
    safari: 'Safari',
    diving: 'Diving',
    cycling: 'Cycling',
    winery: 'Winery',
    culinary: 'Culinary',
    distillery: 'Distillery',
    cultural: 'Culture',
    festival: 'Festival',
    cruise: 'Cruise',
    houseboat: 'Houseboat',
    island: 'Island',
    spa: 'Spa',
    yoga: 'Wellness',
    cabin: 'Cabin',
    wedding: 'Wedding',
    anniversary: 'Anniversary',
    birthday: 'Birthday',
    graduation: 'Graduation',
    retirement: 'Retirement',
    babymoon: 'Babymoon',
    reunion: 'Reunion',
    corporate: 'Retreat',
    dinner: 'Dinner',
    vacation: 'Vacation',
  };
  return map[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

function getEventEmoji(type: string) {
  const map: Record<string, string> = {
    hiking: '⛰️', sailing: '⛵', ski: '🎿', safari: '🦁', diving: '🤿', cycling: '🚴',
    winery: '🍷', culinary: '🍽️', distillery: '🥃', cultural: '🎨', festival: '🎪',
    cruise: '🚢', houseboat: '🛥️', island: '🏝️', spa: '🧖', yoga: '🧘', cabin: '🌲',
    wedding: '💍', anniversary: '🥂', birthday: '🎂', graduation: '🎓', retirement: '🌅',
    babymoon: '🌙', reunion: '🫂', corporate: '🏢', dinner: '🕯️', vacation: '✈️',
  };
  return map[type] ?? '✨';
}
