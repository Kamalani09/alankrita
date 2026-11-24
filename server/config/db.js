import mongoose from 'mongoose';

export function connectDatabase(uri) {
  // Bound the wait when Atlas credentials or network access are misconfigured.
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
