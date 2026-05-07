import mongoose from 'mongoose';

export default async function connectDB() {
  // Try environment variable first, then fallback to local MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/carpool';
  if (!uri) throw new Error('MONGODB_URI not set');
  mongoose.set('strictQuery', true);
  
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'carpool' });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // For development, continue without database
    console.log('Continuing without database connection...');
  }
}
