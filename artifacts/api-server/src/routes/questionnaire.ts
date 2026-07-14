import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";

const router: IRouter = Router();

const Q_MARKER = "__CELEBRANT__:";
const PLAN_MARKER = "__CHOSEN_PLAN__:";
const Q_DISABLED_MARKER = "__Q_DISABLED__:";
const Q_CUSTOM_MARKER = "__Q_CUSTOM__:";

function injectCelebrantAnswers(description: string | null | undefined, answers: Record<string, string>): string {
  let desc = description ?? "";
  const qIdx = desc.indexOf(Q_MARKER);
  if (qIdx !== -1) desc = desc.slice(0, qIdx).trim();
  const tag = `${Q_MARKER}${JSON.stringify(answers)}`;
  const planIdx = desc.indexOf(PLAN_MARKER);
  if (planIdx !== -1) {
    return `${desc.slice(0, planIdx).trim()}\n${tag}\n${desc.slice(planIdx)}`;
  }
  return `${desc}\n${tag}`.trim();
}

function parseQuestionConfig(description: string | null | undefined): {
  disabledKeys: string[];
  customQuestions: string[];
} {
  const desc = description ?? "";
  let disabledKeys: string[] = [];
  let customQuestions: string[] = [];
  for (const line of desc.split("\n")) {
    if (line.startsWith(Q_DISABLED_MARKER)) {
      try { disabledKeys = JSON.parse(line.slice(Q_DISABLED_MARKER.length)); } catch {}
    }
    if (line.startsWith(Q_CUSTOM_MARKER)) {
      try { customQuestions = JSON.parse(line.slice(Q_CUSTOM_MARKER.length)); } catch {}
    }
  }
  return { disabledKeys, customQuestions };
}

// Public — no auth required
router.get("/q/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.questionnaireToken, token));
  if (!event) { res.status(404).json({ error: "Link not found or expired" }); return; }
  const { disabledKeys, customQuestions } = parseQuestionConfig(event.description);
  res.json({
    eventTitle: event.title,
    eventType: event.type,
    eventDate: event.startDate ?? null,
    eventLocation: event.location ?? null,
    disabledKeys,
    customQuestions,
  });
});

// Public — celebrant submits answers
router.post("/q/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.questionnaireToken, token));
  if (!event) { res.status(404).json({ error: "Link not found or expired" }); return; }

  const answers: Record<string, string> = req.body ?? {};
  const newDesc = injectCelebrantAnswers(event.description, answers);

  await db.update(eventsTable).set({ description: newDesc }).where(eq(eventsTable.id, event.id));
  res.json({ ok: true });
});

export default router;
