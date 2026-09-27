import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { configureSockets } from './sockets/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import ServiceCategory from './models/ServiceCategory.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const categories = [
  ['AC Repair', 'ac-repair', 'Heating and cooling, kept comfortable.', '❄️'],
  ['Plumbing', 'plumbing', 'Leaky taps, drains, and pipe repairs.', '🔧'],
  ['Electrical', 'electrical', 'Safe wiring, fixtures, and troubleshooting.', '⚡'],
  ['Cleaning', 'cleaning', 'A little reset for your home.', '🧹'],
  ['Appliance Repair', 'appliance-repair', 'Repairs for the machines you count on.', '🧺'],
  ['Painting', 'painting', 'Fresh color and careful finishing.', '🎨'],
  ['Computer & Laptop', 'computer-laptop', 'Computer tune-ups and device repairs.', '💻'],
  ['Home Maintenance', 'home-maintenance', 'Small fixes that keep things running.', '🏠']
];

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random string with at least 32 characters in .env.');
  await connectDB();
  await ServiceCategory.bulkWrite(categories.map(([name, slug, description, icon]) => ({ updateOne: { filter: { slug }, update: { $setOnInsert: { name, slug, description, icon } }, upsert: true } })));
  const app = express();
  const server = http.createServer(app);
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  const allowedOrigins = (process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173').split(',').map(value => value.trim());
  const isAllowedOrigin = origin => !origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin));
  const io = new SocketServer(server, { cors: { origin(origin, callback) { callback(isAllowedOrigin(origin) ? null : new Error('Origin is not allowed by CORS'), isAllowedOrigin(origin)); }, credentials: true }, transports: ['websocket', 'polling'] });
  configureSockets(io);

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: { directives: { styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'", ...allowedOrigins.map(origin => origin.replace(/^http/, 'ws'))] } } }));
  app.use(cors({ origin(origin, callback) { callback(isAllowedOrigin(origin) ? null : new Error('Origin is not allowed by CORS'), isAllowedOrigin(origin)); }, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(mongoSanitize());
  if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(dirname, 'uploads'));
  app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many sign-in attempts. Please try again later.' } }));
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api', routes);
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(projectRoot, 'client', 'dist');
    app.use(express.static(clientDist, { maxAge: '1d', index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(path.join(clientDist, 'index.html'), error => { if (error) next(error); });
    });
  }
  app.use(notFound);
  app.use(errorHandler);

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, '0.0.0.0', () => console.log(`QuickFix API + Socket.IO listening on port ${port}`));
  const stop = signal => { console.log(`${signal} received, shutting down QuickFix`); io.close(); server.close(() => process.exit(0)); };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
}

start().catch(error => {
  console.error(error.message);
  if (error.cause) console.error(error.cause.message);
  process.exit(1);
});
