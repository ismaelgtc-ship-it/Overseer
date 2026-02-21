/**
 * Free/local assistant stub.
 * This is intentionally offline: no paid APIs, no keys.
 *
 * Later you can swap internals to an OSS local runner without changing call sites.
 */
export function suggestNextJob(_context) {
  return {
    ok: true,
    suggestion: "noop",
    reason: "skeleton"
  };
}
