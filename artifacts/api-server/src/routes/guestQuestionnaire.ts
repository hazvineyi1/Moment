import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, guestsTable, eventsTable } from "@workspace/db";

const router: IRouter = Router();

// Public — no auth required
router.get("/gq/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;
  const [guest] = await db.select().from(guestsTable)
    .where(eq(guestsTable.questionnaireToken, token));
  if (!guest) { res.status(404).json({ error: "Link not found or expired" }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, guest.eventId));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  // Check if already answered
  let selfProfile: Record<string, unknown> | null = null;
  try {
    if (guest.personality) {
      const p = JSON.parse(guest.personality);
      if (p.selfProfile) selfProfile = p.selfProfile;
    }
  } catch {}

  res.json({
    guestName: guest.name,
    eventTitle: event.title,
    eventType: event.type,
    eventDate: event.startDate ?? null,
    alreadyAnswered: !!selfProfile,
  });
});

// Public — guest submits self-assessment
router.post("/gq/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;
  const [guest] = await db.select().from(guestsTable)
    .where(eq(guestsTable.questionnaireToken, token));
  if (!guest) { res.status(404).json({ error: "Link not found or expired" }); return; }

  const body = req.body as {
    archetypes?: string[];
    mustHaves?: string[];
    dealbreakers?: string[];
    dietary?: string;
  };

  // Merge selfProfile into existing personality JSON
  let existing: Record<string, unknown> = {};
  try { if (guest.personality) existing = JSON.parse(guest.personality); } catch {}

  const updated = {
    ...existing,
    selfProfile: {
      archetypes: body.archetypes ?? [],
      mustHaves: body.mustHaves ?? [],
      dealbreakers: body.dealbreakers ?? [],
      dietary: body.dietary ?? "",
    },
  };

  await db.update(guestsTable)
    .set({ personality: JSON.stringify(updated) })
    .where(eq(guestsTable.id, guest.id));

  res.json({ ok: true });
});

export default router;
