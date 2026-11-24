import { isDatabaseConnected } from '../config/db.js';

export function getHealth(_request, response) {
  response.set('Cache-Control', 'no-store').json({
    success: true,
    data: {
      status: 'ok',
      database: isDatabaseConnected() ? 'connected' : 'disconnected',
    },
    message: 'ALANKRITA API is running.',
  });
}

export function getReadiness(_request, response) {
  const connected = isDatabaseConnected();
  response.set('Cache-Control', 'no-store').status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? 'ready' : 'unavailable' },
    message: connected ? 'ALANKRITA API is ready.' : 'Database is unavailable.',
  });
}
