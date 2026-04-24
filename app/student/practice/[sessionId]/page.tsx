"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { shouldUseVoice } from "@/lib/voice-config";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { TEST_MODE } from "@/lib/test-config";
import PrepPhase from "@/components/practice/PrepPhase";
import PresentPhase from "@/components/practice/PresentPhase";
import ConversePhase from "@/components/practice/ConversePhase";
import MicPermission from "@/components/practice/MicPermission";
import VoicePresentPhase from "@/components/practice/VoicePresentPhase";
import VoiceConversPhase from "@/components/practice/VoiceConversPhase";

type SessionData = {
  id: string;
  status: "PREPARING" | "PRESENTING" | "CONVERSING" | "COMPLETED" | "TERMINATED";
  language?: string;
  image: {
    id: string;
    url: string;
    theme: string;
    culturalContext: string;
    talkingPoints: string[];
  };
  transcript: { role: string; content: string }[];
};

function FullPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="habla-ui"
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"voice" | "text">(() => (shouldUseVoice() ? "voice" : "text"));
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

  const handlePrepAdvance = useCallback(async () => {
    await advanceSession("PRESENTING");
    if (mode === "voice") {
      await voice.connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionId]);

  const handleVoicePresentAdvance = useCallback(
    async (presentationText: string) => {
      setVoicePhaseOverride("PRESENTING");
      voice.pauseAutoSave();

      const voiceEntries = voice.getTranscript().filter((m) => m.role === "student");
      if (voiceEntries.length > 0) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: voiceEntries }),
        });
      }

      await advanceSession("CONVERSING", presentationText);

      const res = await fetch("/api/realtime/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        console.error("[SESSION] Failed to fetch conversation instructions");
        setError("Failed to load conversation instructions. Please try again.");
        setVoicePhaseOverride(null);
        voice.resumeAutoSave();
        return;
      }

      const { instructions } = await res.json();

      voice.setPresentationMode(false);
      voice.clearTranscript();
      voice.resumeAutoSave();

      voice.updateSession({
        instructions,
        turnDetection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
        },
      });

      voice.triggerResponse(
        "The student has finished their presentation. Ask your first follow-up question referencing something specific from their presentation."
      );

      voice.clearError();
      setVoicePhaseOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

  const handleVoiceComplete = useCallback(async () => {
    await voice.disconnect();
    await advanceSession("COMPLETED");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleFallbackToText = useCallback(async () => {
    await voice.disconnect();
    setMode("text");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <FullPageFrame>
        <div style={{ color: "var(--ink-3)", fontSize: 14 }}>Loading session…</div>
      </FullPageFrame>
    );
  }

  if (error || !session) {
    return (
      <FullPageFrame>
        <div className="card" style={{ padding: 32, maxWidth: 400, textAlign: "center" }}>
          <p style={{ color: "var(--ink-3)", fontSize: 14, marginBottom: 16 }}>
            {error || "Something went wrong"}
          </p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="btn-primary"
          >
            Return to dashboard
          </button>
        </div>
      </FullPageFrame>
    );
  }

  if (session.status === "COMPLETED") {
    router.push(`/student/history/${session.id}`);
    return (
      <FullPageFrame>
        <div className="card" style={{ padding: 36, maxWidth: 380, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--indigo-softer)",
              border: "1.5px solid var(--ink)",
              margin: "0 auto 16px",
            }}
          />
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>
            Analyzing your performance…
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: 0 }}>
            Redirecting to your results.
          </p>
        </div>
      </FullPageFrame>
    );
  }

  if (session.status === "TERMINATED") {
    return (
      <FullPageFrame>
        <div className="card" style={{ padding: 32, maxWidth: 400, textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--rose-soft)",
              border: "1.5px solid oklch(0.82 0.09 25)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="oklch(0.5 0.16 25)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>
            Session terminated
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", marginBottom: 16 }}>
            This practice session has been ended.
          </p>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="btn-primary"
          >
            Return to dashboard
          </button>
        </div>
      </FullPageFrame>
    );
  }

  const effectivePhase = voicePhaseOverride || session.status;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {TEST_MODE && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "oklch(0.62 0.13 65)",
            color: "white",
            textAlign: "center",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 0",
            letterSpacing: "0.04em",
          }}
        >
          TEST MODE — REDUCED TIMERS ACTIVE
        </div>
      )}

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

      {effectivePhase === "CONVERSING" && (
        <>
          {mode === "voice" ? (
            <VoiceConversPhase
              sessionId={session.id}
              image={session.image}
              language={session.language}
              voice={voice}
              onComplete={handleVoiceComplete}
              onFallbackToText={handleFallbackToText}
            />
          ) : (
            <ConversePhase
              sessionId={session.id}
              image={session.image}
              language={session.language}
              onComplete={() => advanceSession("COMPLETED")}
            />
          )}
        </>
      )}
    </div>
  );
}
