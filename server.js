import app from './src/app.js';
import { connectDatabase, disconnectDatabase } from './src/db.js';

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, async () => {
  try {
    const database = await connectDatabase();
    console.log(`C'Archery API running at http://localhost:${PORT} (${database.connected ? 'postgresql' : 'development fallback'})`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exitCode = 1;
  }
});

async function shutdown() {
  await disconnectDatabase();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
