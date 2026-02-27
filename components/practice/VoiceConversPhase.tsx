"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";
import AudioVisualizer from "./AudioVisualizer";
import SpeakingIndicator from "./SpeakingIndicator";
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
  onComplete: () => void;
  onFallbackToText: () => void;
};

const MIN_CONVERSE_SECONDS = 5 * 60;
const WARN_SECONDS = 10 * 60;
const MAX_SECONDS = 12 * 60;

function timerColor(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 8) return "text-green-600";
  if (minutes < 10) return "text-yellow-600";
  return "text-red-600";
}

function timerZoneLabel(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 8) return "Keep conversing";
  if (minutes < 10) return "Ideal range (8-10 min)";
  return "Time to wrap up";
}

export default function VoiceConversPhase({ image, voice, onComplete, onFallbackToText }: Props) {
  const [ending, setEnding] = useState(false);
  const endingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formattedTime, totalElapsed } = useSessionTimer("up");
  const canEnd = totalElapsed >= MIN_CONVERSE_SECONDS;
  const showWarning = totalElapsed >= WARN_SECONDS && totalElapsed < MAX_SECONDS;

  const theme = themeColors[image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: image.theme,
  };

  // Auto-end at max time
  useEffect(() => {
    if (totalElapsed >= MAX_SECONDS && !endingRef.current) {
      endingRef.current = true;
      onComplete();
    }
  }, [totalElapsed, onComplete]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voice.transcript.length]);

  function handleEnd() {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    onComplete();
  }

  const showErrorOverlay = voice.connectionState === "failed" || voice.error;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-purple-700">Conversation</span>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
            {theme.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-xl font-mono font-semibold tabular-nums ${timerColor(totalElapsed)}`}>
              {formattedTime}
            </p>
            <p className="text-xs text-gray-500">{timerZoneLabel(totalElapsed)}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div className="shrink-0 px-6 py-2 bg-amber-50 border-b border-amber-200 text-center">
          <p className="text-sm text-amber-700 font-medium">
            10 minutes reached — conversation will auto-end at 12 minutes
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
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

        {/* Voice + transcript area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Audio visualizer */}
              <AudioVisualizer
                mediaStream={voice.getMediaStream()}
                isAiSpeaking={voice.isAiSpeaking}
                isMicMuted={voice.isMicMuted}
              />

              {/* Speaking indicator */}
              <SpeakingIndicator
                isAiSpeaking={voice.isAiSpeaking}
                isMicMuted={voice.isMicMuted}
                connectionState={voice.connectionState}
              />

              {/* Chat bubble transcript */}
              {voice.transcript
                .filter((m) => m.role === "student" || m.role === "examiner")
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        msg.role === "student"
                          ? "bg-gray-200 text-gray-900 rounded-br-md"
                          : "bg-indigo-50 text-indigo-900 rounded-bl-md"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-60">
                        {msg.role === "student" ? "You" : "Examiner"}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

              <div ref={messagesEndRef} />
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
            endLabel="End Conversation"
            canEnd={canEnd}
            onEnd={handleEnd}
            ending={ending}
          />
        </div>

        {/* Error overlay */}
        {showErrorOverlay && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center mx-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Voice Connection Lost
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {voice.error || "The voice connection was interrupted. You can switch to text mode to continue."}
              </p>
              <button
                onClick={onFallbackToText}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-3"
              >
                Switch to Text Mode
              </button>
              <button
                onClick={onComplete}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
