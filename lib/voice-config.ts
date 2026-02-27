export const VOICE_MODE_ENABLED =
  process.env.NEXT_PUBLIC_VOICE_MODE_ENABLED === "true";

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia
  );
}

export function shouldUseVoice(): boolean {
  return VOICE_MODE_ENABLED && isVoiceSupported();
}
