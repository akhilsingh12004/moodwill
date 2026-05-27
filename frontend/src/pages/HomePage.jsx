import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBrags, useTasks, useMood } from "../hooks/index.js";

import { C } from "../theme";

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" },
});

const StatCard = ({ label, value, unit, color, onClick, i }) => (
  <motion.div 
    {...fadeUp(i)} 
    onClick={onClick}
    style={{
      background: "var(--s1-solid)",
      border: "1px solid var(--border)",
      borderRadius: 16, 
      padding: "2rem 1.75rem", 
      cursor: onClick ? "pointer" : "default",
      boxShadow: "var(--shadow-glass)",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.25s ease",
    }}
    whileHover={onClick ? { 
      y: -2, 
      borderColor: color,
      boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
    } : {}}
  >
    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: color, margin: "12px 0 6px 0", lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>{unit}</div>
  </motion.div>
);

const PillarCard = ({ emoji, color, gradient, title, sub, progress, i, onClick }) => (
  <motion.div 
    {...fadeUp(i)} 
    onClick={onClick}
    style={{ 
      background: "var(--s1-solid)",
      border: "1px solid var(--border)",
      borderRadius: 16, 
      padding: "2rem 1.75rem", 
      cursor: "pointer", 
      boxShadow: "var(--shadow-glass)",
      position: "relative",
      transition: "all 0.25s ease",
    }}
    whileHover={{ 
      y: -2, 
      borderColor: color,
      boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ 
        width: 38, 
        height: 38, 
        borderRadius: 10, 
        background: `var(--s2)`, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: 18,
        border: `1px solid var(--border)`
      }}>
        {emoji}
      </div>
      <div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</span>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
    
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.5px" }}>COMPLETION RATE</span>
        <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{Math.round(progress)}%</span>
      </div>
      <div style={{ height: 6, background: "var(--s3)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} 
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", background: gradient || color, borderRadius: 3 }}
        />
      </div>
    </div>
  </motion.div>
);

export default function HomePage() {
  const { user }                     = useAuth();
  const navigate                     = useNavigate();
  const { brags, total: bragTotal, isLoading: bragsLoading } = useBrags({ limit: 5 });
  const { tasks }                    = useTasks();
  const { todayMood }                = useMood();

  const hr      = new Date().getHours();
  const greet   = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

  const doneTasks   = tasks.filter((t) => t.status === "Completed").length;
  const totalTasks  = tasks.length;
  const moodEmojis  = ["", "😔", "😕", "😐", "🙂", "😄"];
  const moodColors  = ["", "var(--coral)", "var(--purple)", "var(--muted)", "var(--blue)", "var(--teal)"];
  const currentMoodLevel = todayMood?.moodLevel || 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header section with profile name */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px" }}>
            {greet}, {user?.name || "Developer"}
          </h1>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>
            {dateStr} · Welcome to your personal SaaS dashboard
          </div>
        </div>
      </motion.div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 32 }}>
        <StatCard 
          i={1} 
          label="Journal Logs" 
          value={bragTotal} 
          unit="logged achievements" 
          color="var(--amber)" 
          onClick={() => navigate("/tech")} 
        />
        <StatCard 
          i={2} 
          label="Tasks Completed" 
          value={totalTasks ? `${doneTasks}/${totalTasks}` : "0/0"} 
          unit={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% daily progress` : "no active tasks"} 
          color="var(--coral)" 
          onClick={() => navigate("/solo")} 
        />
        <StatCard 
          i={3} 
          label="Mood Pulse" 
          value={moodEmojis[currentMoodLevel] || "—"} 
          unit={currentMoodLevel ? `daily level ${currentMoodLevel}/5 logged` : "no pulse logged today"} 
          color={moodColors[currentMoodLevel] || "var(--teal)"} 
          onClick={() => navigate("/mind")} 
        />
      </div>

      {/* Workspace Modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 32 }}>
        <PillarCard 
          i={4} 
          emoji="📝" 
          color="var(--amber)" 
          gradient="var(--gradient-amber)"
          title="Developer Journal" 
          sub="Achievement logs & focus timer" 
          progress={Math.min(100, bragTotal * 15)} 
          onClick={() => navigate("/tech")} 
        />
        <PillarCard 
          i={5} 
          emoji="✅" 
          color="var(--coral)" 
          gradient="var(--gradient-coral)"
          title="Routine & Tasks" 
          sub="Checklist, routines & speed-run" 
          progress={totalTasks ? (doneTasks / totalTasks) * 100 : 0} 
          onClick={() => navigate("/solo")} 
        />
        <PillarCard 
          i={6} 
          emoji="🧘" 
          color="var(--teal)" 
          gradient="var(--gradient-teal)"
          title="Mindfulness Center" 
          sub="Ambient mixer & breathing pacer" 
          progress={todayMood ? 100 : 25} 
          onClick={() => navigate("/mind")} 
        />
      </div>

      {/* Recent wins */}
      <motion.div 
        {...fadeUp(7)}
        style={{ 
          background: "var(--s1-solid)",
          border: "1px solid var(--border)",
          borderRadius: 16, 
          padding: "2rem", 
          boxShadow: "var(--shadow-glass)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, color: "var(--text)", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            🏆 Recent Achievements
          </h3>
          <button 
            onClick={() => navigate("/tech")}
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--muted)", 
              fontSize: 12, 
              cursor: "pointer", 
              fontWeight: 600,
              transition: "color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            onMouseEnter={(e) => e.target.style.color = "var(--amber)"}
            onMouseLeave={(e) => e.target.style.color = "var(--muted)"}
          >
            View journal →
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bragsLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{ height: 42, background: "var(--s3)", borderRadius: 10, opacity: 0.5 }} />
            ))
          ) : brags.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "2rem 0", fontStyle: "italic" }}>
              No logs recorded in your journal yet. Access your Developer Journal to log your first win! 🚀
            </div>
          ) : (
            brags.map((b, i) => (
              <motion.div 
                key={b._id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  padding: "12px 16px",
                  background: "var(--s2)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 700,
                  background: "rgba(251, 191, 36, 0.08)", 
                  color: "var(--amber)", 
                  padding: "4px 8px", 
                  borderRadius: 6, 
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(251, 191, 36, 0.18)"
                }}>
                  {b.category}
                </span>
                <span style={{ flex: 1, color: "var(--text)", fontSize: 13, fontWeight: 500 }}>{b.title}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                  {new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
