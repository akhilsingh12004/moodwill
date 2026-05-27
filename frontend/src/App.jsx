import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider }         from "@tanstack/react-query";
import { AuthProvider, useAuth }                    from "./context/AuthContext.jsx";
import { SocketProvider }                           from "./context/SocketContext.jsx";

import AppLayout  from "./components/layout/AppLayout.jsx";
import AuthPage   from "./pages/AuthPage.jsx";
import HomePage   from "./pages/HomePage.jsx";
import TechPage   from "./pages/TechPage.jsx";
import SoloPage   from "./pages/SoloPage.jsx";
import MindPage   from "./pages/MindPage.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Guard: redirect to /login if not authenticated ────────────────────────────
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--teal)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15,
        fontWeight: 600,
      }}>
        Loading Moodwill…
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ── Main router ───────────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route path="/" element={
        <PrivateRoute>
          <SocketProvider>
            <AppLayout />
          </SocketProvider>
        </PrivateRoute>
      }>
        <Route index       element={<HomePage />} />
        <Route path="tech" element={<TechPage />} />
        <Route path="solo" element={<SoloPage />} />
        <Route path="mind" element={<MindPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
