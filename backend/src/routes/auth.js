// ─── routes/auth.js ───────────────────────────────────────────────────────────
const express  = require("express");
const { body } = require("express-validator");
const {
  register, login, getMe, updatePreferences, updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");

const router = express.Router();

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 60 }).escape(),
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const preferencesRules = [
  body("theme").optional().isIn(["dark", "light"]).withMessage("Theme must be dark or light"),
  body("focusDuration").optional().isInt({ min: 5, max: 90 }).withMessage("Focus duration must be between 5 and 90 minutes"),
  body("breakDuration").optional().isInt({ min: 1, max: 30 }).withMessage("Break duration must be between 1 and 30 minutes"),
  body("notifications.hydration").optional().isBoolean().withMessage("Hydration notification must be a boolean"),
  body("notifications.socialPing").optional().isBoolean().withMessage("Social ping notification must be a boolean"),
  body("notifications.moodReminder").optional().isBoolean().withMessage("Mood reminder notification must be a boolean"),
  body("socialGapHours").optional().isInt({ min: 1 }).withMessage("Social gap must be at least 1 hour"),
];

const passwordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
];

router.post("/register",     authLimiter, registerRules, validate, register);
router.post("/login",        authLimiter, loginRules, validate, login);
router.get ("/me",           protect,       getMe);
router.patch("/preferences", protect, preferencesRules, validate, updatePreferences);
router.patch("/password",    protect, authLimiter, passwordRules, validate, updatePassword);

module.exports = router;
