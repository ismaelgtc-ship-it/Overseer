import { env } from "./env.js";
import { startHttpServer } from "./http/server.js";
import { runOnce } from "./jobs/runner.js";
import { gatewayRegister, gatewayHeartbeat } from "./gatewayClient.js";

console.log("[overseer] boot", { version: env.SERVICE_VERSION });

startHttpServer();

async function setupGatewayLoop() {
  const canGateway = Boolean(env.GATEWAY_URL) && Boolean(env.INTERNAL_API_KEY);
  if (!canGateway) {
    console.log("[overseer] gateway disabled (no GATEWAY_URL / INTERNAL_API_KEY)");
    return;
  }

  const ok = await gatewayRegister({
    gatewayUrl: env.GATEWAY_URL,
    internalKey: env.INTERNAL_API_KEY,
    version: env.SERVICE_VERSION,
    meta: { node: process.version }
  }).catch(() => false);

  console.log("[overseer] gatewayRegister", { ok });

  setInterval(() => {
    gatewayHeartbeat({ gatewayUrl: env.GATEWAY_URL, internalKey: env.INTERNAL_API_KEY }).catch(() => {});
  }, 30_000);
}

await setupGatewayLoop();

// Job loop
setInterval(() => {
  runOnce().catch((e) => console.error("[overseer] loop error", String(e?.message || e)));
}, 10_000);

// Run immediately on boot
runOnce().catch(() => {});
