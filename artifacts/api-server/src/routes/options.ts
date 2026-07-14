import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable, guestsTable } from "@workspace/db";
import { openai, withTimeout } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";
import { readMarker, writeMarker, readMarkerString } from "../lib/markers";
import { fetchOwnedEvent } from "../lib/eventHelpers";
import { readInspirations } from "./inspirations";

const router: IRouter = Router();

const OPTIONS_MARKER = "__PLAN_OPTIONS__:";
const AI_TIMEOUT_MS = 45_000;

interface PlanOption {
  id: string;
  name: string;
  tagline: string;
  destination: string;
  venue: string;
  duration: string;
  priceRange: { perPersonMin: number; perPersonMax: number };
  flightEstimate: { perPersonMin: number; perPersonMax: number; carriers: string[] };
  localTransport: string[];
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
  const event = await fetchOwnedEvent(userId, eventId);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  // Return cached options unless the client explicitly asks to regenerate
  const force = req.query.force === "true";
  if (!force) {
    const cached = readMarker<PlanOption[]>(event.description, OPTIONS_MARKER);
    if (cached?.length) {
      res.json({ options: cached, cached: true });
      return;
    }
  }

  // Strip the OPTIONS_MARKER line before sending description to AI
  const descForAI = event.description
    ? event.description.split(OPTIONS_MARKER)[0].trim()
    : null;

  // Extract marker values from description
  const ageContext      = readMarkerString(event.description, "__AGE__:");
  const dateType        = readMarkerString(event.description, "__DATE_TYPE__:");
  const dateFlexible    = readMarker<{ month?: string; duration?: string }>(event.description, "__DATE_FLEXIBLE__:");
  const personality     = readMarker<{ travelStyle?: string; dealbreakers?: string[] }>(event.description, "__PERSONALITY__:");

  // Fetch guest profiles
  const guests = await db.select().from(guestsTable).where(eq(guestsTable.eventId, eventId));
  let guestProfilesText: string | null = null;
  if (guests.length > 0) {
    const profiles = guests.map((g) => {
      let p: any = null;
      try { if (g.personality) p = JSON.parse(g.personality); } catch {}
      const parts: string[] = [g.name];
      if (p?.archetypes?.length) parts.push(p.archetypes.join(", "));
      if (p?.selfProfile?.archetypes?.length) parts.push(`self: ${p.selfProfile.archetypes.join(", ")}`);
      if (p?.selfProfile?.dealbreakers?.length) parts.push(`avoid: ${p.selfProfile.dealbreakers.join(", ")}`);
      if (g.dietaryNeeds) parts.push(`dietary: ${g.dietaryNeeds}`);
      return parts.join(" | ");
    });
    guestProfilesText = profiles.join("; ");
  }

  // Build date context string
  let dateContext: string | null = null;
  if (dateType === "fixed" && event.startDate) {
    dateContext = `Fixed date: ${event.startDate}`;
  } else if (dateType === "flexible" && dateFlexible) {
    const durMap: Record<string, string> = { day: "a day trip", weekend: "a long weekend", week: "about a week", twoweeks: "2 weeks+" };
    const parts: string[] = [];
    if (dateFlexible.month) parts.push(`around ${dateFlexible.month}`);
    if (dateFlexible.duration) parts.push(durMap[dateFlexible.duration] ?? dateFlexible.duration);
    dateContext = parts.length > 0 ? `Timing is flexible: ${parts.join(", ")}` : null;
  } else if (event.startDate) {
    dateContext = `Target date: ${event.startDate}`;
    if (event.endDate) dateContext += ` – ${event.endDate}`;
  }

  // Build personality context string
  let personalityContext: string | null = null;
  if (personality && (personality.travelStyle || (personality.dealbreakers?.length ?? 0) > 0)) {
    const parts: string[] = [];
    if (personality.travelStyle) parts.push(`Travel style: ${personality.travelStyle}`);
    if (personality.dealbreakers?.length) parts.push(`Strongly dislikes: ${personality.dealbreakers.join(", ")}`);
    personalityContext = parts.join(". ");
  }

  // Inspiration context
  const inspirations = readInspirations(event.description);
  const inspirationContext = inspirations.length > 0
    ? inspirations
        .map(i => [i.title, i.description, i.vibes?.length ? `Vibes: ${i.vibes.join(", ")}` : ""].filter(Boolean).join(" — "))
        .join("\n")
    : null;

  const eventCtx = [
    `Occasion/type: ${event.type}`,
    ageContext ? `Celebrant age range: ${ageContext}` : null,
    event.location ? `Preferred area: ${event.location}` : null,
    event.isInternational ? "Open to international destinations: yes" : "Prefers domestic/local",
    event.budget ? `Budget tier: ${event.budget}` : null,
    event.guestCount ? `Group size: ~${event.guestCount} people` : null,
    dateContext,
    personalityContext ? `Planner personality — ${personalityContext}` : null,
    descForAI ? `Additional context: ${descForAI}` : null,
    guestProfilesText ? `Guest personalities: ${guestProfilesText}` : null,
  ].filter(Boolean).join("\n");

  const system = `You are A-Moment — a world-class celebration curator. Generate exactly 6 distinct, opinionated, specific plan proposals for a group celebration.

MANDATORY GEOGRAPHIC SPREAD — assign each of the 6 slots to exactly one of the following tiers, in this order. Do not deviate, do not cluster multiple options in the same country or region:

  option-1: LOCAL — within the home country, preferably the same city or region as the group's home base. A day trip, local venue, or nearby resort.
  option-2: NATIONAL — a different region of the same country, requiring a domestic flight or long train ride.
  option-3: ONE CONTINENT — a destination on a continent that is NOT the home continent and NOT the continent used in option-4 or option-5. Pick a compelling city or region on this continent.
  option-4: ANOTHER CONTINENT — a destination on a second continent different from all others. Must be a genuinely different part of the world (e.g. if option-3 was Europe, option-4 could be Asia, Africa, South America, or Oceania — never the same continent twice).
  option-5: YET ANOTHER CONTINENT — a third distinct continent, or a dramatically different region of one already used only if no untouched continent remains. Push for geographic distance and cultural contrast.
  option-6: CRUISE OR WATER EXCURSION — a cruise, river cruise, sailing charter, liveaboard dive trip, private yacht charter, or any experience where the vessel is the primary venue. Can be anywhere in the world. Name the cruise line or charter operator, the route, and the ship or vessel type.

Within these tiers, vary price points and character. Across all 6 options no two destinations may be in the same country. Be specific: name real venues, real neighborhoods, real properties, real ships or charter companies that actually exist.

When guest personality profiles or a celebrant age are provided, use them to inform each plan's character, pacing, and activity mix. The whyThisWorks field must reference the group's specific personality mix or the celebrant's age/vibe — never be generic.

Prices must be realistic and well-researched. priceRange covers accommodation + experiences per person (excluding flights). flightEstimate is a realistic round-trip economy/business estimate per person from a major hub near the event's home base, with 2–3 real carriers that fly that route. For option-6 (cruise/water), flightEstimate should cover getting to the departure port. localTransport lists the practical ways to get around at the destination with indicative prices in USD (e.g. "Private airport transfers ~$80 each way", "Metro day pass ~$10", "Rental car from ~$50/day"). All prices must be expressed in USD regardless of destination. For option-6 list embarkation logistics instead.

Respond with a JSON object containing an "options" array of exactly 6 objects, each with this exact shape:
{
  "id": "option-1",
  "name": "<evocative plan name, max 6 words>",
  "tagline": "<one vivid sentence that makes someone immediately want this>",
  "destination": "<City/Region, Country>",
  "venue": "<specific named property or venue>",
  "duration": "<always a range, e.g. '3–5 nights' or '4–6 days'>",
  "priceRange": { "perPersonMin": <integer>, "perPersonMax": <integer> },
  "flightEstimate": { "perPersonMin": <integer>, "perPersonMax": <integer>, "carriers": ["<Airline 1>", "<Airline 2>"] },
  "localTransport": ["<option with price>", "<option with price>", "<option with price>"],
  "highlights": ["<specific highlight 1>", "<specific highlight 2>", "<specific highlight 3>"],
  "addOns": ["<optional upgrade 1>", "<optional upgrade 2>"],
  "whyThisWorks": "<one sentence: why this fits this specific group and occasion — be personal and specific>",
  "vibe": "<one or two words — e.g. Intimate luxury, Wild and remote, Urban sophistication>",
  "travelStyleMatch": "<optional: 2–4 words echoing the planner's travel style if personality was provided — omit if no personality data>",
  "optimalTiming": "<optional: specific timing recommendation within the flexible window — omit if dates are fixed or no timing insight applies>"
}`;

  const promptParts: string[] = [`EVENT CONTEXT:\n${eventCtx}`];

  if (personalityContext) {
    promptParts.push(`The planner has shared their travel personality: ${personalityContext}. Use this to sharpen each proposal — avoid dealbreakers entirely, and lean into their travel style for at least 3 of the 6 options. The whyThisWorks field must reference this personality explicitly.`);
  }

  if (dateType === "flexible" && dateContext) {
    promptParts.push(`${dateContext}. Since timing is flexible, you may suggest the optimal season or specific month within that window that makes this destination shine — and say why.`);
  }

  if (inspirationContext) {
    promptParts.push(`STYLE INSPIRATION: The planner has pinned these experience references as mood/style guides:\n${inspirationContext}\n\nChannel the atmosphere, aesthetic, and character of these inspirations — at least 2–3 of the 6 options should feel spiritually aligned with this vibe. Do not copy destinations literally; translate the energy into real curated proposals.`);
  }

  promptParts.push(`Generate exactly 6 plan options following the mandatory geographic spread defined in your instructions: option-1 LOCAL, option-2 NATIONAL, option-3/4/5 each on a distinct continent, option-6 a CRUISE or WATER EXCURSION. No two options may share a country. Vary price points across the six slots. Each option must feel like a genuine editorial recommendation tailored to this specific group — not a generic tourist suggestion.`);

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: "gpt-5.4-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: promptParts.join("\n\n") },
        ],
        max_completion_tokens: 4000,
        response_format: { type: "json_object" },
      }),
      AI_TIMEOUT_MS,
      "plan-options"
    );

    const text = response.choices[0]?.message?.content ?? "{}";
    let parsed: { options?: PlanOption[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("plan-options JSON parse error. Raw:", text.slice(0, 500));
      res.status(500).json({ error: "AI returned malformed JSON. Please try again." });
      return;
    }

    const options = parsed.options;
    if (!Array.isArray(options) || options.length === 0) {
      console.error("plan-options: missing options array. Parsed:", JSON.stringify(parsed).slice(0, 300));
      res.status(500).json({ error: "A-Moment couldn't format options correctly. Please try again." });
      return;
    }

    await db.update(eventsTable)
      .set({ description: writeMarker(event.description, OPTIONS_MARKER, options) })
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));

    res.json({ options });
  } catch (err: any) {
    console.error("plan-options error:", err?.message ?? err);
    res.status(500).json({ error: "A-Moment had trouble generating options. Please try again." });
  }
});

export default router;
