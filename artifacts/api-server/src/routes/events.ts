import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, eventsTable, guestsTable, planningSessionsTable, suggestionsTable, invitesTable } from "@workspace/db";
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

function mapEvent(e: typeof eventsTable.$inferSelect) {
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
  };
}

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
  res.status(201).json(CreateEventResponse.parse(mapEvent(event)));
});

router.get("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GetEventParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const [event] = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.id, params.data.eventId), eq(eventsTable.clerkUserId, userId)));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(GetEventResponse.parse(mapEvent(event)));
});

router.patch("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = UpdateEventParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [updated] = await db
    .update(eventsTable)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
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

  const [guestRows, savedRows, sessionRows, inviteRows] = await Promise.all([
    db.select({ count: count() }).from(guestsTable).where(eq(guestsTable.eventId, eventId)),
    db.select({ count: count() }).from(suggestionsTable).where(eq(suggestionsTable.eventId, eventId)),
    db.select({ count: count() }).from(planningSessionsTable).where(eq(planningSessionsTable.eventId, eventId)),
    db.select({ count: count() }).from(invitesTable).where(eq(invitesTable.eventId, eventId)),
  ]);

  const guestCount = Number(guestRows[0]?.count ?? 0);
  const savedSuggestions = Number(savedRows[0]?.count ?? 0);
  const sessionCount = Number(sessionRows[0]?.count ?? 0);
  const inviteCount = Number(inviteRows[0]?.count ?? 0);

  const checks = [!!event.title, !!event.location, !!event.startDate, guestCount > 0, savedSuggestions > 0, sessionCount > 0, inviteCount > 0];
  const completionPercent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const nextSteps: string[] = [];
  if (!event.location) nextSteps.push("Add a destination or location");
  if (!event.startDate) nextSteps.push("Set event dates");
  if (guestCount === 0) nextSteps.push("Add your first guests");
  if (savedSuggestions === 0) nextSteps.push("Explore and save venue suggestions");
  if (sessionCount === 0) nextSteps.push("Start a planning chat session");
  if (inviteCount === 0) nextSteps.push("Create an invite for your guests");

  res.json(GetEventSummaryResponse.parse({
    eventId,
    title: event.title,
    guestCount,
    confirmedGuests: guestCount,
    savedSuggestions,
    sessionCount,
    inviteCount,
    completionPercent,
    nextSteps,
  }));
});

export default router;
