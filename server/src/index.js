import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import rideRoutes from './routes/rides.js';
import bookingRoutes from './routes/booking.js';
import paymentRoutes from './routes/payment.js';
import aiChatRoutes from './routes/aiChatSimple.js';
import initSockets from './socket.js';

// Load environment variables from .env file
dotenv.config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-secret-key-change-in-production';
  console.log('Using default JWT_SECRET for development');
}

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET','POST'] }
});

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Expose io to routes
app.set('io', io);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiChatRoutes);

// Sockets
initSockets(io);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => console.log(`Server running on :${PORT}`));
}

start().catch((e) => {
  console.error('Startup error', e);
  process.exit(1);
});
