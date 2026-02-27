"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  mediaStream: MediaStream | null;
  isAiSpeaking: boolean;
  isMicMuted: boolean;
};

const BAR_COUNT = 5;
const SMOOTHING = 0.8;
const ZERO_LEVELS: number[] = [0, 0, 0, 0, 0];

function useAudioLevels(mediaStream: MediaStream | null, active: boolean) {
  const [levels, setLevels] = useState(ZERO_LEVELS);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!mediaStream || !active) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = SMOOTHING;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let running = true;

    function tick() {
      if (!running) return;
      analyser.getByteFrequencyData(dataArray);

      const bandSize = Math.floor(dataArray.length / BAR_COUNT);
      const newLevels = Array.from({ length: BAR_COUNT }, (_, i) => {
        const start = i * bandSize;
        const end = start + bandSize;
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        return sum / bandSize / 255;
      });

      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [mediaStream, active]);

  if (!mediaStream || !active) return ZERO_LEVELS;
  return levels;
}

export default function AudioVisualizer({ mediaStream, isAiSpeaking, isMicMuted }: Props) {
  const levels = useAudioLevels(mediaStream, !isMicMuted && !isAiSpeaking);

  // Muted state
  if (isMicMuted) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl">
        <div className="flex items-end gap-0.5 h-8">
          {ZERO_LEVELS.map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gray-300 rounded-full"
              style={{ height: "8px" }}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 font-medium">Muted</span>
      </div>
    );
  }

  // AI speaking state
  if (isAiSpeaking) {
    const barHeights = [14, 20, 16, 22, 12];
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl">
        <div className="flex items-end gap-0.5 h-8">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-indigo-400 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
        <span className="text-sm text-indigo-600 font-medium">Examiner speaking...</span>
      </div>
    );
  }

  // Active / listening state
  const hasInput = levels.some((l) => l > 0.05);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${hasInput ? "bg-green-50" : "bg-gray-50"}`}>
      <div className="flex items-end gap-0.5 h-8">
        {levels.map((level, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ${hasInput ? "bg-green-500" : "bg-gray-300"}`}
            style={{ height: `${Math.max(4, level * 32)}px` }}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${hasInput ? "text-green-600" : "text-gray-400"}`}>
        {hasInput ? "Speaking..." : "Listening..."}
      </span>
    </div>
  );
}
