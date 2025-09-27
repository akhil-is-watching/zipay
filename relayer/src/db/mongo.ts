import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

const URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB || 'zipay'; // optional; falls back to DB in URI

if (!URI) {
  throw new Error("MONGODB_URI is not set");
}

export async function getClient(): Promise<MongoClient> {
  if (client && client.db()) return client;
  client = new MongoClient(URI, {});
  await client.connect();
  return client;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  const c = await getClient();
  // if DB_NAME not set, this uses the database embedded in the URI
  db = DB_NAME ? c.db(DB_NAME) : c.db();
  return db;
}

// Optional: clean shutdown
export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
