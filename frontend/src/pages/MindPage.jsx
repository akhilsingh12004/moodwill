import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMood, useBreathing } from "../hooks/index.js";
import { ambientAudio } from "../utils/audioSynth.js";

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

const MOODS = ["😔", "😕", "😐", "🙂", "😄"];
const PHASE_COLOR = { inhale: "var(--teal)", hold: "var(--blue)", exhale: "var(--purple)" };
const PHASE_MSG   = { inhale: "Breathe in slowly…", hold: "Hold gently…", exhale: "Let it all go…" };

const SOUNDS = [
  { id: "rain",  label: "Deep Rain",         icon: "🌧" },
  { id: "lofi",  label: "Focus Binaural",    icon: "🧘" },
  { id: "cafe",  label: "Campfire Crackle",  icon: "🔥" },
  { id: "noise", label: "Brown Noise",       icon: "〰" },
];

export default function MindPage() {
  const { todayMood, weeklyData, logMood, isLogging } = useMood();
  const { active, phase, countdown, start, stop }     = useBreathing();

  const [volumes,  setVolumes]  = useState(() => ({
    rain: Math.round(ambientAudio.volumes.rain * 100),
    lofi: Math.round(ambientAudio.volumes.lofi * 100),
    cafe: Math.round(ambientAudio.volumes.cafe * 100),
    noise: Math.round(ambientAudio.volumes.noise * 100),
  }));
  const [soundsOn, setSoundsOn] = useState(() => ({
    rain: ambientAudio.playing.rain,
    lofi: ambientAudio.playing.lofi,
    cafe: ambientAudio.playing.cafe,
    noise: ambientAudio.playing.noise,
  }));
  const [moodNote, setMoodNote] = useState("");

  // Local audio states
  const [localAudioFile, setLocalAudioFile] = useState(null);
  const [localAudioPlaying, setLocalAudioPlaying] = useState(false);
  const [localAudioVol, setLocalAudioVol] = useState(50);
  const [localAudioName, setLocalAudioName] = useState("");
  const audioRef = useRef(null);

  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalAudioName(file.name);
    setLocalAudioFile(url);
    setLocalAudioPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  };

  const handleToggleLocalAudio = () => {
    if (!localAudioFile) return;
    if (localAudioPlaying) {
      audioRef.current.pause();
      setLocalAudioPlaying(false);
    } else {
      if (ambientAudio.ctx && ambientAudio.ctx.state === "suspended") {
        ambientAudio.ctx.resume();
      }
      audioRef.current.play().then(() => {
        setLocalAudioPlaying(true);
      }).catch(err => console.error(err));
    }
  };

  const handleLocalVolumeChange = (vol) => {
    setLocalAudioVol(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  };

  // Sync volumes on mount
  useEffect(() => {
    Object.entries(volumes).forEach(([id, val]) => {
      ambientAudio.setVolume(id, val);
    });
  }, []);

  // Hook up breathing guide audio tone cues
  useEffect(() => {
    if (active) {
      if (phase === "inhale") {
        ambientAudio.playBreatheTone(180, 3.8); // low tone
      } else if (phase === "exhale") {
        ambientAudio.playBreatheTone(240, 7.8); // high tone
      }
    }
  }, [active, phase]);

  const currentMood = todayMood?.moodLevel || null;

  const handleMood = async (level) => {
    await logMood({ moodLevel: level, note: moodNote });
    setMoodNote("");
  };

  const handleToggleSound = (id) => {
    const isPlaying = ambientAudio.toggle(id);
    setSoundsOn((prev) => ({ ...prev, [id]: isPlaying }));
  };

  const handleVolumeChange = (id, value) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
    ambientAudio.setVolume(id, value);
  };

  const circleSize = active ? (phase === "exhale" ? 80 : 140) : 100;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px" }}>◎ Mindfulness Center</h1>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>
          Decompress fatigue with Web Audio synthesized soundscapes, deep breathing visual pacers, and mood logs.
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="saas-grid-2col">

        {/* Breathing Pacer */}
        <Box>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            🌬 Deep Breathing Pacer
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "1rem 0" }}>
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: "100%" }}>
              {active && (
                <motion.div
                  animate={{ scale: phase === "inhale" ? [1, 1.15, 1] : 1, opacity: [0.08, 0.18, 0.08] }}
                  transition={{ duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : 8, repeat: Infinity }}
                  style={{
                    position: "absolute",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: PHASE_COLOR[phase],
                    filter: "blur(20px)",
                  }}
                />
              )}
              
              <motion.div
                animate={{ width: circleSize, height: circleSize }}
                transition={{
                  duration: phase === "inhale" ? 4 : phase === "hold" ? 0.3 : 8,
                  ease: "easeInOut",
                }}
                style={{
                  borderRadius: "50%",
                  background: active ? `${PHASE_COLOR[phase]}10` : "var(--s2)",
                  border: `2px solid ${active ? PHASE_COLOR[phase] : "var(--border)"}`,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  {active ? (
                    <div style={{ fontSize: 32, fontWeight: 700, color: PHASE_COLOR[phase], fontFamily: "inherit", lineHeight: 1 }}>
                      {countdown}
                    </div>
                  ) : (
                    <div style={{ fontSize: 18 }}>🧘</div>
                  )}
                  <div style={{ fontSize: 9.5, color: active ? PHASE_COLOR[phase] : "var(--muted)", letterSpacing: "1.5px", fontWeight: 700, marginTop: 4 }}>
                    {active ? phase.toUpperCase() : "READY"}
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 13, color: PHASE_COLOR[phase], fontStyle: "italic", fontWeight: 500 }}
                  >
                    {PHASE_MSG[phase]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, letterSpacing: "0.5px" }}>
              Rhythm: 4s Inhale · 7s Hold · 8s Exhale
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={active ? stop : start}
              style={{
                background: active ? "transparent" : "var(--teal)",
                border: "1px solid var(--teal)",
                borderRadius: 8, 
                padding: "10px 24px",
                color: active ? "var(--teal)" : "var(--bg)",
                fontWeight: 700, 
                fontSize: 12.5, 
                cursor: "pointer", 
                fontFamily: "inherit",
              }}>
              {active ? "Stop Breathing" : "Begin Breathing"}
            </motion.button>

            {active && (
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {["inhale", "hold", "exhale"].map((p) => (
                  <span key={p} style={{
                    fontSize: 9.5, 
                    fontWeight: 700,
                    padding: "4px 12px", 
                    borderRadius: 20,
                    background: phase === p ? `${PHASE_COLOR[p]}15` : "transparent",
                    border: `1px solid ${phase === p ? PHASE_COLOR[p] : "var(--border)"}`,
                    color: phase === p ? PHASE_COLOR[p] : "var(--muted)",
                    transition: "all 0.3s",
                    textTransform: "capitalize"
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Box>

        {/* Mood Pulse */}
        <Box>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            💫 Daily Mood Pulse
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            {MOODS.map((e, i) => (
              <motion.button
                key={i} 
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMood(i + 1)}
                disabled={isLogging}
                style={{
                  fontSize: 22, 
                  background: currentMood === i + 1 ? "rgba(45, 212, 191, 0.08)" : "var(--s2)",
                  border: `1px solid ${currentMood === i + 1 ? "var(--teal)" : "var(--border)"}`,
                  borderRadius: 8, 
                  padding: "8px 12px", 
                  cursor: "pointer",
                  transition: "all 0.2s",
                  outline: "none"
                }}
              >{e}</motion.button>
            ))}
          </div>

          {currentMood && (
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--teal)", marginBottom: 12, fontWeight: 500 }}>
              Logged Today: {MOODS[currentMood - 1]} {todayMood?.note ? `· "${todayMood.note}"` : ""}
            </div>
          )}

          <input
            value={moodNote} 
            onChange={(e) => setMoodNote(e.target.value)}
            placeholder="Add an optional comment..."
            style={{ 
              width: "100%", 
              background: "var(--s2)", 
              border: "1px solid var(--border)", 
              borderRadius: 8, 
              padding: "10px 14px", 
              color: "var(--text)", 
              fontSize: 12.5, 
              outline: "none", 
              fontFamily: "inherit", 
              marginBottom: 16, 
              boxSizing: "border-box",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--teal)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />

          <div style={{ height: 120, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--s1-solid)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 11, fontWeight: 500 }}
                  formatter={(v) => [v ? MOODS[v - 1] : "—", "Mood Score"]}
                />
                <Area type="monotone" dataKey="level" stroke="var(--teal)" fill="url(#mg)" strokeWidth={2}
                  dot={{ r: 3, fill: "var(--teal)", strokeWidth: 0 }} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 12, fontWeight: 500 }}>
            7-day history trend graph · tap emojis to save state
          </div>
        </Box>

        {/* Sound Mixer */}
        <Box style={{ gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 16, fontSize: 14, letterSpacing: "0.5px" }}>
            🎵 Ambient Soundscape Mixer
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="saas-grid-4col">
            {SOUNDS.map((snd) => (
              <div key={snd.id} style={{
                background: soundsOn[snd.id] ? "rgba(45, 212, 191, 0.04)" : "var(--s2)",
                border: `1px solid ${soundsOn[snd.id] ? "var(--teal)" : "var(--border)"}`,
                borderRadius: 14, 
                padding: "16px 12px", 
                textAlign: "center", 
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{snd.icon}</div>
                <div style={{ fontSize: 13, color: soundsOn[snd.id] ? "var(--teal)" : "var(--text)", fontWeight: 700, marginBottom: 12 }}>
                  {snd.label}
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggleSound(snd.id)}
                  style={{
                    background: soundsOn[snd.id] ? "var(--teal)" : "transparent",
                    border: `1px solid ${soundsOn[snd.id] ? "var(--teal)" : "var(--border)"}`,
                    borderRadius: 6, 
                    padding: "6px 0", 
                    color: soundsOn[snd.id] ? "var(--bg)" : "var(--muted)",
                    fontSize: 10, 
                    fontWeight: 700, 
                    cursor: "pointer", 
                    width: "100%", 
                    marginBottom: 12, 
                    fontFamily: "inherit",
                    letterSpacing: "0.5px"
                  }}
                >
                  {soundsOn[snd.id] ? "Playing" : "Muted"}
                </motion.button>
                
                <input type="range" min={0} max={100} value={volumes[snd.id]}
                  onChange={(e) => handleVolumeChange(snd.id, +e.target.value)}
                  style={{ width: "95%", accentColor: "var(--teal)", cursor: "pointer" }}
                />
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6, fontFamily: "monospace" }}>{volumes[snd.id]}%</div>
              </div>
            ))}
          </div>

          {/* ── Custom Soundtrack & Application Integration ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid var(--border)`,
          }} className="saas-grid-2col">
            {/* Column 1: Play Local File */}
            <div style={{
              background: "var(--s2)",
              borderRadius: 14,
              padding: 16,
              border: `1px solid var(--border)`,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                💿 Play Local Audio File
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{
                  background: "var(--s1-solid)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--text)",
                  transition: "all 0.2s"
                }}
                  onMouseEnter={(e) => e.target.style.borderColor = "var(--teal)"}
                  onMouseLeave={(e) => e.target.style.borderColor = "var(--border)"}
                >
                  📁 Select Audio
                  <input type="file" accept="audio/*" onChange={handleLocalFileChange} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: 11, color: "var(--muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
                  {localAudioName || "No file selected"}
                </div>
              </div>
              
              {localAudioFile && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleLocalAudio}
                    style={{
                      background: "var(--teal)",
                      border: "none",
                      borderRadius: 8,
                      width: 34,
                      height: 34,
                      color: "var(--bg)",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      outline: "none"
                    }}
                  >
                    {localAudioPlaying ? "⏸" : "▶"}
                  </motion.button>
                  <div style={{ flex: 1 }}>
                    <input type="range" min={0} max={100} value={localAudioVol}
                      onChange={(e) => handleLocalVolumeChange(+e.target.value)}
                      style={{ width: "100%", accentColor: "var(--teal)", cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", marginTop: 4, fontFamily: "monospace" }}>
                      <span>VOLUME</span>
                      <span>{localAudioVol}%</span>
                    </div>
                  </div>
                </div>
              )}
              <audio ref={audioRef} loop style={{ display: "none" }} />
            </div>

            {/* Column 2: Launch Apps */}
            <div style={{
              background: "var(--s2)",
              borderRadius: 14,
              padding: 16,
              border: `1px solid var(--border)`,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🎧 Launch Desktop Music App
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Spotify", icon: "🟢", url: "spotify:" },
                  { label: "Apple Music", icon: "🍎", url: "musics:" },
                  { label: "YT Music", icon: "🔴", url: "https://music.youtube.com" },
                  { label: "SoundCloud", icon: "🟠", url: "https://soundcloud.com" },
                ].map((app) => (
                  <motion.a
                    key={app.label}
                    href={app.url}
                    target={app.url.startsWith("http") ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, borderColor: "var(--purple)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: "var(--s1-solid)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "border-color 0.2s"
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{app.icon}</span>
                    {app.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </Box>

        {/* Wellness routines */}
        <Box style={{ gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: 14, letterSpacing: "0.5px" }}>
            🎧 Screen Fatigue Mitigation Routines
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>3-minute sensory resets · close eyes completely during execution.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="saas-grid-3col">
            {[
              { icon: "👁", title: "Visual Eye Stretch", duration: "3 min duration",
                steps: ["Close eyes and relax brow", "Roll clockwise gently 5×", "Pivot perspective: far → near", "Cover eyelids with warm palms"] },
              { icon: "🦴", title: "Cervical Release", duration: "2 min duration",
                steps: ["Drop chin slowly to chest", "Tilt left ear to shoulder (5s)", "Tilt right ear to shoulder (5s)", "Perform 3 slow neck rotations"] },
              { icon: "🤲", title: "Carpal Hand Reset", duration: "1 min duration",
                steps: ["Shake hands out loosely", "Rotate wrists outward 10×", "Extend digits as wide as possible", "Squeeze fists tight, then release"] },
            ].map((r) => (
              <div key={r.title} style={{ 
                background: "var(--s2)", 
                borderRadius: 14, 
                padding: 14,
                border: "1px solid var(--border)",
                borderTop: `3px solid var(--purple)`
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--purple)" }}>{r.title}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10, fontWeight: 600 }}>{r.duration}</div>
                {r.steps.map((s, j) => (
                  <div key={j} style={{ 
                    fontSize: 11.5, 
                    color: "var(--text)", 
                    padding: "4px 0", 
                    borderBottom: j < r.steps.length - 1 ? "1px solid var(--border)" : "none",
                    fontWeight: 500,
                  }}>
                    {j + 1}. {s}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  );
}
