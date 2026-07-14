import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useListGuests, useAddGuest, useDeleteGuest, useUpdateGuest } from '@workspace/api-client-react';
import {
  Users, Plus, ChevronLeft, Loader2, Trash2, Check, X, Phone, Mail, AlertCircle,
  ChevronDown, ChevronUp, Copy, Link2,
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
            <p className="text-sm text-muted-foreground mt-1">Name is required — everything else is optional.</p>
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
