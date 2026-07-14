import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { toFile } from "openai";
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

    try {
      const highlightSummary = highlights.slice(0, 3).join(", ");

      // Build the edit prompt — people are preserved by the edit endpoint reading the source image directly.
      const prompt = [
        `Keep every person in this photo exactly as they are — their faces, hairstyles, hair colour, skin tone, clothing, and expressions must remain completely unchanged.`,
        `Replace only the background and surroundings: transport them to ${optionName} in ${destination}.`,
        vibe ? `The atmosphere is ${vibe.toLowerCase()}.` : "",
        tagline ? `The moment captures: ${tagline}.` : "",
        highlightSummary ? `Scene details: ${highlightSummary}.` : "",
        `Ultra-high quality luxury editorial travel photography. Cinematic composition. Warm golden light. Photorealistic. No text overlays.`,
      ].filter(Boolean).join(" ");

      // Convert buffer to a File object the SDK accepts
      const imageFile = await toFile(req.file.buffer, "photo.png", { type: "image/png" });

      // Use images.edit so the model reads the actual photo — faces, hair, clothing are all preserved
      const imageResponse = await withTimeout(
        (openai.images as any).edit({
          model: "gpt-image-1",
          image: imageFile,
          prompt,
          size: "1536x1024",
          quality: "high",
          n: 1,
        }),
        VISUALIZE_TIMEOUT_MS
      );

      const b64 = (imageResponse as any).data?.[0]?.b64_json;
      if (!b64) { res.status(500).json({ error: "Image generation returned no data" }); return; }

      res.json({ image: `data:image/png;base64,${b64}` });
    } catch (err: any) {
      console.error("visualize error:", err?.message ?? err);
      res.status(500).json({ error: err?.message ?? "Image generation failed" });
    }
  }
);

export default router;
