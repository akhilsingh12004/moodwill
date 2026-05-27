const jwt = require("jsonwebtoken");

/**
 * Initialise Socket.io and attach JWT authentication.
 * Each authenticated user joins their own room "user:<userId>"
 * so cron jobs can emit targeted nudges.
 *
 * @param {import("socket.io").Server} io
 */
function initSocket(io) {
  // ── Auth middleware for socket connections ──────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required."));

    try {
      const decoded  = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId  = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    console.log(`[Socket] User ${socket.userId} connected → joined ${room}`);

    // ── Client events ───────────────────────────────────────────────────────
    // Frontend can emit these to update server-side timestamps used by crons
    socket.on("water:log", () => {
      // The client logged water — update timestamp (full update via REST preferred,
      // but this gives instant feedback without an extra HTTP round-trip)
      const User = require("../models/User");
      User.findByIdAndUpdate(socket.userId, { lastWaterLog: new Date() }).catch(() => {});
      console.log(`[Socket] User ${socket.userId} logged water.`);
    });

    socket.on("social:activity", () => {
      const User = require("../models/User");
      User.findByIdAndUpdate(socket.userId, { lastSocialActivity: new Date() }).catch(() => {});
      console.log(`[Socket] User ${socket.userId} logged social activity.`);
    });

    // Pomodoro session start/end (for future analytics)
    socket.on("pomodoro:start", (data) => {
      console.log(`[Socket] User ${socket.userId} started Pomodoro: ${JSON.stringify(data)}`);
    });

    socket.on("pomodoro:end", (data) => {
      console.log(`[Socket] User ${socket.userId} ended Pomodoro: ${JSON.stringify(data)}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ${socket.userId} disconnected — ${reason}`);
    });
  });
}

module.exports = initSocket;
