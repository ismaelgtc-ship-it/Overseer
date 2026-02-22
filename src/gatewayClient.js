import { fetch } from "undici";

const GATEWAY_URL = process.env.GATEWAY_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

async function post(path) {
  if (!GATEWAY_URL || !INTERNAL_API_KEY) return;

  const url = `${GATEWAY_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-internal-key": INTERNAL_API_KEY
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gateway ${path} failed: ${res.status} ${body}`);
  }
}

export async function gatewayRegister() {
  await post("/register");
}

export async function gatewayHeartbeat() {
  await post("/heartbeat");
}
