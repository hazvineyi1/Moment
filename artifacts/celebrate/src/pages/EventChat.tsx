import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import { useListSessions, useCreateSession, useListMessages, useSendMessage, useGetEvent } from '@workspace/api-client-react';
import { Send, Bot, ChevronLeft, User as UserIcon, RefreshCw, Check } from 'lucide-react';

// ─── Option card parser ────────────────────────────────────────────────────────
interface ParsedOption {
  number: number;
  title: string;
  body: string;
}
interface ParsedMessage {
  preamble: string;
  options: ParsedOption[];
  postamble: string;
}

/**
 * Detects messages that contain a numbered list of **Bold:** description items
 * (at least 2 items). Returns null if the message isn't an options list.
 */
function parseOptionsList(content: string): ParsedMessage | null {
  // Match lines like: 1. **Title:** body  or  1. **Title** body
  const itemRe = /^(\d+)\.\s+\*\*(.+?)\*\*[:\s]+(.+)/;
  const lines = content.split('\n');

  const optionLines: Array<{ lineIdx: number; option: ParsedOption }> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(itemRe);
    if (m) {
      optionLines.push({
        lineIdx: i,
        option: { number: parseInt(m[1], 10), title: m[2].trim(), body: m[3].trim() },
      });
    }
  }

  if (optionLines.length < 2) return null;

  const firstIdx = optionLines[0].lineIdx;
  const lastIdx = optionLines[optionLines.length - 1].lineIdx;

  const preamble = lines.slice(0, firstIdx).join('\n').trim();
  const postamble = lines.slice(lastIdx + 1).join('\n').trim();

  return { preamble, options: optionLines.map(o => o.option), postamble };
}

/** Renders bold (**text**) within a string as <strong> */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function OptionsCards({
  parsed,
  onChoose,
}: {
  parsed: ParsedMessage;
  onChoose: (title: string) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);

  const handleChoose = (opt: ParsedOption) => {
    if (chosen !== null) return;
    setChosen(opt.number);
    onChoose(opt.title);
  };

  return (
    <div className="space-y-3 w-full">
      {parsed.preamble && (
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{parsed.preamble}</p>
      )}
      <div className="flex flex-col gap-2 mt-1">
        {parsed.options.map(opt => {
          const isChosen = chosen === opt.number;
          const isDimmed = chosen !== null && !isChosen;
          return (
            <button
              key={opt.number}
              type="button"
              onClick={() => handleChoose(opt)}
              disabled={chosen !== null}
              className="text-left w-full px-4 py-4 transition-all duration-200"
              style={{
                border: `1px solid ${isChosen ? '#c9a96e' : 'rgba(201,169,110,0.12)'}`,
                background: isChosen ? 'rgba(201,169,110,0.05)' : '#141414',
                opacity: isDimmed ? 0.4 : 1,
                cursor: isDimmed ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full text-xs font-light flex items-center justify-center transition-colors"
                  style={{
                    border: `1px solid ${isChosen ? '#c9a96e' : 'rgba(201,169,110,0.2)'}`,
                    color: isChosen ? '#c9a96e' : '#8a7a65',
                  }}
                >
                  {isChosen ? <Check className="w-3 h-3" /> : opt.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm leading-snug mb-0.5"
                    style={{ color: isChosen ? '#c9a96e' : '#f5f0e8' }}
                  >
                    {opt.title}
                  </p>
                  <p className="text-xs font-light leading-relaxed" style={{ color: '#8a7a65' }}>{opt.body}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {parsed.postamble && (
        <p className="text-sm text-muted-foreground leading-relaxed mt-1 whitespace-pre-wrap italic">{parsed.postamble}</p>
      )}
    </div>
  );
}

function MessageContent({
  content,
  onSend,
}: {
  content: string;
  onSend: (text: string) => void;
}) {
  const parsed = parseOptionsList(content);
  if (parsed) {
    return <OptionsCards parsed={parsed} onChoose={onSend} />;
  }
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
      <InlineMarkdown text={content} />
    </p>
  );
}

const QUESTION_CHIPS = [
  "Yes, let's go with that",
  "Not quite right",
  "Tell me more",
  "Show me alternatives",
];

function QuestionChips({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  const handle = (chip: string) => {
    if (chosen) return;
    setChosen(chip);
    onSend(chip);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 ml-11">
      {QUESTION_CHIPS.map((chip) => {
        const isChosen = chosen === chip;
        const isDimmed = chosen !== null && !isChosen;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => handle(chip)}
            disabled={chosen !== null}
            className="px-3.5 py-1.5 text-xs tracking-wide transition-all duration-200"
            style={{
              border: `1px solid ${isChosen ? '#c9a96e' : 'rgba(201,169,110,0.2)'}`,
              color: isChosen ? '#c9a96e' : isDimmed ? 'rgba(201,169,110,0.25)' : '#8a7a65',
              background: isChosen ? 'rgba(201,169,110,0.08)' : 'transparent',
              cursor: isDimmed ? 'default' : 'pointer',
              opacity: isDimmed ? 0.4 : 1,
            }}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}

type OptimisticMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isPending?: boolean;
};

export function EventChat() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = parseInt(eventId, 10);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [sessionCreating, setSessionCreating] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: event } = useGetEvent(id, { query: { enabled: !!id } });

  const { data: sessions, isLoading: sessionsLoading } = useListSessions(id, {
    query: { enabled: !!id }
  });

  const createSession = useCreateSession();

  // Initialize session — guarded to prevent infinite loop
  useEffect(() => {
    if (!id || !sessions || sessionCreating || sessionError) return;

    if (sessions.length > 0) {
      if (!activeSessionId) setActiveSessionId(sessions[0].id);
      return;
    }

    // No sessions yet — create one (once)
    setSessionCreating(true);
    createSession.mutate(
      { eventId: id, data: { title: 'Planning Session' } },
      {
        onSuccess: (s) => {
          setActiveSessionId(s.id);
          setSessionCreating(false);
        },
        onError: () => {
          setSessionCreating(false);
          setSessionError(true);
        },
      }
    );
  }, [sessions, id]);

  const { data: serverMessages, isLoading: messagesLoading, refetch: refetchMessages } = useListMessages(
    id,
    activeSessionId!,
    { query: { enabled: !!id && !!activeSessionId } }
  );

  const sendMessage = useSendMessage();

  // Merge server messages with optimistic ones
  const allMessages: OptimisticMessage[] = [
    ...(serverMessages ?? []).map((m) => ({
      id: String(m.id),
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    ...optimisticMessages,
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length]);

  const handleSend = (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const content = preset || input.trim();
    if (!content || !activeSessionId || sendMessage.isPending) return;

    setInput('');

    // Optimistic: show user message + thinking bubble immediately
    const userOptId = `opt-user-${Date.now()}`;
    const thinkOptId = `opt-think-${Date.now()}`;
    setOptimisticMessages([
      { id: userOptId, role: 'user', content },
      { id: thinkOptId, role: 'assistant', content: '', isPending: true },
    ]);

    setTimeout(scrollToBottom, 50);

    sendMessage.mutate(
      { eventId: id, sessionId: activeSessionId, data: { content } },
      {
        onSuccess: () => {
          setOptimisticMessages([]);
          refetchMessages();
        },
        onError: () => {
          setOptimisticMessages([]);
        },
      }
    );

    inputRef.current?.focus();
  };

  // Smart context-aware quick replies based on event type
  const quickReplies = event?.type
    ? getQuickReplies(event.type)
    : ['What should we plan first?', 'Give me venue ideas.', 'Help with the guest list.'];

  const isBooting = sessionsLoading || sessionCreating || (!activeSessionId && !sessionError);

  if (isBooting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-background gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-ping" />
        </div>
        <div className="text-center">
          <p className="font-serif text-xl text-foreground mb-1">A-Moment is preparing your session</p>
          <p className="text-sm text-muted-foreground">Setting the stage for something remarkable…</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-background gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-destructive/60" />
        </div>
        <div className="text-center max-w-sm">
          <p className="font-serif text-xl mb-2">Something went sideways</p>
          <p className="text-sm text-muted-foreground mb-6">A-Moment couldn't start the session. This sometimes happens on first load.</p>
          <button
            onClick={() => { setSessionError(false); setSessionCreating(false); }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header
        className="z-10 sticky top-0 flex-shrink-0 h-16"
        style={{
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(201,169,110,0.1)',
        }}
      >
        <div className="px-6 md:px-10 h-full flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${id}`}
              className="transition-colors"
              style={{ color: '#8a7a65' }}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <div>
              <h2 className="font-serif italic text-base leading-tight" style={{ color: '#f5f0e8' }}>A-Moment</h2>
              <p className="text-[10px] tracking-wide truncate max-w-[180px] md:max-w-sm" style={{ color: '#8a7a65' }}>{event?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-[6px] w-[6px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#c9a96e' }} />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px]" style={{ background: '#c9a96e' }} />
            </span>
            <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#8a7a65' }}>Live</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-medium">Let's make this unforgettable</h3>
              <p className="text-muted-foreground max-w-md">
                Pick a question below to kick things off, or tell me what's on your mind.
              </p>
            </div>
          ) : (
            (() => {
              // Find the last non-pending assistant message index for chip display
              const lastAssistantIdx = allMessages.reduce(
                (acc, m, i) => (!m.isPending && m.role === 'assistant' ? i : acc),
                -1,
              );
              return allMessages.map((msg, msgIdx) => {
                const isUser = msg.role === 'user';
                const isLastAssistant = msgIdx === lastAssistantIdx;
                const trimmed = msg.content.trimEnd();
                const endsWithQuestion = trimmed.endsWith('?');
                const hasOptions = !msg.isPending && parseOptionsList(msg.content) !== null;
                const showChips = isLastAssistant && endsWithQuestion && !hasOptions && !msg.isPending;
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-0.5"
                        style={isUser
                          ? { background: '#f5f0e8' }
                          : { background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}
                      >
                        {isUser
                          ? <UserIcon className="w-3.5 h-3.5" style={{ color: '#0a0a0a' }} />
                          : <Bot className="w-3.5 h-3.5" style={{ color: '#c9a96e' }} />}
                      </div>
                      <div
                        className="max-w-[78%] px-4 py-3"
                        style={isUser
                          ? { background: 'rgba(245,240,232,0.95)', color: '#0a0a0a' }
                          : { background: '#141414', border: '1px solid rgba(201,169,110,0.1)', color: '#f5f0e8' }}
                      >
                        {msg.isPending ? (
                          <div className="flex items-center gap-1.5 h-5">
                            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                        ) : (
                          <MessageContent content={msg.content} onSend={(text) => handleSend(undefined, text)} />
                        )}
                      </div>
                    </div>
                    {showChips && (
                      <QuestionChips onSend={(text) => handleSend(undefined, text)} />
                    )}
                  </div>
                );
              });
            })()
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 p-4 md:p-6 pb-safe"
        style={{
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(201,169,110,0.1)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          {allMessages.filter(m => !m.isPending).length <= 1 && !sendMessage.isPending && (
            <div className="flex flex-wrap gap-2 mb-4">
              {quickReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, r)}
                  disabled={sendMessage.isPending}
                  className="px-4 py-2 text-xs tracking-wide transition-colors disabled:opacity-50"
                  style={{
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: '#8a7a65',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#c9a96e'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8a7a65'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)'; }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to A-Moment…"
              className="w-full pl-5 pr-14 py-3.5 outline-none transition-all text-sm md:text-base font-light"
              style={{
                background: '#141414',
                border: '1px solid rgba(201,169,110,0.15)',
                color: '#f5f0e8',
              }}
              disabled={sendMessage.isPending}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.15)'; }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="absolute right-0 px-4 h-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ color: '#c9a96e' }}
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function getQuickReplies(eventType: string): string[] {
  const map: Record<string, string[]> = {
    wedding: ['What venues should we consider?', 'Help me think through the timeline.', 'What makes a wedding feel truly personal?'],
    birthday: ['What experiences would make this unforgettable?', 'Ideas for a surprise element?', 'How do we tailor this to their personality?'],
    cruise: ['Which route would you recommend?', 'What should I look for in a ship?', 'How do we keep everyone entertained on board?'],
    hiking: ['Which trail fits our group?', 'What level of difficulty are we talking?', 'How do we plan rest stops and meals?'],
    winery: ['Which wine region should we visit?', 'How do we get a private tasting?', 'What pairs well with a winery weekend?'],
    sailing: ['Crewed yacht or bareboat charter?', 'What route should we take?', 'What should we pack for a sailing trip?'],
    ski: ['Which resort fits our group?', 'On-piste or off-piste focus?', 'How do we handle mixed ability levels?'],
    spa: ['What kind of treatments should anchor the trip?', 'Destination spa or city retreat?', 'What makes a spa weekend feel luxurious?'],
    festival: ['Which festivals should we have on our radar?', 'VIP or general: what\u2019s the trade-off?', 'How do we plan around the lineup?'],
    corporate: ['What\u2019s the balance between work and play?', 'Any team-building ideas that don\u2019t feel forced?', 'What venues work for both sessions and dinners?'],
    reunion: ['How do we get people who haven\u2019t seen each other in years comfortable?', 'Where\u2019s a good central meeting point?', 'What activities work for mixed ages?'],
    safari: ['East Africa or Southern Africa?', 'Luxury lodge or tented camp?', 'What\u2019s the ideal time of year for wildlife?'],
    vacation: ['Where should we go?', "What's the right pace for this trip?", "Any places we might overlook but shouldn't?"],
    dinner: ['What kind of setting are we imagining?', 'How do we make the seating feel intentional?', 'Any ideas for a memorable moment during the meal?'],
    other: ['What are we actually celebrating?', "Who's coming and what do they love?", "What would make this feel completely different from anything they've done before?"],
  };
  return map[eventType] ?? map['other'];
}
