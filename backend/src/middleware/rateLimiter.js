const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV === "development";

/**
 * Global rate limiter for general API routes.
 * Limits each IP to 100 requests per 15 minutes.
 */
const apiLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes."
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    });

/**
 * Strict rate limiter for sensitive authentication attempts (login, registration, password updates).
 * Limits each IP to 5 attempts per 15 minutes.
 */
const authLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = {
  apiLimiter,
  authLimiter,
};
