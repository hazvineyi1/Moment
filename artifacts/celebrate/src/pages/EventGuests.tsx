import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useAuth } from '@clerk/react';
import { useListGuests, useAddGuest, useDeleteGuest, useUpdateGuest } from '@workspace/api-client-react';
import {
  Users, Plus, ChevronLeft, Loader2, Trash2, Check, X, Phone, Mail, AlertCircle,
  ChevronDown, ChevronUp, Copy, Link2, ChevronRight, Sparkles, RefreshCw, Send,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/* ─── Guest personality archetypes ─────────────────────────────────── */
const GUEST_ARCHETYPES = [
  { id: 'energiser',       emoji: '🔥', label: 'Energiser'       },
  { id: 'flow',            emoji: '🌊', label: 'The Flow'         },
  { id: 'grounding',       emoji: '🌿', label: 'Steady'           },
  { id: 'wild-card',       emoji: '⚡', label: 'Wild Card'        },
  { id: 'life-of-party',   emoji: '🎤', label: 'Life of party'    },
  { id: 'connector',       emoji: '🤝', label: 'Connector'        },
  { id: 'deep-talker',     emoji: '💬', label: 'Deep talker'      },
  { id: 'observer',        emoji: '👀', label: 'Observer'         },
  { id: 'spontaneous',     emoji: '🎲', label: 'Spontaneous'      },
  { id: 'planner',         emoji: '📋', label: 'The Planner'      },
  { id: 'luxe-lover',      emoji: '💅', label: 'Luxe lover'       },
  { id: 'adventure-first', emoji: '🥾', label: 'Adventurer'       },
  { id: 'here-for-laughs', emoji: '😂', label: 'Here for laughs'  },
];

/* ─── RSVP status badge ─────────────────────────────────────────────── */
function RsvpBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    confirmed: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Confirmed' },
    declined:  { cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400', label: 'Declined' },
    pending:   { cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', label: 'Pending' },
  };
  const { cls, label } = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Guest card ────────────────────────────────────────────────────── */
function GuestCard({
  guest, eventId, onDelete, onRefetch,
}: {
  guest: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    rsvpStatus: string;
    dietaryNeeds?: string | null;
    notes?: string | null;
    personality?: string | null;
    questionnaireToken?: string | null;
  };
  eventId: number;
  onDelete: (id: number) => void;
  onRefetch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const updateGuest = useUpdateGuest();

  let parsedPersonality: {
    archetypes?: string[];
    selfProfile?: { archetypes?: string[]; mustHaves?: string[]; dealbreakers?: string[]; dietary?: string };
  } | null = null;
  try { if (guest.personality) parsedPersonality = JSON.parse(guest.personality); } catch {}

  const hostTags = parsedPersonality?.archetypes ?? [];
  const selfTags = parsedPersonality?.selfProfile?.archetypes ?? [];
  const hasTags = hostTags.length > 0 || selfTags.length > 0;

  const questionnaireUrl = guest.questionnaireToken
    ? `${window.location.origin}${BASE}/gq/${guest.questionnaireToken}`
    : null;

  const handleCopyLink = () => {
    if (!questionnaireUrl) return;
    navigator.clipboard.writeText(questionnaireUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = guest.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const setRsvp = (rsvpStatus: string) => {
    updateGuest.mutate({ eventId, guestId: guest.id, data: { rsvpStatus } }, { onSuccess: onRefetch });
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>

          {/* Name + badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{guest.name}</span>
              <RsvpBadge status={guest.rsvpStatus} />
            </div>
            {(guest.email || guest.whatsapp || guest.phone) && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {guest.email || guest.whatsapp || guest.phone}
              </p>
            )}
          </div>

          {/* Expand */}
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded */}
        {open && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Contact details */}
            {(guest.email || guest.whatsapp || guest.phone) && (
              <div className="space-y-1 text-sm text-muted-foreground">
                {guest.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                )}
                {(guest.whatsapp || guest.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{guest.whatsapp || guest.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dietary */}
            {guest.dietaryNeeds && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{guest.dietaryNeeds}</span>
              </div>
            )}

            {/* Notes */}
            {guest.notes && (
              <p className="text-sm text-muted-foreground italic">"{guest.notes}"</p>
            )}

            {/* Personality tags */}
            {hasTags && (
              <div className="flex flex-wrap gap-1.5">
                {hostTags.map(id => {
                  const a = GUEST_ARCHETYPES.find(x => x.id === id);
                  return a ? (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {a.emoji} {a.label}
                    </span>
                  ) : null;
                })}
                {selfTags.map(id => {
                  const a = GUEST_ARCHETYPES.find(x => x.id === id);
                  return a ? (
                    <span key={"self-" + id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-foreground/80 text-xs font-medium border border-border/50">
                      {a.emoji} {a.label}
                    </span>
                  ) : null;
                })}
                {selfTags.length > 0 && (
                  <span className="text-xs text-muted-foreground self-center">(self)</span>
                )}
              </div>
            )}

            {/* Self-assessment summary */}
            {parsedPersonality?.selfProfile && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {parsedPersonality.selfProfile.mustHaves && parsedPersonality.selfProfile.mustHaves.length > 0 && (
                  <p>Needs: {parsedPersonality.selfProfile.mustHaves.join(", ")}</p>
                )}
                {parsedPersonality.selfProfile.dealbreakers && parsedPersonality.selfProfile.dealbreakers.length > 0 && (
                  <p>Avoid: {parsedPersonality.selfProfile.dealbreakers.join(", ")}</p>
                )}
                {parsedPersonality.selfProfile.dietary && (
                  <p>Dietary: {parsedPersonality.selfProfile.dietary}</p>
                )}
              </div>
            )}

            {/* Questionnaire link */}
            {questionnaireUrl && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground mb-1.5">
                  {parsedPersonality?.selfProfile ? '✓ Guest has completed their profile' : 'Share this link with the guest'}
                </p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-mono truncate flex-1">/gq/{guest.questionnaireToken?.slice(0, 8)}…</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setRsvp('confirmed')}
                disabled={guest.rsvpStatus === 'confirmed' || updateGuest.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Confirmed
              </button>
              <button
                onClick={() => setRsvp('declined')}
                disabled={guest.rsvpStatus === 'declined' || updateGuest.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Declined
              </button>
              <button
                onClick={() => onDelete(guest.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dietary chips ─────────────────────────────────────────────────── */
const DIETARY_CHIPS = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'Nut allergy'];

function DietaryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-border text-foreground hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Add guest drawer ──────────────────────────────────────────────── */
function AddGuestDrawer({
  eventId, onClose, onSuccess,
}: { eventId: number; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [dietary, setDietary] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const addGuest = useAddGuest();

  const toggleArchetype = (id: string) =>
    setSelectedArchetypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const personalityJson = selectedArchetypes.length > 0
      ? JSON.stringify({ archetypes: selectedArchetypes })
      : undefined;
    addGuest.mutate({
      eventId,
      data: {
        name: name.trim(),
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        personality: personalityJson,
        dietaryNeeds: dietary && dietary !== 'None' ? dietary : undefined,
        notes: notes || undefined,
      },
    }, {
      onSuccess: () => { onSuccess(); onClose(); },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="p-6 pb-safe space-y-5">
          <div>
            <h2 className="font-serif text-2xl font-medium">Add a guest</h2>
            <p className="text-sm text-muted-foreground mt-1">Name is required. Everything else is optional.</p>
          </div>

          <input
            type="text"
            placeholder="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
            autoFocus
          />

          <input
            type="tel"
            placeholder="WhatsApp / phone"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
          />

          <div>
            <p className="text-sm font-medium mb-1.5">How would you describe them? <span className="text-muted-foreground font-normal">(optional)</span></p>
            <p className="text-xs text-muted-foreground mb-2.5">A-Moment uses this for seating, pairings, and activity design.</p>
            <div className="grid grid-cols-3 gap-1.5">
              {GUEST_ARCHETYPES.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleArchetype(a.id)}
                  className={"relative p-2.5 rounded-xl border text-left transition-all " + (
                    selectedArchetypes.includes(a.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-primary/40 bg-background'
                  )}
                >
                  {selectedArchetypes.includes(a.id) && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-2 h-2" />
                    </span>
                  )}
                  <div className="text-lg mb-0.5">{a.emoji}</div>
                  <div className="font-medium text-xs leading-tight">{a.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Dietary needs</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_CHIPS.map((d) => (
                <DietaryChip
                  key={d}
                  label={d}
                  active={dietary === d}
                  onClick={() => setDietary(dietary === d ? '' : d)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Notes <span className="text-muted-foreground font-normal">(optional)</span></p>
            <textarea
              placeholder="Anything A-Moment should know about them..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || addGuest.isPending}
              className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            >
              {addGuest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Add guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Send-to-guests panel ──────────────────────────────────────────── */
function GuestLinksSendPanel({ guests }: { guests: GuestShape[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const withLinks = guests.filter(g => g.questionnaireToken);
  const completedCount = withLinks.filter(g => {
    try { return !!(g.personality && JSON.parse(g.personality)?.selfProfile); } catch { return false; }
  }).length;
  const pendingCount = withLinks.length - completedCount;

  if (withLinks.length === 0) return null;

  const getUrl = (token: string) =>
    `${window.location.origin}${BASE}/gq/${token}`;

  const handleCopy = async (guestId: number, token: string) => {
    await navigator.clipboard.writeText(getUrl(token));
    setCopied(guestId);
    setTimeout(() => setCopied(null), 2200);
  };

  const eyebrow: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c6b7a1',
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div className="mb-6" style={{ border: '1px solid rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.03)' }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
        style={{ borderBottom: open ? '1px solid rgba(201,169,110,0.12)' : undefined }}
      >
        <Send className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c9a96e' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#f5f0e8' }}>Send to guests</p>
          <p className="text-xs mt-0.5" style={{ color: '#c6b7a1' }}>
            {pendingCount > 0
              ? `${pendingCount} profile${pendingCount !== 1 ? 's' : ''} still pending · send each guest their personal link`
              : `All ${completedCount} guest profiles complete`}
          </p>
        </div>
        <span className="text-[11px] mr-1.5" style={{ color: '#c6b7a1' }}>
          {completedCount}/{withLinks.length}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
          style={{ color: '#c6b7a1', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Guest rows */}
      {open && (
        <>
          {/* Column headers */}
          <div
            className="px-5 py-2 grid gap-3 items-center"
            style={{
              gridTemplateColumns: '2rem 1fr 4.5rem 5rem',
              borderBottom: '1px solid rgba(201,169,110,0.08)',
              background: 'rgba(201,169,110,0.02)',
            }}
          >
            <span />
            <span style={eyebrow}>Guest</span>
            <span style={{ ...eyebrow, textAlign: 'center' }}>Status</span>
            <span style={{ ...eyebrow, textAlign: 'right' }}>Link</span>
          </div>

          {withLinks.map((guest) => {
            const initials = guest.name
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase();

            let hasProfile = false;
            try {
              hasProfile = !!(guest.personality && JSON.parse(guest.personality)?.selfProfile);
            } catch {}

            const isCopied = copied === guest.id;

            return (
              <div
                key={guest.id}
                className="px-5 py-3 grid gap-3 items-center"
                style={{
                  gridTemplateColumns: '2rem 1fr 4.5rem 5rem',
                  borderBottom: '1px solid rgba(201,169,110,0.06)',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: 'rgba(201,169,110,0.1)', color: '#c9a96e' }}
                >
                  {initials}
                </div>

                {/* Name + truncated URL */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#f5f0e8' }}>
                    {guest.name}
                  </p>
                  <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: '#c6b7a1' }}>
                    /gq/{guest.questionnaireToken?.slice(0, 10)}…
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex justify-center">
                  {hasProfile ? (
                    <span
                      className="text-[10px] tracking-[0.14em] uppercase px-2 py-0.5"
                      style={{ border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
                    >
                      Done
                    </span>
                  ) : (
                    <span
                      className="text-[10px] tracking-[0.14em] uppercase px-2 py-0.5"
                      style={{ border: '1px solid rgba(201,169,110,0.12)', color: '#c6b7a1' }}
                    >
                      Pending
                    </span>
                  )}
                </div>

                {/* Copy button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopy(guest.id, guest.questionnaireToken!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all"
                    style={{
                      border: `1px solid ${isCopied ? 'rgba(201,169,110,0.4)' : 'rgba(201,169,110,0.18)'}`,
                      color: isCopied ? '#c9a96e' : '#c6b7a1',
                      background: isCopied ? 'rgba(201,169,110,0.07)' : 'transparent',
                    }}
                  >
                    {isCopied
                      ? <><Check className="w-3 h-3" /> Copied</>
                      : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer note */}
          <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(201,169,110,0.06)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: '#c6b7a1' }}>
              Each link is unique to that guest. Once they fill in their personality, must-haves, and any dealbreakers,
              A-Moment will factor them into seating, pairings, and activity design.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Group Analysis ────────────────────────────────────────────────── */
type GuestShape = {
  id: number;
  name: string;
  rsvpStatus: string;
  dietaryNeeds?: string | null;
  personality?: string | null;
  questionnaireToken?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
};

const HIGH_ENERGY_IDS = new Set(['energiser', 'life-of-party', 'spontaneous', 'wild-card', 'here-for-laughs']);
const REFLECTIVE_IDS  = new Set(['deep-talker', 'observer', 'grounding', 'flow']);
const LUXURY_IDS      = new Set(['luxe-lover', 'planner']);
const ADVENTURE_IDS   = new Set(['adventure-first', 'connector']);

function groupInsight(archCounts: Record<string, number>): string {
  const top = Object.entries(archCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  const he  = top.filter(id => HIGH_ENERGY_IDS.has(id)).length;
  const ref = top.filter(id => REFLECTIVE_IDS.has(id)).length;
  const lux = top.filter(id => LUXURY_IDS.has(id)).length;
  const adv = top.filter(id => ADVENTURE_IDS.has(id)).length;
  if (he >= 2)  return 'High-energy crowd. Plan for big shared moments and spontaneity.';
  if (ref >= 2) return 'Intimate and reflective. Quality conversation over spectacle.';
  if (lux >= 1) return 'Quality-focused group. Comfort, craft, and curated experiences will land well.';
  if (adv >= 1) return 'Adventure-first. Push the experience beyond the ordinary.';
  if (he >= 1 && ref >= 1) return 'Mixed energy. Build a flow that lets both high and low energy moments shine.';
  return 'Diverse mix. Variety and flexibility will keep everyone engaged.';
}

function GroupAnalysis({ guests, eventId }: { guests: GuestShape[]; eventId: number }) {
  const [, setLocation] = useLocation();

  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const pending   = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declined  = guests.filter(g => g.rsvpStatus === 'declined').length;

  const archCounts: Record<string, number> = {};
  const dietarySet = new Set<string>();

  guests.forEach(g => {
    if (g.dietaryNeeds?.trim()) dietarySet.add(g.dietaryNeeds.trim());
    let parsed: { archetypes?: string[]; selfProfile?: { archetypes?: string[]; dietary?: string } } | null = null;
    try { if (g.personality) parsed = JSON.parse(g.personality); } catch {}
    [...(parsed?.archetypes ?? []), ...(parsed?.selfProfile?.archetypes ?? [])].forEach(id => {
      archCounts[id] = (archCounts[id] ?? 0) + 1;
    });
    if (parsed?.selfProfile?.dietary?.trim()) dietarySet.add(parsed.selfProfile.dietary.trim());
  });

  const topArchetypes = Object.entries(archCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = topArchetypes[0]?.[1] ?? 1;
  const hasPersonality = topArchetypes.length > 0;
  const dietary = [...dietarySet];
  const insight = hasPersonality ? groupInsight(archCounts) : null;
  const noRsvp = guests.filter(g => !g.questionnaireToken).length;

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="font-medium">Group profile</h3>
        {insight && <p className="text-sm text-muted-foreground mt-1 italic">{insight}</p>}
      </div>

      {/* RSVP row */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40">
        {[
          { label: 'Confirmed', count: confirmed, cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending',   count: pending,   cls: 'text-amber-600 dark:text-amber-400'   },
          { label: 'Declined',  count: declined,  cls: 'text-rose-600 dark:text-rose-400'     },
        ].map(({ label, count, cls }) => (
          <div key={label} className="flex flex-col items-center py-4 gap-0.5">
            <span className={`text-2xl font-medium ${cls}`}>{count}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Personality mix */}
      {hasPersonality && (
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Personality mix</p>
          <div className="space-y-2.5">
            {topArchetypes.map(([id, count]) => {
              const arch = GUEST_ARCHETYPES.find(a => a.id === id);
              if (!arch) return null;
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm flex-shrink-0">{arch.emoji}</span>
                  <span className="text-sm w-28 flex-shrink-0 text-foreground/80">{arch.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dietary + action row */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {dietary.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Dietary needs</p>
              <div className="flex flex-wrap gap-1.5">
                {dietary.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40">
                    <AlertCircle className="w-3 h-3" /> {d}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No dietary needs recorded.</p>
          )}
        </div>
        {!hasPersonality && (
          <p className="text-xs text-muted-foreground italic">Add personality tags to guests to see the group mix.</p>
        )}
        <button
          onClick={() => setLocation(`/events/${eventId}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline flex-shrink-0"
        >
          Back to hub <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── Guest pairings panel ──────────────────────────────────────────── */
interface PairingGuest { id: number; name: string }
interface Pair { guest1: PairingGuest; guest2: PairingGuest; compatibilityScore: number; reason: string }
interface SeatingGroup { tableName: string; guests: PairingGuest[]; vibe: string }
interface PairingsData {
  roommates: Pair[];
  travelBuddies: Pair[];
  seatingGroups: SeatingGroup[];
  reasoning: string;
}

function ScoreDots({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5);
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i <= filled ? '#c9a96e' : 'rgba(201,169,110,0.18)',
          display: 'inline-block',
        }} />
      ))}
    </span>
  );
}

function PairRow({ pair }: { pair: Pair }) {
  return (
    <div className="py-3.5" style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm" style={{ color: '#f5f0e8' }}>
          {pair.guest1.name} <span style={{ color: '#c6b7a1' }}>+</span> {pair.guest2.name}
        </span>
        <ScoreDots score={pair.compatibilityScore} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#c6b7a1' }}>{pair.reason}</p>
    </div>
  );
}

function GuestPairings({ guests, eventId }: { guests: GuestShape[]; eventId: number }) {
  const { getToken } = useAuth();
  const [data, setData] = useState<PairingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasPersonality = guests.some(g => !!g.personality);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/events/${eventId}/guests/pairings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Could not generate pairings');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const eyebrow: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c6b7a1',
  };

  return (
    <div className="mb-6" style={{ border: '1px solid rgba(201,169,110,0.18)', background: 'rgba(201,169,110,0.02)' }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
        <div>
          <p style={eyebrow}>Psychology &amp; pairings</p>
          {!data && (
            <p className="text-xs mt-1 font-normal" style={{ color: '#c6b7a1' }}>
              AI-matched roommates, travel buddies &amp; seating groups based on personality.
            </p>
          )}
          {data?.reasoning && (
            <p className="text-xs mt-1 italic font-normal" style={{ color: '#c6b7a1' }}>{data.reasoning}</p>
          )}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors flex-shrink-0"
          style={{
            border: '1px solid rgba(201,169,110,0.3)',
            color: loading ? '#c6b7a1' : '#c9a96e',
            background: 'transparent',
          }}
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : data
            ? <RefreshCw className="w-3.5 h-3.5" />
            : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? 'Analysing…' : data ? 'Regenerate' : 'Analyse group'}
        </button>
      </div>

      {!hasPersonality && !data && (
        <div className="px-5 py-4">
          <p className="text-xs italic" style={{ color: '#c6b7a1' }}>
            Add personality tags to guests first. Pairings are more accurate with at least a few archetypes set.
          </p>
        </div>
      )}

      {error && (
        <div className="px-5 py-4">
          <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {data && (
        <div className="divide-y" style={{ borderColor: 'rgba(201,169,110,0.08)' }}>
          {/* Roommates */}
          {data.roommates.length > 0 && (
            <div className="px-5 py-4">
              <p style={{ ...eyebrow, marginBottom: 12 }}>🛏 Roommates</p>
              {data.roommates.map((p, i) => <PairRow key={i} pair={p} />)}
            </div>
          )}

          {/* Travel buddies */}
          {data.travelBuddies.length > 0 && (
            <div className="px-5 py-4">
              <p style={{ ...eyebrow, marginBottom: 12 }}>✈️ Travel buddies</p>
              {data.travelBuddies.map((p, i) => <PairRow key={i} pair={p} />)}
            </div>
          )}

          {/* Seating groups */}
          {data.seatingGroups.length > 0 && (
            <div className="px-5 py-4">
              <p style={{ ...eyebrow, marginBottom: 12 }}>🍽 Seating groups</p>
              <div className="space-y-3">
                {data.seatingGroups.map((g, i) => (
                  <div key={i} className="p-4" style={{ border: '1px solid rgba(201,169,110,0.12)', background: 'rgba(201,169,110,0.03)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: '#f5f0e8' }}>{g.tableName}</p>
                      <span className="text-xs italic" style={{ color: '#c6b7a1' }}>{g.vibe}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#c6b7a1' }}>
                      {g.guests.map(gs => gs.name).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.roommates.length === 0 && data.travelBuddies.length === 0 && data.seatingGroups.length === 0 && (
            <div className="px-5 py-4">
              <p className="text-xs italic" style={{ color: '#c6b7a1' }}>
                {guests.length < 2 ? 'Add at least 2 guests to generate pairings.' : 'No pairings generated. Try adding personality tags to your guests.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export function EventGuests() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);
  const [showAdd, setShowAdd] = useState(false);

  const { data: guests, isLoading, refetch } = useListGuests(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'guests'] },
  });
  const deleteGuest = useDeleteGuest();

  const handleDelete = (guestId: number) => {
    if (confirm('Remove this guest?')) {
      deleteGuest.mutate({ eventId: id, guestId }, { onSuccess: () => refetch() });
    }
  };

  const confirmed = guests?.filter((g) => g.rsvpStatus === 'confirmed').length ?? 0;
  const pending = guests?.filter((g) => g.rsvpStatus === 'pending').length ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-medium">Guests</h1>
          {(guests?.length ?? 0) > 0 && (
            <p className="text-sm text-muted-foreground">
              {guests!.length} added
              {confirmed > 0 && ` · ${confirmed} confirmed`}
              {pending > 0 && ` · ${pending} pending`}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !guests || guests.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="font-serif text-xl mb-2">No guests yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Add your guests and A-Moment will factor them into every recommendation.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add your first guest
          </button>
        </div>
      ) : (
        <>
          <GroupAnalysis guests={guests} eventId={id} />
          <GuestLinksSendPanel guests={guests} />
          <GuestPairings guests={guests} eventId={id} />
          <div className="space-y-3">
            {guests.map((guest) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                eventId={id}
                onDelete={handleDelete}
                onRefetch={refetch}
              />
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <AddGuestDrawer
          eventId={id}
          onClose={() => setShowAdd(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
