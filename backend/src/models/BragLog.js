const mongoose = require("mongoose");

const CATEGORIES = ["Bug Fix", "New Skill", "Milestone", "PR Merged", "Test Pass", "Other"];

const bragLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "User",
    required: true,
    index: true,
  },
  title: {
    type:      String,
    required:  true,
    trim:      true,
    maxlength: 200,
  },
  description: {
    type:      String,
    trim:      true,
    maxlength: 1000,
    default:   "",
  },
  category: {
    type:    String,
    enum:    CATEGORIES,
    default: "Milestone",
  },
}, {
  timestamps: true,   // createdAt = the "win timestamp" shown in the UI
});

// Most recent wins first
bragLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("BragLog", bragLogSchema);
