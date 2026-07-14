import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Behind Railway's proxy
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Clerk: reads CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY from env.
app.use(clerkMiddleware());

app.use("/api", router);

// Serve the built frontend (copied into dist/public at build time)
const publicDir = path.resolve(globalThis.__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  logger.warn({ publicDir }, "No frontend build found; serving API only");
}

export default app;
