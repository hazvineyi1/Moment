import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import sessionsRouter from "./sessions";
import guestsRouter from "./guests";
import suggestionsRouter from "./suggestions";
import invitesRouter from "./invites";
import costsRouter from "./costs";
import optionsRouter from "./options";
import questionnaireRouter from "./questionnaire";
import guestQuestionnaireRouter from "./guestQuestionnaire";
import revealScriptRouter from "./revealScript";
import memoriesRouter from "./memories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(sessionsRouter);
router.use(guestsRouter);
router.use(suggestionsRouter);
router.use(invitesRouter);
router.use(costsRouter);
router.use(optionsRouter);
router.use(questionnaireRouter);
router.use(guestQuestionnaireRouter);
router.use(revealScriptRouter);
router.use(memoriesRouter);

export default router;
