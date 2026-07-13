import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useListSuggestions, useGenerateSuggestions, useUpdateSuggestion } from '@workspace/api-client-react';
import { Sparkles, MapPin, Globe, DollarSign, ExternalLink, ChevronLeft, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';

export function EventDiscover() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);
  
  const [focus, setFocus] = useState('all');

  const { data: suggestions, isLoading, refetch } = useListSuggestions(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'suggestions'] }
  });

  const generate = useGenerateSuggestions();
  const update = useUpdateSuggestion();

  const handleGenerate = () => {
    generate.mutate({
      eventId: id,
      data: { focus, count: 4 }
    }, {
      onSuccess: () => refetch()
    });
  };

  const toggleSave = (suggestionId: number, isSaved: boolean) => {
    update.mutate({
      eventId: id,
      suggestionId,
      data: { isSaved: !isSaved }
    }, {
      onSuccess: () => {
        // Optimistic update would be better, but refetching is safer for now
        refetch();
      }
    });
  };

  const filters = [
    { id: 'all', label: 'All Ideas' },
    { id: 'venue', label: 'Venues' },
    { id: 'accommodation', label: 'Stays' },
    { id: 'dining', label: 'Dining' },
    { id: 'activities', label: 'Activities' },
  ];

  const filteredSuggestions = suggestions?.filter(s => focus === 'all' || s.type === focus) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href={`/events/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-serif font-medium">Discover</h1>
          </div>
          <p className="text-muted-foreground md:ml-12">Curated venues and experiences for your celebration.</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-sm"
        >
          {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Ask Cele for Ideas
        </button>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFocus(f.id)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
              focus === f.id 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-card border-border hover:border-foreground/30 text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border/50 rounded-3xl">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="font-serif text-2xl mb-2">A blank canvas</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Tap the button above to let Cele generate bespoke suggestions based on your event details and profile preferences.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="text-primary font-medium hover:underline"
          >
            Generate first ideas →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map((s, i) => {
            let highlights = [];
            try { highlights = s.highlights ? JSON.parse(s.highlights) : []; } catch(e) {}

            return (
              <div 
                key={s.id} 
                className="group flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                      <span className="font-serif text-4xl text-muted-foreground/30 capitalize">{s.type[0]}</span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => toggleSave(s.id, s.isSaved)}
                      className="p-2.5 rounded-full bg-white/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/50 transition-colors"
                    >
                      {s.isSaved ? <BookmarkCheck className="w-5 h-5 fill-primary text-primary" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4">
                    <span className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                      {s.type}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl font-medium mb-2 leading-tight">{s.name}</h3>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                    {s.location && (
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>{s.location}</div>
                    )}
                    {s.country && (
                      <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/>{s.country}</div>
                    )}
                    {s.estimatedCost && (
                      <div className="flex items-center gap-1.5 font-medium text-foreground"><DollarSign className="w-3.5 h-3.5"/>{s.estimatedCost}</div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">{s.description}</p>

                  {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {highlights.slice(0,3).map((h: string, idx: number) => (
                        <span key={idx} className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-md border border-border/50">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {s.websiteUrl && (
                    <a href={s.websiteUrl} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      View Website <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
