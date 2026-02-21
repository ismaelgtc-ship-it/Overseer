import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  GATEWAY_URL: z.string().url(),
  INTERNAL_API_KEY: z.string().min(16),
  SERVICE_VERSION: z.string().default("0.0.0"),
  MONGODB_URI_HEAVY: z.string().optional().or(z.literal(""))
});

export const env = EnvSchema.parse(process.env);
