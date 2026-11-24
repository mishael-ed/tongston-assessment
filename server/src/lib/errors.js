export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, _res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

export function errorHandler(error, _req, res, _next) {
  if (error.name === 'ValidationError') {
    return res.status(422).json({ error: 'Validation failed', details: error.errors });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid resource id' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    error: status >= 500 ? 'An unexpected error occurred' : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}
