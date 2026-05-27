const cron = require("node-cron");
const User = require("../models/User");
const Task = require("../models/Task");

/**
 * Register all background cron jobs.
 * @param {import("socket.io").Server} io  — Socket.io server for real-time nudges
 */
function registerCronJobs(io) {

  // ── 1. Hydration Nudge — every 2 hours ──────────────────────────────────────
  // "Internal storage is low. Drink some water, dev!"
  cron.schedule("0 */2 * * *", async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const users = await User.find({
        "preferences.notifications.hydration": true,
        lastWaterLog: { $lt: twoHoursAgo },
      }).lean();

      users.forEach(user => {
        io.to(`user:${user._id}`).emit("nudge", {
          type:    "Hydration",
          icon:    "💧",
          message: "Internal storage is low. Drink some water, dev!",
        });
      });

      console.log(`[CRON] Hydration nudge sent to ${users.length} user(s).`);
    } catch (err) {
      console.error("[CRON] Hydration nudge error:", err.message);
    }
  });


  // ── 2. Social Ping — every hour, check social gap ──────────────────────────
  cron.schedule("0 * * * *", async () => {
    try {
      const users = await User.find({
        "preferences.notifications.socialPing": true,
      }).lean();

      users.forEach(user => {
        const gapMs     = user.socialGapHours * 60 * 60 * 1000;
        const lastSocial = new Date(user.lastSocialActivity || 0);

        if (Date.now() - lastSocial.getTime() >= gapMs) {
          io.to(`user:${user._id}`).emit("nudge", {
            type:    "Social Ping",
            icon:    "📞",
            message: `${user.socialGapHours}h social gap detected. Call home or text a friend?`,
          });
        }
      });
    } catch (err) {
      console.error("[CRON] Social ping error:", err.message);
    }
  });


  // ── 3. Mood Reminder — daily at 9 PM ────────────────────────────────────────
  cron.schedule("0 21 * * *", async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find users who haven't logged a mood today
      const users = await User.find({
        "preferences.notifications.moodReminder": true,
        $or: [
          { lastMoodLog: null },
          { lastMoodLog: { $lt: todayStart } },
        ],
      }).lean();

      users.forEach(user => {
        io.to(`user:${user._id}`).emit("nudge", {
          type:    "Mood Reminder",
          icon:    "💫",
          message: "How are you feeling today? Log your mood pulse.",
        });
      });

      console.log(`[CRON] Mood reminder sent to ${users.length} user(s).`);
    } catch (err) {
      console.error("[CRON] Mood reminder error:", err.message);
    }
  });


  // ── 4. Daily Task Reset — midnight every day ─────────────────────────────────
  // Resets "Daily" tasks back to Pending so they appear fresh each morning
  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await Task.updateMany(
        { frequency: "Daily", status: "Completed" },
        { $set: { status: "Pending" } }
      );
      console.log(`[CRON] Daily reset — ${result.modifiedCount} task(s) reset to Pending.`);
    } catch (err) {
      console.error("[CRON] Daily reset error:", err.message);
    }
  });


  // ── 5. Sun Break Nudge — every 6 hours during daylight ──────────────────────
  cron.schedule("0 9,15,18 * * *", async () => {
    try {
      const users = await User.find({
        "preferences.notifications.hydration": true,   // reuse this pref for general wellness
      }).lean();

      users.forEach(user => {
        io.to(`user:${user._id}`).emit("nudge", {
          type:    "Sun Break",
          icon:    "☀️",
          message: "Screens are great, but so is vitamin D. Step outside for 5 minutes!",
        });
      });
    } catch (err) {
      console.error("[CRON] Sun nudge error:", err.message);
    }
  });


  console.log("✅ Cron jobs registered: Hydration · Social Ping · Mood Reminder · Daily Reset · Sun Break");
}

module.exports = registerCronJobs;
