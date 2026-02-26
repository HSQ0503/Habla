"use client";

import type { ChatMessage } from "@/lib/types";

type Props = {
  transcript: ChatMessage[];
  onBack: () => void;
};

export default function TranscriptView({ transcript, onBack }: Props) {
  const presentationEntry = transcript.find((m) => m.role === "presentation");
  const conversation = transcript.filter((m) => m.role !== "presentation");

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Feedback
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Full Transcript</h1>

      {/* Presentation */}
      {presentationEntry && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Presentation
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {presentationEntry.content}
          </p>
          {presentationEntry.wordCount && (
            <p className="text-xs text-gray-400 mt-3">
              {presentationEntry.wordCount} words
            </p>
          )}
        </div>
      )}

      {/* Conversation */}
      {conversation.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            Conversation
          </h2>
          <div className="space-y-4">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    msg.role === "student"
                      ? "bg-gray-100 text-gray-900 rounded-br-md"
                      : "bg-indigo-50 text-indigo-900 rounded-bl-md"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium opacity-60">
                      {msg.role === "student" ? "You" : "Examiner"}
                    </p>
                    {msg.timestamp && (
                      <p className="text-xs opacity-40">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "student" && msg.wordCount && (
                    <p className="text-xs opacity-40 mt-1">{msg.wordCount} words</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transcript.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No transcript available for this session.</p>
        </div>
      )}
    </div>
  );
}
