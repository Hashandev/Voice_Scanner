import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import transactionRoutes from './routes/transactions.js';

// Force Node to use IPv4 first to avoid IPv6 connection timeout issues on Windows
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VoiceLedger API is running' });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceledger', {
      serverSelectionTimeoutMS: 2000
    });
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 VoiceLedger server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Starting server without MongoDB...');
    console.log('💡 Make sure MongoDB is running: mongod --dbpath <your-data-path>');

    app.listen(PORT, () => {
      console.log(`🚀 VoiceLedger server running on http://localhost:${PORT} (without DB)`);
    });
  }
};

startServer();
