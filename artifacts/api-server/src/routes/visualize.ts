import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { openai, withTimeout } from "../lib/ai";
import { requireAuth } from "../middlewares/requireAuth";
import { fetchOwnedEvent } from "../lib/eventHelpers";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are accepted"));
  },
});

const VISUALIZE_TIMEOUT_MS = 120_000;

/** Use GPT-4o vision to describe the people in the uploaded photo. */
async function describePeople(base64: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 180,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `Look carefully at this photo and describe the people in it for an image generation prompt.
Be precise and literal — your description will be used to recreate these exact people in a new scene.
Include:
- How many people
- Each person's apparent age range
- Each person's gender presentation
- Each person's skin tone and ethnicity (be specific: e.g. "dark brown skin", "medium brown South Asian complexion", "East Asian", "light-skinned Black", "olive Mediterranean complexion" — do not default to or assume white/light skin)
- Hair colour and style for each person
- The group's mood and energy

Write 2–3 sentences. Be accurate and faithful to what you actually see. Do not generalise or substitute.
Example: "A group of five people in their thirties: two Black women with natural afro hair, one South Asian man with short dark hair, one mixed-race woman with curly auburn hair, and one East Asian woman with straight black hair. They are laughing and relaxed, dressed in smart-casual clothes."`,
          },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "a group of friends";
}

/** POST /api/events/:eventId/visualize
 *  multipart/form-data:
 *    photo       — image file (required)
 *    optionName  — plan option title
 *    destination — destination string
 *    tagline     — plan tagline
 *    highlights  — JSON array of strings
 *    vibe        — vibe tag (optional)
 */
router.post(
  "/events/:eventId/visualize",
  requireAuth,
  upload.single("photo"),
  async (req: Request & { file?: Express.Multer.File }, res): Promise<void> => {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) { res.status(400).json({ error: "Invalid event ID" }); return; }

    if (!req.file) { res.status(400).json({ error: "Photo is required" }); return; }

    const event = await fetchOwnedEvent((req as any).userId, eventId);
    if (!event) { res.status(404).json({ error: "Event not found" }); return; }

    const { optionName = "a curated experience", destination = "a beautiful destination", tagline = "", vibe = "" } = req.body ?? {};
    let highlights: string[] = [];
    try { highlights = JSON.parse(req.body?.highlights ?? "[]"); } catch {}

    const base64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    try {
      // Step 1: Describe the people in the uploaded photo
      const peopleDesc = await withTimeout(
        describePeople(base64, mimeType),
        20_000
      );

      // Step 2: Build a rich scene prompt
      const highlightSummary = highlights.slice(0, 3).join(", ");
      const prompt = [
        `Ultra-high quality editorial travel photograph for a luxury lifestyle magazine.`,
        `The people in this scene must match this description exactly — skin tones, ethnicities, hair, and count are non-negotiable: ${peopleDesc}`,
        `Do not alter, lighten, or substitute any person's appearance. Render every individual faithfully as described.`,
        `They are ${vibe ? `experiencing a ${vibe.toLowerCase()} celebration —` : "celebrating —"}`,
        `${optionName} in ${destination}.`,
        tagline ? `The moment captures: ${tagline}.` : "",
        highlightSummary ? `Setting details: ${highlightSummary}.` : "",
        `Cinematic composition. Warm golden light. Photorealistic. No text overlays.`,
      ].filter(Boolean).join(" ");

      // Step 3: Generate the scene with gpt-image-1
      const imageResponse = await withTimeout(
        openai.images.generate({
          model: "gpt-image-1",
          prompt,
          size: "1536x1024",
          quality: "high",
          n: 1,
        } as any),
        VISUALIZE_TIMEOUT_MS
      );

      const b64 = (imageResponse as any).data?.[0]?.b64_json;
      if (!b64) { res.status(500).json({ error: "Image generation returned no data" }); return; }

      res.json({ image: `data:image/png;base64,${b64}`, peopleDesc });
    } catch (err: any) {
      console.error("visualize error:", err?.message ?? err);
      res.status(500).json({ error: err?.message ?? "Image generation failed" });
    }
  }
);

export default router;
