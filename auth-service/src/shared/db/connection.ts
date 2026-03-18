import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Types
interface DatabaseConfig {
  uri?: string;
  dbName?: string;
  useInMemory?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// Database Connection Singleton
let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;

// Connect to MongoDB with Retry Logic
export async function connectDatabase(config: DatabaseConfig = {}): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const maxRetries = config.maxRetries ?? 5;
  const retryDelay = config.retryDelay ?? 5000;
  let mongoUri: string;

  // Use in-memory MongoDB if no URI provided or explicitly requested
  if (config.useInMemory || !config.uri) {
    console.log('📦 No MONGODB_URI provided, starting in-memory MongoDB server...');
    
    try {
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.3',
        },
      });
      
      mongoUri = mongoServer.getUri();
      console.log('✅ In-memory MongoDB started');
    } catch (error) {
      console.error('❌ Failed to start in-memory MongoDB:', error);
      throw error;
    }
  } else {
    mongoUri = config.uri;
    console.log(`🔌 Connecting to MongoDB: ${mongoUri}`);
  }

  // Retry connection logic
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Connection attempt ${attempt}/${maxRetries}...`);
      
      await mongoose.connect(mongoUri, {
        dbName: config.dbName || 'bookworm',
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      });
      
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Log connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        isConnected = false;
      });

      return mongoose;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Connection attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(`❌ Failed to connect after ${maxRetries} attempts`);
  throw lastError || new Error('Failed to connect to MongoDB');
}

// Disconnect from MongoDB
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
  
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
    console.log('📦 In-memory MongoDB stopped');
  }
  
  isConnected = false;
}

// Get Connection Status
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// Clear Database (for testing)
export async function clearDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  console.log('🗑️ Database cleared');
}

// Export mongoose
export { mongoose };
