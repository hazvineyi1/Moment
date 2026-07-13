import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, eventsTable, planningSessionsTable, messagesTable, usersTable } from "@workspace/db";
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

async function getUser() {
  const [user] = await db.select().from(usersTable).limit(1);
  return user ?? null;
}

function extractChosenPlan(description: string | null): { plan: Record<string, unknown> | null; baseDescription: string } {
  if (!description) return { plan: null, baseDescription: "" };
  const marker = "__CHOSEN_PLAN__:";
  const idx = description.indexOf(marker);
  if (idx === -1) return { plan: null, baseDescription: description };
  const base = description.slice(0, idx).trim();
  try {
    const plan = JSON.parse(description.slice(idx + marker.length).trim());
    return { plan, baseDescription: base };
  } catch {
    return { plan: null, baseDescription: description };
  }
}

function buildSystemPrompt(
  event: typeof eventsTable.$inferSelect,
  user: typeof usersTable.$inferSelect | null,
  messageCount: number
): string {
  const userContext = user
    ? [
        user.name && user.name !== "Traveler" ? `Host: ${user.name}` : null,
        user.location ? `Based in: ${user.location}` : null,
        user.personality ? `Personality: ${user.personality}` : null,
        user.preferences ? `Preferences & tastes: ${user.preferences}` : null,
        user.bio ? `Background: ${user.bio}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const { plan: chosenPlan, baseDescription } = extractChosenPlan(event.description);

  const eventContext = [
    `Celebration type: ${event.type}`,
    `Title: "${event.title}"`,
    event.location ? `Location: ${event.location}` : null,
    event.isInternational ? "Open to international options: yes" : null,
    event.startDate ? `Date: ${new Date(event.startDate).toDateString()}` : null,
    event.endDate ? `End date: ${new Date(event.endDate).toDateString()}` : null,
    event.budget ? `Budget tier: ${event.budget}` : null,
    event.guestCount ? `Estimated guests: ${event.guestCount}` : null,
    baseDescription ? `Notes: ${baseDescription}` : null,
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

  return `You are Cele — a world-class celebration curator, travel broker, personal psychologist, and project organizer rolled into one. Think of yourself as the Ritz-Carlton concierge who also happens to be the host's most well-traveled and emotionally intelligent friend, a quietly brilliant therapist, and a Wrike-level planner.

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

${chosenPlanContext ? `${chosenPlanContext}\n\n` : ""}${
  userContext
    ? `HOST PROFILE:
${userContext}`
    : "No host profile yet — infer personality from how they write and remember it in conversation."
}

Rules for this conversation:
- Keep responses to 3–5 sentences unless a list genuinely adds value.
- When you suggest specific venues, experiences or vendors, make them real and named.
- If budget or timing hasn't been established, ask about it only when it will change your recommendations.
- When you sense the host is ready to act on something specific (venue, invite, guest list, discover), mention that they can use the relevant section of the app — but only once per topic.
- Never repeat what was said. Build forward.
${chosenPlan ? "- The plan is chosen. Do not re-propose alternatives. Drill into specifics: logistics, room counts, dietary needs, exact experiences, timings, add-on decisions." : ""}`;
}

router.get("/events/:eventId/sessions", async (req, res): Promise<void> => {
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

router.post("/events/:eventId/sessions", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = CreateSessionParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const [session] = await db.insert(planningSessionsTable).values({
    eventId: params.data.eventId,
    title: parsed.data.title,
    focus: parsed.data.focus,
  }).returning();

  const user = await getUser();
  const systemPrompt = buildSystemPrompt(event, user, 0);

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

router.get("/events/:eventId/sessions/:sessionId", async (req, res): Promise<void> => {
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

router.get("/events/:eventId/sessions/:sessionId/messages", async (req, res): Promise<void> => {
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

router.post("/events/:eventId/sessions/:sessionId/messages", async (req, res): Promise<void> => {
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

  const user = await getUser();
  const systemPrompt = buildSystemPrompt(event!, user, history.length);

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
