import http from "node:http";
import { env } from "./env.js";
import { gatewayRegister, gatewayHeartbeat } from "./gatewayClient.js";
import { runOnce } from "./jobs/runner.js";

// Render (Free) Web Service health checks require an HTTP listener.
const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/healthz" || url === "/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "overseer", version: env.SERVICE_VERSION }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "not_found" }));
});

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[overseer] health server listening on :${env.PORT}`);
});

async function main() {
  console.log("[overseer] boot", { version: env.SERVICE_VERSION });

  const hasGateway = Boolean(env.GATEWAY_URL) && Boolean(env.INTERNAL_API_KEY);
  if (hasGateway) {
    await gatewayRegister();
    setInterval(() => {
      gatewayHeartbeat().catch((err) => console.error("[overseer] heartbeat error", err));
    }, 30_000);
  } else {
    console.log("[overseer] gateway disabled (no GATEWAY_URL / INTERNAL_API_KEY)");
  }

  // Minimal job tick every 5s
  setInterval(() => {
    runOnce().catch((err) => console.error("[overseer] job error", err));
  }, 5_000);
}

main().catch((err) => {
  console.error("[overseer] fatal", err);
  process.exitCode = 1;
});
