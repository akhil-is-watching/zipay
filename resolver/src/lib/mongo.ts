import { Collection, Db, MongoClient } from 'mongodb';
import { QuoteDocument } from '../types/quote';
import { SecretDocument } from '../types/secret';
import { SwapDocument } from '../types/quote';

const defaultUri = 'mongodb://localhost:27017/zipay';
const uri = process.env.MONGODB_URI ?? defaultUri;
const dbName = process.env.MONGODB_DB ?? 'zipay';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect().then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    });
  }

  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const mongoClient = await getClient();
  return mongoClient.db(dbName);
}

export async function getQuotesCollection(): Promise<Collection<QuoteDocument>> {
  const db = await getDatabase();
  return db.collection<QuoteDocument>('quotes');
}

export async function getSecretsCollection(): Promise<Collection<SecretDocument>> {
  const db = await getDatabase();
  return db.collection<SecretDocument>('secrets');
}

export async function getSwapsCollection(): Promise<Collection<SwapDocument>> {
  const db = await getDatabase();
  return db.collection<SwapDocument>('swaps');
}
