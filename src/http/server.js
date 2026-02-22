import http from "node:http";
import { URL } from "node:url";
import { env } from "../env.js";
import { getLatestSnapshot } from "../snapshot/store.js";
import { getLatestDiff } from "../diff/engine.js";

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function text(res, status, body) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

function secretOk(req) {
  if (!env.OVERSEER_SECRET) return true; // if unset, endpoints are open
  const header = req.headers["x-overseer-secret"];
  return typeof header === "string" && header === env.OVERSEER_SECRET;
}

export function startHttpServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      if (u.pathname === "/" || u.pathname === "/healthz" || u.pathname === "/health") {
        return json(res, 200, {
          ok: true,
          service: "overseer",
          version: env.SERVICE_VERSION,
          ts: new Date().toISOString()
        });
      }

      if (u.pathname === "/api/snapshot/latest" && req.method === "GET") {
        if (!secretOk(req)) return json(res, 401, { ok: false, error: "UNAUTHORIZED" });
        const guildId = u.searchParams.get("guildId") || env.GUILD_ID;
        if (!guildId) return json(res, 400, { ok: false, error: "BAD_REQUEST", detail: "missing guildId" });

        const snap = await getLatestSnapshot(guildId);
        if (!snap) return json(res, 404, { ok: false, error: "NOT_FOUND" });
        return json(res, 200, { ok: true, snapshot: snap });
      }

      if (u.pathname === "/api/diff/latest" && req.method === "GET") {
        if (!secretOk(req)) return json(res, 401, { ok: false, error: "UNAUTHORIZED" });
        const guildId = u.searchParams.get("guildId") || env.GUILD_ID;
        if (!guildId) return json(res, 400, { ok: false, error: "BAD_REQUEST", detail: "missing guildId" });

        const diff = await getLatestDiff(guildId);
        if (!diff) return json(res, 404, { ok: false, error: "NOT_FOUND" });
        return json(res, 200, { ok: true, diff });
      }

      return text(res, 404, "not found");
    } catch (e) {
      return json(res, 500, { ok: false, error: "INTERNAL_ERROR", detail: String(e?.message || e) });
    }
  });

  server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[overseer] http listening on :${env.PORT}`);
  });

  return server;
}
