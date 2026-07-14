import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, memoriesTable, eventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /api/events/:eventId/memories — list memories for an event
router.get("/events/:eventId/memories", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  // Verify the event belongs to this user
  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const memories = await db.select().from(memoriesTable)
    .where(eq(memoriesTable.eventId, eventId))
    .orderBy(memoriesTable.addedAt);

  res.json(memories.map(m => ({
    id: m.id,
    eventId: m.eventId,
    url: m.url,
    caption: m.caption ?? null,
    addedAt: m.addedAt.toISOString(),
  })));
});

// POST /api/events/:eventId/memories — add a memory
router.post("/events/:eventId/memories", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const { url, caption } = req.body as { url?: string; caption?: string };
  if (!url || typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "Photo URL is required" }); return;
  }

  const [memory] = await db.insert(memoriesTable).values({
    eventId,
    url: url.trim(),
    caption: caption?.trim() || null,
  }).returning();

  res.status(201).json({
    id: memory.id,
    eventId: memory.eventId,
    url: memory.url,
    caption: memory.caption ?? null,
    addedAt: memory.addedAt.toISOString(),
  });
});

// DELETE /api/events/:eventId/memories/:id
router.delete("/events/:eventId/memories/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const eventId = parseInt(req.params.eventId, 10);
  const memoryId = parseInt(req.params.id, 10);
  if (isNaN(eventId) || isNaN(memoryId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  await db.delete(memoriesTable).where(
    and(eq(memoriesTable.id, memoryId), eq(memoriesTable.eventId, eventId))
  );

  res.status(204).send();
});

export default router;
