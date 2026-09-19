import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { connectDatabase, disconnectDatabase, prisma } from './src/db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'carchery-development-secret';
app.use(cors());
app.use(express.json());

const bows = [
  { id: 'compound', name: 'Compound bow', price: 75000, description: 'Stabil, presisi, dan ringan untuk pemanah yang ingin membidik jarak jauh.', level: 'Intermediate' },
  { id: 'recurve', name: 'Recurve bow', price: 55000, description: 'Busur klasik dengan tarikan yang halus, cocok untuk belajar teknik dasar.', level: 'Beginner' },
  { id: 'traditional', name: 'Traditional bow', price: 45000, description: 'Pengalaman memanah yang autentik dengan desain kayu yang berkarakter.', level: 'All levels' }
];
const venues = [
  { id: 'indoor', name: 'Indoor range', label: 'INDOOR', description: 'Fokus tanpa gangguan cuaca', distance: '18m', price: 125000, accent: 'sand', lanes: Array.from({ length: 5 }, (_, i) => ({ id: `I${i + 1}`, name: `Lane ${String(i + 1).padStart(2, '0')}` })) },
  { id: 'outdoor', name: 'Outdoor range', label: 'OUTDOOR', description: 'Bidikan lapang dengan udara segar', distance: '30m', price: 150000, accent: 'sky', lanes: Array.from({ length: 5 }, (_, i) => ({ id: `O${i + 1}`, name: `Lane ${String(i + 1).padStart(2, '0')}` })) }
];
const users = [{ id: 'usr-demo', name: 'Alya Pratama', email: 'alya@carchery.id', role: 'user', password: bcrypt.hashSync('password', 10) }, { id: 'usr-admin', name: 'C\'Archery Admin', email: 'admin@carchery.id', role: 'admin', password: bcrypt.hashSync('password', 10) }];
const bookings = [
  { id: 'BK-24091', userId: 'usr-demo', venueId: 'outdoor', laneId: 'O2', date: '2026-09-24', time: '16:00', duration: 2, bowId: 'recurve', bringOwnBow: false, status: 'confirmed', total: 355000, createdAt: '2026-09-18' },
  { id: 'BK-24070', userId: 'usr-demo', venueId: 'indoor', laneId: 'I4', date: '2026-09-19', time: '10:00', duration: 1, bowId: null, bringOwnBow: true, status: 'completed', total: 125000, createdAt: '2026-09-12' }
];

const publicUser = ({ password, ...user }) => user;
const tokenFor = user => jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
const auth = (req, res, next) => { const header = req.headers.authorization; if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' }); try { req.user = jwt.verify(header.slice(7), JWT_SECRET); next(); } catch { res.status(401).json({ message: 'Session expired' }); } };
const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission to perform this action' });
const requireFields = (...fields) => (req, res, next) => fields.every(field => req.body[field] !== undefined && req.body[field] !== '') ? next() : res.status(400).json({ message: `Required fields: ${fields.join(', ')}` });
const findVenue = id => venues.find(venue => venue.id === id);

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'C\'Archery API', database: prisma ? 'configured' : 'development-memory-fallback' }));
app.get('/api/venues', (_, res) => res.json(venues));
app.post('/api/venues', auth, requireRole('admin'), requireFields('id', 'name', 'description', 'price'), (req, res) => { if (venues.some(item => item.id === req.body.id)) return res.status(409).json({ message: 'Venue id already exists' }); const venue = { ...req.body, price: Number(req.body.price), lanes: Array.from({ length: 5 }, (_, i) => ({ id: `${req.body.id[0].toUpperCase()}${i + 1}`, name: `Lane ${String(i + 1).padStart(2, '0')}` })) }; venues.push(venue); res.status(201).json(venue); });
app.patch('/api/venues/:id', auth, requireRole('admin'), (req, res) => { const venue = findVenue(req.params.id); if (!venue) return res.status(404).json({ message: 'Venue not found' }); Object.assign(venue, req.body, { price: req.body.price === undefined ? venue.price : Number(req.body.price) }); res.json(venue); });
app.delete('/api/venues/:id', auth, requireRole('admin'), (req, res) => { const index = venues.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ message: 'Venue not found' }); venues.splice(index, 1); res.status(204).send(); });
app.get('/api/bows', (_, res) => res.json(bows));
app.post('/api/bows', auth, requireRole('admin'), requireFields('id', 'name', 'description', 'price'), (req, res) => { if (bows.some(item => item.id === req.body.id)) return res.status(409).json({ message: 'Bow id already exists' }); const bow = { ...req.body, price: Number(req.body.price) }; bows.push(bow); res.status(201).json(bow); });
app.patch('/api/bows/:id', auth, requireRole('admin'), (req, res) => { const bow = bows.find(item => item.id === req.params.id); if (!bow) return res.status(404).json({ message: 'Bow not found' }); Object.assign(bow, req.body, { price: req.body.price === undefined ? bow.price : Number(req.body.price) }); res.json(bow); });
app.delete('/api/bows/:id', auth, requireRole('admin'), (req, res) => { const index = bows.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ message: 'Bow not found' }); bows.splice(index, 1); res.status(204).send(); });
app.get('/api/weather', (_, res) => res.json({ location: 'Cimahi, Jawa Barat', temperature: 24, condition: 'Partly cloudy', rainChance: 18, wind: 12, updatedAt: new Date().toISOString() }));
app.get('/api/availability', (req, res) => { const { date, venueId } = req.query; const venue = findVenue(venueId || 'outdoor'); if (!venue) return res.status(404).json({ message: 'Venue not found' }); const reserved = bookings.filter(item => item.date === date && item.venueId === venue.id && item.status !== 'cancelled').map(item => item.laneId); res.json({ date, venueId: venue.id, reserved, lanes: venue.lanes }); });

app.post('/api/auth/register', async (req, res) => { const { name, email, password } = req.body; if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email, and password (min. 6 characters) are required' }); if (users.some(user => user.email === email.toLowerCase())) return res.status(409).json({ message: 'Email already registered' }); const user = { id: randomUUID(), name, email: email.toLowerCase(), role: 'user', password: await bcrypt.hash(password, 10) }; users.push(user); res.status(201).json({ user: publicUser(user), token: tokenFor(user) }); });
app.post('/api/auth/login', async (req, res) => { const user = users.find(item => item.email === req.body.email?.toLowerCase()); if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Email or password is incorrect' }); res.json({ user: publicUser(user), token: tokenFor(user) }); });
app.get('/api/me', auth, (req, res) => { const user = users.find(item => item.id === req.user.id); res.json(publicUser(user)); });

app.get('/api/bookings', auth, (req, res) => { const list = bookings.filter(item => req.user.role === 'admin' || item.userId === req.user.id).map(item => ({ ...item, venue: findVenue(item.venueId), bow: bows.find(bow => bow.id === item.bowId) || null, user: users.find(user => user.id === item.userId)?.name })); res.json(list); });
app.post('/api/bookings', auth, requireFields('venueId', 'laneId', 'date', 'time'), (req, res) => { const { venueId, laneId, date, time, duration = 1, bowId, bringOwnBow = true } = req.body; const venue = findVenue(venueId); if (!venue) return res.status(400).json({ message: 'Venue not found' }); if (!venue.lanes.some(lane => lane.id === laneId)) return res.status(400).json({ message: 'Invalid lane' }); if (![1, 2, 3].includes(Number(duration))) return res.status(400).json({ message: 'Duration must be between 1 and 3 hours' }); if (bookings.some(item => item.date === date && item.time === time && item.laneId === laneId && item.status !== 'cancelled')) return res.status(409).json({ message: 'That lane is already booked for this time' }); if (!bringOwnBow && !bows.some(bow => bow.id === bowId)) return res.status(400).json({ message: 'Choose a rental bow or bring your own' }); const total = venue.price * Number(duration) + (!bringOwnBow ? bows.find(bow => bow.id === bowId).price : 0); const booking = { id: `BK-${Math.floor(10000 + Math.random() * 89999)}`, userId: req.user.id, venueId, laneId, date, time, duration: Number(duration), bowId: bringOwnBow ? null : bowId, bringOwnBow, status: 'confirmed', total, createdAt: new Date().toISOString().slice(0, 10) }; bookings.unshift(booking); res.status(201).json(booking); });
app.patch('/api/bookings/:id', auth, (req, res) => { const booking = bookings.find(item => item.id === req.params.id && (item.userId === req.user.id || req.user.role === 'admin')); if (!booking) return res.status(404).json({ message: 'Booking not found' }); if (booking.status !== 'confirmed') return res.status(409).json({ message: 'Only confirmed bookings can be rescheduled' }); const nextDate = req.body.date || booking.date; const nextTime = req.body.time || booking.time; const nextLane = req.body.laneId || booking.laneId; if (bookings.some(item => item.id !== booking.id && item.date === nextDate && item.time === nextTime && item.laneId === nextLane && item.status !== 'cancelled')) return res.status(409).json({ message: 'That lane is already booked for this time' }); Object.assign(booking, { date: nextDate, time: nextTime, laneId: nextLane }); res.json(booking); });
app.patch('/api/bookings/:id/cancel', auth, (req, res) => { const booking = bookings.find(item => item.id === req.params.id && (item.userId === req.user.id || req.user.role === 'admin')); if (!booking) return res.status(404).json({ message: 'Booking not found' }); booking.status = 'cancelled'; res.json(booking); });
app.delete('/api/bookings/:id', auth, requireRole('admin'), (req, res) => { const index = bookings.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ message: 'Booking not found' }); bookings.splice(index, 1); res.status(204).send(); });

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: 'Unexpected server error' }); });

const server = app.listen(PORT, async () => { try { const database = await connectDatabase(); console.log(`C'Archery API running at http://localhost:${PORT} (${database.connected ? 'database connected' : 'development fallback'})`); } catch (error) { console.error('Database connection failed:', error.message); process.exitCode = 1; } });
process.on('SIGTERM', async () => { await disconnectDatabase(); server.close(); });
