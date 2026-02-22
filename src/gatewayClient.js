import { fetch } from "undici";

export async function gatewayRegister({ gatewayUrl, internalKey, version, meta } = {}) {
  if (!gatewayUrl || !internalKey) return false;

  const url = `${gatewayUrl.replace(/\/$/, "")}/internal/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-key": internalKey
    },
    body: JSON.stringify({ service: "heavy", version, meta })
  });

  return res.ok;
}

export async function gatewayHeartbeat({ gatewayUrl, internalKey } = {}) {
  if (!gatewayUrl || !internalKey) return false;

  const url = `${gatewayUrl.replace(/\/$/, "")}/internal/heartbeat`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-key": internalKey
    },
    body: JSON.stringify({ service: "heavy" })
  });

  return res.ok;
}
