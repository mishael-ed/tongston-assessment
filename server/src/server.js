import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { config } from './config.js';

let server;

async function start() {
  await connectDatabase();
  server = createApp().listen(config.PORT, () => {
    console.log(`T-World API listening on http://localhost:${config.PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received, closing connections`);
  server?.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error('Could not start server:', error.message);
  process.exit(1);
});
