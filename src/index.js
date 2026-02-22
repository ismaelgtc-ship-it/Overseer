import http from "node:http";

const PORT = Number(process.env.PORT ?? 10000);

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";

  if (url === "/" || url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "overseer" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "not_found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[overseer] health server listening on :${PORT}`);
});
