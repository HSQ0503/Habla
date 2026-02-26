"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";

type ChatMessage = {
  role: "student" | "examiner";
  content: string;
};

type Props = {
  sessionId: string;
  image: {
    url: string;
    theme: string;
    culturalContext: string;
  };
  onComplete: () => void;
};

const MIN_CONVERSE_SECONDS = 5 * 60; // 5 minutes minimum
const WARN_SECONDS = 10 * 60; // 10 minute warning
const MAX_SECONDS = 12 * 60; // 12 minute auto-end

function timerColor(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 8) return "text-green-600";
  if (minutes < 10) return "text-yellow-600";
  return "text-red-600";
}

function timerZoneLabel(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 8) return "Keep conversing";
  if (minutes < 10) return "Ideal range (8–10 min)";
  return "Time to wrap up";
}

export default function ConversePhase({ sessionId, image, onComplete }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
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
    if (totalElapsed >= MAX_SECONDS) {
      onComplete();
    }
  }, [totalElapsed, onComplete]);

  // Get initial examiner question
  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setMessages([{ role: "examiner", content: data.message }]);
      setInitializing(false);
    }
    init();
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "student", content: text }]);

    const res = await fetch(`/api/sessions/${sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "examiner", content: data.message }]);
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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
          <button
            onClick={onComplete}
            disabled={!canEnd}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            End Conversation
          </button>
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Image thumbnail */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.culturalContext}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>

          {initializing && (
            <div className="flex justify-start">
              <div className="bg-indigo-50 text-indigo-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  El examinador está preparando su primera pregunta...
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
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

          {sending && (
            <div className="flex justify-start">
              <div className="bg-indigo-50 text-indigo-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response in Spanish..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="max-w-2xl mx-auto text-xs text-gray-400 mt-1.5">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
