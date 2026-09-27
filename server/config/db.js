import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required. Set it in the root .env or hosting environment.');
  const databaseName = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?#]+)/i)?.[1];
  if (databaseName !== 'quickfix') throw new Error('MONGO_URI must point to the quickfix database.');
  const isLocal = /^mongodb:\/\/(?:[^@/]+@)?(?:127\.0\.0\.1|localhost)(?::\d+)?\/quickfix(?:\?|$)/i.test(uri);
  if (!isLocal && process.env.NODE_ENV !== 'production') throw new Error('Remote MongoDB is only enabled when NODE_ENV=production. Local development uses mongodb://127.0.0.1:27017/quickfix.');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    const wrapped = new Error('MongoDB connection failed. Check MONGO_URI, the database user, and the host IP access list.');
    wrapped.cause = error;
    throw wrapped;
  }
}
