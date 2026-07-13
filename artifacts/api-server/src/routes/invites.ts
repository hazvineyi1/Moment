import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, invitesTable, eventsTable, guestsTable } from "@workspace/db";
import {
  ListInvitesParams,
  ListInvitesResponse,
  GenerateInviteParams,
  GenerateInviteBody,
  GenerateInviteResponse,
  GetInviteParams,
  GetInviteResponse,
} from "@workspace/api-zod";
import { generateJSON } from "../lib/ai";

const router: IRouter = Router();

function mapInvite(i: typeof invitesTable.$inferSelect) {
  return {
    id: i.id,
    eventId: i.eventId,
    title: i.title,
    message: i.message,
    style: i.style,
    whatsappText: i.whatsappText,
    whatsappLink: i.whatsappLink,
    guestIds: i.guestIds ?? null,
    createdAt: i.createdAt.toISOString(),
  };
}

router.get("/events/:eventId/invites", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = ListInvitesParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const invites = await db.select().from(invitesTable).where(eq(invitesTable.eventId, params.data.eventId));
  res.json(ListInvitesResponse.parse(invites.map(mapInvite)));
});

router.post("/events/:eventId/invites/generate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GenerateInviteParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = GenerateInviteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const guestIds = parsed.data.guestIds ?? [];
  let guestNames: string[] = [];
  if (guestIds.length > 0) {
    const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, params.data.eventId));
    guestNames = guests.filter((g) => guestIds.includes(g.id)).map((g) => g.name);
  }

  const style = parsed.data.style;
  const context = parsed.data.additionalContext ?? "";

  const systemPrompt = `You are an expert invitation writer who creates memorable, heartfelt event invitations.
Create an invitation for a ${event.type} event with a ${style} tone.
Return JSON with:
{
  "title": "Invitation title",
  "message": "Full invitation message (2-4 paragraphs)",
  "whatsappText": "A shorter WhatsApp-ready version of the message (1-2 paragraphs, no markdown)"
}
Style guidelines:
- formal: elegant, respectful, traditional language
- casual: warm, friendly, conversational
- playful: fun, energetic, with personality
- elegant: sophisticated, refined, tasteful
Do not use emojis.`;

  const prompt = `Event: "${event.title}" — a ${event.type}
${event.location ? `Location: ${event.location}` : ""}
${event.startDate ? `Date: ${event.startDate}${event.endDate ? ` to ${event.endDate}` : ""}` : ""}
${event.description ? `Description: ${event.description}` : ""}
${guestNames.length > 0 ? `Recipients: ${guestNames.join(", ")}` : ""}
${context ? `Additional context: ${context}` : ""}`;

  type InviteResult = { title: string; message: string; whatsappText: string };
  const result = await generateJSON<InviteResult>(prompt, systemPrompt);

  const whatsappText = result.whatsappText ?? result.message;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const [invite] = await db.insert(invitesTable).values({
    eventId: params.data.eventId,
    title: result.title ?? `${event.title} Invitation`,
    message: result.message ?? "",
    style,
    whatsappText,
    whatsappLink,
    guestIds: guestIds.length > 0 ? JSON.stringify(guestIds) : null,
  }).returning();

  res.status(201).json(GenerateInviteResponse.parse(mapInvite(invite)));
});

router.get("/events/:eventId/invites/:inviteId", async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawInviteId = Array.isArray(req.params.inviteId) ? req.params.inviteId[0] : req.params.inviteId;
  const params = GetInviteParams.safeParse({ eventId: parseInt(rawEventId, 10), inviteId: parseInt(rawInviteId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [invite] = await db.select().from(invitesTable).where(
    and(eq(invitesTable.id, params.data.inviteId), eq(invitesTable.eventId, params.data.eventId))
  );
  if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
  res.json(GetInviteResponse.parse(mapInvite(invite)));
});

export default router;
