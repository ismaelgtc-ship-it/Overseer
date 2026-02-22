import http from "node:http";
import { request } from "undici";
import { env } from "./env.js";
import { getDb } from "./db.js";
import { gatewayRegister, gatewayHeartbeat } from "./gatewayClient.js";
import { calculateDiff } from "./diff.js";

const PORT = env.PORT;

function requireOverseerSecret(req, res) {
  if (!env.OVERSEER_SECRET) return true;
  const key = req.headers["x-overseer-secret"];
  if (key !== env.OVERSEER_SECRET) {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }));
    return false;
  }
  return true;
}

async function pullSnapshot() {
  if (!env.RELAY_PUBLIC_URL || !env.RELAY_SECRET) return null;
  const url = `${env.RELAY_PUBLIC_URL.replace(/\/$/, "")}/internal/snapshot`;
  const res = await request(url, {
    method: "GET",
    headers: { "x-relay-secret": env.RELAY_SECRET }
  });
  const body = await res.body.json().catch(() => null);
  if (res.statusCode !== 200 || !body?.ok) return null;
  return body.snapshot;
}

async function saveSnapshotAndDiff(snapshot) {
  const db = await getDb();
  const snapshots = db.collection("guild_snapshots");
  const diffs = db.collection("guild_diffs");

  const latest = await snapshots.find({ guildId: snapshot.guild.id }).sort({ createdAt: -1 }).limit(1).toArray();
  const prev = latest?.[0]?.snapshot ?? null;

  const diff = calculateDiff(prev, snapshot);

  await snapshots.insertOne({
    guildId: snapshot.guild.id,
    createdAt: Date.now(),
    snapshot
  });

  await diffs.insertOne({
    guildId: snapshot.guild.id,
    createdAt: Date.now(),
    diff
  });

  return { diff };
}

let lastSnapshot = null;
let lastDiff = null;

async function runOnce() {
  const snapshot = await pullSnapshot();
  if (!snapshot) return;

  // avoid storing duplicates if unchanged
  const fingerprint = JSON.stringify({ roles: snapshot.roles?.length, channels: snapshot.channels?.length, ts: snapshot.ts });
  if (lastSnapshot?.fingerprint === fingerprint) return;

  const { diff } = await saveSnapshotAndDiff(snapshot);
  lastSnapshot = { fingerprint, snapshot };
  lastDiff = diff;
}

// HTTP API
const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (url === "/" || url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "overseer", ts: new Date().toISOString() }));
    return;
  }

  if (url === "/api/snapshot/latest") {
    if (!requireOverseerSecret(req, res)) return;
    const db = await getDb().catch(() => null);
    if (!db) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "MONGO_NOT_READY" }));
      return;
    }
    const doc = await db
      .collection("guild_snapshots")
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, snapshot: doc?.[0]?.snapshot ?? null }));
    return;
  }

  if (url === "/api/diff/latest") {
    if (!requireOverseerSecret(req, res)) return;
    const db = await getDb().catch(() => null);
    if (!db) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "MONGO_NOT_READY" }));
      return;
    }
    const doc = await db
      .collection("guild_diffs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, diff: doc?.[0]?.diff ?? null }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "NOT_FOUND" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[overseer] http listening on :${PORT}`);
});

// Boot
(async () => {
  // Register in Gateway if configured
  await gatewayRegister({
    gatewayUrl: env.GATEWAY_URL ? env.GATEWAY_URL.replace(/\/$/, "") : "",
    internalKey: env.INTERNAL_API_KEY,
    service: "heavy",
    version: env.SERVICE_VERSION,
    meta: { slug: "overseer" }
  }).catch(() => null);

  if (env.GATEWAY_URL && env.INTERNAL_API_KEY) {
    setInterval(() => {
      gatewayHeartbeat({
        gatewayUrl: env.GATEWAY_URL.replace(/\/$/, ""),
        internalKey: env.INTERNAL_API_KEY,
        service: "heavy"
      }).catch(() => null);
    }, 30_000);
  }

  // Start job loop only if Relay integration configured
  if (env.RELAY_PUBLIC_URL && env.RELAY_SECRET) {
    await runOnce().catch(() => null);
    setInterval(() => runOnce().catch(() => null), 10_000);
  } else {
    console.log("[overseer] relay integration not configured (RELAY_PUBLIC_URL/RELAY_SECRET)");
  }
})();
