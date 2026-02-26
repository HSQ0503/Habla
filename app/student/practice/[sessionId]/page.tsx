"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PrepPhase from "@/components/practice/PrepPhase";
import PresentPhase from "@/components/practice/PresentPhase";
import ConversePhase from "@/components/practice/ConversePhase";

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
    return null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {session.status === "PREPARING" && (
        <PrepPhase
          image={session.image}
          onAdvance={() => advanceSession("PRESENTING")}
        />
      )}
      {session.status === "PRESENTING" && (
        <PresentPhase
          image={session.image}
          onAdvance={(text) => advanceSession("CONVERSING", text)}
        />
      )}
      {session.status === "CONVERSING" && (
        <ConversePhase
          sessionId={session.id}
          image={session.image}
          onComplete={() => advanceSession("COMPLETED")}
        />
      )}
    </div>
  );
}
