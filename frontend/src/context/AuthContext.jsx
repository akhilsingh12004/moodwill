import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("mw_user")) || null; }
    catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem("mw_token") || null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Verify token on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const me = await authService.getMe();
        setUser(me);
        localStorage.setItem("mw_user", JSON.stringify(me));
      } catch {
        // Token is stale — wipe it
        localStorage.removeItem("mw_token");
        localStorage.removeItem("mw_user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []); // eslint-disable-line

  const persist = (data) => {
    localStorage.setItem("mw_token", data.token);
    localStorage.setItem("mw_user",  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const data = await authService.register({ name, email, password });
      persist(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await authService.login({ email, password });
      persist(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed.";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mw_token");
    localStorage.removeItem("mw_user");
    setToken(null);
    setUser(null);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const updated = await authService.updatePreferences(prefs);
    setUser(updated);
    localStorage.setItem("mw_user", JSON.stringify(updated));
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      isAuthenticated: !!token,
      register, login, logout, updatePreferences,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
