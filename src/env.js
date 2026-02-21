import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  // Optional legacy gateway heartbeat/registry. Leave unset when running without Gateway.
  GATEWAY_URL: z.string().url().optional().or(z.literal("")),
  INTERNAL_API_KEY: z.string().min(16).optional().or(z.literal("")),

  // Render Web Services provide PORT; we also allow local/dev defaults.
  PORT: z.coerce.number().int().positive().default(10000),

  SERVICE_VERSION: z.string().default("0.0.0"),

  // Mongo (snapshot store)
  MONGO_URI: z.string().optional().or(z.literal("")),
  // Backward compatibility if present in older setups
  MONGODB_URI_HEAVY: z.string().optional().or(z.literal("")),

  // Snapshot target
  GUILD_ID: z.string().min(1).optional().or(z.literal("")),

  // Relay integration (for pulling snapshots)
  RELAY_PUBLIC_URL: z.string().url().optional().or(z.literal("")),
  RELAY_SECRET: z.string().min(16).optional().or(z.literal("")),

  // Optional protection for /snapshot/* endpoints
  OVERSEER_SECRET: z.string().min(16).optional().or(z.literal(""))
});

export const env = EnvSchema.parse(process.env);
