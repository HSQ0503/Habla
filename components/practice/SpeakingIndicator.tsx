"use client";

import type { ConnectionState } from "@/lib/realtime-client";

type Props = {
  isAiSpeaking: boolean;
  isMicMuted: boolean;
  connectionState: ConnectionState;
};

export default function SpeakingIndicator({ isAiSpeaking, isMicMuted, connectionState }: Props) {
  if (connectionState === "connecting") {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <svg className="animate-spin h-3.5 w-3.5 text-yellow-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-yellow-600 font-medium">Connecting...</span>
      </div>
    );
  }

  if (connectionState === "failed") {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="text-sm text-red-600 font-medium">Connection lost</span>
      </div>
    );
  }

  if (isAiSpeaking) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-sm text-indigo-600 font-medium">Examiner is speaking...</span>
      </div>
    );
  }

  if (isMicMuted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-500 font-medium">Microphone muted</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
      <span className="text-sm text-green-600 font-medium">Your turn — speak now</span>
    </div>
  );
}
