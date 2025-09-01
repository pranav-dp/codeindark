import { MongoClient, ObjectId } from 'mongodb'

if (!process.env.MONGODB_CONNECTION_URI) {
  throw new Error('Please add your MongoDB URI to .env')
}

const uri = process.env.MONGODB_CONNECTION_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function getDb() {
  const client = await clientPromise
  return client.db('code')
}

// Helper function to find user by ID (handles both ObjectId and string)
export async function findUserById(userId: string) {
  const db = await getDb()
  try {
    // Try as ObjectId first
    if (ObjectId.isValid(userId)) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
      if (user) return user
    }
    // Fallback to string
    return await db.collection('users').findOne({ _id: userId as any })
  } catch {
    return await db.collection('users').findOne({ _id: userId as any })
  }
}
