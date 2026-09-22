import { Router } from 'express';
import { auth, requireFields, requireRole } from '../middleware.js';
import { createBow, createVenue, deleteBow, deleteVenue, findBow, findVenue, listBows, listVenues, updateBow, updateVenue } from '../store.js';

const router = Router();
const handleNotFound = (res, item, label) => item || res.status(404).json({ message: `${label} not found` });

router.get('/venues', async (_req, res) => res.json(await listVenues()));
router.post('/venues', auth, requireRole('ADMIN'), requireFields('id', 'name', 'description', 'price'), async (req, res) => { if (await findVenue(req.body.id)) return res.status(409).json({ message: 'Venue id already exists' }); res.status(201).json(await createVenue(req.body)); });
router.patch('/venues/:id', auth, requireRole('ADMIN'), async (req, res) => { const venue = await findVenue(req.params.id); if (!handleNotFound(res, venue, 'Venue')) return; res.json(await updateVenue(req.params.id, req.body)); });
router.delete('/venues/:id', auth, requireRole('ADMIN'), async (req, res) => { if (!await findVenue(req.params.id)) return res.status(404).json({ message: 'Venue not found' }); await deleteVenue(req.params.id); res.status(204).send(); });

router.get('/bows', async (_req, res) => res.json(await listBows()));
router.post('/bows', auth, requireRole('ADMIN'), requireFields('id', 'name', 'description', 'price'), async (req, res) => { if (await findBow(req.body.id)) return res.status(409).json({ message: 'Bow id already exists' }); res.status(201).json(await createBow(req.body)); });
router.patch('/bows/:id', auth, requireRole('ADMIN'), async (req, res) => { if (!await findBow(req.params.id)) return res.status(404).json({ message: 'Bow not found' }); res.json(await updateBow(req.params.id, req.body)); });
router.delete('/bows/:id', auth, requireRole('ADMIN'), async (req, res) => { if (!await findBow(req.params.id)) return res.status(404).json({ message: 'Bow not found' }); await deleteBow(req.params.id); res.status(204).send(); });

router.get('/weather', (_req, res) => res.json({ location: 'Cimahi, Jawa Barat', temperature: 24, condition: 'Partly cloudy', rainChance: 18, wind: 12, updatedAt: new Date().toISOString() }));
router.get('/availability', async (req, res) => { const venue = await findVenue(req.query.venueId || 'outdoor'); if (!venue) return res.status(404).json({ message: 'Venue not found' }); const { listBookings } = await import('../store.js'); const records = await listBookings({ role: 'ADMIN' }); const reserved = records.filter(item => item.date === req.query.date && item.venueId === venue.id && item.status !== 'cancelled').map(item => item.laneId); res.json({ date: req.query.date, venueId: venue.id, reserved, lanes: venue.lanes }); });
export default router;
