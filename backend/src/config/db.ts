import mongoose from "mongoose";
import path from "path";
import { env } from "./env";

/** Held so we can stop it on disconnect. Typed loosely to keep the dep optional. */
let memoryServer: { stop: () => Promise<boolean> } | null = null;

/**
 * Connect to MongoDB. Uses MONGODB_URI when provided; otherwise spins up an
 * in-memory MongoDB (dev convenience) and warns that data is ephemeral.
 */
export async function connectDB(): Promise<void> {
  if (env.mongodbUri) {
    await mongoose.connect(env.mongodbUri);
    console.log(`[db] Connected to MongoDB at ${env.mongodbUri}`);
    return;
  }

  try {
    // Dynamic import so production builds without the dev dependency still load.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const instance = await MongoMemoryServer.create({
      binary: { downloadDir: path.resolve(process.cwd(), ".mongodb-binaries") },
    });
    memoryServer = instance;
    await mongoose.connect(instance.getUri("topinz"));
    console.warn(
      "[db] WARNING: MONGODB_URI is not set — using an in-memory MongoDB. " +
        "All data is EPHEMERAL and will be lost when the process exits."
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      "[db] Failed to start the in-memory MongoDB fallback (binary download may be blocked). " +
        `Set MONGODB_URI in backend/.env to a running MongoDB instance. Underlying error: ${detail}`
    );
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
