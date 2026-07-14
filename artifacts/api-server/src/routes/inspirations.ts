import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { openai, CHAT_MODEL } from "../lib/ai";
import { readMarker, writeMarker } from "../lib/markers";
import { fetchOwnedEvent } from "../lib/eventHelpers";

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

// Thin wrapper kept for backward-compat import in options.ts
export function readInspirations(description: string | null | undefined): Inspiration[] {
  return readMarker<Inspiration[]>(description, MARKER) ?? [];
}

// ─── URL metadata helpers ─────────────────────────────────────────────────────

async function fetchUrlMeta(url: string): Promise<{ title: string; description: string; image?: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const og = (prop: string): string =>
      html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']{1,500})["']`, "i"))?.[1] ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+property=["']og:${prop}["']`, "i"))?.[1] || "";

    const title = og("title") || html.match(/<title>([^<]{1,200})<\/title>/i)?.[1] || "";
    const description = og("description") ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)?.[1] || "";
    const image = og("image") || undefined;

    if (!title && !description) return null;
    return { title: title.trim().slice(0, 200), description: description.trim().slice(0, 500), image: image?.slice(0, 500) };
  } catch {
    return null;
  }
}

async function aiInferFromUrl(url: string): Promise<{ title: string; description: string; vibes: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_completion_tokens: 256,
      messages: [
        { role: "system", content: "You are a luxury event experience curator. Given a URL, infer the type of experience or venue it showcases. Respond with JSON only." },
        { role: "user", content: `URL: ${url}\n\nRespond as JSON: { "title": "<5-8 word evocative title>", "description": "<1-2 sentences about atmosphere, style, and experience type>", "vibes": ["<tag1>", "<tag2>", "<tag3>"] }` },
      ],
    });
    const parsed = JSON.parse((response.choices[0]?.message?.content ?? "{}").replace(/```json|```/g, "").trim());
    return { title: parsed.title || "Inspiration", description: parsed.description || "", vibes: Array.isArray(parsed.vibes) ? parsed.vibes.slice(0, 5) : [] };
  } catch {
    return { title: "Inspiration", description: "", vibes: [] };
  }
}

async function aiExtractVibes(title: string, description: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_completion_tokens: 80,
      messages: [{ role: "user", content: `Given this title and description, return 3-5 short vibe/mood tags as a JSON array.\nTitle: ${title}\nDescription: ${description}\nRespond with JSON array only.` }],
    });
    const parsed = JSON.parse((response.choices[0]?.message?.content ?? "[]").replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/events/:eventId/inspirations", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const event = await fetchOwnedEvent((req as any).userId, eventId);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  res.json({ inspirations: readInspirations(event.description) });
});

router.post("/events/:eventId/inspirations", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") { res.status(400).json({ error: "url is required" }); return; }

  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { res.status(400).json({ error: "Invalid URL" }); return; }

  const event = await fetchOwnedEvent((req as any).userId, eventId);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existing = readInspirations(event.description);
  if (existing.length >= 10) { res.status(400).json({ error: "Maximum 10 inspirations per event" }); return; }
  if (existing.some((i) => i.url === url)) { res.status(400).json({ error: "Already saved" }); return; }

  let title = "", description = "", image: string | undefined, vibes: string[] = [];

  const meta = await fetchUrlMeta(url);
  if (meta && (meta.title || meta.description)) {
    ({ title, description, image } = meta);
    vibes = await aiExtractVibes(title, description);
  } else {
    const inferred = await aiInferFromUrl(url);
    ({ title, description, vibes } = inferred);
  }

  const inspiration: Inspiration = { url, title: title || parsedUrl.hostname, description, image, vibes, addedAt: new Date().toISOString() };
  const updated = [...existing, inspiration];

  await db.update(eventsTable)
    .set({ description: writeMarker(event.description, MARKER, updated) })
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, (req as any).userId)));

  res.json({ inspiration });
});

router.delete("/events/:eventId/inspirations/:index", requireAuth, async (req, res): Promise<void> => {
  const eventId = parseInt(req.params.eventId, 10);
  const idx = parseInt(req.params.index, 10);
  if (isNaN(eventId) || isNaN(idx)) { res.status(400).json({ error: "Invalid params" }); return; }

  const event = await fetchOwnedEvent((req as any).userId, eventId);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existing = readInspirations(event.description);
  if (idx < 0 || idx >= existing.length) { res.status(404).json({ error: "Inspiration not found" }); return; }

  await db.update(eventsTable)
    .set({ description: writeMarker(event.description, MARKER, existing.filter((_, i) => i !== idx)) })
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, (req as any).userId)));

  res.json({ ok: true });
});

export default router;
