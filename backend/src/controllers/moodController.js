const MoodLog              = require("../models/MoodLog");
const User                 = require("../models/User");

// ─── POST /api/mood ───────────────────────────────────────────────────────────
exports.logMood = async (req, res, next) => {
  try {
    const { moodLevel, note } = req.body;
    const EMOJIS = ["😔", "😕", "😐", "🙂", "😄"];

    // Upsert: one mood per day per user
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const mood = await MoodLog.findOneAndUpdate(
      { user: req.user._id, createdAt: { $gte: todayStart } },
      {
        $set: {
          moodLevel,
          emojiTag: EMOJIS[moodLevel - 1],
          note:     note || "",
        },
        $setOnInsert: { user: req.user._id },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update lastMoodLog on user for cron tracking
    await User.findByIdAndUpdate(req.user._id, { lastMoodLog: new Date() });

    res.status(201).json({ success: true, data: mood });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mood/week ───────────────────────────────────────────────────────
// Returns 7-day trend formatted for Recharts
exports.getWeeklyMood = async (req, res, next) => {
  try {
    const trend = await MoodLog.getWeeklyTrend(req.user._id);
    res.status(200).json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mood ────────────────────────────────────────────────────────────
// Paginated history
exports.getMoodHistory = async (req, res, next) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await MoodLog.countDocuments({ user: req.user._id });
    const moods = await MoodLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ success: true, total, data: moods });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mood/today ──────────────────────────────────────────────────────
exports.getTodayMood = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const mood = await MoodLog.findOne({
      user:      req.user._id,
      createdAt: { $gte: todayStart },
    }).lean();

    res.status(200).json({ success: true, data: mood || null });
  } catch (err) {
    next(err);
  }
};
