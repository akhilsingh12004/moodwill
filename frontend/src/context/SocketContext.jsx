import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [nudges,    setNudges]      = useState([]);  // queued nudges for the UI

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect with auth token
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Smart nudge from cron jobs
    socket.on("nudge", (nudge) => {
      setNudges((prev) => [
        { ...nudge, id: Date.now(), seen: false },
        ...prev.slice(0, 9),   // keep last 10
      ]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const emit = (event, data) => socketRef.current?.emit(event, data);

  const markNudgesSeen = () =>
    setNudges((prev) => prev.map((n) => ({ ...n, seen: true })));

  const dismissNudge = (id) =>
    setNudges((prev) => prev.filter((n) => n.id !== id));

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      nudges,
      unseenCount: nudges.filter((n) => !n.seen).length,
      emit,
      markNudgesSeen,
      dismissNudge,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");
  return ctx;
};
