import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, guestsTable } from "@workspace/db";
import { generateJSON } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

interface CostLine {
  category: string;
  perPersonMin: number;
  perPersonMax: number;
  notes: string;
}

interface CostEstimate {
  currency: string;
  currencyCode: string;
  perPersonMin: number;
  perPersonMax: number;
  totalMin: number;
  totalMax: number;
  guestCount: number;
  breakdown: CostLine[];
  assumptions: string;
  insiderTip: string;
}

router.post("/events/:eventId/cost-estimate", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const eventId = parseInt(rawId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, eventId));
  const headcount = guests.length > 0 ? guests.length : (event.guestCount ?? 10);

  const systemPrompt = `You are a world-class travel cost analyst and celebration planner.
Given an event, return a realistic, itemized cost estimate in the local currency of the destination.
Be specific — name real venues, real services, real market rates.
Use current real-world pricing. For Southeast Asia use USD or VND as appropriate.
Return ONLY a valid JSON object. No markdown, no prose.`;

  const userPrompt = `Event: ${event.title}
Type: ${event.type}
Location: ${event.location ?? "unspecified"}
Budget tier: ${event.budget ?? "mid-range"}
Estimated headcount: ${headcount}
Duration: ${event.startDate && event.endDate ? `${event.startDate} to ${event.endDate}` : "not set"}
Notes: ${event.description ?? "none"}

Return a JSON object with this exact shape:
{
  "currency": "US Dollar",
  "currencyCode": "USD",
  "perPersonMin": number,
  "perPersonMax": number,
  "totalMin": number,
  "totalMax": number,
  "guestCount": ${headcount},
  "breakdown": [
    { "category": "Venue", "perPersonMin": number, "perPersonMax": number, "notes": "specific description" },
    { "category": "Food & Drink", "perPersonMin": number, "perPersonMax": number, "notes": "specific description" },
    { "category": "Activities", "perPersonMin": number, "perPersonMax": number, "notes": "specific description" },
    { "category": "Transport", "perPersonMin": number, "perPersonMax": number, "notes": "specific description" },
    { "category": "Accommodation", "perPersonMin": number, "perPersonMax": number, "notes": "specific description if overnight" }
  ],
  "assumptions": "2-3 sentence summary of key assumptions (duration, included meals, etc.)",
  "insiderTip": "One specific insider tip for saving money or getting better value at this destination"
}`;

  try {
    const result = await generateJSON<CostEstimate>(userPrompt, systemPrompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate cost estimate" });
  }
});

export default router;
