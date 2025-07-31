import { MongoClient } from "mongodb";

//Load the connection string from environment variables
const uri = process.env.MONGO_URI!;

//create a global Mongo connection to reuse throughout the api
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

//check for uri env variable
if (!process.env.MONGO_URI) {
  throw new Error("❌ Please add your Mongo URI to .env.local");
}

/* for our dev environment. Nextjs hot reloads a bunch so we want to cache our mongoDB 
connection to node global as custom variable */

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  // if this property doesnt exist we create a new client connection
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  //reassign our client Promise to the global for development
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  //otherwise, connect as normal
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Export the promise. Any API route can `await clientPromise`
// to get an active MongoDB client.
export default clientPromise;
