import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import { ambientAudio } from "../../utils/audioSynth.js";

import { C } from "../../theme.js";

// High-fidelity SVG Navigation Icons
const NAV = [
  { 
    to: "/", 
    label: "Overview", 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  { 
    to: "/tech", 
    label: "Developer Journal", 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    )
  },
  { 
    to: "/solo", 
    label: "Routine & Tasks", 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    )
  },
  { 
    to: "/mind", 
    label: "Mindfulness Center", 
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    )
  },
];

// ─── Nudge Toast ──────────────────────────────────────────────────────────────
function NudgeToast({ nudge, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        background: "rgba(22, 31, 36, 0.85)", 
        backdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`, 
        borderRadius: 12,
        padding: "14px 18px", 
        display: "flex", 
        gap: 12, 
        alignItems: "center",
        maxWidth: 300, 
        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: 22, textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>{nudge.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, color: C.teal, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>
          {nudge.type}
        </div>
        <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.4, fontWeight: 500 }}>{nudge.message}</div>
      </div>
      <button onClick={() => onDismiss(nudge.id)}
        style={{ 
          background: "none", 
          border: "none", 
          color: C.muted, 
          cursor: "pointer", 
          fontSize: 16, 
          lineHeight: 1,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => e.target.style.color = C.coral}
        onMouseLeave={(e) => e.target.style.color = C.muted}
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── SOS Full-screen overlay ─────────────────────────────────────────────────
function SOSOverlay({ onClose }) {
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(4);
  const [big, setBig] = useState(true);

  useEffect(() => {
    const seq = [
      { p: "inhale", s: 4 },
      { p: "hold", s: 7 },
      { p: "exhale", s: 8 },
    ];
    let idx = 0;
    let pt;
    let ct;

    const run = () => {
      const cur = seq[idx];
      setPhase(cur.p);
      setBig(cur.p !== "exhale");
      setCount(cur.s);

      // Play soft audio tone cues dynamically
      if (cur.p === "inhale") {
        ambientAudio.playBreatheTone(180, 3.8); // low pitch
      } else if (cur.p === "exhale") {
        ambientAudio.playBreatheTone(240, 7.8); // higher relaxing pitch
      }

      let c = cur.s;
      clearInterval(ct);
      ct = setInterval(() => {
        c--;
        setCount(c);
        if (c <= 0) clearInterval(ct);
      }, 1000);

      pt = setTimeout(() => {
        clearInterval(ct);
        idx = (idx + 1) % seq.length;
        run();
      }, cur.s * 1000);
    };

    run();

    return () => {
      clearTimeout(pt);
      clearInterval(ct);
    };
  }, []);

  const col = { inhale: C.teal, hold: "#38bdf8", exhale: C.purple };
  const msg = { inhale: "Breathe in slowly…", hold: "Hold gently…", exhale: "Let it all go…" };
  const sz = big ? 190 : 95;

  return (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(6, 9, 11, 0.97)", zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", backdropFilter: "blur(20px)",
      }}
    >
      <button onClick={onClose} style={{
        position: "absolute", top: 24, right: 24, background: "transparent",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px",
        color: C.muted, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px",
        transition: "all 0.2s",
      }}
        onMouseEnter={(e) => { e.target.style.borderColor = C.teal; e.target.style.color = C.teal; }}
        onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.color = C.muted; }}
      >✕ Close Breather</button>

      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "3px", marginBottom: 40, textTransform: "uppercase", fontWeight: 700 }}>
        Moodwill — Quick Breather
      </div>

      <div style={{ position: "relative", width: 250, height: 250, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
        {/* Glow effect */}
        <motion.div
          animate={{ scale: big ? [1, 1.25, 1] : 1, opacity: big ? [0.15, 0.35, 0.15] : 0.1 }}
          transition={{ duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", width: 160, height: 160, borderRadius: "50%",
            background: col[phase], filter: "blur(35px)", pointerEvents: "none",
          }}
        />

        <motion.div
          animate={{ width: sz, height: sz }}
          transition={{ duration: phase === "inhale" ? 4 : phase === "hold" ? 0.3 : 8, ease: "easeInOut" }}
          style={{
            borderRadius: "50%", border: `2px solid ${col[phase]}77`,
            background: `radial-gradient(circle, ${col[phase]}18, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 25px ${col[phase]}20`, position: "relative", zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: col[phase], fontFamily: "monospace" }}>{count}</div>
            <div style={{ fontSize: 9, color: `${col[phase]}cc`, letterSpacing: "2.5px", fontWeight: 700 }}>{phase.toUpperCase()}</div>
          </div>
        </motion.div>
      </div>

      <div style={{ fontSize: 19, color: col[phase], fontWeight: 600, marginBottom: 8, height: 26 }}>{msg[phase]}</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 36, letterSpacing: "0.5px" }}>4 – 7 – 8 breathing guide with audio cues</div>

      <div style={{ display: "flex", gap: 12 }}>
        {["inhale", "hold", "exhale"].map((p) => (
          <span key={p} style={{
            fontSize: 9.5, fontWeight: 700, padding: "5px 15px", borderRadius: 20,
            background: p === phase ? `${col[p]}25` : "rgba(255,255,255,0.02)",
            border: `1px solid ${p === phase ? `${col[p]}60` : "rgba(255,255,255,0.06)"}`,
            color: p === phase ? col[p] : C.muted,
            transition: "all 0.3s",
          }}>
            {p === "inhale" ? "Inhale 4s" : p === "hold" ? "Hold 7s" : "Exhale 8s"}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Preferences Modal ─────────────────────────────────────────────────────────
function PreferencesModal({ onClose }) {
  const { user, updatePreferences } = useAuth();
  const [focusDuration, setFocusDuration] = useState(user?.preferences?.focusDuration || 25);
  const [breakDuration, setBreakDuration] = useState(user?.preferences?.breakDuration || 5);
  const [socialGapHours, setSocialGapHours] = useState(user?.preferences?.socialGapHours || 48);
  const [notifs, setNotifs] = useState({
    hydration: user?.preferences?.notifications?.hydration ?? true,
    socialPing: user?.preferences?.notifications?.socialPing ?? true,
    moodReminder: user?.preferences?.notifications?.moodReminder ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updatePreferences({
        focusDuration: Number(focusDuration),
        breakDuration: Number(breakDuration),
        socialGapHours: Number(socialGapHours),
        notifications: notifs,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(3, 5, 8, 0.8)",
        backdropFilter: "blur(10px)", zIndex: 90,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        style={{
          width: "100%", maxWidth: 440, background: "var(--s1-solid)",
          border: `1px solid ${C.border}`, borderRadius: 20, padding: "2rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.65)", position: "relative"
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, background: "transparent",
          border: "none", color: C.muted, cursor: "pointer", fontSize: 16, transition: "color 0.2s"
        }}
          onMouseEnter={(e) => e.target.style.color = C.coral}
          onMouseLeave={(e) => e.target.style.color = C.muted}
        >✕</button>

        <div style={{ fontSize: 17, fontWeight: 800, color: C.teal, marginBottom: 4 }}>
          ⚙ Settings
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: "1.5rem" }}>
          Configure your Pomodoro blocks and wellness nudge parameters
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: "0.5px" }}>FOCUS SESSION (MIN)</label>
              <input type="number" min="5" max="90" value={focusDuration}
                onChange={e => setFocusDuration(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: "0.5px" }}>BREAK DURATION (MIN)</label>
              <input type="number" min="1" max="30" value={breakDuration}
                onChange={e => setBreakDuration(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: "0.5px" }}>SOCIAL CHAT GAP THRESHOLD (HOURS)</label>
            <input type="number" min="1" max="168" value={socialGapHours}
              onChange={e => setSocialGapHours(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11, background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: "0.5px" }}>WORKSPACE NOTIFICATIONS</div>
            
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, cursor: "pointer", color: C.text }}>
              <input type="checkbox" checked={notifs.hydration}
                onChange={e => setNotifs(prev => ({ ...prev, hydration: e.target.checked }))}
                style={{ accentColor: C.teal }} />
              💧 2-Hour Hydration Alerts
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, cursor: "pointer", color: C.text }}>
              <input type="checkbox" checked={notifs.socialPing}
                onChange={e => setNotifs(prev => ({ ...prev, socialPing: e.target.checked }))}
                style={{ accentColor: C.teal }} />
              📞 Social Gap Reminder
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, cursor: "pointer", color: C.text }}>
              <input type="checkbox" checked={notifs.moodReminder}
                onChange={e => setNotifs(prev => ({ ...prev, moodReminder: e.target.checked }))}
                style={{ accentColor: C.teal }} />
              💫 9:00 PM Daily Mood Logger
            </label>
          </div>

          {success && (
            <div style={{ color: C.teal, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
              ✓ Preferences updated and synced!
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            background: saving ? "rgba(255,255,255,0.05)" : C.teal, 
            border: "none", 
            borderRadius: 9,
            padding: "12px", 
            color: "var(--bg)", 
            fontWeight: 700, 
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 12, 
            transition: "all 0.2s"
          }}
            onMouseEnter={(e) => { if(!saving) e.target.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { if(!saving) e.target.style.filter = "none"; }}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout }                    = useAuth();
  const { nudges, dismissNudge, connected } = useSocket();
  const [sos, setSos]                       = useState(false);
  const [showPrefs, setShowPrefs]           = useState(false);
  const navigate                            = useNavigate();
  const queryClient                         = useQueryClient();

  // Auto-refresh checklist and tasks when date changes
  useEffect(() => {
    let lastDate = new Date().toDateString();
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["mood"] });
      }
    }, 10000); // Check every 10 seconds for date changes
    return () => clearInterval(interval);
  }, [queryClient]);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // Clean up all background audio streams when AppLayout unmounts (e.g. logout)
  useEffect(() => {
    return () => {
      ambientAudio.stopAll();
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const handleLogout = (e) => {
    e.stopPropagation(); // prevent opening prefs modal
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontSize: 14 }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 230, 
        background: "var(--s1-solid)", 
        borderRight: `1px solid ${C.border}`,
        display: "flex", 
        flexDirection: "column", 
        padding: "2rem 1.25rem",
        gap: 6, 
        position: "sticky", 
        top: 0, 
        height: "100vh", 
        flexShrink: 0,
        boxSizing: "border-box",
        transition: "all 0.25s ease",
      }} className="saas-sidebar">
        <div style={{ padding: "0 6px", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: connected ? "var(--teal)" : "var(--coral)",
            }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--teal)", letterSpacing: "-0.8px" }}>Moodwill</div>
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, letterSpacing: "1.5px", fontWeight: 700 }}>WORKSPACE v1.2</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}
              style={({ isActive }) => ({
                background: isActive ? "var(--s2)" : "transparent",
                border: "1px solid transparent",
                borderRadius: 8, 
                padding: "10px 12px",
                color: isActive ? "var(--text)" : "var(--muted)",
                fontSize: 12.5, 
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none", 
                display: "flex", 
                alignItems: "center", 
                gap: 10,
                transition: "all 0.2s ease",
              })}
              className="saas-nav-link"
            >
              {({ isActive }) => (
                <>
                  <span style={{ display: "flex", alignItems: "center", color: isActive ? "var(--teal)" : "var(--muted)" }}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          style={{
            background: "var(--s2)",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "10px",
            color: "var(--text)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--s3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--s2)"; }}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* SOS button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSos(true)} 
          style={{
            background: "var(--gradient-coral)",
            border: "none", 
            borderRadius: 8, 
            padding: "12px",
            color: "#fff", 
            fontSize: 11.5, 
            fontWeight: 700, 
            cursor: "pointer",
            letterSpacing: "0.5px", 
            marginBottom: 12,
            boxShadow: "var(--shadow-coral)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>🧘</span> Quick Breather
        </motion.button>

        {/* Profile Card & Settings Link */}
        <div 
          onClick={() => setShowPrefs(true)}
          style={{
            background: "var(--s2)", 
            borderRadius: 10, 
            padding: "10px 12px",
            display: "flex", 
            alignItems: "center", 
            gap: 10,
            cursor: "pointer",
            border: `1px solid ${C.border}`,
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--s3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--s2)"; }}
        >
          <div style={{
            width: 32, 
            height: 32, 
            borderRadius: "50%",
            background: "rgba(45, 212, 191, 0.12)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: 13, 
            color: "var(--teal)", 
            fontWeight: 700,
            border: `1px solid ${C.border}`,
          }}>
            {user?.name?.[0]?.toUpperCase() || "D"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: 12, 
              color: "var(--text)", 
              fontWeight: 600, 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              {user?.name || "Dev"} 
              <span style={{ fontSize: 11, color: "var(--muted)" }}>⚙</span>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ 
                background: "none", 
                border: "none", 
                color: "var(--muted)", 
                fontSize: 9.5, 
                cursor: "pointer", 
                padding: 0, 
                fontFamily: "inherit",
                display: "block",
                textAlign: "left",
                marginTop: 1,
              }}
              onMouseEnter={(e) => e.target.style.color = "var(--coral)"}
              onMouseLeave={(e) => e.target.style.color = "var(--muted)"}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "3rem 4rem", maxHeight: "100vh", boxSizing: "border-box" }} className="saas-main-content">
        <Outlet />
      </div>

      {/* ── Nudge Toasts ── */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, zIndex: 50 }}>
        <AnimatePresence>
          {nudges.filter((n) => !n.seen).slice(0, 3).map((n) => (
            <NudgeToast key={n.id} nudge={n} onDismiss={dismissNudge} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── SOS Overlay ── */}
      <AnimatePresence>
        {sos && <SOSOverlay onClose={() => setSos(false)} />}
      </AnimatePresence>

      {/* ── Preferences Modal ── */}
      <AnimatePresence>
        {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
      </AnimatePresence>
    </div>
  );
}
