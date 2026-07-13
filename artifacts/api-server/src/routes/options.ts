import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { chatWithAI } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

interface PlanOption {
  id: string;
  name: string;
  tagline: string;
  destination: string;
  venue: string;
  duration: string;
  priceRange: { perPersonMin: number; perPersonMax: number };
  highlights: string[];
  addOns: string[];
  whyThisWorks: string;
  vibe?: string;
}

router.post("/events/:eventId/plan-options", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const eventId = parseInt(rawId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const userId = (req as any).userId as string;
  const [event] = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const eventCtx = [
    `Occasion/type: ${event.type}`,
    event.location ? `Preferred area: ${event.location}` : null,
    event.isInternational ? "Open to international destinations: yes" : "Prefers domestic/local",
    event.budget ? `Budget tier: ${event.budget}` : null,
    event.guestCount ? `Group size: ~${event.guestCount} people` : null,
    event.startDate ? `Target date: ${event.startDate}` : null,
    event.endDate ? `End date: ${event.endDate}` : null,
    event.description ? `Additional context: ${event.description}` : null,
  ].filter(Boolean).join("\n");

  const system = `You are Cele — a world-class celebration curator. Generate exactly 6 distinct, opinionated, specific plan proposals for a group celebration. Each option must feel meaningfully different from the others in destination, price tier, and character. Be specific: name real venues, real neighborhoods, real properties that actually exist.

Return ONLY a valid JSON array — no markdown, no explanation, no prefix text. The array must contain exactly 6 objects with this exact shape:
{
  "id": "option-1",
  "name": "<evocative plan name, max 6 words>",
  "tagline": "<one vivid sentence that makes someone immediately want this>",
  "destination": "<City/Region, Country>",
  "venue": "<specific named property or venue>",
  "duration": "<e.g. 3 nights / 5 days>",
  "priceRange": { "perPersonMin": <integer>, "perPersonMax": <integer> },
  "highlights": ["<specific highlight 1>", "<specific highlight 2>", "<specific highlight 3>"],
  "addOns": ["<optional upgrade 1>", "<optional upgrade 2>", "<optional upgrade 3>"],
  "whyThisWorks": "<one sentence: why this fits this specific group and occasion — be personal and specific>",
  "vibe": "<one or two words — e.g. Intimate luxury, Wild and remote, Urban sophistication>"
}`;

  const prompt = `EVENT CONTEXT:\n${eventCtx}\n\nGenerate 6 distinct plan options. Vary the destinations, price points, and character significantly. At least one option should be unexpected or non-obvious. Make each feel like a genuine editorial recommendation, not a generic template.`;

  try {
    const raw = await chatWithAI(
      [{ role: "user", content: prompt }],
      system
    );

    // Parse JSON from response (strip any accidental markdown fences)
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const options: PlanOption[] = JSON.parse(cleaned);

    if (!Array.isArray(options) || options.length === 0) {
      res.status(500).json({ error: "Invalid options format returned" });
      return;
    }

    res.json({ options });
  } catch (err) {
    console.error("plan-options error:", err);
    res.status(500).json({ error: "Failed to generate plan options" });
  }
});

export default router;
