//lib\mongodb.ts
import mongoose from 'mongoose';

// Definir interfaces para errores de MongoDB
interface MongoServerError extends Error {
  code: number;
  codeName: string;
}

interface MongoNetworkError extends Error {
  // Propiedades específicas de MongoNetworkError si las hay
}

// Aseguramos que MONGODB_URI sea string o lanzamos error
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function connectToDatabase() {
  try {
    // Usamos el operador ! para indicar a TypeScript que MONGODB_URI no es undefined
    const conn = await mongoose.connect(MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: unknown) {
    console.error('MongoDB connection error:', error);
    
    // Verificar tipos de error específicos
    if (error instanceof Error) {
      if (
        error.name === 'MongoServerError' && 
        'code' in error && 
        (error as MongoServerError).code === 18
      ) {
        console.error('Authentication failed. Please check your username and password.');
      } else if (error.name === 'MongoNetworkError') {
        console.error('Network error. Please check if the MongoDB server is running and accessible.');
      }
    }
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
}

export default connectToDatabase;
