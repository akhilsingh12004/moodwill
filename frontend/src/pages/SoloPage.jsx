import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTasks, useChoreTimer } from "../hooks/index.js";
import { useSocket } from "../context/SocketContext";
import { triggerConfetti } from "../utils/confetti";

import { C } from "../theme";

const Box = ({ children, style = {} }) => (
  <div style={{
    background: "var(--s1-solid)",
    border: "1px solid var(--border)",
    borderRadius: 16, 
    padding: "1.75rem",
    boxShadow: "var(--shadow-glass)", 
    ...style,
  }}>{children}</div>
);

const NEEDS_CONFIG = [
  { key: "Sleep",  icon: "🌙", category: "Health" },
  { key: "Eat",    icon: "🍱", category: "Health" },
  { key: "Water",  icon: "💧", category: "Health" },
  { key: "Sun",    icon: "☀️", category: "Health" },
];

export default function SoloPage() {
  const { emit }                                    = useSocket();
  const { tasks, dailyNeeds, addTask, completeTask, deleteTask, isAdding } = useTasks();
  
  const [customChoreMins, setCustomChoreMins] = useState(() => {
    return parseInt(localStorage.getItem("pomo_custom_chore_mins") || "10", 10);
  });

  useEffect(() => {
    localStorage.setItem("pomo_custom_chore_mins", customChoreMins.toString());
  }, [customChoreMins]);

  const { seconds, running, done, pct, toggle, reset, fmt } = useChoreTimer(customChoreMins * 60);

  const [newTask, setNewTask]   = useState("");
  const [taskCat, setTaskCat]   = useState("Chore");
  const [taskFreq, setTaskFreq] = useState("Daily");

  // Trigger confetti upon chore speed-run completion!
  useEffect(() => {
    if (done) {
      triggerConfetti();
    }
  }, [done]);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    await addTask({ title: newTask.trim(), category: taskCat, frequency: taskFreq });
    setNewTask("");
  };

  const handleComplete = async (id, category) => {
    await completeTask(id);
    if (category === "Social") emit("social:activity");
    if (category === "Health") emit("water:log");
    triggerConfetti(); // Play confetti!
  };

  const choreCirc = 2 * Math.PI * 44;

  const choreTasks  = tasks.filter((t) => t.category === "Chore");
  const socialTasks = tasks.filter((t) => t.category === "Social");
  const healthTasks = tasks.filter((t) => t.category === "Health" && !["sleep", "eat", "water", "sun"].includes(t.title.toLowerCase()));
  const selfCareTasks = tasks.filter((t) => t.category === "Self-care");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px" }}>🌿 Routine & Tasks</h1>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>
          Manage your daily routines, log wellness habits, and focus with speed-run chore blocks.
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="saas-grid-2col">

        {/* Daily Reset */}
        <Box>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            ✅ Daily Wellness Checklist
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {NEEDS_CONFIG.map((n) => {
              const task = dailyNeeds.find((t) => t.title.toLowerCase().includes(n.key.toLowerCase()));
              const isCompleted = task?.status === "Completed";
              return (
                <motion.button
                  key={n.key}
                  whileHover={task && !isCompleted ? { scale: 1.02, borderColor: "var(--coral)" } : {}}
                  whileTap={task && !isCompleted ? { scale: 0.98 } : {}}
                  onClick={() => task && !isCompleted && handleComplete(task._id, task.category)}
                  style={{
                    background: isCompleted ? "rgba(251, 113, 133, 0.08)" : "var(--s2)",
                    border: `1px solid ${isCompleted ? "var(--coral)" : "var(--border)"}`,
                    borderRadius: 12, 
                    padding: "16px 12px",
                    color: isCompleted ? "var(--coral)" : "var(--muted)",
                    cursor: task && !isCompleted ? "pointer" : "default",
                    textAlign: "center", 
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none"
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6, filter: isCompleted ? "none" : "grayscale(40%)" }}>{n.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCompleted ? "var(--coral)" : "var(--text)" }}>{n.key}</div>
                  <div style={{ fontSize: 10, marginTop: 4, fontWeight: 500, color: isCompleted ? "var(--coral)" : "var(--muted)" }}>
                    {isCompleted ? "✓ Logged" : "Tap to log"}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Box>

        {/* Chore Speed-Run */}
        <Box>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: 14, letterSpacing: "0.5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚡ Speed-Run Focus Clock</span>
            {!running && !done && (
              <select 
                value={customChoreMins} 
                onChange={(e) => setCustomChoreMins(Number(e.target.value))}
                style={{ 
                  background: "var(--s2)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 6, 
                  padding: "2px 6px", 
                  color: "var(--text)", 
                  fontSize: 11, 
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {[1, 2, 5, 10, 15, 20, 25, 30].map(m => (
                  <option key={m} value={m} style={{ background: "var(--s1-solid)" }}>{m} min</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            Launch a swift {customChoreMins}-minute focus burst to clean your environment.
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={55} cy={55} r={44} fill="none" stroke="var(--border)" strokeWidth={3} />
                <motion.circle 
                  cx={55} 
                  cy={55} 
                  r={44} 
                  fill="none"
                  stroke={done ? "var(--teal)" : "var(--coral)"} 
                  strokeWidth={3} 
                  strokeLinecap="round"
                  strokeDasharray={choreCirc}
                  strokeDashoffset={choreCirc * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "var(--muted)", letterSpacing: "1px", fontWeight: 700, textTransform: "uppercase" }}>
                  {done ? "DONE!" : running ? "RUNNING" : "READY"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: done ? "var(--teal)" : "var(--coral)" }}>
                  {fmt(seconds)}
                </div>
              </div>
            </div>

            {done && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ fontSize: 12.5, color: "var(--teal)", fontWeight: 700 }}>
                🎉 Burst completed! Impressive focus.
              </motion.div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggle} 
                disabled={done}
                style={{
                  background: running ? "transparent" : "var(--coral)",
                  border: running ? `1.5px solid var(--coral)` : "none",
                  borderRadius: 8, 
                  padding: "8px 20px",
                  color: running ? "var(--coral)" : "var(--bg)",
                  fontWeight: 700, 
                  fontSize: 12.5, 
                  cursor: done ? "not-allowed" : "pointer", 
                  fontFamily: "inherit",
                }}>
                {running ? "Pause" : "Start Burst"}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                style={{ 
                  background: "transparent", 
                  border: "1px solid var(--border)", 
                  borderRadius: 8, 
                  padding: "8px 12px", 
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
            {running && <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>🎧 Pop on your focus playlist!</div>}
          </div>
        </Box>

        {/* Task Manager */}
        <Box style={{ gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            📋 Backlog Planner
          </div>

          {/* Add task */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input
              value={newTask} onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add a new task..."
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
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--coral)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <select value={taskCat} onChange={(e) => setTaskCat(e.target.value)}
              style={{ 
                background: "var(--s2)", 
                border: "1px solid var(--border)", 
                borderRadius: 8, 
                padding: "10px", 
                color: "var(--text)", 
                fontSize: 12.5, 
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--coral)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            >
              {["Chore", "Health", "Social", "Self-care"].map((c) => <option key={c} value={c} style={{ background: "var(--s1-solid)", color: "var(--text)" }}>{c}</option>)}
            </select>
            <select value={taskFreq} onChange={(e) => setTaskFreq(e.target.value)}
              style={{ 
                background: "var(--s2)", 
                border: "1px solid var(--border)", 
                borderRadius: 8, 
                padding: "10px", 
                color: "var(--text)", 
                fontSize: 12.5, 
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--coral)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            >
              {["Once", "Daily", "Weekly"].map((f) => <option key={f} value={f} style={{ background: "var(--s1-solid)", color: "var(--text)" }}>{f}</option>)}
            </select>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd} 
              disabled={isAdding || !newTask.trim()}
              style={{ 
                background: "var(--coral)", 
                border: "none", 
                borderRadius: 8, 
                padding: "10px 20px", 
                color: "var(--bg)", 
                fontWeight: 700, 
                cursor: "pointer", 
                fontSize: 13 
              }}
            >
              {isAdding ? "…" : "Add"}
            </motion.button>
          </div>

          {/* Task lists by category */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {[
              { label: "Chores Log",  color: "var(--coral)",  items: choreTasks },
              { label: "Social Sync",  color: "var(--amber)",  items: socialTasks },
              { label: "Health Tasks",  color: "var(--teal)",   items: healthTasks },
              { label: "Self-Care",     color: "var(--purple)", items: selfCareTasks },
            ].map((group) => (
              <div key={group.label} style={{ background: "var(--s2)", padding: 14, borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: group.color, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {group.label}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.items.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", padding: "8px 0" }}>No active tasks</div>
                  ) : (
                    group.items.map((t) => (
                      <motion.div 
                        key={t._id} 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          display: "flex", 
                          alignItems: "center", 
                          gap: 8,
                          background: "var(--s1)", 
                          border: "1px solid var(--border)",
                          borderRadius: 8, 
                          padding: "8px 10px",
                          opacity: t.status === "Completed" ? 0.6 : 1,
                          borderLeft: `3px solid ${t.status === "Completed" ? `${group.color}60` : group.color}`,
                          transition: "all 0.2s",
                        }}
                      >
                        <button
                          onClick={() => t.status !== "Completed" && handleComplete(t._id, t.category)}
                          style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: `1.5px solid ${group.color}`,
                            background: t.status === "Completed" ? group.color : "transparent",
                            cursor: t.status === "Completed" ? "default" : "pointer", 
                            flexShrink: 0, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            outline: "none",
                            transition: "all 0.15s"
                          }}
                        >
                          {t.status === "Completed" && <span style={{ fontSize: 8, color: "var(--bg)", fontWeight: 800 }}>✓</span>}
                        </button>
                        <span style={{ 
                          fontSize: 12, 
                          color: "var(--text)", 
                          flex: 1, 
                          textDecoration: t.status === "Completed" ? "line-through" : "none",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {t.title}
                        </span>
                        <button onClick={() => deleteTask(t._id)}
                          style={{ 
                            background: "none", 
                            border: "none", 
                            color: "var(--muted)", 
                            cursor: "pointer", 
                            fontSize: 14, 
                            padding: "0 2px",
                            transition: "color 0.2s" 
                          }}
                          onMouseEnter={(e) => e.target.style.color = "var(--coral)"}
                          onMouseLeave={(e) => e.target.style.color = "var(--muted)"}
                        >×</button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </Box>

        {/* Smart Nudges info */}
        <Box style={{ gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            🔔 Wellness Notifications & Nudge Frequencies
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="saas-grid-3col">
            {[
              { icon: "💧", type: "Hydration",   desc: "Fires every 2 hours if no water log has been recorded", freq: "Every 2 hours" },
              { icon: "☀️", type: "Outdoor Sun",  desc: "Fires morning, afternoon & evening to trigger outdoor rests", freq: "9:00AM · 3:00PM · 6:00PM" },
              { icon: "📞", type: "Social Ping", desc: "Fires automatically when social interaction gap exceeds threshold", freq: "Monitored hourly" },
            ].map((n, i) => (
              <div key={i} style={{ 
                background: "var(--s2)", 
                borderRadius: 12, 
                padding: 16, 
                border: "1px solid var(--border)",
                borderLeft: `3px solid var(--coral)`
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{n.icon}</div>
                <div style={{ fontSize: 12, color: "var(--coral)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{n.type}</div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4, marginBottom: 10, height: 36, overflow: "hidden" }}>{n.desc}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>⏱ {n.freq}</div>
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  );
}
