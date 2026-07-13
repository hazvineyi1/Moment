import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, suggestionsTable, eventsTable } from "@workspace/db";
import {
  ListSuggestionsParams,
  ListSuggestionsResponse,
  GenerateSuggestionsParams,
  GenerateSuggestionsBody,
  GenerateSuggestionsResponse,
  UpdateSuggestionParams,
  UpdateSuggestionBody,
  UpdateSuggestionResponse,
  DeleteSuggestionParams,
} from "@workspace/api-zod";
import { generateJSON } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function mapSuggestion(s: typeof suggestionsTable.$inferSelect) {
  return {
    id: s.id,
    eventId: s.eventId,
    type: s.type,
    name: s.name,
    description: s.description,
    location: s.location ?? null,
    country: s.country ?? null,
    estimatedCost: s.estimatedCost ?? null,
    bestFor: s.bestFor ?? null,
    highlights: s.highlights ?? null,
    isSaved: s.isSaved,
    imageUrl: s.imageUrl ?? null,
    websiteUrl: s.websiteUrl ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/events/:eventId/suggestions", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = ListSuggestionsParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const suggestions = await db
    .select()
    .from(suggestionsTable)
    .where(eq(suggestionsTable.eventId, params.data.eventId))
    .orderBy(suggestionsTable.createdAt);

  res.json(ListSuggestionsResponse.parse(suggestions.map(mapSuggestion)));
});

router.post("/events/:eventId/suggestions/generate", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const params = GenerateSuggestionsParams.safeParse({ eventId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const parsed = GenerateSuggestionsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const count = parsed.data.count ?? 5;
  const focus = parsed.data.focus;
  const prefs = parsed.data.preferences ?? "";

  const systemPrompt = `You are a world-class celebration and travel planning expert with deep knowledge of venues, destinations, and experiences globally.
Generate specific, real-world suggestions for a ${event.type} celebration.
${event.location ? `The event location preference is: ${event.location}` : ""}
${event.isInternational ? "International options are welcome." : "Focus on local or domestic options."}
${event.budget ? `Budget range: ${event.budget}` : ""}
${event.guestCount ? `Guest count: approximately ${event.guestCount} people` : ""}
${prefs ? `Additional preferences: ${prefs}` : ""}

Return a JSON object with key "suggestions" containing an array of ${count} suggestions.
Each suggestion should have:
{
  "type": "${focus === "all" ? "venue|activity|accommodation|dining|entertainment" : focus}",
  "name": "Specific venue/place name",
  "description": "Compelling 2-3 sentence description",
  "location": "City, Region",
  "country": "Country name",
  "estimatedCost": "e.g. $2,000-5,000 per person or $500/night",
  "bestFor": "e.g. Adventurous couples, large groups who love culture",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}
Be specific. Use real place names. Make suggestions feel exciting and well-researched.`;

  type SuggestionItem = {
    type: string;
    name: string;
    description: string;
    location: string;
    country: string;
    estimatedCost: string;
    bestFor: string;
    highlights: string[];
  };

  const result = await generateJSON<{ suggestions: SuggestionItem[] }>(
    `Generate ${count} ${focus} suggestions for our ${event.type} event.`,
    systemPrompt
  );

  const items = result.suggestions ?? [];

  const inserted = await Promise.all(
    items.map(async (item) => {
      const [row] = await db.insert(suggestionsTable).values({
        eventId: params.data.eventId,
        type: item.type ?? focus,
        name: item.name,
        description: item.description,
        location: item.location ?? null,
        country: item.country ?? null,
        estimatedCost: item.estimatedCost ?? null,
        bestFor: item.bestFor ?? null,
        highlights: item.highlights ? JSON.stringify(item.highlights) : null,
        isSaved: false,
      }).returning();
      return row;
    })
  );

  res.status(201).json(GenerateSuggestionsResponse.parse(inserted.map(mapSuggestion)));
});

router.patch("/events/:eventId/suggestions/:suggestionId", requireAuth, async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawSugId = Array.isArray(req.params.suggestionId) ? req.params.suggestionId[0] : req.params.suggestionId;
  const params = UpdateSuggestionParams.safeParse({ eventId: parseInt(rawEventId, 10), suggestionId: parseInt(rawSugId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const parsed = UpdateSuggestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [updated] = await db
    .update(suggestionsTable)
    .set({
      ...(data.isSaved !== undefined && { isSaved: data.isSaved }),
    })
    .where(and(eq(suggestionsTable.id, params.data.suggestionId), eq(suggestionsTable.eventId, params.data.eventId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Suggestion not found" }); return; }
  res.json(UpdateSuggestionResponse.parse(mapSuggestion(updated)));
});

router.delete("/events/:eventId/suggestions/:suggestionId", requireAuth, async (req, res): Promise<void> => {
  const rawEventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const rawSugId = Array.isArray(req.params.suggestionId) ? req.params.suggestionId[0] : req.params.suggestionId;
  const params = DeleteSuggestionParams.safeParse({ eventId: parseInt(rawEventId, 10), suggestionId: parseInt(rawSugId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(suggestionsTable).where(
    and(eq(suggestionsTable.id, params.data.suggestionId), eq(suggestionsTable.eventId, params.data.eventId))
  );
  res.status(204).send();
});

export default router;
