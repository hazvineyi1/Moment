import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable, guestsTable } from "@workspace/db";
import { openai, withTimeout } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const OPTIONS_MARKER = "__PLAN_OPTIONS__:";

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

function extractCachedOptions(description: string | null | undefined): PlanOption[] | null {
  if (!description) return null;
  const idx = description.indexOf(OPTIONS_MARKER);
  if (idx === -1) return null;
  try {
    // Read to end of line (options are on one line)
    const raw = description.slice(idx + OPTIONS_MARKER.length).split("\n")[0].trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function injectCachedOptions(description: string | null | undefined, options: PlanOption[]): string {
  const desc = description ?? "";
  const newLine = OPTIONS_MARKER + JSON.stringify(options);
  const idx = desc.indexOf(OPTIONS_MARKER);

  if (idx === -1) {
    // Not present yet — append without touching anything else
    return (desc.trimEnd() ? desc.trimEnd() + "\n" : "") + newLine;
  }

  // Replace only the __PLAN_OPTIONS__ line, preserving everything after it
  // (e.g. __CHOSEN_PLAN__, __HOST_CONTEXT__ that may follow)
  const lineEnd = desc.indexOf("\n", idx);
  if (lineEnd === -1) {
    // Options line is the last line — replace from marker to end
    return desc.slice(0, idx).trimEnd() + (desc.slice(0, idx).trimEnd() ? "\n" : "") + newLine;
  }
  return desc.slice(0, idx) + newLine + desc.slice(lineEnd);
}

router.post("/events/:eventId/plan-options", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const eventId = parseInt(rawId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const userId = (req as any).userId as string;
  const [event] = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  // Return cached options unless the client explicitly asks to regenerate
  const force = req.query.force === "true";
  if (!force) {
    const cached = extractCachedOptions(event.description);
    if (cached) {
      res.json({ options: cached, cached: true });
      return;
    }
  }

  // Strip the OPTIONS_MARKER from description before sending to AI (avoid injecting cached junk)
  const descForAI = event.description
    ? event.description.split(OPTIONS_MARKER)[0].trim()
    : null;

  // Helper: extract a single-line marker value from description
  function extractMarkerLine(desc: string, marker: string): string | null {
    const idx = desc.indexOf(marker);
    if (idx === -1) return null;
    return desc.slice(idx + marker.length).split("\n")[0].trim() || null;
  }

  // Extract age range from description
  let ageContext: string | null = null;
  if (event.description) {
    ageContext = extractMarkerLine(event.description, "__AGE__:");
  }

  // Extract personality preferences
  let personality: { travelStyle?: string; dealbreakers?: string[] } | null = null;
  if (event.description) {
    const persRaw = extractMarkerLine(event.description, "__PERSONALITY__:");
    if (persRaw) {
      try { personality = JSON.parse(persRaw); } catch {}
    }
  }

  // Extract date type and flexible date info
  let dateType: string | null = null;
  let dateFlexible: { month?: string; duration?: string } | null = null;
  if (event.description) {
    dateType = extractMarkerLine(event.description, "__DATE_TYPE__:");
    const dfRaw = extractMarkerLine(event.description, "__DATE_FLEXIBLE__:");
    if (dfRaw) {
      try { dateFlexible = JSON.parse(dfRaw); } catch {}
    }
  }

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

  const system = `You are A-Moment — a world-class celebration curator. Generate exactly 6 distinct, opinionated, specific plan proposals for a group celebration. Each option must feel meaningfully different from the others in destination, price tier, and character. Be specific: name real venues, real neighborhoods, real properties that actually exist.

When guest personality profiles or a celebrant age are provided, use them to inform each plan's character, pacing, and activity mix. The whyThisWorks field must reference the group's specific personality mix or the celebrant's age/vibe — never be generic.

Prices must be realistic and well-researched. priceRange covers accommodation + experiences per person (excluding flights). flightEstimate is a realistic round-trip economy/business estimate per person from a major hub near the event's home base, with 2–3 real carriers that fly that route. localTransport lists the practical ways to get around at the destination with indicative prices (e.g. "Private airport transfers ~$80 each way", "Metro day pass €10", "Rental car from €45/day").

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
  "vibe": "<one or two words — e.g. Intimate luxury, Wild and remote, Urban sophistication>"
}`;

  const promptParts: string[] = [
    `EVENT CONTEXT:\n${eventCtx}`,
  ];

  if (personalityContext) {
    promptParts.push(`The planner has shared their travel personality: ${personalityContext}. Use this to sharpen each proposal — avoid dealbreakers entirely, and lean into their travel style for at least 3 of the 6 options. The whyThisWorks field must reference this personality explicitly.`);
  }

  if (dateType === "flexible" && dateContext) {
    promptParts.push(`${dateContext}. Since timing is flexible, you may suggest the optimal season or specific month within that window that makes this destination shine — and say why.`);
  }

  promptParts.push(`Generate 6 distinct plan options. Vary the destinations, price points, and character significantly. At least one option should be unexpected or non-obvious. Make each feel like a genuine editorial recommendation tailored to this specific group's personality mix.`);

  const prompt = promptParts.join("\n\n");

  const AI_TIMEOUT_MS = 45_000;

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.9,
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
      console.error("plan-options JSON parse error. Raw AI output:", text.slice(0, 500));
      res.status(500).json({ error: "AI returned malformed JSON. Please try again." });
      return;
    }

    const options = parsed.options;
    if (!Array.isArray(options) || options.length === 0) {
      console.error("plan-options: missing or empty options array. Parsed:", JSON.stringify(parsed).slice(0, 300));
      res.status(500).json({ error: "A-Moment couldn't format options correctly. Please try again." });
      return;
    }

    // Cache options in event description so the next load is instant
    const newDescription = injectCachedOptions(event.description, options);
    await db.update(eventsTable)
      .set({ description: newDescription })
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));

    res.json({ options });
  } catch (err: any) {
    console.error("plan-options error:", err?.message ?? err);
    res.status(500).json({ error: "A-Moment had trouble generating options. Please try again." });
  }
});

export default router;
