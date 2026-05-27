const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
    index:    true,
  },
  title: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 200,
  },
  category: {
    type:    String,
    enum:    ["Chore", "Health", "Social", "Self-care"],
    default: "Chore",
  },
  status: {
    type:    String,
    enum:    ["Pending", "Completed"],
    default: "Pending",
  },
  frequency: {
    type:    String,
    enum:    ["Once", "Daily", "Weekly"],
    default: "Daily",
  },
  lastCompletedAt: {
    type: Date,
    default: null,
  },
  // For the chore speed-run: optional target duration in seconds
  targetDuration: {
    type:    Number,
    default: 600,   // 10 minutes
    min:     60,
    max:     3600,
  },
}, {
  timestamps: true,
});

// Auto-reset daily tasks at midnight (done by cron job, not the model itself)
taskSchema.methods.isDueToday = function () {
  if (this.frequency === "Once")   return this.status === "Pending";
  if (this.frequency === "Daily")  {
    if (!this.lastCompletedAt) return true;
    const last = new Date(this.lastCompletedAt);
    const now  = new Date();
    return last.toDateString() !== now.toDateString();
  }
  if (this.frequency === "Weekly") {
    if (!this.lastCompletedAt) return true;
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(this.lastCompletedAt).getTime() >= msInWeek;
  }
  return false;
};

taskSchema.index({ user: 1, category: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);
