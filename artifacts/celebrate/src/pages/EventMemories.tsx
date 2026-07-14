import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@clerk/react';
import { Loader2, Plus, X, Trash2, ArrowLeft } from 'lucide-react';
import { useParams } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface Memory {
  id: number;
  eventId: number;
  url: string;
  caption: string | null;
  addedAt: string;
}

/* ─── Add Memory Modal ────────────────────────────────────────────────── */
function AddMemoryModal({ onAdd, onClose }: { onAdd: (url: string, caption: string) => Promise<void>; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => { urlRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please paste a photo URL'); return; }
    setSaving(true);
    setError('');
    try {
      await onAdd(url.trim(), caption.trim());
      onClose();
    } catch {
      setError('Could not add photo. Check the URL and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(6,6,6,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#141414', width: '100%', maxWidth: 480,
        border: '1px solid rgba(201,169,110,0.15)',
        padding: 40, position: 'relative',
        animation: 'modal-up 0.3s ease both',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a65' }}
        >
          <X size={18} />
        </button>

        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8a7a65', marginBottom: 24 }}>
          Add a memory
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, letterSpacing: '0.12em', color: '#8a7a65', display: 'block', marginBottom: 8 }}>
              Photo URL
            </label>
            <input
              ref={urlRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://photos.google.com/... or any image URL"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0a0a', border: '1px solid rgba(201,169,110,0.15)',
                color: '#f5f0e8', fontFamily: "'Outfit', sans-serif", fontSize: 13,
                padding: '12px 14px', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, letterSpacing: '0.12em', color: '#8a7a65', display: 'block', marginBottom: 8 }}>
              Caption <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="A note about this moment..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0a0a', border: '1px solid rgba(201,169,110,0.15)',
                color: '#f5f0e8', fontFamily: "'Outfit', sans-serif", fontSize: 13,
                padding: '12px 14px', outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#e57373' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: saving ? '#8a7a65' : '#c9a96e', background: 'none',
              border: '1px solid rgba(201,169,110,0.3)', padding: '14px 24px',
              cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {saving ? 'Adding…' : 'Add memory'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Memory Photo Card ───────────────────────────────────────────────── */
function MemoryCard({ memory, onDelete, index }: { memory: Memory; onDelete: () => void; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#141414',
        animation: `card-appear 0.5s ease ${index * 60}ms both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ paddingBottom: '75%', position: 'relative' }}>
        <img
          src={memory.url}
          alt={memory.caption ?? 'Memory'}
          onLoad={() => setImgLoaded(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(6,6,6,0.85) 0%, rgba(6,6,6,0) 50%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16,
        }}>
          {memory.caption && (
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12, color: '#f5f0e8', lineHeight: 1.5,
              marginBottom: 8,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 0.3s ease',
            }}>
              {memory.caption}
            </p>
          )}

          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              alignSelf: 'flex-start',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 0.3s ease 0.05s, color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e57373')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EventMemories Page ──────────────────────────────────────────────── */
export function EventMemories({ eventId }: { eventId: string }) {
  const { getToken } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const authFetch = async (url: string, opts: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...opts,
      headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  };

  useEffect(() => {
    authFetch(`${BASE}/api/events/${eventId}/memories`)
      .then(r => r.json())
      .then(setMemories)
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleAdd = async (url: string, caption: string) => {
    const r = await authFetch(`${BASE}/api/events/${eventId}/memories`, {
      method: 'POST',
      body: JSON.stringify({ url, caption }),
    });
    if (!r.ok) throw new Error('Failed');
    const newMemory = await r.json();
    setMemories(prev => [...prev, newMemory]);
  };

  const handleDelete = async (id: number) => {
    await authFetch(`${BASE}/api/events/${eventId}/memories/${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes card-appear { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes modal-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={{
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(201,169,110,0.1)',
      }}>
        <Link href={`/events/${eventId}`}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#8a7a65', background: 'none', border: 'none', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f5f0e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8a7a65')}
          >
            <ArrowLeft size={14} />
            Back to event
          </button>
        </Link>

        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#c9a96e', background: 'none', border: '1px solid rgba(201,169,110,0.3)',
            padding: '10px 20px', cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Add memory
        </button>
      </header>

      {/* Page title */}
      <div style={{ padding: '48px 32px 32px' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8a7a65', marginBottom: 12 }}>
          Memory Album
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(36px, 5vw, 64px)',
          color: '#f5f0e8',
          lineHeight: 1.0,
        }}>
          Moments worth keeping.
        </h1>
      </div>

      {/* Gold rule */}
      <div style={{ height: 1, margin: '0 32px 48px', background: 'linear-gradient(90deg, rgba(201,169,110,0.4) 0%, rgba(201,169,110,0) 100%)' }} />

      {/* Content */}
      <div style={{ padding: '0 32px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Loader2 size={20} style={{ color: '#c9a96e', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : memories.length === 0 ? (
          /* Empty state */
          <div style={{ maxWidth: 400, paddingTop: 40 }}>
            <p style={{ fontSize: 14, fontWeight: 300, color: '#8a7a65', lineHeight: 1.7, marginBottom: 32 }}>
              After the celebration, add your photos here — a private album for the moments that made it memorable.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span>Add your first memory</span>
              <span style={{ fontSize: 16, letterSpacing: '-0.08em' }}>———›</span>
            </button>
          </div>
        ) : (
          /* Photo grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {memories.map((m, i) => (
              <MemoryCard
                key={m.id}
                memory={m}
                index={i}
                onDelete={() => handleDelete(m.id)}
              />
            ))}

            {/* Add tile */}
            <button
              onClick={() => setShowAdd(true)}
              style={{
                aspectRatio: '4/3',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: '1px solid rgba(201,169,110,0.12)',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <Plus size={20} style={{ color: '#c9a96e', opacity: 0.5 }} />
              <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8a7a65' }}>
                Add memory
              </span>
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddMemoryModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
