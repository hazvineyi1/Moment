import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, guestsTable, eventsTable } from "@workspace/db";
import {
  ListGuestsParams,
  ListGuestsResponse,
  AddGuestParams,
  AddGuestBody,
  AddGuestResponse,
  GetGuestParams,
  GetGuestResponse,
  UpdateGuestParams,
  UpdateGuestBody,
  UpdateGuestResponse,
  DeleteGuestParams,
  GetGuestPairingsParams,
  GetGuestPairingsResponse,
} from "@workspace/api-zod";
import { generateJSON } from "../lib/ai";

const router: IRouter = Router();

function mapGuest(g: typeof guestsTable.$inferSelect) {
  return {
    id: g.id,
    eventId: g.eventId,
    name: g.name,
    email: g.email ?? null,
    phone: g.phone ?? null,
    whatsapp: g.whatsapp ?? null,
    rsvpStatus: g.rsvpStatus,
    personality: g.personality ?? null,
    dietaryNeeds: g.dietaryNeeds ?? null,
    notes: g.notes ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}

router.get("/events/:eventId/guests", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = ListGuestsParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, params.data.eventId));
  res.json(ListGuestsResponse.parse(guests.map(mapGuest)));
});

router.post("/events/:eventId/guests", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = AddGuestParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = AddGuestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [guest] = await db.insert(guestsTable).values({
    eventId: params.data.eventId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    personality: data.personality,
    dietaryNeeds: data.dietaryNeeds,
    notes: data.notes,
  }).returning();

  res.status(201).json(AddGuestResponse.parse(mapGuest(guest)));
});

router.get("/events/:eventId/guests/pairings", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GetGuestPairingsParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, params.data.eventId));
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));

  if (guests.length < 2) {
    res.json(GetGuestPairingsResponse.parse({
      eventId: params.data.eventId,
      roommates: [],
      travelBuddies: [],
      seatingGroups: [],
      reasoning: "Add at least 2 guests to generate personality-based pairings.",
    }));
    return;
  }

  const guestList = guests.map((g) => ({
    id: g.id,
    name: g.name,
    personality: g.personality ? JSON.parse(g.personality) : {},
    notes: g.notes ?? "",
  }));

  const systemPrompt = `You are an expert at personality-based event planning and group dynamics.
Given a list of guests for a ${event?.type ?? "celebration"}, create thoughtful pairings for roommates, travel buddies, and seating groups.
Consider personality compatibility, shared interests, and complementary styles.
Return a JSON object with this exact shape:
{
  "roommates": [{"guest1Id": number, "guest2Id": number, "compatibilityScore": number, "reason": string}],
  "travelBuddies": [{"guest1Id": number, "guest2Id": number, "compatibilityScore": number, "reason": string}],
  "seatingGroups": [{"tableName": string, "guestIds": number[], "vibe": string}],
  "reasoning": string
}`;

  type PairingsResult = {
    roommates: Array<{ guest1Id: number; guest2Id: number; compatibilityScore: number; reason: string }>;
    travelBuddies: Array<{ guest1Id: number; guest2Id: number; compatibilityScore: number; reason: string }>;
    seatingGroups: Array<{ tableName: string; guestIds: number[]; vibe: string }>;
    reasoning: string;
  };

  const result = await generateJSON<PairingsResult>(
    `Guests: ${JSON.stringify(guestList)}`,
    systemPrompt
  );

  const guestMap = Object.fromEntries(guests.map((g) => [g.id, g]));

  const roommates = (result.roommates ?? []).map((p) => ({
    guest1: mapGuest(guestMap[p.guest1Id]),
    guest2: mapGuest(guestMap[p.guest2Id]),
    compatibilityScore: p.compatibilityScore,
    reason: p.reason,
  })).filter((p) => p.guest1 && p.guest2);

  const travelBuddies = (result.travelBuddies ?? []).map((p) => ({
    guest1: mapGuest(guestMap[p.guest1Id]),
    guest2: mapGuest(guestMap[p.guest2Id]),
    compatibilityScore: p.compatibilityScore,
    reason: p.reason,
  })).filter((p) => p.guest1 && p.guest2);

  const seatingGroups = (result.seatingGroups ?? []).map((g) => ({
    tableName: g.tableName,
    guests: (g.guestIds ?? []).map((id: number) => mapGuest(guestMap[id])).filter(Boolean),
    vibe: g.vibe,
  }));

  res.json(GetGuestPairingsResponse.parse({
    eventId: params.data.eventId,
    roommates,
    travelBuddies,
    seatingGroups,
    reasoning: result.reasoning ?? "",
  }));
});

router.get("/events/:eventId/guests/:guestId", async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawGuestId = Array.isArray(req.params.guestId) ? req.params.guestId[0] : req.params.guestId;
  const params = GetGuestParams.safeParse({ eventId: parseInt(rawEventId, 10), guestId: parseInt(rawGuestId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [guest] = await db.select().from(guestsTable).where(
    and(eq(guestsTable.id, params.data.guestId), eq(guestsTable.eventId, params.data.eventId))
  );
  if (!guest) { res.status(404).json({ error: "Guest not found" }); return; }
  res.json(GetGuestResponse.parse(mapGuest(guest)));
});

router.patch("/events/:eventId/guests/:guestId", async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawGuestId = Array.isArray(req.params.guestId) ? req.params.guestId[0] : req.params.guestId;
  const params = UpdateGuestParams.safeParse({ eventId: parseInt(rawEventId, 10), guestId: parseInt(rawGuestId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const parsed = UpdateGuestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [updated] = await db
    .update(guestsTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
      ...(data.rsvpStatus !== undefined && { rsvpStatus: data.rsvpStatus }),
      ...(data.personality !== undefined && { personality: data.personality }),
      ...(data.dietaryNeeds !== undefined && { dietaryNeeds: data.dietaryNeeds }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .where(and(eq(guestsTable.id, params.data.guestId), eq(guestsTable.eventId, params.data.eventId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Guest not found" }); return; }
  res.json(UpdateGuestResponse.parse(mapGuest(updated)));
});

router.delete("/events/:eventId/guests/:guestId", async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawGuestId = Array.isArray(req.params.guestId) ? req.params.guestId[0] : req.params.guestId;
  const params = DeleteGuestParams.safeParse({ eventId: parseInt(rawEventId, 10), guestId: parseInt(rawGuestId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(guestsTable).where(
    and(eq(guestsTable.id, params.data.guestId), eq(guestsTable.eventId, params.data.eventId))
  );
  res.status(204).send();
});

export default router;
