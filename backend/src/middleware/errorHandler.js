/**
 * Central error-handling middleware.
 * Express calls this when next(err) is invoked from any route/controller.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Malformed JSON payload handler
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message    = "Malformed JSON payload.";
  }

  // Mongoose — bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose — duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`;
  }

  // Mongoose — validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message    = Object.values(err.errors).map(e => e.message).join(". ");
  }

  // JWT errors (fallback — usually caught in auth middleware)
  if (err.name === "JsonWebTokenError")  { statusCode = 401; message = "Invalid token."; }
  if (err.name === "TokenExpiredError")  { statusCode = 401; message = "Token expired."; }

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${statusCode} — ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
