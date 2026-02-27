"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { shouldUseVoice } from "@/lib/voice-config";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import PrepPhase from "@/components/practice/PrepPhase";
import PresentPhase from "@/components/practice/PresentPhase";
import ConversePhase from "@/components/practice/ConversePhase";
import MicPermission from "@/components/practice/MicPermission";
import VoicePresentPhase from "@/components/practice/VoicePresentPhase";
import VoiceConversPhase from "@/components/practice/VoiceConversPhase";

type SessionData = {
  id: string;
  status: "PREPARING" | "PRESENTING" | "CONVERSING" | "COMPLETED" | "TERMINATED";
  image: {
    id: string;
    url: string;
    theme: string;
    culturalContext: string;
    talkingPoints: string[];
  };
  transcript: { role: string; content: string }[];
};

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"voice" | "text">(() => shouldUseVoice() ? "voice" : "text");
  const [micReady, setMicReady] = useState(false);
  const [voicePhaseOverride, setVoicePhaseOverride] = useState<string | null>(null);

  const voice = useRealtimeVoice(sessionId);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found");
        return res.json();
      })
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Session not found");
        setLoading(false);
      });
  }, [sessionId]);

  async function advanceSession(targetStatus: string, presentationText?: string) {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus, presentationText }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to advance session");
      return;
    }
    const updated = await res.json();
    setSession(updated);
  }

  // PREPARING → PRESENTING transition
  const handlePrepAdvance = useCallback(async () => {
    await advanceSession("PRESENTING");
    if (mode === "voice") {
      await voice.connect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionId]);

  // PRESENTING → CONVERSING transition (voice mode)
  const handleVoicePresentAdvance = useCallback(async (presentationText: string) => {
    setVoicePhaseOverride("PRESENTING");

    // 1. Advance server state (saves presentation text to DB)
    await advanceSession("CONVERSING", presentationText);

    // 2. Fetch conversation instructions (server builds prompt with aiAnalysis)
    const res = await fetch("/api/realtime/instructions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const { instructions } = await res.json();

    // 3. Update AI instructions and turn detection via data channel
    voice.updateSession({
      instructions,
      turnDetection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 800,
      },
    });

    // 4. Trigger first examiner question
    voice.triggerResponse(
      "The student has finished their presentation. Ask your first follow-up question referencing something specific from their presentation."
    );

    // 5. Release display lock
    setVoicePhaseOverride(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Voice conversation completion
  const handleVoiceComplete = useCallback(async () => {
    await voice.disconnect();
    await advanceSession("COMPLETED");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Text mode fallback during conversation
  const handleFallbackToText = useCallback(() => {
    voice.disconnect();
    setMode("text");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading session...
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || "Something went wrong"}</p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (session.status === "COMPLETED") {
    router.push(`/student/history/${session.id}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8 max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="animate-spin h-7 w-7 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Analyzing your performance...</h2>
          <p className="text-sm text-gray-500">Redirecting to your results...</p>
        </div>
      </div>
    );
  }

  if (session.status === "TERMINATED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8 max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Terminated</h2>
          <p className="text-sm text-gray-500 mb-4">This practice session has been ended.</p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const effectivePhase = voicePhaseOverride || session.status;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PREPARING phase */}
      {effectivePhase === "PREPARING" && (
        <>
          {mode === "voice" && !micReady ? (
            <MicPermission
              onReady={() => setMicReady(true)}
              onFallbackToText={() => setMode("text")}
            />
          ) : (
            <PrepPhase
              image={session.image}
              onAdvance={handlePrepAdvance}
              voiceMode={mode === "voice"}
            />
          )}
        </>
      )}

      {/* PRESENTING phase */}
      {effectivePhase === "PRESENTING" && (
        <>
          {mode === "voice" ? (
            <VoicePresentPhase
              sessionId={session.id}
              image={session.image}
              voice={voice}
              onAdvance={handleVoicePresentAdvance}
            />
          ) : (
            <PresentPhase
              image={session.image}
              onAdvance={(text) => advanceSession("CONVERSING", text)}
            />
          )}
        </>
      )}

      {/* CONVERSING phase */}
      {effectivePhase === "CONVERSING" && (
        <>
          {mode === "voice" ? (
            <VoiceConversPhase
              sessionId={session.id}
              image={session.image}
              voice={voice}
              onComplete={handleVoiceComplete}
              onFallbackToText={handleFallbackToText}
            />
          ) : (
            <ConversePhase
              sessionId={session.id}
              image={session.image}
              onComplete={() => advanceSession("COMPLETED")}
            />
          )}
        </>
      )}
    </div>
  );
}
