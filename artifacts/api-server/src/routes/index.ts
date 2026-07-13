import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import eventsRouter from "./events";
import sessionsRouter from "./sessions";
import guestsRouter from "./guests";
import suggestionsRouter from "./suggestions";
import invitesRouter from "./invites";
import costsRouter from "./costs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(eventsRouter);
router.use(sessionsRouter);
router.use(guestsRouter);
router.use(suggestionsRouter);
router.use(invitesRouter);
router.use(costsRouter);

export default router;
