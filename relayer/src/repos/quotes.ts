import { Collection, ObjectId } from "mongodb";
import { getDb } from "../db/mongo";

export type QuoteRecord = {
  _id?: ObjectId;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
  fromChainAmount: string;
  quoteId?: string;        // optional external id if you add later
  status?: string;         // e.g., "created"
  createdAt?: Date;
  updatedAt?: Date;
};

async function getQuotesCollection(): Promise<Collection<QuoteRecord>> {
  const db = await getDb();
  const col = db.collection<QuoteRecord>("quotes");
  return col;
}

// Call once somewhere during startup if you want the index guaranteed.
// Safe to call multiple times; Mongo will no-op if exists.
export async function ensureQuoteIndexes(): Promise<void> {
  const col = await getQuotesCollection();
  await col.createIndexes([
    { key: { createdAt: -1 }, name: "createdAt_desc" },
  ]);
}

export async function createQuote(doc: Omit<QuoteRecord, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
  const col = await getQuotesCollection();
  const now = new Date();
  const res = await col.insertOne({
    ...doc,
    status: doc.status ?? "created",
    createdAt: now,
    updatedAt: now,
  });
  return res.insertedId;
}
