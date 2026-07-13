import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, eventsTable, planningSessionsTable, messagesTable, guestsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ListSessionsParams,
  ListSessionsResponse,
  CreateSessionParams,
  CreateSessionBody,
  CreateSessionResponse,
  GetSessionParams,
  GetSessionResponse,
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageParams,
  SendMessageBody,
  SendMessageResponse,
} from "@workspace/api-zod";
import { chatWithAI } from "../lib/ai";

const router: IRouter = Router();

function mapSession(s: typeof planningSessionsTable.$inferSelect, messageCount: number) {
  return {
    id: s.id,
    eventId: s.eventId,
    title: s.title,
    focus: s.focus ?? null,
    messageCount,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapMessage(m: typeof messagesTable.$inferSelect) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

function extractMarkerLine(description: string, marker: string): string | null {
  const idx = description.indexOf(marker);
  if (idx === -1) return null;
  return description.slice(idx + marker.length).split("\n")[0].trim() || null;
}

function parseDescription(description: string | null): {
  baseNotes: string;
  hostContext: string | null;
  chosenPlan: Record<string, unknown> | null;
  planningFor: string | null;
  dateType: string | null;
  dateFlexible: { month?: string; duration?: string } | null;
  personality: { travelStyle?: string; dealbreakers?: string[] } | null;
  age: string | null;
  celebrantAnswers: Record<string, string> | null;
} {
  if (!description) return {
    baseNotes: "", hostContext: null, chosenPlan: null,
    planningFor: null, dateType: null, dateFlexible: null, personality: null,
    age: null, celebrantAnswers: null,
  };

  const PLAN_MARKER = "__CHOSEN_PLAN__:";
  const CTX_MARKER = "__HOST_CONTEXT__:";
  const PF_MARKER = "__PLANNING_FOR__:";
  const DT_MARKER = "__DATE_TYPE__:";
  const DF_MARKER = "__DATE_FLEXIBLE__:";
  const PERS_MARKER = "__PERSONALITY__:";

  let remaining = description;
  let chosenPlan: Record<string, unknown> | null = null;
  let hostContext: string | null = null;

  // Extract chosen plan
  const planIdx = remaining.indexOf(PLAN_MARKER);
  if (planIdx !== -1) {
    try { chosenPlan = JSON.parse(remaining.slice(planIdx + PLAN_MARKER.length).split("\n")[0].trim()); } catch {}
    remaining = remaining.slice(0, planIdx).trim();
  }

  // Extract host context
  const ctxIdx = remaining.indexOf(CTX_MARKER);
  if (ctxIdx !== -1) {
    hostContext = remaining.slice(ctxIdx + CTX_MARKER.length).split("\n")[0].trim() || null;
    remaining = remaining.slice(0, ctxIdx).trim();
  }

  // Extract semantic markers (non-destructive — from original description)
  const planningFor = extractMarkerLine(description, PF_MARKER);
  const dateType = extractMarkerLine(description, DT_MARKER);

  let dateFlexible: { month?: string; duration?: string } | null = null;
  const dfRaw = extractMarkerLine(description, DF_MARKER);
  if (dfRaw) {
    try { dateFlexible = JSON.parse(dfRaw); } catch {}
  }

  let personality: { travelStyle?: string; dealbreakers?: string[] } | null = null;
  const persRaw = extractMarkerLine(description, PERS_MARKER);
  if (persRaw) {
    try { personality = JSON.parse(persRaw); } catch {}
  }

  const age = extractMarkerLine(description, "__AGE__:");

  let celebrantAnswers: Record<string, string> | null = null;
  const celebrantRaw = extractMarkerLine(description, "__CELEBRANT__:");
  if (celebrantRaw) {
    try { celebrantAnswers = JSON.parse(celebrantRaw); } catch {}
  }

  // Strip all markers from baseNotes
  const markerPrefixes = [PF_MARKER, DT_MARKER, DF_MARKER, PERS_MARKER, "__PLAN_OPTIONS__:", "__Q_TOKEN__:", "__AGE__:", "__CELEBRANT__:"];
  let baseNotes = remaining;
  for (const m of markerPrefixes) {
    const idx = baseNotes.indexOf(m);
    if (idx !== -1) baseNotes = baseNotes.slice(0, idx).trim();
  }

  return { baseNotes, hostContext, chosenPlan, planningFor, dateType, dateFlexible, personality, age, celebrantAnswers };
}

function buildSystemPrompt(
  event: typeof eventsTable.$inferSelect,
  messageCount: number,
  guests: Array<typeof guestsTable.$inferSelect> = []
): string {

  const { baseNotes, hostContext, chosenPlan, planningFor, dateType, dateFlexible, personality, age, celebrantAnswers } = parseDescription(event.description);

  // ── Date context
  let dateContext: string | null = null;
  if (dateType === "fixed" && event.startDate) {
    dateContext = `Fixed date: ${new Date(event.startDate).toDateString()}`;
  } else if (dateType === "flexible" && dateFlexible) {
    const parts = [];
    if (dateFlexible.month) parts.push(`around ${dateFlexible.month}`);
    if (dateFlexible.duration) {
      const durMap: Record<string, string> = { day: "a day trip", weekend: "a long weekend", week: "about a week", twoweeks: "2 weeks+" };
      parts.push(durMap[dateFlexible.duration] ?? dateFlexible.duration);
    }
    dateContext = parts.length > 0 ? `Flexible timing: ${parts.join(", ")}` : null;
  } else if (event.startDate) {
    dateContext = `Date: ${new Date(event.startDate).toDateString()}`;
  }

  // ── Planning-for context
  let planningForContext: string | null = null;
  if (planningFor?.startsWith("someone")) {
    const nameRaw = planningFor.slice("someone".length).replace(/^:/, "").trim();
    const name = nameRaw || "the celebrant";
    planningForContext = `The planner is organising this for someone else named ${name}. ${name} may or may not know the full plan yet.`;
  }

  // Celebrant questionnaire answers
  let celebrantContext: string | null = null;
  if (celebrantAnswers && Object.keys(celebrantAnswers).length > 0) {
    const parts = Object.entries(celebrantAnswers)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `  ${k}: ${v}`);
    if (parts.length) celebrantContext = parts.join("\n");
  }

  // Guest profiles from personality JSON
  let guestProfilesText: string | null = null;
  if (guests.length > 0) {
    const profiles = guests.map((g) => {
      let p: any = null;
      try { if (g.personality) p = JSON.parse(g.personality); } catch {}
      const parts: string[] = [g.name];
      const hostTags: string[] = p?.archetypes ?? [];
      if (hostTags.length) parts.push(`tagged: ${hostTags.join(", ")}`);
      if (p?.selfProfile?.archetypes?.length) parts.push(`self: ${p.selfProfile.archetypes.join(", ")}`);
      if (p?.selfProfile?.mustHaves?.length) parts.push(`needs: ${p.selfProfile.mustHaves.join(", ")}`);
      if (p?.selfProfile?.dealbreakers?.length) parts.push(`avoid: ${p.selfProfile.dealbreakers.join(", ")}`);
      if (g.dietaryNeeds) parts.push(`dietary: ${g.dietaryNeeds}`);
      return `  ${parts.join(" | ")}`;
    });
    guestProfilesText = profiles.join("\n");
  }

  const eventContext = [
    `Celebration type: ${event.type}`,
    `Title: "${event.title}"`,
    age ? `Celebrant age range: ${age}` : null,
    event.location ? `Location: ${event.location}` : null,
    event.isInternational ? "Open to international options: yes" : null,
    dateContext,
    event.endDate && dateType !== "flexible" ? `End date: ${new Date(event.endDate).toDateString()}` : null,
    event.budget ? `Budget tier: ${event.budget}` : null,
    event.guestCount ? `Estimated guests: ${event.guestCount}` : null,
    baseNotes ? `Notes: ${baseNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const chosenPlanContext = chosenPlan
    ? `CHOSEN PLAN (the host selected this from the options Cele proposed — this is now the working plan):
Name: ${(chosenPlan as any).name}
Destination: ${(chosenPlan as any).destination}
Venue: ${(chosenPlan as any).venue}
Duration: ${(chosenPlan as any).duration}
Price range: ${(chosenPlan as any).priceRange?.perPersonMin}–${(chosenPlan as any).priceRange?.perPersonMax} per person
Highlights: ${((chosenPlan as any).highlights ?? []).join(", ")}
Available add-ons: ${((chosenPlan as any).addOns ?? []).join(", ")}
Vibe: ${(chosenPlan as any).vibe ?? ""}
Tagline: ${(chosenPlan as any).tagline ?? ""}`
    : null;

  const isFirstMessage = messageCount === 0;

  return `You are Cele — a world-class celebration curator, travel broker, personal psychologist, and group-dynamics expert rolled into one. Think of yourself as the Ritz-Carlton concierge who also happens to be the host's most well-traveled and emotionally intelligent friend, a quietly brilliant therapist, and a Wrike-level planner.

Your personality:
- Warm, specific, and a little witty. You banter naturally. You surprise people with how well you understand them before they say it.
- Never generic. You name specific venues, neighborhoods, chefs, experiences, routes — and explain why they fit this particular person.
- One question at a time, always. You read the room. You never overwhelm.
- You are a psychological profiler. From a few words you understand who someone is and what they'll actually love, not just what they think they want.
- You push back gently and charmingly when something won't work. You have opinions and share them with grace.
- You write like a great travel editor: vivid, specific, evocative — never overwrought, never hollow.
- You never use emojis. You never say "Great choice!" or "Absolutely!" You do not use filler affirmations.
- You connect dots. Surface patterns the host didn't notice. Remember everything said and build forward.
- You keep a running mental to-do list for them. Weave in gentle nudges when decisions are still open.
${
  isFirstMessage && chosenPlan
    ? `
For this opening message: the host has chosen a specific plan. Open by affirming the plan by name with one sharp observation about what makes it right for them — not generic praise. Then ask the single most specific, consequential question that will unlock the next decision for THIS plan. (e.g. room configuration, dietary needs, specific add-on, arrival logistics — whatever will take the longest to sort).`
    : isFirstMessage
    ? `
For this opening message, introduce yourself briefly (one sentence, something specific to their event — not a generic greeting), then ask the single most important question that will unlock the whole plan. Make it feel like you've already been thinking about their event.`
    : ""
}

CURRENT EVENT:
${eventContext}
${planningForContext ? `\nPLANNING CONTEXT:\n${planningForContext}` : ""}${
  personality && (personality.travelStyle || (personality.dealbreakers?.length ?? 0) > 0)
    ? `\n\nPLANNER PERSONALITY:\n${personality.travelStyle ? `Travel style: ${personality.travelStyle}` : ""}${
        (personality.dealbreakers?.length ?? 0) > 0
          ? `\nDealbreakers: ${personality.dealbreakers!.join(", ")}`
          : ""
      }`
    : ""
}

${
  celebrantContext
    ? `\nCELEBRANT'S OWN ANSWERS (from their questionnaire — weight these heavily):\n${celebrantContext}`
    : ""
}${
  guestProfilesText
    ? `\n\nGUEST PROFILES (use for seating, pairings, activity and accommodation recommendations):\n${guestProfilesText}`
    : ""
}

${chosenPlanContext ? `${chosenPlanContext}\n\n` : ""}${
  hostContext
    ? `HOST CONTEXT FOR THIS EVENT:
${hostContext}`
    : "No host context yet — infer personality and preferences from how they write and build forward."
}

Rules for this conversation:
- Keep responses to 3–5 sentences unless a list genuinely adds value.
- When you suggest specific venues, experiences or vendors, make them real and named.
- If budget or timing hasn't been established, ask about it only when it will change your recommendations.
- When you sense the host is ready to act on something specific (venue, invite, guest list, discover), mention that they can use the relevant section of the app — but only once per topic.
- Never repeat what was said. Build forward.
${chosenPlan ? "- The plan is chosen. Do not re-propose alternatives. Drill into specifics: logistics, room counts, dietary needs, exact experiences, timings, add-on decisions." : ""}`;
}

router.get("/events/:eventId/sessions", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = ListSessionsParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const sessions = await db
    .select()
    .from(planningSessionsTable)
    .where(eq(planningSessionsTable.eventId, params.data.eventId))
    .orderBy(planningSessionsTable.createdAt);

  const withCounts = await Promise.all(
    sessions.map(async (s) => {
      const [row] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.sessionId, s.id));
      return mapSession(s, Number(row?.count ?? 0));
    })
  );

  res.json(ListSessionsResponse.parse(withCounts));
});

router.post("/events/:eventId/sessions", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = CreateSessionParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, params.data.eventId));

  const [session] = await db.insert(planningSessionsTable).values({
    eventId: params.data.eventId,
    title: parsed.data.title,
    focus: parsed.data.focus,
  }).returning();

  const systemPrompt = buildSystemPrompt(event, 0, guests);

  const opening = await chatWithAI(
    [{ role: "user", content: `Start planning session. Focus: ${parsed.data.focus ?? "general"}` }],
    systemPrompt
  );

  await db.insert(messagesTable).values({
    sessionId: session.id,
    role: "assistant",
    content: opening,
  });

  res.status(201).json(CreateSessionResponse.parse(mapSession(session, 1)));
});

router.get("/events/:eventId/sessions/:sessionId", requireAuth, async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawSessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = GetSessionParams.safeParse({ eventId: parseInt(rawEventId, 10), sessionId: parseInt(rawSessionId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [session] = await db
    .select()
    .from(planningSessionsTable)
    .where(and(
      eq(planningSessionsTable.id, params.data.sessionId),
      eq(planningSessionsTable.eventId, params.data.eventId)
    ));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const [row] = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.sessionId, session.id));
  res.json(GetSessionResponse.parse(mapSession(session, Number(row?.count ?? 0))));
});

router.get("/events/:eventId/sessions/:sessionId/messages", requireAuth, async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawSessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = ListMessagesParams.safeParse({ eventId: parseInt(rawEventId, 10), sessionId: parseInt(rawSessionId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, params.data.sessionId))
    .orderBy(messagesTable.createdAt);

  res.json(ListMessagesResponse.parse(messages.map(mapMessage)));
});

router.post("/events/:eventId/sessions/:sessionId/messages", requireAuth, async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawSessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = SendMessageParams.safeParse({ eventId: parseInt(rawEventId, 10), sessionId: parseInt(rawSessionId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [session] = await db
    .select()
    .from(planningSessionsTable)
    .where(and(
      eq(planningSessionsTable.id, params.data.sessionId),
      eq(planningSessionsTable.eventId, params.data.eventId)
    ));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, params.data.eventId));

  const [userMsg] = await db.insert(messagesTable).values({
    sessionId: params.data.sessionId,
    role: "user",
    content: parsed.data.content,
  }).returning();

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, params.data.sessionId))
    .orderBy(messagesTable.createdAt);

  const systemPrompt = buildSystemPrompt(event!, history.length, guests);

  const aiMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiReply = await chatWithAI(aiMessages, systemPrompt);

  const [assistantMsg] = await db.insert(messagesTable).values({
    sessionId: params.data.sessionId,
    role: "assistant",
    content: aiReply,
  }).returning();

  res.status(201).json(SendMessageResponse.parse({
    userMessage: mapMessage(userMsg),
    assistantMessage: mapMessage(assistantMsg),
  }));
});

export default router;
