import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let db;

export async function getDb() {
  if (db) return db;
  const uri = env.MONGO_URI || env.MONGODB_URI_HEAVY;
  if (!uri) throw new Error("Missing env: MONGO_URI (or MONGODB_URI_HEAVY)");

  client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();
  db = client.db();
  return db;
}

export async function closeDb() {
  try {
    await client?.close();
  } finally {
    client = undefined;
    db = undefined;
  }
}
