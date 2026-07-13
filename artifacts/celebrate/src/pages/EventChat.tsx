import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import { useListSessions, useCreateSession, useListMessages, useSendMessage, useGetEvent } from '@workspace/api-client-react';
import { Send, Sparkles, ChevronLeft, User as UserIcon, RefreshCw } from 'lucide-react';

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
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-ping" />
        </div>
        <div className="text-center">
          <p className="font-serif text-xl text-foreground mb-1">Cele is preparing your session</p>
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
          <p className="text-sm text-muted-foreground mb-6">Cele couldn't start the session. This sometimes happens on first load.</p>
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
      <header className="glass-panel border-b border-border/40 z-10 sticky top-0 flex-shrink-0 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/events/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="font-serif font-medium text-lg leading-tight">Cele</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[180px] md:max-w-sm">{event?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">online</span>
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
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-medium">Let's make this unforgettable</h3>
              <p className="text-muted-foreground max-w-md">
                Pick a question below to kick things off, or tell me what's on your mind.
              </p>
            </div>
          ) : (
            allMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-end mb-0.5 ${
                    isUser
                      ? 'bg-foreground text-background'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-foreground text-background rounded-tr-sm'
                      : 'bg-card border border-border/50 text-foreground rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.isPending ? (
                      <div className="flex items-center gap-1.5 h-5">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 bg-background/80 backdrop-blur border-t border-border/40 pb-safe">
        <div className="max-w-3xl mx-auto">
          {allMessages.filter(m => !m.isPending).length <= 1 && !sendMessage.isPending && (
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, r)}
                  disabled={sendMessage.isPending}
                  className="px-4 py-2 bg-card border border-border/60 rounded-full text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
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
              placeholder="Talk to Cele…"
              className="w-full bg-card border border-border rounded-full pl-5 pr-14 py-3.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm md:text-base"
              disabled={sendMessage.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
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
    festival: ['Which festivals should we have on our radar?', 'VIP or general — what\u2019s the trade-off?', 'How do we plan around the lineup?'],
    corporate: ['What\u2019s the balance between work and play?', 'Any team-building ideas that don\u2019t feel forced?', 'What venues work for both sessions and dinners?'],
    reunion: ['How do we get people who haven\u2019t seen each other in years comfortable?', 'Where\u2019s a good central meeting point?', 'What activities work for mixed ages?'],
    safari: ['East Africa or Southern Africa?', 'Luxury lodge or tented camp?', 'What\u2019s the ideal time of year for wildlife?'],
    vacation: ['Where should we go?', "What's the right pace for this trip?", "Any places we might overlook but shouldn't?"],
    dinner: ['What kind of setting are we imagining?', 'How do we make the seating feel intentional?', 'Any ideas for a memorable moment during the meal?'],
    other: ['What are we actually celebrating?', "Who's coming and what do they love?", "What would make this feel completely different from anything they've done before?"],
  };
  return map[eventType] ?? map['other'];
}
