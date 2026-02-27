"use client";

import { useState } from "react";

type MicState = "prompt" | "requesting" | "granted" | "denied";

type Props = {
  onReady: () => void;
  onFallbackToText: () => void;
};

export default function MicPermission({ onReady, onFallbackToText }: Props) {
  const [state, setState] = useState<MicState>("prompt");
  const [deviceName, setDeviceName] = useState<string>("");

  async function requestMic() {
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get device name
      const track = stream.getAudioTracks()[0];
      setDeviceName(track.label || "Microphone");

      // Release the test stream immediately — RealtimeClient acquires its own
      stream.getTracks().forEach((t) => t.stop());

      setState("granted");
    } catch {
      setState("denied");
    }
  }

  if (state === "prompt") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Microphone Access Required
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            This practice session uses voice conversation. Grant microphone access to speak with the examiner.
          </p>
          <button
            onClick={requestMic}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-3"
          >
            Allow Microphone
          </button>
          <button
            onClick={onFallbackToText}
            className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Use Text Mode Instead
          </button>
        </div>
      </div>
    );
  }

  if (state === "requesting") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="animate-spin h-7 w-7 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Requesting Access...
          </h3>
          <p className="text-sm text-gray-500">
            Please allow microphone access in your browser&apos;s permission dialog.
          </p>
        </div>
      </div>
    );
  }

  if (state === "granted") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Microphone Ready
          </h3>
          {deviceName && (
            <p className="text-xs text-gray-400 mb-4">
              {deviceName}
            </p>
          )}
          <button
            onClick={onReady}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Voice Conversation
          </button>
        </div>
      </div>
    );
  }

  // Denied state
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Microphone Access Denied
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          To use voice mode, enable microphone access in your browser settings.
        </p>
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-medium text-gray-700 mb-2">How to enable:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>Chrome: Click the lock icon in the address bar &gt; Site settings &gt; Microphone &gt; Allow</li>
            <li>Firefox: Click the lock icon &gt; Clear permissions &gt; Reload</li>
            <li>Safari: Safari menu &gt; Settings &gt; Websites &gt; Microphone</li>
          </ul>
        </div>
        <button
          onClick={requestMic}
          className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-3"
        >
          Try Again
        </button>
        <button
          onClick={onFallbackToText}
          className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Use Text Mode Instead
        </button>
      </div>
    </div>
  );
}
