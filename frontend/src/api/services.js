import api from "./axiosConfig";

// ─── Brag Stack (Tech Core) ───────────────────────────────────────────────────
export const bragService = {
  getAll:  (params) => api.get("/brags", { params }).then((r) => r.data),
  getStats:()       => api.get("/brags/stats").then((r) => r.data),
  create:  (data)   => api.post("/brags", data).then((r) => r.data.data),
  update:  (id, data) => api.patch(`/brags/${id}`, data).then((r) => r.data.data),
  remove:  (id)     => api.delete(`/brags/${id}`).then((r) => r.data),
};

// ─── Tasks (Solo Core) ───────────────────────────────────────────────────────
export const taskService = {
  getAll:       (params)   => api.get("/tasks", { params }).then((r) => r.data),
  getDailyReset:()         => api.get("/tasks/daily-reset").then((r) => r.data.data),
  create:       (data)     => api.post("/tasks", data).then((r) => r.data.data),
  complete:     (id)       => api.patch(`/tasks/${id}/complete`).then((r) => r.data.data),
  update:       (id, data) => api.patch(`/tasks/${id}`, data).then((r) => r.data.data),
  remove:       (id)       => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// ─── Mood Pulse (Sanctuary) ───────────────────────────────────────────────────
export const moodService = {
  logMood:     (data) => api.post("/mood", data).then((r) => r.data.data),
  getToday:    ()     => api.get("/mood/today").then((r) => r.data.data),
  getWeek:     ()     => api.get("/mood/week").then((r) => r.data.data),
  getHistory:  (p)    => api.get("/mood", { params: p }).then((r) => r.data),
};
