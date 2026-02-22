
import http from "node:http";

export function startHttpServer({ port = 10000, name = "overseer" } = {}) {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: name }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  });

  server.listen(port, () => {
    console.log(`[${name}] health server listening on :${port}`);
  });

  return server;
}
