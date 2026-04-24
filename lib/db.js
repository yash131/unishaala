import { MongoClient, GridFSBucket } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'unishaala';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

/**
 * Return a GridFSBucket for storing large binary files (e.g. PDFs).
 * Bucket name defaults to 'pdfs' (chunks + files collections: pdfs.chunks / pdfs.files)
 */
export async function getPdfBucket(bucketName = 'pdfs') {
  const { db } = await connectToDatabase();
  return new GridFSBucket(db, { bucketName });
}
