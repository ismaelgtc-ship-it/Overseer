import { suggestNextJob } from "../ai/assistant.js";

export async function runOnce() {
  // Placeholder job loop (Phase 1).
  const s = suggestNextJob({});
  if (s.suggestion !== "noop") {
    // eslint-disable-next-line no-console
    console.log("[overseer] suggested job:", s);
  }
}
