import api from "./axiosConfig";

const authService = {
  register: (data) =>
    api.post("/auth/register", data).then((r) => r.data),

  login: (data) =>
    api.post("/auth/login", data).then((r) => r.data),

  getMe: () =>
    api.get("/auth/me").then((r) => r.data.user),

  updatePreferences: (prefs) =>
    api.patch("/auth/preferences", prefs).then((r) => r.data.user),

  updatePassword: (data) =>
    api.patch("/auth/password", data).then((r) => r.data),
};

export default authService;
