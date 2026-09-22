import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import bookingsRouter from './routes/bookings.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: "C'Archery API", database: process.env.DATABASE_URL ? 'postgresql' : 'development-memory-fallback' }));
app.use('/api/auth', authRouter);
app.use('/api', catalogRouter);
app.use('/api/bookings', bookingsRouter);
app.use((error, _req, res, _next) => {
	if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Request body must be valid JSON' });
	console.error(error);
	res.status(500).json({ message: 'Unexpected server error' });
});
export default app;
