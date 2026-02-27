"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";
import AudioVisualizer from "./AudioVisualizer";
import VoiceControls from "./VoiceControls";
import type { ConnectionState } from "@/lib/realtime-client";
import type { ChatMessage } from "@/lib/types";

type VoiceState = {
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

type Props = {
  sessionId: string;
  image: {
    url: string;
    theme: string;
  };
  voice: VoiceState;
  onAdvance: (presentationText: string) => Promise<void>;
};

const MIN_PRESENT_SECONDS = 60;

function timerColor(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 3) return "text-green-600";
  if (minutes < 4) return "text-yellow-600";
  return "text-red-600";
}

function timerZoneLabel(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 3) return "Keep going";
  if (minutes < 4) return "Ideal range (3-4 min)";
  return "Consider wrapping up";
}

export default function VoicePresentPhase({ image, voice, onAdvance }: Props) {
  const [ending, setEnding] = useState(false);
  const { formattedTime, totalElapsed } = useSessionTimer("up");
  const canEnd = totalElapsed >= MIN_PRESENT_SECONDS;
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const theme = themeColors[image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: image.theme,
  };

  // Filter to student entries only
  const studentEntries = voice.transcript.filter((m) => m.role === "student");

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [studentEntries.length]);

  async function handleEnd() {
    if (ending) return;
    setEnding(true);
    const presentationText = studentEntries.map((m) => m.content).join(" ");
    await onAdvance(presentationText);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-700">Presentation</span>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
            {theme.label}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-xl font-mono font-semibold tabular-nums ${timerColor(totalElapsed)}`}>
            {formattedTime}
          </p>
          <p className="text-xs text-gray-500">{timerZoneLabel(totalElapsed)}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Image sidebar */}
        <div className="shrink-0 lg:w-64 lg:border-r border-b lg:border-b-0 border-gray-200 bg-white">
          <div className="p-3">
            <div className="rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Practice image"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Voice area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Audio visualizer */}
              <AudioVisualizer
                mediaStream={voice.getMediaStream()}
                isAiSpeaking={voice.isAiSpeaking}
                isMicMuted={voice.isMicMuted}
              />

              {/* Info note */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span className="text-xs text-blue-600">
                  The examiner is listening silently. Present your analysis of the image.
                </span>
              </div>

              {/* Live transcript (student entries only) */}
              {studentEntries.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Your Presentation
                  </p>
                  <div className="space-y-2">
                    {studentEntries.map((entry, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {entry.content}
                      </p>
                    ))}
                  </div>
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {studentEntries.length === 0 && voice.connectionState === "connected" && (
                <p className="text-sm text-gray-400 text-center py-8">
                  Start speaking to present your analysis...
                </p>
              )}
            </div>
          </div>

          {/* Voice controls */}
          <VoiceControls
            connectionState={voice.connectionState}
            isMicMuted={voice.isMicMuted}
            isAiSpeaking={voice.isAiSpeaking}
            onToggleMic={voice.toggleMic}
            formattedTime={formattedTime}
            timerColorClass={timerColor(totalElapsed)}
            timerLabel={timerZoneLabel(totalElapsed)}
            endLabel="End Presentation"
            canEnd={canEnd}
            onEnd={handleEnd}
            ending={ending}
          />
        </div>
      </div>
    </div>
  );
}
