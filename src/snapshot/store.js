import { getDb } from "../db/mongo.js";
import { env } from "../env.js";

export async function saveSnapshot(snapshot) {
  const db = await getDb();
  const col = db.collection("guild_snapshots");

  const doc = {
    guildId: snapshot?.guild?.id ?? env.GUILD_ID ?? null,
    takenAt: snapshot?.takenAt ?? new Date().toISOString(),
    snapshot
  };

  await col.insertOne(doc);
  return doc;
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
