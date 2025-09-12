export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PROD: (process.env.NODE_ENV || "development") === "production",
  PORT: Number(process.env.PORT || 10000),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || "7d") as any,
  JWT_COOKIE_MAX_AGE_MS: Number(process.env.JWT_COOKIE_MAX_AGE_MS || 604800000),
  MONGODB_URI: process.env.MONGODB_URI || "",
};

if (!env.JWT_SECRET) console.error("❌ JWT_SECRET is not set");
if (!env.MONGODB_URI) console.error("❌ MONGODB_URI is not set");