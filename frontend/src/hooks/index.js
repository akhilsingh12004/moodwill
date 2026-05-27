import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bragService, taskService, moodService } from "../api/services";

// ─────────────────────────────────────────────────────────────────────────────
// useBrags — Brag Stack (Tech Core)
// ─────────────────────────────────────────────────────────────────────────────
export function useBrags(params = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["brags", params],
    queryFn:  () => bragService.getAll(params),
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ["brags", "stats"],
    queryFn:  bragService.getStats,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: bragService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brags"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: bragService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brags"] }),
  });

  return {
    brags:    query.data?.data || [],
    total:    query.data?.total || 0,
    stats:    statsQuery.data?.data || [],
    isLoading: query.isLoading,
    error:    query.error,
    addBrag:  createMutation.mutateAsync,
    delBrag:  deleteMutation.mutateAsync,
    isAdding: createMutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTasks — Solo Core tasks
// ─────────────────────────────────────────────────────────────────────────────
export function useTasks(params = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", params],
    queryFn:  () => taskService.getAll(params),
    staleTime: 30_000,
  });

  const dailyQuery = useQuery({
    queryKey: ["tasks", "daily"],
    queryFn:  taskService.getDailyReset,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const completeMutation = useMutation({
    mutationFn: taskService.complete,
    // Optimistic update — flip the task immediately in the cache
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      
      const prevTasks = qc.getQueryData(["tasks", params]);
      const prevDaily = qc.getQueryData(["tasks", "daily"]);

      // Update tasks query
      qc.setQueryData(["tasks", params], (old) => old
        ? { ...old, data: old.data.map((t) => t._id === id ? { ...t, status: "Completed" } : t) }
        : old
      );

      // Update daily needs query
      qc.setQueryData(["tasks", "daily"], (old) => old
        ? old.map((t) => t._id === id ? { ...t, status: "Completed" } : t)
        : old
      );

      return { prevTasks, prevDaily };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevTasks) qc.setQueryData(["tasks", params], ctx.prevTasks);
      if (ctx?.prevDaily) qc.setQueryData(["tasks", "daily"], ctx.prevDaily);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return {
    tasks:       query.data?.data || [],
    dailyNeeds:  dailyQuery.data  || [],
    isLoading:   query.isLoading,
    addTask:     createMutation.mutateAsync,
    completeTask:completeMutation.mutateAsync,
    deleteTask:  deleteMutation.mutateAsync,
    isAdding:    createMutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useMood — Sanctuary mood pulse
// ─────────────────────────────────────────────────────────────────────────────
export function useMood() {
  const qc = useQueryClient();

  const todayQuery = useQuery({
    queryKey: ["mood", "today"],
    queryFn:  moodService.getToday,
    staleTime: 60_000,
  });

  const weekQuery = useQuery({
    queryKey: ["mood", "week"],
    queryFn:  moodService.getWeek,
    staleTime: 60_000,
  });

  const logMutation = useMutation({
    mutationFn: moodService.logMood,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mood"] });
    },
  });

  return {
    todayMood:  todayQuery.data,
    weeklyData: weekQuery.data  || [],
    isLoading:  todayQuery.isLoading || weekQuery.isLoading,
    logMood:    logMutation.mutateAsync,
    isLogging:  logMutation.isPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// usePomodoro — Focus timer with phase switching
// ─────────────────────────────────────────────────────────────────────────────
export function usePomodoro({ focusMins = 25, breakMins = 5, onComplete } = {}) {
  const [phase, setPhase] = useState(() => {
    return localStorage.getItem("pomo_phase") || "focus";
  });
  const [running, setRunning] = useState(() => {
    return localStorage.getItem("pomo_running") === "true";
  });
  const [sessions, setSessions] = useState(() => {
    return parseInt(localStorage.getItem("pomo_sessions") || "0", 10);
  });

  const getPhaseDuration = (p) => (p === "focus" ? focusMins * 60 : breakMins * 60);

  const [seconds, setSeconds] = useState(() => {
    const savedSecs = localStorage.getItem("pomo_seconds");
    if (savedSecs !== null) return parseInt(savedSecs, 10);
    return getPhaseDuration(phase);
  });

  // Track config changes to reset if not running
  useEffect(() => {
    if (!running) {
      setSeconds(getPhaseDuration(phase));
    }
  }, [focusMins, breakMins, phase]);

  useEffect(() => {
    localStorage.setItem("pomo_phase", phase);
  }, [phase]);

  useEffect(() => {
    localStorage.setItem("pomo_running", running.toString());
  }, [running]);

  useEffect(() => {
    localStorage.setItem("pomo_sessions", sessions.toString());
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("pomo_seconds", seconds.toString());
  }, [seconds]);

  useEffect(() => {
    if (!running) return;

    const savedEndTime = localStorage.getItem("pomo_end_time");
    let endTime = savedEndTime ? parseInt(savedEndTime, 10) : (Date.now() + seconds * 1000);

    if (!savedEndTime) {
      localStorage.setItem("pomo_end_time", endTime.toString());
    }

    // Sync initial remaining time
    const initialRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    setSeconds(initialRemaining);

    if (initialRemaining <= 0) {
      setRunning(false);
      localStorage.removeItem("pomo_end_time");
      // Handle switch
      if (phase === "focus") {
        setSessions((n) => n + 1);
        setPhase("break");
        setSeconds(breakMins * 60);
        onComplete?.("focus");
      } else {
        setPhase("focus");
        setSeconds(focusMins * 60);
        onComplete?.("break");
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setSeconds(remaining);

      if (remaining <= 0) {
        setRunning(false);
        localStorage.removeItem("pomo_end_time");
        clearInterval(interval);

        if (phase === "focus") {
          setSessions((n) => n + 1);
          setPhase("break");
          setSeconds(breakMins * 60);
          onComplete?.("focus");
        } else {
          setPhase("focus");
          setSeconds(focusMins * 60);
          onComplete?.("break");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [running, phase, focusMins, breakMins, onComplete]);

  const toggle = useCallback(() => {
    if (running) {
      // Pause
      const savedEndTime = localStorage.getItem("pomo_end_time");
      if (savedEndTime) {
        const remaining = Math.max(0, Math.ceil((parseInt(savedEndTime, 10) - Date.now()) / 1000));
        setSeconds(remaining);
      }
      setRunning(false);
      localStorage.removeItem("pomo_end_time");
    } else {
      // Start
      const newEndTime = Date.now() + seconds * 1000;
      localStorage.setItem("pomo_end_time", newEndTime.toString());
      setRunning(true);
    }
  }, [running, seconds]);

  const reset = useCallback(() => {
    setRunning(false);
    setPhase("focus");
    setSeconds(focusMins * 60);
    localStorage.removeItem("pomo_end_time");
  }, [focusMins]);

  const skip = useCallback(() => {
    setRunning(false);
    localStorage.removeItem("pomo_end_time");
    if (phase === "focus") {
      setPhase("break");
      setSeconds(breakMins * 60);
    } else {
      setPhase("focus");
      setSeconds(focusMins * 60);
    }
  }, [phase, focusMins, breakMins]);

  const totalDuration = getPhaseDuration(phase);
  const pct = totalDuration ? ((totalDuration - seconds) / totalDuration) * 100 : 0;

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return { phase, seconds, running, sessions, pct, toggle, reset, skip, fmt };
}

// ─────────────────────────────────────────────────────────────────────────────
// useChoreTimer — dynamic speedrun gamified countdown
// ─────────────────────────────────────────────────────────────────────────────
export function useChoreTimer(durationSecs = 600) {
  const [totalDuration, setTotalDuration] = useState(() => {
    const saved = localStorage.getItem("chore_total_duration");
    return saved !== null ? parseInt(saved, 10) : durationSecs;
  });

  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem("chore_seconds");
    return saved !== null ? parseInt(saved, 10) : durationSecs;
  });
  const [running, setRunning] = useState(() => {
    return localStorage.getItem("chore_running") === "true";
  });
  const [done, setDone] = useState(() => {
    return localStorage.getItem("chore_done") === "true";
  });

  useEffect(() => {
    localStorage.setItem("chore_total_duration", totalDuration.toString());
  }, [totalDuration]);

  useEffect(() => {
    localStorage.setItem("chore_seconds", seconds.toString());
  }, [seconds]);

  useEffect(() => {
    localStorage.setItem("chore_running", running.toString());
  }, [running]);

  useEffect(() => {
    localStorage.setItem("chore_done", done.toString());
  }, [done]);

  // If the dynamic duration changes, update total & seconds when not running/done
  useEffect(() => {
    if (!running && !done) {
      setSeconds(durationSecs);
      setTotalDuration(durationSecs);
    }
  }, [durationSecs, running, done]);

  useEffect(() => {
    if (!running) return;

    const savedEndTime = localStorage.getItem("chore_end_time");
    let endTime = savedEndTime ? parseInt(savedEndTime, 10) : (Date.now() + seconds * 1000);
    
    if (!savedEndTime) {
      localStorage.setItem("chore_end_time", endTime.toString());
    }

    // Sync initial remaining time
    const initialRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    setSeconds(initialRemaining);
    if (initialRemaining <= 0) {
      setRunning(false);
      setDone(true);
      localStorage.removeItem("chore_end_time");
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) {
        setRunning(false);
        setDone(true);
        localStorage.removeItem("chore_end_time");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const toggle = () => {
    if (done) return;
    if (running) {
      // Pause
      const savedEndTime = localStorage.getItem("chore_end_time");
      if (savedEndTime) {
        const remaining = Math.max(0, Math.ceil((parseInt(savedEndTime, 10) - Date.now()) / 1000));
        setSeconds(remaining);
      }
      setRunning(false);
      localStorage.removeItem("chore_end_time");
    } else {
      // Start
      setTotalDuration(durationSecs);
      const newEndTime = Date.now() + seconds * 1000;
      localStorage.setItem("chore_end_time", newEndTime.toString());
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setSeconds(durationSecs);
    setDone(false);
    localStorage.removeItem("chore_end_time");
  };

  const pct = ((durationSecs - seconds) / durationSecs) * 100;
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return { seconds, running, done, pct, toggle, reset, fmt };
}

// ─────────────────────────────────────────────────────────────────────────────
// useBreathing — 4-7-8 breathing cycle
// ─────────────────────────────────────────────────────────────────────────────
export function useBreathing() {
  const SEQUENCE = [
    { phase: "inhale", secs: 4 },
    { phase: "hold",   secs: 7 },
    { phase: "exhale", secs: 8 },
  ];

  const [active,    setActive]    = useState(false);
  const [phase,     setPhase]     = useState("inhale");
  const [countdown, setCountdown] = useState(4);

  const phaseRef   = useRef(0);
  const timerRef   = useRef(null);
  const countRef   = useRef(null);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    setActive(false);
    phaseRef.current = 0;
    setPhase("inhale");
    setCountdown(4);
  }, []);

  const runPhase = useCallback(() => {
    const cur = SEQUENCE[phaseRef.current];
    setPhase(cur.phase);
    setCountdown(cur.secs);

    let c = cur.secs;
    clearInterval(countRef.current);
    countRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) clearInterval(countRef.current);
    }, 1000);

    timerRef.current = setTimeout(() => {
      phaseRef.current = (phaseRef.current + 1) % SEQUENCE.length;
      runPhase();
    }, cur.secs * 1000);
  }, []); // eslint-disable-line

  const start = useCallback(() => {
    setActive(true);
    phaseRef.current = 0;
    runPhase();
  }, [runPhase]);

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(countRef.current); }, []);

  return { active, phase, countdown, start, stop };
}
