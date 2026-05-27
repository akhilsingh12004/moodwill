const express  = require("express");
const { body } = require("express-validator");
const {
  getBrags, createBrag, getBrag, updateBrag, deleteBrag, getBragStats,
} = require("../controllers/bragController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

const bragRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).escape(),
  body("description").optional().trim().isLength({ max: 1000 }).escape(),
  body("category").optional().isIn(["Bug Fix","New Skill","Milestone","PR Merged","Test Pass","Other"]).withMessage("Invalid category"),
];

router.use(protect);   // all brag routes require auth

router.route("/")
  .get(getBrags)
  .post(bragRules, validate, createBrag);

router.get("/stats", getBragStats);

router.route("/:id")
  .get(getBrag)
  .patch(bragRules, validate, updateBrag)
  .delete(deleteBrag);

module.exports = router;
