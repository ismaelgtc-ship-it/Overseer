import http from "node:http";
import { env } from "./env.js";
import { gatewayRegister, gatewayHeartbeat } from "./gatewayClient.js";
import { runOnce } from "./jobs/runner.js";
import { getLatestSnapshot } from "./snapshot/store.js";
import { pullSnapshotFromRelay } from "./snapshot/pull.js";

function requireSecretIfConfigured(req, res) {
  if (!env.OVERSEER_SECRET) return true;
  const got = req.headers["x-overseer-secret"];
  if (got !== env.OVERSEER_SECRET) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "unauthorized" }));
    return false;
  }
  return true;
}

// Render (Free) Web Service health checks require an HTTP listener.
const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (url === "/healthz" || url === "/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "overseer", version: env.SERVICE_VERSION }));
    return;
  }

  // Snapshot API (Phase 1 clone engine)
  if (url === "/snapshot/latest" && req.method === "GET") {
    if (!requireSecretIfConfigured(req, res)) return;
    if (!env.GUILD_ID) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "bad_request", error: "GUILD_ID missing" }));
      return;
    }
    try {
      const doc = await getLatestSnapshot(env.GUILD_ID);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", latest: doc }));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "error", error: String(e?.message ?? e) }));
    }
    return;
  }

  if (url === "/snapshot/pull" && req.method === "POST") {
    if (!requireSecretIfConfigured(req, res)) return;
    try {
      const snap = await pullSnapshotFromRelay();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", snapshot: { guildId: snap.guild?.id, takenAt: snap.takenAt } }));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "error", error: String(e?.message ?? e) }));
    }
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
