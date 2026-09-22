import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { bows as memoryBows, venues as memoryVenues, users as memoryUsers, bookings as memoryBookings } from './data.js';

const useDatabase = () => Boolean(prisma);
const normalizeUser = user => ({ ...user, role: String(user.role).toUpperCase() });

export async function seedDatabase() {
  if (!prisma || await prisma.user.count() > 0) return;
  await prisma.$transaction(async transaction => {
    for (const user of memoryUsers) await transaction.user.create({ data: user });
    for (const venue of memoryVenues) await transaction.venue.create({ data: { id: venue.id, name: venue.name, type: venue.type, description: venue.description, price: venue.price, lanes: { create: venue.lanes.map(lane => ({ id: lane.id, name: lane.name })) } } });
    for (const bow of memoryBows) await transaction.bow.create({ data: bow });
    for (const booking of memoryBookings) await transaction.booking.create({ data: { ...booking, date: new Date(`${booking.date}T12:00:00`), status: booking.status } });
  });
}

export async function findUserByEmail(email) { return useDatabase() ? prisma.user.findUnique({ where: { email } }) : memoryUsers.find(user => user.email === email); }
export async function findUserById(id) { return useDatabase() ? prisma.user.findUnique({ where: { id } }) : memoryUsers.find(user => user.id === id); }
export async function createUser({ name, email, password }) { const data = { id: randomUUID(), name, email, role: 'USER', passwordHash: await bcrypt.hash(password, 10) }; return useDatabase() ? prisma.user.create({ data }) : (memoryUsers.push(data), data); }

export async function listVenues() { return useDatabase() ? prisma.venue.findMany({ include: { lanes: true } }) : memoryVenues; }
export async function findVenue(id) { return useDatabase() ? prisma.venue.findUnique({ where: { id }, include: { lanes: true } }) : memoryVenues.find(venue => venue.id === id); }
export async function createVenue(input) { const data = { id: input.id, name: input.name, type: input.type || 'INDOOR', description: input.description, price: Number(input.price), lanes: { create: Array.from({ length: 5 }, (_, index) => ({ id: `${input.id[0].toUpperCase()}${index + 1}`, name: `Lane ${String(index + 1).padStart(2, '0')}` })) } }; return useDatabase() ? prisma.venue.create({ data, include: { lanes: true } }) : (memoryVenues.push({ ...data, lanes: data.lanes.create }), memoryVenues.at(-1)); }
export async function updateVenue(id, input) { const allowed = {}; for (const field of ['name', 'description', 'type']) if (input[field] !== undefined) allowed[field] = input[field]; if (input.price !== undefined) allowed.price = Number(input.price); return useDatabase() ? prisma.venue.update({ where: { id }, data: allowed, include: { lanes: true } }) : Object.assign(memoryVenues.find(venue => venue.id === id), allowed); }
export async function deleteVenue(id) { return useDatabase() ? prisma.venue.delete({ where: { id } }) : memoryVenues.splice(memoryVenues.findIndex(venue => venue.id === id), 1)[0]; }

export async function listBows() { return useDatabase() ? prisma.bow.findMany() : memoryBows; }
export async function findBow(id) { return useDatabase() ? prisma.bow.findUnique({ where: { id } }) : memoryBows.find(bow => bow.id === id); }
export async function createBow(input) { const data = { id: input.id, name: input.name, description: input.description, price: Number(input.price), level: input.level || 'All levels' }; return useDatabase() ? prisma.bow.create({ data }) : (memoryBows.push(data), data); }
export async function updateBow(id, input) { const allowed = {}; for (const field of ['name', 'description', 'level']) if (input[field] !== undefined) allowed[field] = input[field]; if (input.price !== undefined) allowed.price = Number(input.price); return useDatabase() ? prisma.bow.update({ where: { id }, data: allowed }) : Object.assign(memoryBows.find(bow => bow.id === id), allowed); }
export async function deleteBow(id) { return useDatabase() ? prisma.bow.delete({ where: { id } }) : memoryBows.splice(memoryBows.findIndex(bow => bow.id === id), 1)[0]; }

const bookingInclude = { venue: true, lane: true, bow: true, user: { select: { name: true } } };
export async function listBookings(user) { const records = useDatabase() ? await prisma.booking.findMany({ where: user.role === 'ADMIN' ? {} : { userId: user.id }, include: bookingInclude, orderBy: { date: 'desc' } }) : memoryBookings.filter(item => user.role === 'ADMIN' || item.userId === user.id).map(item => ({ ...item, venue: memoryVenues.find(venue => venue.id === item.venueId), bow: memoryBows.find(bow => bow.id === item.bowId) || null, user: { name: memoryUsers.find(member => member.id === item.userId)?.name } })); return records.map(record => ({ ...record, status: String(record.status).toLowerCase(), date: record.date instanceof Date ? record.date.toISOString().slice(0, 10) : record.date, user: record.user?.name || record.user })); }
export async function isSlotTaken({ date, time, laneId, ignoreId }) { return useDatabase() ? Boolean(await prisma.booking.findFirst({ where: { date: new Date(`${date}T12:00:00`), time, laneId, status: { not: 'CANCELLED' }, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) } })) : memoryBookings.some(item => item.id !== ignoreId && item.date === date && item.time === time && item.laneId === laneId && item.status !== 'CANCELLED'); }
export async function createBooking(input) { const record = { id: `BK-${Math.floor(10000 + Math.random() * 89999)}`, ...input, date: new Date(`${input.date}T12:00:00`), status: 'CONFIRMED', duration: Number(input.duration), total: Number(input.total) }; return useDatabase() ? prisma.booking.create({ data: record, include: bookingInclude }) : (memoryBookings.unshift({ ...record, date: input.date, status: 'CONFIRMED' }), memoryBookings[0]); }
export async function updateBooking(id, input) { return useDatabase() ? prisma.booking.update({ where: { id }, data: { ...(input.date ? { date: new Date(`${input.date}T12:00:00`) } : {}), ...(input.time ? { time: input.time } : {}), ...(input.laneId ? { laneId: input.laneId } : {}) }, include: bookingInclude }) : Object.assign(memoryBookings.find(item => item.id === id), input); }
export async function cancelBooking(id) { return useDatabase() ? prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }) : Object.assign(memoryBookings.find(item => item.id === id), { status: 'CANCELLED' }); }
export async function deleteBooking(id) { return useDatabase() ? prisma.booking.delete({ where: { id } }) : memoryBookings.splice(memoryBookings.findIndex(item => item.id === id), 1)[0]; }
export async function findBooking(id) { return useDatabase() ? prisma.booking.findUnique({ where: { id } }) : memoryBookings.find(item => item.id === id); }
