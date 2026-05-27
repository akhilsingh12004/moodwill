import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useBrags, usePomodoro } from "../hooks/index.js";
import { triggerConfetti } from "../utils/confetti";

import { C } from "../theme";

const Box = ({ children, style = {} }) => (
  <div style={{
    background: "var(--s1-solid)",
    border: "1px solid var(--border)",
    borderRadius: 16, 
    padding: "2rem",
    boxShadow: "var(--shadow-glass)", 
    ...style,
  }}>{children}</div>
);

const CATS = ["Bug Fix", "New Skill", "Milestone", "PR Merged", "Test Pass", "Other"];

const CAT_COLORS = {
  "Bug Fix": "var(--coral)",
  "New Skill": "var(--teal)",
  "Milestone": "var(--amber)",
  "PR Merged": "var(--blue)",
  "Test Pass": "#10b981",
  "Other": "var(--purple)",
};

const CAT_GRADIENTS = {
  "Bug Fix": "var(--gradient-coral)",
  "New Skill": "var(--gradient-teal)",
  "Milestone": "var(--gradient-amber)",
  "PR Merged": "var(--gradient-blue)",
  "Test Pass": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "Other": "var(--gradient-purple)",
};

export default function TechPage() {
  const { user }          = useAuth();
  const { emit }          = useSocket();
  const focusMins         = user?.preferences?.focusDuration || 25;
  const breakMins         = user?.preferences?.breakDuration || 5;

  const { brags, stats, isLoading, addBrag, delBrag, isAdding } = useBrags({ limit: 30 });
  
  const { phase, seconds, running, sessions, pct, toggle, reset, skip, fmt } = usePomodoro({
    focusMins,
    breakMins,
    onComplete: (completedPhase) => {
      if (completedPhase === "focus") {
        emit("pomodoro:end", { completed: true });
        triggerConfetti();
      }
    },
  });

  const [title, setTitle] = useState("");
  const [cat,   setCat]   = useState("Bug Fix");
  const [completedBreaks, setCompletedBreaks] = useState({});

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addBrag({ title: title.trim(), category: cat });
    setTitle("");
    triggerConfetti();
  };

  const handleToggle = () => {
    if (!running) emit("pomodoro:start", { duration: focusMins });
    toggle();
  };

  const toggleBreak = (idx) => {
    setCompletedBreaks(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      const keys = [0, 1, 2, 3];
      const allDone = keys.every(k => next[k] === true);
      if (allDone) {
        triggerConfetti();
      }
      return next;
    });
  };

  const circ = 2 * Math.PI * 64;
  const phaseColor = phase === "focus" ? "var(--amber)" : "var(--teal)";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px" }}>📝 Developer Journal</h1>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>
          Record your engineering accomplishments, run focus sessions, and track micro-stretch habits.
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="saas-grid-2col">

        {/* LEFT — Brag Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Box>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
              🏆 Log New Achievement
            </div>
            
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="What did you ship today? 🚀"
                style={{
                  flex: 1, 
                  background: "var(--s2)", 
                  border: "1px solid var(--border)",
                  borderRadius: 8, 
                  padding: "10px 14px", 
                  color: "var(--text)",
                  fontSize: 13, 
                  outline: "none", 
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
              <select value={cat} onChange={(e) => setCat(e.target.value)}
                style={{ 
                  background: "var(--s2)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 8, 
                  padding: "10px", 
                  color: "var(--text)", 
                  fontSize: 12.5, 
                  fontFamily: "inherit", 
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              >
                {CATS.map((c) => <option key={c} value={c} style={{ background: "var(--s1-solid)", color: "var(--text)" }}>{c}</option>)}
              </select>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd} 
                disabled={isAdding || !title.trim()}
                style={{
                  background: isAdding ? "var(--s3)" : "var(--amber)", 
                  border: "none", 
                  borderRadius: 8,
                  padding: "10px 16px", 
                  color: "var(--bg)", 
                  fontWeight: 700,
                  cursor: isAdding ? "not-allowed" : "pointer", 
                  fontSize: 14,
                }}>
                {isAdding ? "…" : "Log"}
              </motion.button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
              {isLoading
                ? [1,2,3].map((i) => <div key={i} style={{ height: 38, background: "var(--s3)", borderRadius: 8, opacity: 0.5 }} />)
                : brags.map((b) => (
                    <motion.div 
                      key={b._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ 
                        display: "flex", 
                        gap: 10, 
                        alignItems: "center", 
                        background: "var(--s2)", 
                        border: "1px solid var(--border)",
                        borderRadius: 10, 
                        padding: "10px 12px",
                        transition: "all 0.2s" 
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <span style={{ 
                        fontSize: 9.5, 
                        fontWeight: 700,
                        background: `${CAT_COLORS[b.category] || "var(--amber)"}15`, 
                        color: CAT_COLORS[b.category] || "var(--amber)", 
                        padding: "3px 7px", 
                        borderRadius: 5, 
                        whiteSpace: "nowrap",
                        border: `1px solid ${CAT_COLORS[b.category] || "var(--amber)"}30`
                      }}>
                        {b.category}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text)", flex: 1, fontWeight: 500 }}>{b.title}</span>
                      <button onClick={() => delBrag(b._id)}
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "var(--muted)", 
                          cursor: "pointer", 
                          fontSize: 15, 
                          lineHeight: 1, 
                          padding: "0 4px",
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "var(--coral)"}
                        onMouseLeave={(e) => e.target.style.color = "var(--muted)"}
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
              {!isLoading && brags.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "2rem 0", fontStyle: "italic" }}>
                  Your log is empty. Record a commit, milestone or PR fix above! 🚀
                </div>
              )}
            </div>
          </Box>

          {/* Stats by category */}
          {stats.length > 0 && (
            <Box>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
                📊 Category Distribution
              </div>
              {stats.map((s) => (
                <div key={s._id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 500 }}>{s._id}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{s.count} logs</span>
                  </div>
                  <div style={{ height: 6, background: "var(--s3)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${brags.length ? (s.count / brags.length) * 100 : 0}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ 
                        height: "100%", 
                        background: CAT_GRADIENTS[s._id] || "var(--gradient-amber)", 
                        borderRadius: 3
                      }} 
                    />
                  </div>
                </div>
              ))}
            </Box>
          )}

          {/* Micro-stretch breaks */}
          <Box>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: 14, letterSpacing: "0.5px" }}>
              👁 Micro-Stretch Breaks
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Complete these compile-time activities during build runs.</div>
            {[
              "Roll eyes in complete circles — 10 seconds",
              "Focus alt: far horizon, then your hand (3×)",
              "Close eyes & take deep belly breaths to 5",
              "Roll shoulders back × 5, then forward × 5",
            ].map((ex, i) => {
              const done = completedBreaks[i] === true;
              return (
                <div 
                  key={i} 
                  onClick={() => toggleBreak(i)}
                  style={{ 
                    display: "flex", 
                    gap: 10, 
                    alignItems: "center", 
                    background: done ? "rgba(167, 139, 250, 0.06)" : "var(--s2)", 
                    border: `1px solid ${done ? "rgba(167, 139, 250, 0.2)" : "var(--border)"}`,
                    borderRadius: 10, 
                    padding: "12px 14px", 
                    marginBottom: 8,
                    cursor: "pointer",
                    transition: "all 0.2s" 
                  }}
                  onMouseEnter={(e) => { if (!done) e.currentTarget.style.borderColor = "var(--purple)"; }}
                  onMouseLeave={(e) => { if (!done) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `1.5px solid var(--purple)`,
                    background: done ? "var(--purple)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {done && <span style={{ fontSize: 9, color: "var(--bg)", fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ 
                    fontSize: 12.5, 
                    color: done ? "var(--muted)" : "var(--text)",
                    textDecoration: done ? "line-through" : "none",
                    fontWeight: 500
                  }}>
                    {ex}
                  </span>
                </div>
              );
            })}
          </Box>
        </div>

        {/* RIGHT — Pomodoro */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Box>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⏱ Focus Session</span>
              {sessions > 0 && (
                <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, background: "var(--s2)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 20 }}>
                  {sessions} completed today
                </span>
              )}
            </div>

            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: phaseColor, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 20 }}>
                {phase === "focus" ? "Deep Focus Active" : "Break Interval"}
              </div>

              {/* Clean thin circular timer */}
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={70} cy={70} r={64} fill="none" stroke="var(--border)" strokeWidth={3} />
                  <motion.circle
                    cx={70} cy={70} r={64} fill="none" stroke={phaseColor}
                    strokeWidth={3} strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct / 100)}
                    style={{ 
                      transition: "stroke-dashoffset 1s linear, stroke 0.5s",
                    }}
                  />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", fontFamily: "inherit" }}>
                    {fmt(seconds)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleToggle}
                  style={{
                    background: running ? "transparent" : phaseColor,
                    border: running ? `1.5px solid ${phaseColor}` : "none",
                    borderRadius: 8, 
                    padding: "10px 24px",
                    color: running ? phaseColor : "var(--bg)",
                    fontWeight: 700, 
                    fontSize: 12.5, 
                    cursor: "pointer", 
                    fontFamily: "inherit",
                  }}>
                  {running ? "Pause" : "Start Session"}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={skip}
                  style={{ 
                    background: "transparent", 
                    border: "1px solid var(--border)", 
                    borderRadius: 8, 
                    padding: "10px 16px", 
                    color: "var(--muted)", 
                    cursor: "pointer", 
                    fontSize: 12.5, 
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = "var(--text)"}
                  onMouseLeave={(e) => e.target.style.borderColor = "var(--border)"}
                >
                  Skip
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  style={{ 
                    background: "transparent", 
                    border: "1px solid var(--border)", 
                    borderRadius: 8, 
                    padding: "10px 14px", 
                    color: "var(--muted)", 
                    cursor: "pointer", 
                    fontFamily: "inherit",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = "var(--text)"}
                  onMouseLeave={(e) => e.target.style.borderColor = "var(--border)"}
                >
                  ↺
                </motion.button>
              </div>

              <div style={{ marginTop: 20, fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
                Focus: {focusMins}m · Break: {breakMins}m
                <span style={{ marginLeft: 6, color: "var(--teal)" }}>
                  (configure in Settings)
                </span>
              </div>
            </div>
          </Box>

          {/* Mindset anchors */}
          <Box>
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
              💡 Mindset Anchors
            </div>
            {[
              { q: "Everyone Googles, reads docs, and asks questions.", sub: "Knowing how to find solutions is the core engineering skill." },
              { q: "Bugs are a normal, expected byproduct of coding.", sub: "No bugs means you aren't writing any new features." },
              { q: "You don't need to commit everything to memory.", sub: "You need architectural intuition and problem-solving drive." },
            ].map((item, i) => (
              <div key={i} style={{ 
                background: "var(--s2)", 
                borderRadius: 10, 
                padding: "12px 14px", 
                marginBottom: 10, 
                borderLeft: `3px solid var(--teal)`,
                border: "1px solid var(--border)",
                borderLeftWidth: 3,
              }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700 }}>{item.q}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            ))}
          </Box>
        </div>
      </div>
    </div>
  );
}
