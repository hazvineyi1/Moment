import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetEvent } from '@workspace/api-client-react';
import { Loader2, Plus, X, Link2, Sparkles } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface Inspiration {
  url: string;
  title: string;
  description: string;
  image?: string;
  vibes: string[];
  addedAt: string;
}

function domain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function PlatformIcon({ url }: { url: string }) {
  const host = domain(url);
  const emoji =
    host.includes('instagram') ? '📸' :
    host.includes('tiktok')    ? '🎵' :
    host.includes('youtube')   ? '▶️' :
    host.includes('pinterest')  ? '📌' :
    host.includes('airbnb')    ? '🏠' :
    host.includes('tripadvisor') ? '✈️' :
    '🔗';
  return <span className="text-sm">{emoji}</span>;
}

interface Props { eventId: string }

export function EventInspirations({ eventId }: Props) {
  const [, setLocation] = useLocation();
  const id = parseInt(eventId, 10);
  const { data: event } = useGetEvent(id, { query: { enabled: !!id } });

  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch saved inspirations
  useEffect(() => {
    if (!id) return;
    fetch(`${BASE}/api/events/${id}/inspirations`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setInspirations(d.inspirations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setAddError('');
    setAdding(true);
    try {
      const res = await fetch(`${BASE}/api/events/${id}/inspirations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Could not save inspiration.'); return; }
      setInspirations(prev => [...prev, data.inspiration]);
      setUrl('');
      inputRef.current?.focus();
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (idx: number) => {
    setRemovingIdx(idx);
    try {
      await fetch(`${BASE}/api/events/${id}/inspirations/${idx}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setInspirations(prev => prev.filter((_, i) => i !== idx));
    } catch {}
    finally { setRemovingIdx(null); }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col container mx-auto px-6 py-10 max-w-2xl">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-medium mb-2">Inspiration board</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md text-sm">
            Drop any URL — Instagram reels, TikToks, travel blogs, venues — and A-Moment will
            use the vibe to sharpen your curated plan options.
          </p>
        </div>

        {/* URL input */}
        <form onSubmit={handleAdd} className="mb-8">
          <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: '#a89880' }}>
            Add inspiration
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a89880' }} />
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setAddError(''); }}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#242424',
                  border: '1px solid rgba(201,169,110,0.15)',
                  color: '#f5f0e8',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)')}
                disabled={adding}
              />
            </div>
            <button
              type="submit"
              disabled={adding || !url.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? 'Reading…' : 'Add'}
            </button>
          </div>
          {addError && (
            <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>{addError}</p>
          )}
          <p className="mt-2 text-xs" style={{ color: '#a89880' }}>
            Works with Instagram, TikTok, YouTube, Pinterest, travel blogs, hotel sites — any public URL.
            Instagram reels may take a moment while A-Moment reads the vibe.
          </p>
        </form>

        {/* Inspirations list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : inspirations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ border: '1px dashed rgba(201,169,110,0.18)' }}
          >
            <Sparkles className="w-8 h-8 mb-3" style={{ color: 'rgba(201,169,110,0.3)' }} />
            <p className="text-sm font-normal" style={{ color: '#a89880' }}>
              No inspirations yet. Paste your first URL above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inspirations.map((insp, idx) => (
              <div
                key={idx}
                className="flex gap-4 rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(201,169,110,0.12)', background: '#0d0d0d' }}
              >
                {/* Thumbnail */}
                {insp.image ? (
                  <img
                    src={insp.image}
                    alt=""
                    className="w-24 h-24 object-cover flex-shrink-0"
                    style={{ background: 'rgba(201,169,110,0.05)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 flex-shrink-0 flex items-center justify-center self-center ml-4"
                    style={{ background: 'rgba(201,169,110,0.05)', borderRadius: 8 }}
                  >
                    <PlatformIcon url={insp.url} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 py-3 pr-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <PlatformIcon url={insp.url} />
                        <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: '#a89880' }}>
                          {domain(insp.url)}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug truncate" style={{ color: '#f5f0e8' }}>
                        {insp.title}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      disabled={removingIdx === idx}
                      className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-60"
                    >
                      {removingIdx === idx
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#a89880' }} />
                        : <X className="w-3.5 h-3.5" style={{ color: '#a89880' }} />}
                    </button>
                  </div>

                  {insp.description && (
                    <p className="text-[11px] font-normal leading-relaxed line-clamp-2 mb-2" style={{ color: '#a89880' }}>
                      {insp.description}
                    </p>
                  )}

                  {insp.vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insp.vibes.map(v => (
                        <span
                          key={v}
                          className="px-2 py-0.5 text-[11px] tracking-wide rounded-full"
                          style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.18)', color: '#c9a96e' }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works note */}
        {inspirations.length > 0 && (
          <div
            className="mt-6 rounded-xl px-4 py-4"
            style={{ background: 'rgba(201,169,110,0.03)', border: '1px solid rgba(201,169,110,0.1)' }}
          >
            <p className="text-[11px] tracking-[0.15em] uppercase mb-1.5" style={{ color: '#a89880' }}>How A-Moment uses this</p>
            <p className="text-xs font-normal leading-relaxed" style={{ color: '#a89880' }}>
              When you generate or regenerate plan options, A-Moment reads the vibe, atmosphere, and style
              from your {inspirations.length} inspiration{inspirations.length !== 1 ? 's' : ''} and uses
              them to shape the character of each proposal — venues, activities, and overall feel.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {inspirations.length > 0 && (
            <button
              onClick={() => setLocation(`/events/${eventId}/options?force=true`)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-medium text-sm transition-all"
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
            >
              <Sparkles className="w-4 h-4" />
              Regenerate plan with these inspirations
            </button>
          )}
          <button
            onClick={() => setLocation(`/events/${eventId}`)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Back to event hub
          </button>
        </div>
      </div>
    </div>
  );
}
