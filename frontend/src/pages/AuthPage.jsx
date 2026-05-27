import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

import { C } from "../theme.js";

const Input = ({ label, type = "text", value, onChange, placeholder, error }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.5px", fontWeight: 600 }}>
      {label}
    </label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", 
        background: "var(--s2)", 
        border: `1px solid ${error ? "var(--coral)" : "var(--border)"}`,
        borderRadius: 8, 
        padding: "12px 16px", 
        color: "var(--text)", 
        fontSize: 14,
        outline: "none", 
        fontFamily: "inherit", 
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--teal)"; }}
      onBlur={(e) => { if (!error) e.target.style.borderColor = "var(--border)"; }}
    />
    {error && <div style={{ fontSize: 11, color: "var(--coral)", marginTop: 4 }}>{error}</div>}
  </div>
);

const SubmitBtn = ({ children, loading, color = "var(--teal)" }) => (
  <button
    type="submit" disabled={loading}
    style={{
      width: "100%", 
      background: loading ? "var(--s3)" : color,
      border: "none", 
      borderRadius: 8, 
      padding: "14px",
      color: loading ? "var(--muted)" : "var(--bg)", 
      fontWeight: 700,
      fontSize: 14, 
      cursor: loading ? "not-allowed" : "pointer",
      transition: "all 0.2s", 
      fontFamily: "inherit",
      letterSpacing: "0.5px",
    }}
  >
    {loading ? "Loading…" : children}
  </button>
);

export default function AuthPage() {
  const [mode, setMode]       = useState("login");   // "login" | "register"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "register") await register(name, email, password);
      else                     await login(email, password);
      navigate("/");
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", 
      background: "var(--bg)", 
      display: "flex",
      alignItems: "center", 
      justifyContent: "center",
      padding: 20
    }}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%", 
          maxWidth: 440, 
          background: "var(--s1-solid)",
          border: "1px solid var(--border)", 
          borderRadius: 16, 
          padding: "2.5rem",
          position: "relative",
          boxShadow: "var(--shadow-glass)"
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--teal)", letterSpacing: "-1px" }}>
            Moodwill
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, letterSpacing: "1px" }}>
            DAILY WELLNESS WORKSPACE
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "grid", 
          gridTemplateColumns: "1fr 1fr",
          background: "var(--s3)", 
          borderRadius: 8, 
          padding: 4, 
          marginBottom: "1.5rem",
        }}>
          {["login", "register"].map((m) => (
            <button
              key={m} onClick={() => { setMode(m); setErr(""); }}
              style={{
                background: mode === m ? "var(--s1-solid)" : "transparent",
                border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 6, 
                padding: "8px", 
                color: mode === m ? "var(--text)" : "var(--muted)",
                fontSize: 12, 
                fontWeight: mode === m ? 700 : 500,
                cursor: "pointer", 
                textTransform: "capitalize", 
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
          >
            {mode === "register" && (
              <Input label="NAME" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            )}
            <Input label="EMAIL" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="PASSWORD" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

            {err && (
              <div style={{
                background: "rgba(251, 113, 133, 0.08)", 
                border: "1px solid var(--coral)",
                borderRadius: 8, 
                padding: "10px 14px", 
                marginBottom: 16,
                fontSize: 12.5, 
                color: "var(--coral)",
              }}>
                {err}
              </div>
            )}

            <SubmitBtn loading={loading}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </SubmitBtn>
          </motion.form>
        </AnimatePresence>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
          {mode === "login"
            ? "No account? "
            : "Already have one? "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
