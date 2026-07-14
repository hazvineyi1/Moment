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

/** Use GPT-4o-mini vision to describe the people in the uploaded photo. */
async function describePeople(base64: string, mimeType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "low",
            },
          },
          {
            type: "text",
            text: `Describe the people in this photo concisely for an image generation prompt.
Include: how many people, apparent age range, gender presentation, ethnicity (if clearly visible), hair colour/style, and the mood/energy of the group.
Keep it to 1–2 sentences, neutral and descriptive. Focus only on the people, not the background.
Example: "A group of four women in their late twenties, mixed ethnicity, laughing together, dressed casually — relaxed and joyful energy."`,
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
        `Professional luxury travel photograph.`,
        `${peopleDesc}`,
        `They are ${vibe ? `experiencing a ${vibe.toLowerCase()} celebration —` : "celebrating —"}`,
        `${optionName} in ${destination}.`,
        tagline ? `The moment captures: ${tagline}.` : "",
        highlightSummary ? `Setting details: ${highlightSummary}.` : "",
        `Ultra-high quality editorial travel photography. Cinematic composition. Warm golden light.`,
        `Shot for a luxury lifestyle magazine. No text overlays. Photorealistic.`,
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
