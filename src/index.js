import { env } from "./env.js";
import { gatewayRegister, gatewayHeartbeat } from "./gatewayClient.js";
import { runOnce } from "./jobs/runner.js";

async function main() {
  console.log("[overseer] boot", { version: env.SERVICE_VERSION });

  await gatewayRegister();

  setInterval(() => {
    gatewayHeartbeat().catch((err) => console.error("[overseer] heartbeat error", err));
  }, 30_000);

  // Minimal job tick every 5s
  setInterval(() => {
    runOnce().catch((err) => console.error("[overseer] job error", err));
  }, 5_000);
}

main().catch((err) => {
  console.error("[overseer] fatal", err);
  process.exitCode = 1;
});
