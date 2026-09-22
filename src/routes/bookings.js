import { Router } from 'express';
import { auth, requireFields, requireRole } from '../middleware.js';
import { findBow, findBooking, findVenue, isSlotTaken, listBookings, createBooking, updateBooking, cancelBooking, deleteBooking } from '../store.js';

const router = Router();
router.use(auth);
router.get('/', async (req, res) => res.json(await listBookings(req.user)));
router.post('/', requireFields('venueId', 'laneId', 'date', 'time'), async (req, res) => {
  const { venueId, laneId, date, time, duration = 1, bowId, bringOwnBow = true } = req.body;
  const venue = await findVenue(venueId);
  if (!venue) return res.status(400).json({ message: 'Venue not found' });
  if (!venue.lanes.some(lane => lane.id === laneId)) return res.status(400).json({ message: 'Invalid lane' });
  if (![1, 2, 3].includes(Number(duration))) return res.status(400).json({ message: 'Duration must be between 1 and 3 hours' });
  if (await isSlotTaken({ date, time, laneId })) return res.status(409).json({ message: 'That lane is already booked for this time' });
  const bow = bringOwnBow ? null : await findBow(bowId);
  if (!bringOwnBow && !bow) return res.status(400).json({ message: 'Choose a rental bow or bring your own' });
  const booking = await createBooking({ userId: req.user.id, venueId, laneId, date, time, duration, bowId: bow?.id || null, bringOwnBow, total: venue.price * Number(duration) + (bow?.price || 0) });
  res.status(201).json(booking);
});
router.patch('/:id', async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking || (req.user.role !== 'ADMIN' && booking.userId !== req.user.id)) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status !== 'CONFIRMED' && booking.status !== 'confirmed') return res.status(409).json({ message: 'Only confirmed bookings can be rescheduled' });
  const date = req.body.date || (booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : booking.date);
  const time = req.body.time || booking.time; const laneId = req.body.laneId || booking.laneId;
  if (await isSlotTaken({ date, time, laneId, ignoreId: booking.id })) return res.status(409).json({ message: 'That lane is already booked for this time' });
  res.json(await updateBooking(booking.id, { date, time, laneId }));
});
router.patch('/:id/cancel', async (req, res) => { const booking = await findBooking(req.params.id); if (!booking || (req.user.role !== 'ADMIN' && booking.userId !== req.user.id)) return res.status(404).json({ message: 'Booking not found' }); res.json(await cancelBooking(booking.id)); });
router.delete('/:id', requireRole('ADMIN'), async (req, res) => { if (!await findBooking(req.params.id)) return res.status(404).json({ message: 'Booking not found' }); await deleteBooking(req.params.id); res.status(204).send(); });
export default router;
