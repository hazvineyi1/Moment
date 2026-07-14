import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, eventsTable, guestsTable, planningSessionsTable } from "@workspace/db";
import {
  ListEventsResponse,
  CreateEventBody,
  CreateEventResponse,
  GetDashboardResponse,
  GetEventParams,
  GetEventResponse,
  UpdateEventParams,
  UpdateEventBody,
  UpdateEventResponse,
  DeleteEventParams,
  GetEventSummaryParams,
  GetEventSummaryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function mapEvent(e: typeof eventsTable.$inferSelect, opts: { includeToken?: boolean } = {}) {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    description: e.description ?? null,
    location: e.location ?? null,
    isInternational: e.isInternational,
    startDate: e.startDate ?? null,
    endDate: e.endDate ?? null,
    budget: e.budget ?? null,
    guestCount: e.guestCount ?? null,
    status: e.status,
    coverImage: e.coverImage ?? null,
    createdAt: e.createdAt.toISOString(),
    questionnaireToken: opts.includeToken ? (e.questionnaireToken ?? null) : null,
  };
}

// ── Public endpoint — no auth required ────────────────────────────────
router.get("/events/:eventId/public", async (req, res): Promise<void> => {
  const id = parseInt(req.params.eventId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid event ID" }); return; }
  const [event] = await db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      type: eventsTable.type,
      location: eventsTable.location,
      startDate: eventsTable.startDate,
      endDate: eventsTable.endDate,
      guestCount: eventsTable.guestCount,
      coverImage: eventsTable.coverImage,
    })
    .from(eventsTable)
    .where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(event);
});

router.get("/events", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const events = await db.select().from(eventsTable)
    .where(eq(eventsTable.clerkUserId, userId))
    .orderBy(eventsTable.createdAt);
  res.json(ListEventsResponse.parse(events.map(mapEvent)));
});

router.get("/events/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const events = await db.select().from(eventsTable)
    .where(eq(eventsTable.clerkUserId, userId))
    .orderBy(eventsTable.createdAt);
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !e.startDate || e.startDate >= now);

  const guestRows = await db
    .select({ count: count() })
    .from(guestsTable)
    .innerJoin(eventsTable, eq(guestsTable.eventId, eventsTable.id))
    .where(eq(eventsTable.clerkUserId, userId));
  const totalGuests = Number(guestRows[0]?.count ?? 0);

  res.json(GetDashboardResponse.parse({
    totalEvents: events.length,
    upcomingEvents: upcoming.length,
    totalGuests,
    events: events.map(mapEvent),
  }));
});

router.post("/events", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = parsed.data;
  const token = crypto.randomUUID();
  const [event] = await db.insert(eventsTable).values({
    clerkUserId: userId,
    questionnaireToken: token,
    title: data.title,
    type: data.type,
    description: data.description,
    location: data.location,
    isInternational: data.isInternational ?? false,
    startDate: data.startDate,
    endDate: data.endDate,
    budget: data.budget,
    guestCount: data.guestCount,
  }).returning();
  res.status(201).json(CreateEventResponse.parse(mapEvent(event, { includeToken: true })));
});

router.get("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GetEventParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const [event] = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.id, params.data.eventId), eq(eventsTable.clerkUserId, userId)));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(GetEventResponse.parse(mapEvent(event, { includeToken: true })));
});

router.patch("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = UpdateEventParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;

  // If the client is writing a new description, strip any cached plan-options so
  // stale proposals aren't served after a personality or date-preference change.
  // Options are re-cached by options.ts via a direct DB update that bypasses this route.
  const PLAN_OPTIONS_MARKER = "__PLAN_OPTIONS__:";
  const sanitizedDescription = data.description !== undefined
    ? (() => {
        const idx = data.description!.indexOf(PLAN_OPTIONS_MARKER);
        if (idx === -1) return data.description!;
        // Strip from the marker to end of that line (inclusive of the newline)
        const lineEnd = data.description!.indexOf("\n", idx);
        const before = data.description!.slice(0, idx).trimEnd();
        const after = lineEnd !== -1 ? data.description!.slice(lineEnd + 1) : "";
        return (before && after) ? `${before}\n${after}` : (before || after);
      })()
    : undefined;

  const [updated] = await db
    .update(eventsTable)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(sanitizedDescription !== undefined && { description: sanitizedDescription }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.isInternational !== undefined && { isInternational: data.isInternational }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    })
    .where(and(eq(eventsTable.id, params.data.eventId), eq(eventsTable.clerkUserId, userId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(UpdateEventResponse.parse(mapEvent(updated)));
});

router.delete("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = DeleteEventParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  await db.delete(eventsTable)
    .where(and(eq(eventsTable.id, params.data.eventId), eq(eventsTable.clerkUserId, userId)));
  res.status(204).send();
});

// Delete ALL events for the current user
router.delete("/events", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  await db.delete(eventsTable).where(eq(eventsTable.clerkUserId, userId));
  res.status(204).send();
});

router.get("/events/:eventId/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GetEventSummaryParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const eventId = params.data.eventId;
  const [event] = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const [guestRows, sessionRows] = await Promise.all([
    db.select({ count: count() }).from(guestsTable).where(eq(guestsTable.eventId, eventId)),
    db.select({ count: count() }).from(planningSessionsTable).where(eq(planningSessionsTable.eventId, eventId)),
  ]);

  const guestCount = Number(guestRows[0]?.count ?? 0);
  const sessionCount = Number(sessionRows[0]?.count ?? 0);

  const checks = [!!event.title, !!event.location, !!event.startDate, guestCount > 0, sessionCount > 0];
  const completionPercent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const nextSteps: string[] = [];
  if (!event.location) nextSteps.push("Add a destination or location");
  if (!event.startDate) nextSteps.push("Set event dates");
  if (guestCount === 0) nextSteps.push("Add your first guests");
  if (sessionCount === 0) nextSteps.push("Start a planning chat with A-Moment");

  res.json(GetEventSummaryResponse.parse({
    eventId,
    title: event.title,
    guestCount,
    confirmedGuests: guestCount,
    savedSuggestions: 0,
    sessionCount,
    inviteCount: 0,
    completionPercent,
    nextSteps,
  }));
});

export default router;
