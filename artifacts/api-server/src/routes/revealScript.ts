import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJSON } from "../lib/ai";

const router: IRouter = Router();

const PLANNING_FOR_MARKER = "__PLANNING_FOR__:";
const AGE_MARKER = "__AGE__:";
const CHOSEN_PLAN_MARKER = "__CHOSEN_PLAN__:";
const HOST_CONTEXT_MARKER = "__HOST_CONTEXT__:";
const CELEBRANT_MARKER = "__CELEBRANT__:";

function parseMarker(desc: string, marker: string): string | null {
  const idx = desc.indexOf(marker);
  if (idx === -1) return null;
  return desc.slice(idx + marker.length).split("\n")[0].trim();
}

export type RevealScript = {
  timing: { suggestion: string; why: string };
  setting: { suggestion: string; why: string };
  script: { opening: string; buildup: string; theReveal: string; afterword: string };
  doNots: string[];
  contingency: string;
};

router.post("/events/:eventId/reveal-script", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));

  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const desc = event.description ?? "";

  // Resolve celebrant name
  const planningForValue = parseMarker(desc, PLANNING_FOR_MARKER);
  const isSomeone = planningForValue?.startsWith("someone");
  if (!isSomeone) { res.status(400).json({ error: "Not a surprise event" }); return; }
  const celebrantName =
    planningForValue?.startsWith("someone:")
      ? planningForValue.slice("someone:".length).trim()
      : "them";

  const age = parseMarker(desc, AGE_MARKER);
  const hostContext = parseMarker(desc, HOST_CONTEXT_MARKER);

  // Chosen plan summary
  let chosenPlanSummary = "";
  const planIdx = desc.indexOf(CHOSEN_PLAN_MARKER);
  if (planIdx !== -1) {
    try {
      const raw = desc.slice(planIdx + CHOSEN_PLAN_MARKER.length).trim();
      const plan = JSON.parse(raw);
      const parts = [plan.name, plan.tagline, plan.destination].filter(Boolean);
      chosenPlanSummary = parts.join(" — ");
    } catch {}
  }

  // Celebrant self-profile (from questionnaire)
  let celebrantProfile = "";
  const celebrantIdx = desc.indexOf(CELEBRANT_MARKER);
  if (celebrantIdx !== -1) {
    try {
      const raw = desc.slice(celebrantIdx + CELEBRANT_MARKER.length).split("\n")[0].trim();
      const answers = JSON.parse(raw);
      const parts: string[] = [];
      if (answers.archetypes?.length) parts.push(`personality: ${answers.archetypes.join(", ")}`);
      if (answers.mustHaves?.length) parts.push(`loves: ${answers.mustHaves.join(", ")}`);
      if (answers.dealbreakers?.length) parts.push(`dislikes: ${answers.dealbreakers.join(", ")}`);
      if (answers.dietary) parts.push(`dietary: ${answers.dietary}`);
      celebrantProfile = parts.join("; ");
    } catch {}
  }

  const eventCtx = [
    `Occasion: ${event.type}`,
    `Celebrant name: ${celebrantName}`,
    age ? `Celebrant age range: ${age}` : null,
    event.startDate ? `Event date: ${event.startDate}` : null,
    event.location ? `Location/destination: ${event.location}` : null,
    chosenPlanSummary ? `The surprise: ${chosenPlanSummary}` : null,
    hostContext ? `Host's notes: ${hostContext}` : null,
    celebrantProfile ? `What we know about ${celebrantName}: ${celebrantProfile}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an expert in emotional intelligence, surprise planning, and storytelling. You write reveal scripts that land — warm, personal, and completely natural spoken aloud.

Generate a personalized surprise reveal script. Be specific to the person and occasion. Use ${celebrantName}'s name throughout. Reference real details from the event context. Every line should sound like it was written for this exact person in this exact moment, not a template.

Respond with a JSON object matching this shape exactly:
{
  "timing": {
    "suggestion": "<specific when — time of day, what they should be doing beforehand, lead-up activity>",
    "why": "<one sentence: why this timing works for this specific person>"
  },
  "setting": {
    "suggestion": "<specific where and how — private or group, staged or casual, any props or setup>",
    "why": "<one sentence: why this setting fits>"
  },
  "script": {
    "opening": "<The opening line — casual and disarming, draws them in, no hint of what's coming. 1-2 sentences.>",
    "buildup": "<Build warmth and anticipation. Reference something real — a memory, a quality, a running joke. 2-3 sentences. Still no reveal.>",
    "theReveal": "<The moment itself. Vivid and specific. Name the thing. Land it emotionally. 2-3 sentences.>",
    "afterword": "<What to say in the 30 seconds after — handles their reaction, whatever it is. 2 sentences.>"
  },
  "doNots": [
    "<Specific thing to avoid — phrased as an action or phrase, not generic advice>",
    "<Another specific avoid>",
    "<Another>",
    "<Another>"
  ],
  "contingency": "<One paragraph: how to handle it gracefully if they react with overwhelm, tears, or something unexpected. Warm and practical.>"
}`;

  const result = await generateJSON<RevealScript>(eventCtx, systemPrompt);
  res.json(result);
});

export default router;
