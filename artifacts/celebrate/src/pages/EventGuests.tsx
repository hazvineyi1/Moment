import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import {
  useListGuests, useAddGuest, useDeleteGuest, useGetGuestPairings, useUpdateGuest,
} from '@workspace/api-client-react';
import {
  Users, Plus, ChevronLeft, Loader2, Trash2, Sparkles, ChevronDown, ChevronUp, Check, X,
  Phone, Mail, AlertCircle,
} from 'lucide-react';

/* ─── Personality shape ────────────────────────────────────────────── */
interface GuestPersonality {
  social: string;
  energy: string;
  travelStyle: string;
  quirks: string[];
  likelihood: string;
}

const DEFAULTS: GuestPersonality = {
  social: '',
  energy: '',
  travelStyle: '',
  quirks: [],
  likelihood: '',
};

function parsePersonality(raw?: string | null): GuestPersonality {
  if (!raw) return { ...DEFAULTS };
  try { return { ...DEFAULTS, ...JSON.parse(raw) }; } catch { return { ...DEFAULTS }; }
}

/* ─── Chip helpers ──────────────────────────────────────────────────── */
function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
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

function SingleSelect({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} active={value === o} onClick={() => onChange(value === o ? '' : o)} />
      ))}
    </div>
  );
}

function MultiSelect({
  options, values, onChange,
}: { options: string[]; values: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((x) => x !== o) : [...values, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} active={values.includes(o)} onClick={() => toggle(o)} />
      ))}
    </div>
  );
}

/* ─── Likelihood helpers ────────────────────────────────────────────── */
const LIKELIHOOD_OPTIONS = ['Definitely in', 'Probably', 'Maybe', 'Unlikely'];
const LIKELIHOOD_COLOR: Record<string, string> = {
  'Definitely in': 'bg-emerald-500',
  'Probably':      'bg-primary',
  'Maybe':         'bg-amber-400',
  'Unlikely':      'bg-rose-400',
  'pending':       'bg-amber-400',
  'confirmed':     'bg-emerald-500',
  'declined':      'bg-rose-400',
};
const LIKELIHOOD_PCT: Record<string, number> = {
  'Definitely in': 95,
  'Probably':      70,
  'Maybe':         35,
  'Unlikely':      10,
  '':              40,
};

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
  guest: { id: number; name: string; email?: string | null; phone?: string | null; whatsapp?: string | null; rsvpStatus: string; personality?: string | null; dietaryNeeds?: string | null; notes?: string | null };
  eventId: number;
  onDelete: (id: number) => void;
  onRefetch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const updateGuest = useUpdateGuest();
  const p = parsePersonality(guest.personality);

  const initials = guest.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const likelihoodPct = LIKELIHOOD_PCT[p.likelihood] ?? (
    guest.rsvpStatus === 'confirmed' ? 95 : guest.rsvpStatus === 'declined' ? 5 : 40
  );
  const barColor = LIKELIHOOD_COLOR[p.likelihood] || LIKELIHOOD_COLOR[guest.rsvpStatus] || 'bg-muted-foreground';

  const setRsvp = (rsvpStatus: string) => {
    updateGuest.mutate({ eventId, guestId: guest.id, data: { rsvpStatus } }, { onSuccess: onRefetch });
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Likelihood bar */}
      <div className="h-1 bg-muted w-full">
        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${likelihoodPct}%` }} />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{guest.name}</span>
              <RsvpBadge status={guest.rsvpStatus} />
            </div>

            {/* Personality chips */}
            {(p.social || p.energy || p.travelStyle) && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {p.social && <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{p.social}</span>}
                {p.energy && <span className="text-[10px] bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">{p.energy}</span>}
                {p.travelStyle && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p.travelStyle}</span>}
                {p.quirks?.slice(0, 2).map((q: string) => (
                  <span key={q} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q}</span>
                ))}
              </div>
            )}

            {/* Likelihood label */}
            {p.likelihood && (
              <p className="text-xs text-muted-foreground mt-1">{p.likelihood} to attend</p>
            )}
          </div>

          {/* Expand toggle */}
          <button onClick={() => setOpen(!open)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors flex-shrink-0">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded */}
        {open && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Contact */}
            {(guest.email || guest.whatsapp || guest.phone) && (
              <div className="space-y-1 text-sm text-muted-foreground">
                {guest.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{guest.email}</div>}
                {(guest.whatsapp || guest.phone) && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{guest.whatsapp || guest.phone}</div>}
              </div>
            )}

            {/* Dietary */}
            {guest.dietaryNeeds && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{guest.dietaryNeeds}</span>
              </div>
            )}

            {/* All quirks */}
            {p.quirks?.length > 2 && (
              <div className="flex flex-wrap gap-1">
                {p.quirks.slice(2).map((q: string) => (
                  <span key={q} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q}</span>
                ))}
              </div>
            )}

            {/* Notes */}
            {guest.notes && (
              <p className="text-sm text-muted-foreground italic">"{guest.notes}"</p>
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

/* ─── Add guest drawer ──────────────────────────────────────────────── */
const QUIRK_OPTIONS = [
  'Early riser', 'Night owl', 'FOMO', 'JOMO', 'Adventure seeker',
  'Creature of comfort', 'Picky eater', 'Foodie', 'Non-drinker',
  'Social butterfly', 'Introvert recharger', 'VIP energy', 'Always late', 'Budget hawk',
];
const DIETARY_CHIPS = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'Nut allergy'];

interface NewGuest {
  name: string;
  whatsapp: string;
  email: string;
  social: string;
  energy: string;
  travelStyle: string;
  quirks: string[];
  likelihood: string;
  dietary: string;
  notes: string;
}

const EMPTY_GUEST: NewGuest = {
  name: '', whatsapp: '', email: '',
  social: '', energy: '', travelStyle: '',
  quirks: [], likelihood: '', dietary: '', notes: '',
};

function AddGuestDrawer({
  eventId, onClose, onSuccess,
}: { eventId: number; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [g, setG] = useState<NewGuest>({ ...EMPTY_GUEST });
  const addGuest = useAddGuest();

  const set = (field: keyof NewGuest, value: string | string[]) =>
    setG((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!g.name.trim()) return;
    const personality: GuestPersonality = {
      social: g.social,
      energy: g.energy,
      travelStyle: g.travelStyle,
      quirks: g.quirks,
      likelihood: g.likelihood,
    };
    addGuest.mutate({
      eventId,
      data: {
        name: g.name,
        whatsapp: g.whatsapp || undefined,
        email: g.email || undefined,
        personality: JSON.stringify(personality),
        dietaryNeeds: g.dietary && g.dietary !== 'None' ? g.dietary : undefined,
        notes: g.notes || undefined,
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

        <div className="p-6 pb-safe">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all ${
                  s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Who */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="font-serif text-2xl font-medium">Who's coming?</h2>
                <p className="text-sm text-muted-foreground mt-1">Name and how to reach them.</p>
              </div>
              <input
                type="text"
                placeholder="Full name *"
                value={g.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
                autoFocus
              />
              <input
                type="tel"
                placeholder="WhatsApp number"
                value={g.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={g.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!g.name.trim()}
                  className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personality */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="font-serif text-2xl font-medium">What are they like?</h2>
                <p className="text-sm text-muted-foreground mt-1">This helps Cele pair guests and tailor suggestions.</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Social style</p>
                <SingleSelect
                  options={['Introvert', 'Ambivert', 'Extrovert']}
                  value={g.social}
                  onChange={(v) => set('social', v)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Energy level</p>
                <SingleSelect
                  options={['Mellow', 'Moderate', 'Wild']}
                  value={g.energy}
                  onChange={(v) => set('energy', v)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Travel style</p>
                <SingleSelect
                  options={['Budget-conscious', 'Balanced', 'Splurger']}
                  value={g.travelStyle}
                  onChange={(v) => set('travelStyle', v)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Quirks & traits <span className="text-muted-foreground font-normal">(pick any)</span></p>
                <MultiSelect
                  options={QUIRK_OPTIONS}
                  values={g.quirks}
                  onChange={(v) => set('quirks', v)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Likelihood + dietary */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="font-serif text-2xl font-medium">Will they make it?</h2>
                <p className="text-sm text-muted-foreground mt-1">A gut-feel helps us plan for the right headcount.</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Attendance likelihood</p>
                <SingleSelect
                  options={LIKELIHOOD_OPTIONS}
                  value={g.likelihood}
                  onChange={(v) => set('likelihood', v)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Dietary needs</p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_CHIPS.map((d) => (
                    <Chip key={d} label={d} active={g.dietary === d} onClick={() => set('dietary', g.dietary === d ? '' : d)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Notes <span className="text-muted-foreground font-normal">(optional)</span></p>
                <textarea
                  placeholder="Anything Cele should remember about them..."
                  value={g.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={2}
                  className="w-full bg-transparent border border-border rounded-xl px-4 py-3 focus:border-primary outline-none resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={addGuest.isPending}
                  className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                >
                  {addGuest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Add guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Prediction meter ──────────────────────────────────────────────── */
function PredictionMeter({ guests }: { guests: { rsvpStatus: string; personality?: string | null }[] }) {
  const counts = useMemo(() => {
    let definite = 0, probable = 0, maybe = 0, unlikely = 0;
    for (const g of guests) {
      const p = parsePersonality(g.personality);
      const l = p.likelihood;
      if (l === 'Definitely in' || g.rsvpStatus === 'confirmed') definite++;
      else if (l === 'Probably') probable++;
      else if (l === 'Maybe' || g.rsvpStatus === 'pending') maybe++;
      else if (l === 'Unlikely' || g.rsvpStatus === 'declined') unlikely++;
      else maybe++;
    }
    return { definite, probable, maybe, unlikely };
  }, [guests]);

  const likely = counts.definite + counts.probable;
  const total = guests.length;
  const pct = total > 0 ? Math.round((likely / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 mb-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">Expected turnout</p>
          <p className="text-3xl font-serif font-medium text-primary">{likely} <span className="text-lg text-muted-foreground font-normal">of {total}</span></p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-medium">{pct}%</p>
          <p className="text-xs text-muted-foreground">likely to attend</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden flex gap-px">
        {counts.definite > 0 && (
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(counts.definite / total) * 100}%` }} />
        )}
        {counts.probable > 0 && (
          <div className="bg-primary h-full transition-all" style={{ width: `${(counts.probable / total) * 100}%` }} />
        )}
        {counts.maybe > 0 && (
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${(counts.maybe / total) * 100}%` }} />
        )}
        {counts.unlikely > 0 && (
          <div className="bg-rose-400 h-full transition-all" style={{ width: `${(counts.unlikely / total) * 100}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{counts.definite} definite</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" />{counts.probable} probable</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{counts.maybe} maybe</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />{counts.unlikely} unlikely</span>
      </div>
    </div>
  );
}

/* ─── Pairings panel ────────────────────────────────────────────────── */
function PairingsPanel({ eventId }: { eventId: number }) {
  const [visible, setVisible] = useState(false);
  const { data: pairings, isLoading, refetch } = useGetGuestPairings(eventId, {
    query: { enabled: false, queryKey: ['events', eventId, 'pairings'] },
  });

  const handleGenerate = () => {
    setVisible(true);
    refetch();
  };

  if (!visible) {
    return (
      <button
        onClick={handleGenerate}
        className="flex items-center justify-center gap-2 bg-card border border-border px-5 py-2.5 rounded-full font-medium text-sm hover:border-primary transition-colors"
      >
        <Sparkles className="w-4 h-4 text-primary" /> Smart pairings
      </button>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 animate-in zoom-in-95">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Smart pairings
        </h3>
        <button onClick={() => setVisible(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      {isLoading ? (
        <div className="py-8 flex flex-col items-center gap-3 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Analyzing personalities...</p>
        </div>
      ) : pairings ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground italic bg-background p-3 rounded-xl border border-border">{pairings.reasoning}</p>
          {pairings.seatingGroups?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pairings.seatingGroups.map((group, i) => (
                <div key={i} className="bg-background rounded-xl p-4 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{group.tableName}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{group.vibe}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.guests.map((g) => (
                      <span key={g.id} className="text-xs bg-card border border-border px-2 py-1 rounded-full">{g.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add more guests with personality info to unlock pairings.</p>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-medium">Guests</h1>
          <p className="text-sm text-muted-foreground">{guests?.length ?? 0} added</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !guests || guests.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="font-serif text-xl mb-2">No guests yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Cele remembers details about each person so you don't have to.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add your first guest
          </button>
        </div>
      ) : (
        <>
          {/* Prediction meter */}
          <PredictionMeter guests={guests} />

          {/* Pairings */}
          <div className="mb-6">
            <PairingsPanel eventId={id} />
          </div>

          {/* Cards */}
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

      {/* Add drawer */}
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
