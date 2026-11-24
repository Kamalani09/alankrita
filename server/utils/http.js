export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function sendSuccess(response, data, message = 'OK', status = 200) {
  return response.status(status).json({ success: true, data, message });
}
