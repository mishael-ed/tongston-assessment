import { AppError } from '../lib/errors.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body ?? {}, query: req.query ?? {}, params: req.params ?? {} });
  if (!result.success) {
    const details = result.error.issues.map(({ path, message }) => ({ field: path.join('.'), message }));
    return next(new AppError(422, 'Request validation failed', details));
  }

  req.validated = result.data;
  next();
};
