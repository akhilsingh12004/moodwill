require("dotenv").config();

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");

const connectDB      = require("../config/db");
const errorHandler   = require("./middleware/errorHandler");
const registerCron   = require("./jobs/cronJobs");
const initSocket     = require("./utils/socket");
const { apiLimiter } = require("./middleware/rateLimiter");

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const bragRoutes = require("./routes/brags");
const taskRoutes = require("./routes/tasks");
const moodRoutes = require("./routes/mood");

// ─── App + HTTP server ────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
initSocket(io);

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy violation"), false);
  },
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("/api", apiLimiter);
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ─── Make io accessible in controllers via req.io ────────────────────────────
app.use((req, _res, next) => { req.io = io; next(); });

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/brags", bragRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/mood",  moodRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status:  "ok",
    app:     "Moodwill API",
    version: "1.0.0",
    uptime:  Math.round(process.uptime()) + "s",
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Cron jobs ────────────────────────────────────────────────────────────────
registerCron(io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Moodwill API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  console.log(`📡 Health check → http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

