import { Client, GatewayIntentBits } from "discord.js";
import http from "node:http";

const PORT = Number(process.env.PORT ?? 10000);
const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? "";

// Health server (Render free necesita listener HTTP)
const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/" || url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "relay" }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "not_found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[relay] health server listening on :${PORT}`);
});

// Si no hay token, NO caemos: dejamos el servicio vivo (y visible en logs)
if (!DISCORD_TOKEN || DISCORD_TOKEN.trim().length < 20) {
  console.error("[relay] DISCORD_TOKEN missing/invalid. Bot login skipped; service stays alive for health checks.");
} else {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("clientReady", () => {
    console.log(`[relay] logged in as ${client.user?.tag ?? "unknown"}`);
  });

  client.login(DISCORD_TOKEN).catch((err) => {
    console.error("[relay] login failed:", err?.message ?? err);
    // No reventamos el proceso; mantenemos health server vivo
  });
}
