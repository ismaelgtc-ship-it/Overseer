import { env } from "../env.js";
import { saveSnapshot } from "./store.js";

export async function pullSnapshotFromRelay() {
  if (!env.RELAY_PUBLIC_URL) throw new Error("RELAY_PUBLIC_URL missing");
  if (!env.RELAY_SECRET) throw new Error("RELAY_SECRET missing");

  const r = await fetch(`${env.RELAY_PUBLIC_URL}/internal/snapshot`, {
    method: "GET",
    headers: {
      "x-relay-secret": env.RELAY_SECRET
    }
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Relay snapshot failed: ${r.status} ${t}`);
  }

  const data = await r.json();
  if (!data?.snapshot) throw new Error("Relay response missing snapshot");

  await saveSnapshot(data.snapshot);
  return data.snapshot;
}
