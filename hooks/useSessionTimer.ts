"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type TimerDirection = "up" | "down";

export function useSessionTimer(
  direction: TimerDirection,
  totalSeconds?: number,
  onComplete?: () => void
) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (direction === "down" && totalSeconds && next >= totalSeconds) {
          clearInterval(interval);
          setRunning(false);
          onCompleteRef.current?.();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, direction, totalSeconds]);

  const remaining = totalSeconds ? Math.max(totalSeconds - elapsed, 0) : 0;
  const displaySeconds = direction === "down" ? remaining : elapsed;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);

  return {
    minutes,
    seconds,
    totalElapsed: elapsed,
    isComplete: direction === "down" && totalSeconds ? elapsed >= totalSeconds : false,
    formattedTime,
    pause,
    resume,
  };
}
