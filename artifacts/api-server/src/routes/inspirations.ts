import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { openai } from "../lib/ai";

const router: IRouter = Router();

const MARKER = "__INSPIRATIONS__:";

export interface Inspiration {
  url: string;
  title: string;
  description: string;
  image?: string;
  vibes: string[];
  addedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readInspirations(description: string | null | undefined): Inspiration[] {
  if (!description) return [];
  const idx = description.indexOf(MARKER);
  if (idx === -1) return [];
  try {
    const raw = description.slice(idx + MARKER.length).split("\n")[0].trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInspirations(description: string | null | undefined, inspirations: Inspiration[]): string {
  const desc = description ?? "";
  const newLine = MARKER + JSON.stringify(inspirations);
  const idx = desc.indexOf(MARKER);
  if (idx === -1) {
    return (desc.trimEnd() ? desc.trimEnd() + "\n" : "") + newLine;
  }
  const lineEnd = desc.indexOf("\n", idx);
  if (lineEnd === -1) {
    return desc.slice(0, idx).trimEnd() + (desc.slice(0, idx).trimEnd() ? "\n" : "") + newLine;
  }
  return desc.slice(0, idx) + newLine + desc.slice(lineEnd);
}

/** Try to pull OG/meta tags from a URL via a plain HTTP fetch. */
async function fetchUrlMeta(url: string): Promise<{ title: string; description: string; image?: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const og = (prop: string): string => {
      return (
        html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']{1,500})["']`, "i"))?.[1] ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:${prop}["']`, "i"))?.[1] ||
        ""
      );
    };

    const title =
      og("title") || html.match(/<title>([^<]{1,200})<\/title>/i)?.[1] || "";
    const description =
      og("description") ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)?.[1] ||
      "";
    const image = og("image") || undefined;

    if (!title && !description) return null;
    return {
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 500),
      image: image?.slice(0, 500),
    };
  } catch {
    return null;
  }
}

/** Ask the AI to infer the experience from a URL when the page can't be fetched. */
async function aiInferFromUrl(url: string): Promise<{ title: string; description: string; vibes: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 256,
      messages: [
        {
          role: "system",
          content:
            "You are a luxury event experience curator. Given a social media or website URL, infer what type of experience or venue it likely showcases based on the URL structure, known platform patterns, and any context you have. Respond with JSON only.",
        },
        {
          role: "user",
          content: `URL: ${url}\n\nRespond as JSON: { "title": "<5-8 word evocative title>", "description": "<1-2 sentences about the atmosphere, style, and type of experience>", "vibes": ["<tag1>", "<tag2>", "<tag3>"] }`,
        },
      ],
    });
    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      title: parsed.title || "Inspiration",
      description: parsed.description || "",
      vibes: Array.isArray(parsed.vibes) ? parsed.vibes.slice(0, 5) : [],
    };
  } catch {
    return { title: "Inspiration", description: "", vibes: [] };
  }
}

/** Extract mood/vibe tags from fetched metadata using AI. */
async function aiExtractVibes(title: string, description: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 80,
      messages: [
        {
          role: "user",
          content: `Given this experience title and description, return 3-5 short vibe/mood tags as a JSON array of strings.\nTitle: ${title}\nDescription: ${description}\nRespond with JSON array only.`,
        },
      ],
    });
    const text = response.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /events/:eventId/inspirations */
router.get("/events/:eventId/inspirations", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const userId = (req as any).userId as string;
  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  res.json({ inspirations: readInspirations(event.description) });
});

/** POST /events/:eventId/inspirations  body: { url: string } */
router.post("/events/:eventId/inspirations", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") { res.status(400).json({ error: "url is required" }); return; }

  // Basic URL validation
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { res.status(400).json({ error: "Invalid URL" }); return; }

  const userId = (req as any).userId as string;
  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existing = readInspirations(event.description);
  if (existing.length >= 10) { res.status(400).json({ error: "Maximum 10 inspirations per event" }); return; }
  if (existing.some((i) => i.url === url)) { res.status(400).json({ error: "Already saved" }); return; }

  // Try to fetch OG metadata; fall back to AI inference
  let title = "";
  let description = "";
  let image: string | undefined;
  let vibes: string[] = [];

  const meta = await fetchUrlMeta(url);
  if (meta && (meta.title || meta.description)) {
    title = meta.title;
    description = meta.description;
    image = meta.image;
    // Extract vibes with AI (parallel — fire and forget if slow)
    vibes = await aiExtractVibes(title, description);
  } else {
    // Instagram, TikTok, etc. block server fetches — infer from URL using AI
    const inferred = await aiInferFromUrl(url);
    title = inferred.title;
    description = inferred.description;
    vibes = inferred.vibes;
  }

  const inspiration: Inspiration = {
    url,
    title: title || parsedUrl.hostname,
    description,
    image,
    vibes,
    addedAt: new Date().toISOString(),
  };

  const updated = [...existing, inspiration];
  const newDescription = writeInspirations(event.description, updated);
  await db.update(eventsTable).set({ description: newDescription })
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));

  res.json({ inspiration });
});

/** DELETE /events/:eventId/inspirations/:index */
router.delete("/events/:eventId/inspirations/:index", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  const idx = parseInt(req.params.index, 10);
  if (isNaN(eventId) || isNaN(idx)) { res.status(400).json({ error: "Invalid params" }); return; }

  const userId = (req as any).userId as string;
  const [event] = await db.select().from(eventsTable).where(
    and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId))
  );
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existing = readInspirations(event.description);
  if (idx < 0 || idx >= existing.length) { res.status(404).json({ error: "Inspiration not found" }); return; }

  const updated = existing.filter((_, i) => i !== idx);
  const newDescription = writeInspirations(event.description, updated);
  await db.update(eventsTable).set({ description: newDescription })
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));

  res.json({ ok: true });
});

export { readInspirations };
export default router;
