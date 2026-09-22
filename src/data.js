import bcrypt from 'bcryptjs';

export const bows = [
  { id: 'compound', name: 'Compound bow', price: 75000, description: 'Stabil, presisi, dan ringan untuk pemanah yang ingin membidik jarak jauh.', level: 'Intermediate' },
  { id: 'recurve', name: 'Recurve bow', price: 55000, description: 'Busur klasik dengan tarikan yang halus, cocok untuk belajar teknik dasar.', level: 'Beginner' },
  { id: 'traditional', name: 'Traditional bow', price: 45000, description: 'Pengalaman memanah yang autentik dengan desain kayu yang berkarakter.', level: 'All levels' }
];

export const venues = [
  { id: 'indoor', name: 'Indoor range', type: 'INDOOR', label: 'INDOOR', description: 'Fokus tanpa gangguan cuaca', distance: '18m', price: 125000, accent: 'sand', lanes: Array.from({ length: 5 }, (_, i) => ({ id: `I${i + 1}`, name: `Lane ${String(i + 1).padStart(2, '0')}` })) },
  { id: 'outdoor', name: 'Outdoor range', type: 'OUTDOOR', label: 'OUTDOOR', description: 'Bidikan lapang dengan udara segar', distance: '30m', price: 150000, accent: 'sky', lanes: Array.from({ length: 5 }, (_, i) => ({ id: `O${i + 1}`, name: `Lane ${String(i + 1).padStart(2, '0')}` })) }
];

export const users = [
  { id: 'usr-demo', name: 'Alya Pratama', email: 'alya@carchery.id', role: 'USER', passwordHash: bcrypt.hashSync('password', 10) },
  { id: 'usr-admin', name: "C'Archery Admin", email: 'admin@carchery.id', role: 'ADMIN', passwordHash: bcrypt.hashSync('password', 10) }
];

export const bookings = [
  { id: 'BK-24091', userId: 'usr-demo', venueId: 'outdoor', laneId: 'O2', date: '2026-09-24', time: '16:00', duration: 2, bowId: 'recurve', bringOwnBow: false, status: 'CONFIRMED', total: 355000, createdAt: '2026-09-18' },
  { id: 'BK-24070', userId: 'usr-demo', venueId: 'indoor', laneId: 'I4', date: '2026-09-19', time: '10:00', duration: 1, bowId: null, bringOwnBow: true, status: 'COMPLETED', total: 125000, createdAt: '2026-09-12' }
];

export function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return { ...safeUser, role: safeUser.role.toLowerCase() };
}
