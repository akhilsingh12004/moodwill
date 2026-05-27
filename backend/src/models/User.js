const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const preferencesSchema = new mongoose.Schema({
  theme:           { type: String, enum: ["dark", "light"], default: "dark" },
  focusDuration:   { type: Number, default: 25, min: 5, max: 90 },  // minutes
  breakDuration:   { type: Number, default: 5,  min: 1, max: 30  },
  notifications: {
    hydration:   { type: Boolean, default: true },
    socialPing:  { type: Boolean, default: true },
    moodReminder:{ type: Boolean, default: true },
  },
  socialGapHours:  { type: Number, default: 48 },  // trigger social ping after N hours
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 60 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 8, select: false },
  preferences: { type: preferencesSchema, default: () => ({}) },

  // Cron tracking — updated by node-cron jobs
  lastSocialActivity: { type: Date, default: Date.now },
  lastWaterLog:       { type: Date, default: Date.now },
  lastMoodLog:        { type: Date, default: null },
}, {
  timestamps: true,
});

// ─── Hash password before save ────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance method: compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Remove password from JSON output ────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
