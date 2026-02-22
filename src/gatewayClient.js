import { createServer } from "node:http";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
if (!INTERNAL_KEY) {
  console.error("[overseer] INTERNAL_API_KEY missing");
}

export function startGateway() {
  const server = createServer((req, res) => {
    const key = req.headers["x-internal-key"];

    if (key !== INTERNAL_KEY) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    if (req.url === "/register") {
      res.writeHead(200);
      res.end("registered");
      return;
    }

    if (req.url === "/heartbeat") {
      res.writeHead(200);
      res.end("ok");
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });

  const port = process.env.PORT || 10000;
  server.listen(port, () => {
    console.log(`[overseer] gateway listening on ${port}`);
  });
}
