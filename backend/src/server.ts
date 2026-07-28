import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { apiKeyAuth } from "./middleware/apiKeyAuth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authLimiter, globalLimiter } from "./middleware/rateLimiters";
import { adminRouter } from "./routes/admin";
import { apikeyRouter } from "./routes/apikey";
import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { dashboardRouter } from "./routes/dashboard";
import { docsRouter } from "./routes/docs";
import { endpointsRouter } from "./routes/endpoints";
import { logsRouter } from "./routes/logs";
import { publicApiRouter } from "./routes/publicApi";
import { pricingRouter, publicStatsRouter, statusRouter } from "./routes/status";
import { userRouter } from "./routes/user";
import { whitelistRouter } from "./routes/whitelist";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(globalLimiter);

  app.get("/", (_req, res) => {
    res.json({ success: true, message: "Topinz API backend running", docs: "http://localhost:3000/docs" });
  });

  app.get("/health", (_req, res) => {
    res.json({ success: true, uptime: process.uptime(), db: mongoose.connection.readyState === 1 });
  });

  app.use("/auth", authLimiter, authRouter);
  app.use("/user", userRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/apikey", apikeyRouter);
  app.use("/whitelist", whitelistRouter);
  app.use("/logs", logsRouter);
  app.use("/categories", categoriesRouter);
  app.use("/endpoint", endpointsRouter);
  app.use("/docs", docsRouter);
  app.use("/admin", adminRouter);
  app.use("/status", statusRouter);
  app.use("/pricing", pricingRouter);
  app.use("/stats", publicStatsRouter);
  app.use("/api/v1", apiKeyAuth, publicApiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log("----------------------------------------------");
    console.log("  Topinz API backend");
    console.log(`  Environment : ${env.nodeEnv}`);
    console.log(`  Listening   : http://localhost:${env.port}`);
    console.log(`  CORS origin : ${env.corsOrigin}`);
    console.log("----------------------------------------------");
  });
}

// Only start listening when executed directly (tests import createApp).
if (require.main === module) {
  bootstrap().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
