"use client";

import type { ConnectionState } from "@/lib/realtime-client";

type Props = {
  connectionState: ConnectionState;
  isMicMuted: boolean;
  isAiSpeaking: boolean;
  onToggleMic: () => void;
  formattedTime: string;
  timerColorClass: string;
  timerLabel: string;
  endLabel: string;
  canEnd: boolean;
  onEnd: () => void;
  ending?: boolean;
};

function connectionDotColor(state: ConnectionState) {
  if (state === "connected") return "bg-green-500";
  if (state === "connecting") return "bg-yellow-500 animate-pulse";
  return "bg-red-500";
}

export default function VoiceControls({
  connectionState,
  isMicMuted,
  onToggleMic,
  formattedTime,
  timerColorClass,
  timerLabel,
  endLabel,
  canEnd,
  onEnd,
  ending,
}: Props) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionDotColor(connectionState)}`} />
          <span className="text-xs text-gray-400">
            {connectionState === "connected" ? "Connected" : connectionState === "connecting" ? "Connecting..." : "Disconnected"}
          </span>
        </div>

        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          disabled={connectionState !== "connected"}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
            isMicMuted
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-green-100 text-green-600 hover:bg-green-200"
          }`}
        >
          {isMicMuted ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          )}
        </button>

        {/* Timer + end button */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-lg font-mono font-semibold tabular-nums ${timerColorClass}`}>
              {formattedTime}
            </p>
            <p className="text-xs text-gray-500">{timerLabel}</p>
          </div>
          <button
            onClick={onEnd}
            disabled={!canEnd || ending}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {ending && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {endLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
