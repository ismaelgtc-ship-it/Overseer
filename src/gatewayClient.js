import { request } from "undici";

export async function gatewayRegister({ gatewayUrl, internalKey, service, version, meta }) {
  if (!gatewayUrl || !internalKey) return;
  await request(`${gatewayUrl}/internal/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Internal-Key": internalKey
    },
    body: JSON.stringify({ service, version, meta })
  });
}

export async function gatewayHeartbeat({ gatewayUrl, internalKey, service }) {
  if (!gatewayUrl || !internalKey) return;
  await request(`${gatewayUrl}/internal/heartbeat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Internal-Key": internalKey
    },
    body: JSON.stringify({ service })
  });
}
