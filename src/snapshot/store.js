import { getDb } from "../db/mongo.js";
import { env } from "../env.js";
import { computeDiff } from "../diff/engine.js";

export async function saveSnapshot(snapshot) {
  const db = await getDb();
  const snapshots = db.collection("guild_snapshots");
  const diffs = db.collection("guild_diffs");

  const guildId = snapshot?.guild?.id ?? env.GUILD_ID ?? null;
  const takenAt = snapshot?.takenAt ?? new Date().toISOString();

  // Fetch previous snapshot BEFORE insert (so we can diff after insert)
  const previous = await snapshots
    .find({ guildId })
    .sort({ takenAt: -1 })
    .limit(1)
    .next();

  const doc = { guildId, takenAt, snapshot };
  const result = await snapshots.insertOne(doc);
  const current = { ...doc, _id: result.insertedId };

  if (previous) {
    const diff = computeDiff(previous, current);
    await diffs.insertOne(diff);
  }

  return current;
}

export async function getLatestSnapshot(guildId) {
  const db = await getDb();
  const col = db.collection("guild_snapshots");
  const doc = await col
    .find({ guildId })
    .sort({ takenAt: -1 })
    .limit(1)
    .next();
  return doc ?? null;
}
