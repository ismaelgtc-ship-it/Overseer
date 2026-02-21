import { env } from "../env.js";
import { suggestNextJob } from "../ai/assistant.js";
import { pullSnapshotFromRelay } from "../snapshot/pull.js";

let lastPullAt = 0;

export async function runOnce() {
  // Snapshot pull (Phase 1 clone engine)
  if (env.MONGO_URI || env.MONGODB_URI_HEAVY) {
    const now = Date.now();
    if (env.GUILD_ID && env.RELAY_PUBLIC_URL && env.RELAY_SECRET && now - lastPullAt > 60_000) {
      lastPullAt = now;
      try {
        const snap = await pullSnapshotFromRelay();
        // eslint-disable-next-line no-console
        console.log("[overseer] snapshot saved", { guildId: snap.guild?.id, takenAt: snap.takenAt });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[overseer] snapshot pull error", e);
      }
    }
  }

  // AI placeholder job loop (kept)
  const s = suggestNextJob({});
  if (s.suggestion !== "noop") {
    // eslint-disable-next-line no-console
    console.log("[overseer] suggested job:", s);
  }
}
