// Diff Engine (stable) - exports computeDiff + computeGuildDiff alias
// Produces a compact diff between two snapshot docs.

function toMap(list, keyFn) {
  const m = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const k = keyFn(item);
    if (k != null) m.set(k, item);
  }
  return m;
}

function stableJson(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export function computeDiff(prevDoc, currDoc) {
  const prevSnap = prevDoc?.snapshot ?? null;
  const currSnap = currDoc?.snapshot ?? null;

  const prevGuild = prevSnap?.guild ?? prevSnap?.data?.guild ?? null;
  const currGuild = currSnap?.guild ?? currSnap?.data?.guild ?? null;

  const guildId =
    currDoc?.guildId ??
    currGuild?.id ??
    prevDoc?.guildId ??
    prevGuild?.id ??
    null;

  const diff = {
    guildId,
    from: prevDoc?._id ?? null,
    to: currDoc?._id ?? null,
    takenAt: new Date().toISOString(),
    roles: { created: [], deleted: [], updated: [] },
    channels: { created: [], deleted: [], updated: [] }
  };

  const prevRoles = toMap(prevGuild?.roles, (r) => r?.id);
  const currRoles = toMap(currGuild?.roles, (r) => r?.id);

  for (const [id, role] of currRoles) {
    if (!prevRoles.has(id)) { diff.roles.created.push(role); continue; }
    const before = prevRoles.get(id);
    const changed =
      before?.name !== role?.name ||
      before?.position !== role?.position ||
      String(before?.permissions) !== String(role?.permissions) ||
      before?.color !== role?.color ||
      before?.hoist !== role?.hoist ||
      before?.mentionable !== role?.mentionable;

    if (changed) diff.roles.updated.push({ before, after: role });
  }
  for (const [id, role] of prevRoles) {
    if (!currRoles.has(id)) diff.roles.deleted.push(role);
  }

  const prevCh = toMap(prevGuild?.channels, (c) => c?.id);
  const currCh = toMap(currGuild?.channels, (c) => c?.id);

  for (const [id, ch] of currCh) {
    if (!prevCh.has(id)) { diff.channels.created.push(ch); continue; }
    const before = prevCh.get(id);
    const changed =
      before?.name !== ch?.name ||
      before?.type !== ch?.type ||
      before?.position !== ch?.position ||
      before?.parentId !== ch?.parentId ||
      stableJson(before?.permissionOverwrites) !== stableJson(ch?.permissionOverwrites);

    if (changed) diff.channels.updated.push({ before, after: ch });
  }
  for (const [id, ch] of prevCh) {
    if (!currCh.has(id)) diff.channels.deleted.push(ch);
  }

  diff.summary = {
    roles: {
      created: diff.roles.created.length,
      deleted: diff.roles.deleted.length,
      updated: diff.roles.updated.length
    },
    channels: {
      created: diff.channels.created.length,
      deleted: diff.channels.deleted.length,
      updated: diff.channels.updated.length
    }
  };

  return diff;
}

// Back-compat alias
export const computeGuildDiff = computeDiff;

// Storage helper (Overseer) — latest diff
export async function getLatestDiff(guildId) {
  const { getDb } = await import("../db/mongo.js");
  const db = await getDb();
  const col = db.collection("guild_diffs");
  const doc = await col
    .find({ guildId })
    .sort({ takenAt: -1 })
    .limit(1)
    .next();
  return doc ?? null;
}
