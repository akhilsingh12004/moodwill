const express  = require("express");
const { body } = require("express-validator");
const {
  getTasks, createTask, completeTask, updateTask, deleteTask, getDailyReset,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

const taskRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).escape(),
  body("category").optional().isIn(["Chore","Health","Social","Self-care"]).withMessage("Invalid category"),
  body("frequency").optional().isIn(["Once","Daily","Weekly"]).withMessage("Invalid frequency"),
  body("targetDuration").optional().isInt({ min: 0 }).withMessage("Target duration must be non-negative"),
  body("status").optional().isIn(["Pending", "Completed"]).withMessage("Invalid status"),
];

router.use(protect);

router.get("/daily-reset", getDailyReset);

router.route("/")
  .get(getTasks)
  .post(taskRules, validate, createTask);

router.patch("/:id/complete", completeTask);

router.route("/:id")
  .patch(taskRules, validate, updateTask)
  .delete(deleteTask);

module.exports = router;
