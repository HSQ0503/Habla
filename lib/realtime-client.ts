import type { ChatMessage } from "@/lib/types";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export type TurnDetection = {
  type: string;
  threshold: number;
  prefix_padding_ms: number;
  silence_duration_ms: number;
};

export type SessionConfig = {
  instructions: string;
  turnDetection: TurnDetection | null;
};

export type RealtimeCallbacks = {
  onConnectionStateChange: (state: ConnectionState) => void;
  onTranscriptUpdate: (transcript: ChatMessage[]) => void;
  onAiSpeakingChange: (isSpeaking: boolean) => void;
  onError: (error: Error) => void;
};

export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private transcript: ChatMessage[] = [];
  private callbacks: RealtimeCallbacks;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _presentationMode = false;

  constructor(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  set presentationMode(value: boolean) {
    this._presentationMode = value;
  }

  async connect(ephemeralToken: string, config: SessionConfig): Promise<void> {
    this.callbacks.onConnectionStateChange("connecting");

    // 1. Create peer connection
    this.pc = new RTCPeerConnection();

    // 2. Audio playback — receive AI audio
    this.audioElement = document.createElement("audio");
    this.audioElement.autoplay = true;
    this.pc.ontrack = (event) => {
      this.audioElement!.srcObject = event.streams[0];
    };

    // 3. Microphone — send student audio
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.pc.addTrack(this.mediaStream.getTracks()[0]);

    // 4. Data channel for events
    this.dc = this.pc.createDataChannel("oai-events");
    this.dc.onmessage = (event) => this.handleEvent(JSON.parse(event.data));
    this.dc.onopen = () => {
      console.log("[REALTIME] Data channel open");
      const sessionUpdate: Record<string, unknown> = {
        type: "realtime",
        instructions: config.instructions,
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcription" },
            turn_detection: config.turnDetection ?? null,
          },
        },
      };
      this.dc!.send(JSON.stringify({ type: "session.update", session: sessionUpdate }));
      this.callbacks.onConnectionStateChange("connected");
    };
    this.dc.onclose = () => {
      console.log("[REALTIME] Data channel closed");
    };

    // 5. Monitor connection state for failures (with grace period for temporary disconnects)
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(`[REALTIME] Connection state: ${state}`);

      if (this.disconnectTimer) {
        clearTimeout(this.disconnectTimer);
        this.disconnectTimer = null;
      }

      if (state === "failed") {
        this.callbacks.onConnectionStateChange("failed");
        this.callbacks.onError(new Error("Voice connection lost. Your transcript has been saved."));
      } else if (state === "disconnected") {
        // Give WebRTC 5 seconds to recover before treating as failed
        this.disconnectTimer = setTimeout(() => {
          if (this.pc?.connectionState === "disconnected") {
            this.callbacks.onConnectionStateChange("failed");
            this.callbacks.onError(new Error("Voice connection lost. Your transcript has been saved."));
          }
        }, 5000);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(`[REALTIME] ICE state: ${this.pc?.iceConnectionState}`);
    };

    // 6. Create SDP offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 7. Send to OpenAI GA endpoint
    const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ephemeralToken}`,
        "Content-Type": "application/sdp",
      },
      body: this.pc.localDescription!.sdp,
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error(`[REALTIME] SDP exchange failed: ${sdpResponse.status}`, errorText);
      this.disconnect();
      throw new Error(`Failed to establish voice connection: ${sdpResponse.status}`);
    }

    const answerSdp = await sdpResponse.text();
    await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    console.log("[REALTIME] WebRTC connection established");
  }

  private handleEvent(event: { type: string; [key: string]: unknown }): void {
    switch (event.type) {
      // Session created confirmation
      case "session.created":
        console.log("[REALTIME] Session created");
        break;

      // Student's speech transcribed (final)
      case "conversation.item.input_audio_transcription.completed": {
        const text = event.transcript as string;
        if (text?.trim()) {
          this.addTranscriptEntry("student", text.trim());
        }
        break;
      }

      // AI's spoken response transcribed (final — GA event name)
      case "response.output_audio_transcript.done": {
        const text = event.transcript as string;
        if (text?.trim()) {
          this.addTranscriptEntry("examiner", text.trim());
        }
        break;
      }

      // AI started generating a response
      case "response.created":
        if (this._presentationMode) {
          // Cancel any AI response during presentation — student is presenting solo
          console.log("[REALTIME] Cancelling AI response (presentation mode)");
          this.dc?.send(JSON.stringify({ type: "response.cancel" }));
          break;
        }
        this.callbacks.onAiSpeakingChange(true);
        break;

      // AI finished response
      case "response.done":
        this.callbacks.onAiSpeakingChange(false);
        break;

      // Errors
      case "error": {
        const msg = (event.error as { message?: string })?.message || "Realtime API error";
        // Ignore benign cancellation errors (e.g. triggerResponse when no active response)
        if (msg.toLowerCase().includes("cancellation failed")) {
          console.warn("[REALTIME] Ignoring benign error:", msg);
          break;
        }
        console.error("[REALTIME] Error event:", event);
        this.callbacks.onError(new Error(msg));
        break;
      }

      // Log unhandled events for discovery during development
      default:
        console.log(`[REALTIME] Event: ${event.type}`, event);
        break;
    }
  }

  private addTranscriptEntry(role: "student" | "examiner", content: string): void {
    const entry: ChatMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
      ...(role === "student" && {
        wordCount: content.split(/\s+/).filter(Boolean).length,
      }),
    };
    this.transcript.push(entry);
    this.callbacks.onTranscriptUpdate([...this.transcript]);
  }

  updateSession(config: Partial<SessionConfig>): void {
    if (this.dc?.readyState === "open") {
      const session: Record<string, unknown> = { type: "realtime" };
      if (config.instructions !== undefined) {
        session.instructions = config.instructions;
      }
      if (config.turnDetection !== undefined) {
        // Always include transcription config — sending audio.input without it
        // replaces the entire object and disables input transcription
        session.audio = {
          input: {
            transcription: { model: "gpt-4o-mini-transcription" },
            turn_detection: config.turnDetection ?? null,
          },
        };
      }
      this.dc.send(JSON.stringify({ type: "session.update", session }));
    }
  }

  cancelResponse(): void {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify({ type: "response.cancel" }));
    }
  }

  triggerResponse(text?: string): void {
    if (this.dc?.readyState === "open") {
      if (text) {
        this.dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        }));
      }
      this.dc.send(JSON.stringify({ type: "response.create" }));
    }
  }

  setMicMuted(muted: boolean): void {
    this.mediaStream?.getTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  getTranscript(): ChatMessage[] {
    return [...this.transcript];
  }

  addMarker(content: string): void {
    const entry: ChatMessage = {
      role: "phase-transition",
      content,
      timestamp: new Date().toISOString(),
    };
    this.transcript.push(entry);
    this.callbacks.onTranscriptUpdate([...this.transcript]);
  }

  clearTranscript(): void {
    this.transcript = [];
    this.callbacks.onTranscriptUpdate([]);
  }

  disconnect(): void {
    console.log("[REALTIME] Disconnecting");
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.dc?.close();
    this.pc?.close();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
    }
    this.pc = null;
    this.dc = null;
    this.audioElement = null;
    this.mediaStream = null;
    this._presentationMode = false;
  }
}
