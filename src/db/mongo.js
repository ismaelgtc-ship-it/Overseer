import { MongoClient } from "mongodb";
import { env } from "../env.js";

let clientPromise = null;

function getUri() {
  return env.MONGO_URI || env.MONGODB_URI_HEAVY || "";
}

export async function getMongoClient() {
  const uri = getUri();
  if (!uri) throw new Error("MONGO_URI missing");
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5
    });
    clientPromise = client.connect();
  }
  return await clientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  // Default DB from URI path; fallback to 'devilwolf'
  const uri = getUri();
  const m = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
  const dbName = (m && m[1] && m[1] !== "") ? decodeURIComponent(m[1]) : "devilwolf";
  return client.db(dbName);
}
