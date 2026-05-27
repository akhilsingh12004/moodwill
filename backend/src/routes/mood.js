const express  = require("express");
const { body } = require("express-validator");
const {
  logMood, getWeeklyMood, getMoodHistory, getTodayMood,
} = require("../controllers/moodController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

const moodRules = [
  body("moodLevel")
    .isInt({ min: 1, max: 5 })
    .withMessage("moodLevel must be an integer between 1 and 5"),
  body("note").optional().trim().isLength({ max: 500 }).escape(),
];

router.use(protect);

router.post("/",       moodRules, validate, logMood);
router.get("/week",    getWeeklyMood);
router.get("/today",   getTodayMood);
router.get("/",        getMoodHistory);

module.exports = router;
