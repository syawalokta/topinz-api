import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  nodeEnv: "development" | "production" | "test";
  isProduction: boolean;
}

const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];

export const env: AppConfig = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  nodeEnv,
  isProduction: nodeEnv === "production",
};
