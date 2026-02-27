"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RealtimeClient, type ConnectionState } from "@/lib/realtime-client";
import type { ChatMessage } from "@/lib/types";

type UseRealtimeVoiceReturn = {
  connectionState: ConnectionState;
  transcript: ChatMessage[];
  isAiSpeaking: boolean;
  isMicMuted: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => void;
  getMediaStream: () => MediaStream | null;
  updateInstructions: (instructions: string) => void;
  triggerResponse: (text?: string) => void;
};

export function useRealtimeVoice(sessionId: string): UseRealtimeVoiceReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const saveTranscript = useCallback(async (entries: ChatMessage[]) => {
    if (entries.length === 0) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: entries }),
      });
      console.log(`[useRealtimeVoice] Saved ${entries.length} transcript entries`);
    } catch (err) {
      console.error("[useRealtimeVoice] Transcript save failed:", err);
    }
  }, [sessionId]);

  // Auto-save transcript every 30 seconds while connected
  useEffect(() => {
    if (connectionState === "connected") {
      saveTimerRef.current = setInterval(() => {
        const entries = clientRef.current?.getTranscript() || [];
        if (entries.length > 0) {
          saveTranscript(entries);
        }
      }, 30_000);
    }

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [connectionState, saveTranscript]);

  // Save transcript on visibility change (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && clientRef.current) {
        const entries = clientRef.current.getTranscript();
        if (entries.length > 0) {
          saveTranscript(entries);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveTranscript]);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState("connecting");

      // 1. Fetch ephemeral token from our API
      const tokenRes = await fetch("/api/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json();
        throw new Error(data.error || "Failed to get voice token");
      }

      const { token } = await tokenRes.json();

      // 2. Create and connect client
      const client = new RealtimeClient({
        onConnectionStateChange: setConnectionState,
        onTranscriptUpdate: setTranscript,
        onAiSpeakingChange: setIsAiSpeaking,
        onError: (err) => setError(err.message),
      });

      await client.connect(token);
      clientRef.current = client;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect voice");
      setConnectionState("disconnected");
    }
  }, [sessionId]);

  const disconnect = useCallback(async () => {
    // Save final transcript before disconnecting
    const entries = clientRef.current?.getTranscript() || [];
    if (entries.length > 0) {
      await saveTranscript(entries);
    }

    clientRef.current?.disconnect();
    clientRef.current = null;
    setConnectionState("disconnected");
  }, [saveTranscript]);

  const toggleMic = useCallback(() => {
    const newState = !isMicMuted;
    clientRef.current?.setMicMuted(newState);
    setIsMicMuted(newState);
  }, [isMicMuted]);

  const getMediaStream = useCallback(() => {
    return clientRef.current?.getMediaStream() || null;
  }, []);

  const updateInstructions = useCallback((instructions: string) => {
    clientRef.current?.updateInstructions(instructions);
  }, []);

  const triggerResponse = useCallback((text?: string) => {
    clientRef.current?.triggerResponse(text);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, []);

  return {
    connectionState,
    transcript,
    isAiSpeaking,
    isMicMuted,
    error,
    connect,
    disconnect,
    toggleMic,
    getMediaStream,
    updateInstructions,
    triggerResponse,
  };
}
