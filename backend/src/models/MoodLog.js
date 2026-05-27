const mongoose = require("mongoose");

const EMOJI_TAGS = ["😔", "😕", "😐", "🙂", "😄"];

const moodLogSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
    index:    true,
  },
  moodLevel: {
    type:     Number,
    required: true,
    min:      1,
    max:      5,
  },
  emojiTag: {
    type:    String,
    enum:    EMOJI_TAGS,
    default: function () {
      return EMOJI_TAGS[this.moodLevel - 1];
    },
  },
  note: {
    type:      String,
    trim:      true,
    maxlength: 500,
    default:   "",
  },
}, {
  timestamps: true,   // createdAt is the mood timestamp
});

// One mood log per day per user — enforced at controller level, not schema
moodLogSchema.index({ user: 1, createdAt: -1 });

// Static: get the last 7 days of mood data formatted for the chart
moodLogSchema.statics.getWeeklyTrend = async function (userId) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const logs = await this.find({ user: userId, createdAt: { $gte: since } })
    .sort("createdAt")
    .lean();

  // Build a day-keyed map
  const map = {};
  logs.forEach(l => {
    const day = days[new Date(l.createdAt).getDay()];
    map[day] = l.moodLevel;
  });

  // Return the last 7 calendar days in order
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = days[d.getDay()];
    return { day: label, level: map[label] || null };
  });
};

module.exports = mongoose.model("MoodLog", moodLogSchema);
