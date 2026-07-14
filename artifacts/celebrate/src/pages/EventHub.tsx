import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@clerk/react';
import { useGetEvent, useGetEventSummary, useListGuests, useUpdateEvent, useDeleteEvent } from '@workspace/api-client-react';
import {
  MessageSquare, Users, Sparkles, MapPin, Calendar as CalendarIcon,
  CheckCircle2, ChevronRight, Loader2, DollarSign, TrendingUp, RefreshCw,
  Pencil, Check, X, Link, Copy, Wand2, ScrollText, AlertCircle, ClipboardCopy,
  ClipboardList, ChevronDown,
} from 'lucide-react';
import { QUESTIONS } from '../lib/questionnaire-questions';
import { format, parseISO } from 'date-fns';

const CTX_MARKER = '__HOST_CONTEXT__:';
const PLAN_MARKER = '__CHOSEN_PLAN__:';
const PLANNING_FOR_MARKER = '__PLANNING_FOR__:';
const CELEBRANT_MARKER = '__CELEBRANT__:';
const Q_DISABLED_MARKER = '__Q_DISABLED__:';
const Q_CUSTOM_MARKER = '__Q_CUSTOM__:';

function parseQuestionnaireMeta(description: string | null | undefined): {
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

function extractHostContext(description: string | null | undefined): string {
  if (!description) return '';
  const ctxIdx = description.indexOf(CTX_MARKER);
  if (ctxIdx === -1) return '';
  let ctx = description.slice(ctxIdx + CTX_MARKER.length);
  // strip chosen plan if it follows
  const planIdx = ctx.indexOf(PLAN_MARKER);
  if (planIdx !== -1) ctx = ctx.slice(0, planIdx);
  return ctx.trim();
}

function buildDescriptionWithContext(existingDesc: string | null | undefined, hostContext: string): string {
  let desc = existingDesc ?? '';
  // Extract chosen plan portion (keep it intact at the end)
  let planPart = '';
  const planIdx = desc.indexOf(PLAN_MARKER);
  if (planIdx !== -1) {
    planPart = desc.slice(planIdx);
    desc = desc.slice(0, planIdx);
  }
  // Remove existing host context from what remains
  const ctxIdx = desc.indexOf(CTX_MARKER);
  if (ctxIdx !== -1) desc = desc.slice(0, ctxIdx);
  desc = desc.trim();

  const parts = [desc];
  if (hostContext.trim()) parts.push(`${CTX_MARKER}${hostContext.trim()}`);
  if (planPart) parts.push(planPart);
  return parts.filter(Boolean).join('\n');
}

/* ─── Questionnaire question editor ────────────────────────────────── */
function parseQuestionConfig(description: string | null | undefined): {
  disabledKeys: Set<string>;
  customQuestions: string[];
} {
  const desc = description ?? '';
  let disabledKeys = new Set<string>();
  let customQuestions: string[] = [];
  for (const line of desc.split('\n')) {
    if (line.startsWith(Q_DISABLED_MARKER)) {
      try { disabledKeys = new Set(JSON.parse(line.slice(Q_DISABLED_MARKER.length))); } catch {}
    }
    if (line.startsWith(Q_CUSTOM_MARKER)) {
      try { customQuestions = JSON.parse(line.slice(Q_CUSTOM_MARKER.length)); } catch {}
    }
  }
  return { disabledKeys, customQuestions };
}

function buildDescriptionWithQuestionConfig(
  existingDesc: string | null | undefined,
  disabledKeys: string[],
  customQuestions: string[],
): string {
  const lines = (existingDesc ?? '').split('\n').filter(
    line => !line.startsWith(Q_DISABLED_MARKER) && !line.startsWith(Q_CUSTOM_MARKER),
  );
  if (disabledKeys.length > 0) lines.push(`${Q_DISABLED_MARKER}${JSON.stringify(disabledKeys)}`);
  if (customQuestions.length > 0) lines.push(`${Q_CUSTOM_MARKER}${JSON.stringify(customQuestions)}`);
  return lines.join('\n').trim();
}

function QuestionnaireEditor({
  eventId, description, celebrantName,
}: { eventId: number; description: string | null | undefined; celebrantName: string }) {
  const { disabledKeys: initDisabled, customQuestions: initCustom } = parseQuestionConfig(description);
  const [open, setOpen] = useState(false);
  const [disabledKeys, setDisabledKeys] = useState<Set<string>>(initDisabled);
  const [customQuestions, setCustomQuestions] = useState<string[]>(initCustom);
  const [newQ, setNewQ] = useState('');
  const [saved, setSaved] = useState(false);
  const updateEvent = useUpdateEvent();

  useEffect(() => {
    const { disabledKeys: d, customQuestions: c } = parseQuestionConfig(description);
    setDisabledKeys(d);
    setCustomQuestions(c);
  }, [description]);

  const toggleKey = (key: string) =>
    setDisabledKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const addCustom = () => {
    const text = newQ.trim();
    if (!text) return;
    setCustomQuestions(prev => [...prev, text]);
    setNewQ('');
  };

  const removeCustom = (i: number) =>
    setCustomQuestions(prev => prev.filter((_, j) => j !== i));

  const save = () => {
    const newDesc = buildDescriptionWithQuestionConfig(description, [...disabledKeys], customQuestions);
    updateEvent.mutate(
      { eventId, data: { description: newDesc } },
      {
        onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
      },
    );
  };

  const activeCount = QUESTIONS.length - disabledKeys.size + customQuestions.length;

  return (
    <div className="bg-card rounded-2xl border border-border/50 mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium text-sm">Questionnaire questions</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{activeCount} active</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border/40 px-5 pb-5 pt-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            These are the questions {celebrantName || 'your celebrant'} will see when they open the link. Toggle any off, or add your own below.
          </p>

          {/* Built-in questions */}
          {QUESTIONS.map(q => {
            const enabled = !disabledKeys.has(q.key);
            return (
              <div key={q.key} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleKey(q.key)}
                  className={`relative flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 ${
                    enabled ? 'bg-primary' : 'bg-muted-foreground/25'
                  }`}
                  aria-label={enabled ? 'Disable question' : 'Enable question'}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug transition-colors ${
                    enabled ? 'text-foreground' : 'text-muted-foreground/50 line-through'
                  }`}>
                    {q.label}
                  </p>
                  {q.options && enabled && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                      {q.options.slice(0, 3).join(' · ')}{q.options.length > 3 ? ` +${q.options.length - 3}` : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Custom questions */}
          {customQuestions.map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="relative flex-shrink-0 mt-0.5 w-9 h-5 rounded-full bg-primary">
                <span className="absolute top-0.5 translate-x-4 w-4 h-4 bg-white rounded-full shadow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug text-foreground">{text}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Custom · freetext</p>
              </div>
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="flex-shrink-0 mt-0.5 text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add custom question */}
          <div className="flex gap-2 pt-2 border-t border-border/30">
            <input
              type="text"
              value={newQ}
              onChange={e => setNewQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="Add a question…"
              className="flex-1 text-sm bg-background border border-border rounded-full px-4 py-1.5 outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!newQ.trim()}
              className="px-4 py-1.5 bg-muted text-foreground rounded-full text-xs font-medium hover:bg-muted/70 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={save}
              disabled={updateEvent.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateEvent.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : saved
                ? <Check className="w-3.5 h-3.5" />
                : null}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Per-event context panel ───────────────────────────────────────── */
function EventContextPanel({ eventId, description }: { eventId: number; description: string | null | undefined }) {
  const existing = extractHostContext(description);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(existing);
  const [saveError, setSaveError] = useState('');
  const updateEvent = useUpdateEvent();

  useEffect(() => { setValue(extractHostContext(description)); }, [description]);

  const save = () => {
    const newDesc = buildDescriptionWithContext(description, value);
    setSaveError('');
    updateEvent.mutate(
      { eventId, data: { description: newDesc } },
      {
        onSuccess: () => setEditing(false),
        onError: () => setSaveError('Could not save. Try again.'),
      }
    );
  };

  const cancel = () => { setValue(existing); setEditing(false); };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">Your context for this event</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Moment reads this. Different from your global profile — specific to this plan.</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-border hover:border-primary/40"
          >
            <Pencil className="w-3 h-3" /> {existing ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            rows={4}
            placeholder={`E.g., "I'm planning this for my boss's 50th — budget is flexible but it needs to feel effortless, not flashy. He hates surprises and loves wine. The group is 8 executives, most with partners."`}
            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary resize-none leading-relaxed placeholder:text-muted-foreground/60"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={updateEvent.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
            </button>
          </div>
          {saveError && <p className="text-xs text-destructive mt-2">{saveError}</p>}
        </div>
      ) : existing ? (
        <p className="text-sm text-foreground/80 leading-relaxed italic">{existing}</p>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic">
          Tell Moment who you are in the context of this specific event — your role, constraints, what this group means to you.
        </p>
      )}
    </div>
  );
}

function EventTabs({ activeTab, eventId }: { activeTab: string; eventId: string }) {
  const [, setLocation] = useLocation();
  const tabs = [
    { id: 'overview', label: 'Hub' },
    { id: 'chat',     label: 'Plan' },
    { id: 'guests',   label: 'Guests' },
  ];
  return (
    <div className="flex items-center overflow-x-auto no-scrollbar border-b border-border/60 pb-px mb-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const href = tab.id === 'overview'
          ? `/events/${eventId}`
          : `/events/${eventId}/${tab.id === 'chat' ? 'plan' : tab.id}`;
        return (
          <button
            key={tab.id}
            onClick={() => setLocation(href)}
            className={`whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Attendance teaser ─────────────────────────────────────────────── */
interface GuestLike { rsvpStatus: string; personality?: string | null }

function parsePersonality(raw?: string | null) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function AttendanceSummary({ guests, total, onManage }: { guests: GuestLike[]; total: number; onManage: () => void }) {
  const confirmed = guests.filter((g) => {
    const p = parsePersonality(g.personality);
    return g.rsvpStatus === 'confirmed' || p.likelihood === 'Definitely in';
  }).length;
  const probable = guests.filter((g) => {
    const p = parsePersonality(g.personality);
    return p.likelihood === 'Probably';
  }).length;
  const likely = confirmed + probable;
  const pct = guests.length > 0 ? Math.round((likely / guests.length) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" /> Attendance forecast
        </h3>
        <button onClick={onManage} className="text-xs text-primary hover:underline">Manage</button>
      </div>
      {guests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add guests to see who's likely to show up.</p>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-serif font-medium text-primary">{likely}</span>
            <span className="text-muted-foreground text-sm mb-0.5">of {guests.length} likely</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{confirmed} confirmed</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{probable} probable</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />{guests.length - likely} uncertain</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Cost estimate widget ──────────────────────────────────────────── */
interface CostLine {
  category: string;
  perPersonMin: number;
  perPersonMax: number;
  notes: string;
}

interface CostData {
  currency: string;
  currencyCode: string;
  perPersonMin: number;
  perPersonMax: number;
  totalMin: number;
  totalMax: number;
  guestCount: number;
  breakdown: CostLine[];
  assumptions: string;
  insiderTip: string;
}

function fmt(n: number, code: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${code} ${n.toLocaleString()}`;
  }
}

function CostEstimateWidget({ eventId }: { eventId: number }) {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { getToken } = useAuth();

  const fetch_ = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await getToken();
      const res = await fetch(`/api/events/${eventId}/cost-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50">
      <h3 className="font-medium flex items-center gap-2 text-sm mb-3">
        <DollarSign className="w-4 h-4 text-primary" /> Cost snapshot
      </h3>

      {!data && !loading && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Get a real-world cost breakdown based on your location and event type.
          </p>
          <button
            onClick={fetch_}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Estimate costs
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs text-muted-foreground">Pricing it out...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Could not generate estimate.</p>
          <button onClick={fetch_} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Headline */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Per person</p>
              <p className="text-2xl font-serif font-medium text-primary">
                {fmt(data.perPersonMin, data.currencyCode)} – {fmt(data.perPersonMax, data.currencyCode)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total ({data.guestCount} guests)</p>
              <p className="text-sm font-medium">{fmt(data.totalMin, data.currencyCode)} – {fmt(data.totalMax, data.currencyCode)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {data.breakdown.map((line) => (
              <div key={line.category} className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-border/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{line.category}</span>
                  {line.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{line.notes}</p>
                  )}
                </div>
                <span className="text-muted-foreground whitespace-nowrap text-xs pt-0.5">
                  {fmt(line.perPersonMin, data.currencyCode)}–{fmt(line.perPersonMax, data.currencyCode)}<span className="text-muted-foreground/60">/pp</span>
                </span>
              </div>
            ))}
          </div>

          {/* Insider tip */}
          {data.insiderTip && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground leading-relaxed">
              <span className="font-medium text-primary">Insider tip: </span>{data.insiderTip}
            </div>
          )}

          {/* Assumptions */}
          {data.assumptions && (
            <p className="text-xs text-muted-foreground italic leading-relaxed">{data.assumptions}</p>
          )}

          <button
            onClick={fetch_}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh estimate
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Questionnaire share banner ────────────────────────────────────── */
function QuestionnaireBanner({
  celebrantName, questionnaireToken,
}: { celebrantName: string; questionnaireToken: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  const url = questionnaireToken
    ? `${window.location.origin}/q/${questionnaireToken}`
    : '';

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm flex items-center gap-2">
          <Link className="w-4 h-4 text-primary" />
          {celebrantName
            ? `Share with ${celebrantName} — their answers feed into Moment`
            : 'Send your celebrant the questionnaire — their answers feed into Moment'}
        </p>
        {url && (
          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{url}</p>
        )}
      </div>
      {url && (
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export function EventHub() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = useGetEvent(id, {
    query: { enabled: !!id, queryKey: ['events', id] },
  });
  const { data: summary, isLoading: summaryLoading } = useGetEventSummary(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'summary'] },
  });
  const { data: guests } = useListGuests(id, {
    query: { enabled: !!id, queryKey: ['events', id, 'guests'] },
  });

  const { getToken } = useAuth();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ── Reveal script ────────────────────────────────────────────────────
  type RevealScript = {
    timing: { suggestion: string; why: string };
    setting: { suggestion: string; why: string };
    script: { opening: string; buildup: string; theReveal: string; afterword: string };
    doNots: string[];
    contingency: string;
  };
  const [revealScript, setRevealScript] = useState<RevealScript | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState('');
  const [revealCopied, setRevealCopied] = useState(false);

  const generateRevealScript = async () => {
    setRevealLoading(true);
    setRevealError('');
    try {
      const token = await getToken();
      const res = await fetch(`/api/events/${id}/reveal-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setRevealScript(await res.json());
    } catch {
      setRevealError('Could not generate the script. Try again.');
    } finally {
      setRevealLoading(false);
    }
  };

  const copyRevealScript = () => {
    if (!revealScript) return;
    const s = revealScript.script;
    const text = [
      `⏰ TIMING\n${revealScript.timing.suggestion}`,
      `📍 SETTING\n${revealScript.setting.suggestion}`,
      `🎬 THE SCRIPT`,
      `Opening: ${s.opening}`,
      `Build-up: ${s.buildup}`,
      `The reveal: ${s.theReveal}`,
      `After: ${s.afterword}`,
      `🚫 AVOID\n${revealScript.doNots.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
      `🆘 IF THEY REACT UNEXPECTEDLY\n${revealScript.contingency}`,
    ].join('\n\n');
    navigator.clipboard.writeText(text);
    setRevealCopied(true);
    setTimeout(() => setRevealCopied(false), 2500);
  };

  const toggleStep = (i: number) =>
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleResetPlan = () => {
    if (actionBusy) return;
    setActionBusy(true);
    const desc = event?.description ?? '';
    const planIdx = desc.indexOf(PLAN_MARKER);
    const newDesc = planIdx !== -1 ? desc.slice(0, planIdx).trimEnd() : desc;
    updateEvent.mutate(
      { eventId: id, data: { description: newDesc } },
      {
        onSuccess: () => { setActionBusy(false); setConfirmReset(false); setLocation(`/events/${eventId}/options`); },
        onError: () => { setActionBusy(false); },
      }
    );
  };

  const handleDeleteEvent = () => {
    if (actionBusy) return;
    setActionBusy(true);
    deleteEvent.mutate(
      { eventId: id },
      {
        onSuccess: () => { setActionBusy(false); setLocation('/'); },
        onError: () => { setActionBusy(false); },
      }
    );
  };

  if (eventLoading || summaryLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!event || !summary) return <div className="p-8">Event not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 mb-8">
        <div className="h-48 md:h-64 bg-muted relative">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 right-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md">
                {event.type.toUpperCase()}
              </span>
              <span className="bg-black/40 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                {event.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-white mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm md:text-base">
              {event.startDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{format(parseISO(event.startDate), 'MMMM d, yyyy')}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventTabs activeTab="overview" eventId={eventId} />

      {/* Questionnaire share banner — shown when planning for someone and they haven't answered yet */}
      {(() => {
        const { planningForSomeone, celebrantName, celebrantAnswered } = parseQuestionnaireMeta(event.description);
        const token = (event as any).questionnaireToken;
        if (planningForSomeone && !celebrantAnswered) {
          return (
            <>
              <QuestionnaireBanner celebrantName={celebrantName} questionnaireToken={token} />
              <QuestionnaireEditor eventId={id} description={event.description} celebrantName={celebrantName} />
            </>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: progress + next steps */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" /> Planning progress
            </h2>
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-5xl font-serif font-medium text-primary mb-2">
                    {summary.completionPercent}%
                  </div>
                  <p className="text-muted-foreground">Ready to celebrate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{summary.confirmedGuests} / {summary.guestCount} confirmed</p>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${summary.completionPercent}%` }}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-4">Next steps</h2>
            <div className="space-y-3">
              {summary.nextSteps && summary.nextSteps.length > 0 ? (
                summary.nextSteps.map((step, i) => {
                  const done = completedSteps.has(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleStep(i)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
                        done
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card border-border/50 hover:border-primary/40 hover:bg-primary/3'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        done ? 'border-primary bg-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'
                      }`}>
                        {done && <CheckCircle2 className="w-4 h-4 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      <p className={`leading-relaxed transition-colors ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step}</p>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground bg-card rounded-xl border border-border/50">
                  <p>All caught up. Chat with Moment to figure out what&apos;s next.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setLocation(`/events/${eventId}/plan`)}
              className="w-full mt-6 flex items-center justify-between p-4 bg-foreground text-background rounded-xl hover:bg-primary transition-colors group"
            >
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Ask Moment what to do next
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>

          {/* ── Reveal script — only for surprise events ── */}
          {(() => {
            const { planningForSomeone, celebrantName } = parseQuestionnaireMeta(event.description);
            if (!planningForSomeone) return null;
            const name = celebrantName || 'them';
            return (
              <section>
                <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" /> Reveal script
                </h2>

                {!revealScript && !revealLoading && (
                  <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ScrollText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">How will you tell {name}?</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Get a personalised script — timing, setting, exactly what to say, what to avoid, and how to handle any reaction.
                      </p>
                      {revealError && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> {revealError}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={generateRevealScript}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      <Wand2 className="w-4 h-4" /> Generate
                    </button>
                  </div>
                )}

                {revealLoading && (
                  <div className="bg-card rounded-2xl border border-border/50 p-8 flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm">Writing {name}&apos;s reveal script…</p>
                  </div>
                )}

                {revealScript && !revealLoading && (
                  <div className="space-y-4">
                    {/* Timing + Setting row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: '⏰ When', ...revealScript.timing },
                        { label: '📍 Where', ...revealScript.setting },
                      ].map(({ label, suggestion, why }) => (
                        <div key={label} className="bg-card rounded-xl border border-border/50 p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                          <p className="text-sm font-medium text-foreground mb-1">{suggestion}</p>
                          <p className="text-xs text-muted-foreground italic">{why}</p>
                        </div>
                      ))}
                    </div>

                    {/* The script */}
                    <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🎬 The script</p>
                      {[
                        { phase: 'Opening', text: revealScript.script.opening },
                        { phase: 'Build-up', text: revealScript.script.buildup },
                        { phase: 'The reveal', text: revealScript.script.theReveal },
                        { phase: 'After', text: revealScript.script.afterword },
                      ].map(({ phase, text }) => (
                        <div key={phase} className="flex gap-4">
                          <div className="w-20 flex-shrink-0">
                            <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full whitespace-nowrap">{phase}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>
                        </div>
                      ))}
                    </div>

                    {/* Don'ts */}
                    <div className="bg-card rounded-xl border border-border/50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">🚫 Avoid these</p>
                      <ul className="space-y-1.5">
                        {revealScript.doNots.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-destructive/60 mt-0.5 flex-shrink-0">✕</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contingency */}
                    <div className="bg-muted/50 rounded-xl border border-border/40 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">🆘 If they react unexpectedly</p>
                      <p className="text-sm text-foreground leading-relaxed">{revealScript.contingency}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={copyRevealScript}
                        className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                      >
                        {revealCopied ? <Check className="w-4 h-4 text-primary" /> : <ClipboardCopy className="w-4 h-4" />}
                        {revealCopied ? 'Copied!' : 'Copy script'}
                      </button>
                      <button
                        onClick={generateRevealScript}
                        className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })()}
        </div>

        {/* Right: stats, predictions, cost, quick actions */}
        <div className="space-y-5">
          {/* At a glance */}
          <div className="bg-card rounded-2xl p-5 border border-border/50">
            <h3 className="font-medium text-sm border-b border-border/50 pb-3 mb-4">At a glance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Guests</p>
                <p className="text-2xl font-medium">{summary.guestCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Venues saved</p>
                <p className="text-2xl font-medium">{summary.savedSuggestions}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Chats</p>
                <p className="text-2xl font-medium">{summary.sessionCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Invites</p>
                <p className="text-2xl font-medium">{summary.inviteCount}</p>
              </div>
            </div>
          </div>

          {/* Attendance forecast */}
          <AttendanceSummary
            guests={guests ?? []}
            total={summary.guestCount}
            onManage={() => setLocation(`/events/${eventId}/guests`)}
          />

          {/* Per-event context for Moment */}
          <EventContextPanel eventId={id} description={event.description} />

          {/* Cost snapshot */}
          <CostEstimateWidget eventId={id} />

          {/* Quick nav */}
          <div className="space-y-2">
            {[
              { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat with Moment', color: 'bg-primary/10 text-primary', href: `plan` },
              { icon: <Sparkles className="w-5 h-5" />, label: 'View / change plan options', color: 'bg-accent/20 text-foreground', href: `options` },
              { icon: <Users className="w-5 h-5" />, label: 'Manage Guests', color: 'bg-muted text-muted-foreground', href: `guests` },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setLocation(`/events/${eventId}/${item.href}`)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* Danger zone */}
          <div className="border border-destructive/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/20">
              <p className="text-xs font-medium text-destructive/70 uppercase tracking-wide">Danger zone</p>
            </div>
            <div className="divide-y divide-border/50">
              {/* Reset plan */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Reset plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Remove the chosen plan and pick a new one from options.</p>
                  </div>
                  {!confirmReset ? (
                    <button
                      onClick={() => { setConfirmReset(true); setConfirmDelete(false); }}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:border-destructive/50 hover:text-destructive transition-colors"
                    >
                      Reset
                    </button>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmReset(false)}
                        disabled={actionBusy}
                        className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResetPlan}
                        disabled={actionBusy}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        {actionBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete event */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Delete event</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently remove this event and all its data.</p>
                  </div>
                  {!confirmDelete ? (
                    <button
                      onClick={() => { setConfirmDelete(true); setConfirmReset(false); }}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={actionBusy}
                        className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={actionBusy}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        {actionBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Delete forever
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
