export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function sendData(res, data, options = {}) {
  const payload = { data };

  if (options.meta) {
    payload.meta = options.meta;
  }

  return res.status(options.status || 200).json(payload);
}

export function requireRecord(record, resourceName = 'Resource') {
  if (!record) {
    throw new HttpError(404, 'NOT_FOUND', `${resourceName} not found.`);
  }

  return record;
}

export function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required.`, { field });
  }

  return value.trim();
}

export function requireNonNegativeNumber(value, field) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a non-negative number.`, {
      field,
    });
  }

  return number;
}
