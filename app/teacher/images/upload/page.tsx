"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const themes = [
  { value: "IDENTITIES", label: "Identities" },
  { value: "EXPERIENCES", label: "Experiences" },
  { value: "HUMAN_INGENUITY", label: "Human Ingenuity" },
  { value: "SOCIAL_ORGANIZATION", label: "Social Organization" },
  { value: "SHARING_THE_PLANET", label: "Sharing the Planet" },
];

type AiAnalysis = {
  description?: string;
  culturalContext?: string;
  themes?: string[];
  talkingPoints?: string[];
  deeperQuestions?: string[];
  vocabularyHints?: string[];
  suggestedTheme?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState("IDENTITIES");
  const [culturalContext, setCulturalContext] = useState("");
  const [talkingPoints, setTalkingPoints] = useState(["", "", ""]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [scope, setScope] = useState<"CLASS" | "GLOBAL">("CLASS");
  const [submitted, setSubmitted] = useState(false);

  async function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setAnalysisError("");

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", f);

      const uploadRes = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setError(data.error || "Upload failed");
        setAnalyzing(false);
        return;
      }

      const { url } = await uploadRes.json();
      setImageUrl(url);

      const analyzeRes = await fetch("/api/images/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (analyzeRes.ok) {
        const { analysis } = await analyzeRes.json();
        setAiAnalysis(analysis);
        if (analysis.culturalContext) setCulturalContext(analysis.culturalContext);
        if (analysis.talkingPoints?.length) setTalkingPoints(analysis.talkingPoints);
        if (analysis.suggestedTheme && themes.some((t) => t.value === analysis.suggestedTheme)) {
          setTheme(analysis.suggestedTheme);
        }
      } else {
        setAnalysisError("AI analysis failed. You can fill in the fields manually.");
      }
    } catch {
      setAnalysisError("AI analysis failed. You can fill in the fields manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setImageUrl(null);
    setAiAnalysis(null);
    setAnalysisError("");
    setCulturalContext("");
    setTalkingPoints(["", "", ""]);
    setTheme("IDENTITIES");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updatePoint(index: number, value: string) {
    const updated = [...talkingPoints];
    updated[index] = value;
    setTalkingPoints(updated);
  }

  function removePoint(index: number) {
    if (talkingPoints.length <= 2) return;
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file || !imageUrl) {
      setError("Please select an image");
      return;
    }
    if (!culturalContext.trim()) {
      setError("Cultural context is required");
      return;
    }
    const filteredPoints = talkingPoints.filter((p) => p.trim());
    if (filteredPoints.length < 2) {
      setError("At least 2 talking points are required");
      return;
    }

    setUploading(true);
    try {
      const createRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          theme,
          culturalContext,
          talkingPoints: filteredPoints,
          aiAnalysis: aiAnalysis || undefined,
          scope,
        }),
      });

      if (!createRes.ok) {
        setError("Failed to save image record");
        setUploading(false);
        return;
      }

      if (scope === "GLOBAL") {
        setSubmitted(true);
        return;
      }
      router.push("/teacher/images");
    } catch {
      setError("Something went wrong");
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 460, margin: "48px auto 0" }}>
        <div className="card" style={{ padding: 36, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--sage-soft)",
              border: "1.5px solid oklch(0.82 0.07 155)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="oklch(0.5 0.14 155)">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>
            Submitted for review
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 24 }}>
            Your image has been submitted to the global library and will be reviewed by an admin before becoming available to all students.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => {
                setSubmitted(false);
                clearFile();
                setScope("CLASS");
              }}
              className="btn-primary"
            >
              Upload another
            </button>
            <button onClick={() => router.push("/teacher/images")} className="btn-ghost">
              View library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>New submission</div>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
          Upload an image.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>
          Add a culturally relevant image for student speaking practice.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 22 }}
      >
        {error && (
          <div
            style={{
              background: "var(--rose-soft)",
              border: "1px solid oklch(0.82 0.09 25)",
              color: "oklch(0.42 0.14 25)",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label className="label">Image</label>
          {preview ? (
            <div
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--line)",
                background: "var(--paper-2)",
              }}
            >
              <div style={{ position: "relative", height: 260 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              {analyzing && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "oklch(from var(--paper) l c h / 0.82)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="card-soft"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 18px",
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid var(--accent)",
                        borderTopColor: "transparent",
                        animation: "habla-pulse-dot 1.2s ease-in-out infinite",
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>
                      Analyzing image with AI…
                    </span>
                  </div>
                </div>
              )}
              {!analyzing && (
                <button
                  type="button"
                  onClick={clearFile}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    padding: 6,
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    color: "var(--ink-2)",
                    cursor: "pointer",
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--line)"}`,
                borderRadius: 14,
                background: dragOver ? "var(--accent-softer)" : "var(--paper-2)",
                cursor: "pointer",
                transition: "border-color 150ms ease, background 150ms ease",
              }}
            >
              <svg
                width={32}
                height={32}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={1.5}
                stroke="var(--ink-4)"
                style={{ marginBottom: 8 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500, margin: 0 }}>
                Drop an image here or click to browse
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-4)", margin: "6px 0 0" }}>
                PNG, JPG, WEBP up to 10 MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: "none" }}
          />
        </div>

        {analysisError && (
          <div
            style={{
              background: "var(--gold-soft)",
              border: "1px solid oklch(0.82 0.09 65)",
              color: "oklch(0.42 0.13 65)",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 10,
            }}
          >
            {analysisError}
          </div>
        )}

        {aiAnalysis && !analyzing && (
          <div
            style={{
              background: "var(--sage-soft)",
              border: "1px solid oklch(0.82 0.07 155)",
              color: "oklch(0.4 0.1 155)",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            AI analysis complete — fields have been pre-filled. Review and edit as needed.
          </div>
        )}

        {aiAnalysis && !analyzing && (
          <div className="card" style={{ overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setAnalysisExpanded(!analysisExpanded)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                background: "var(--paper-2)",
                border: "none",
                borderBottom: analysisExpanded ? "1px solid var(--line)" : "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--ink-2)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              AI analysis details
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
                style={{ transform: analysisExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {analysisExpanded && (
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                {aiAnalysis.description && (
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Description</div>
                    <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>
                      {aiAnalysis.description}
                    </p>
                  </div>
                )}
                {aiAnalysis.themes && aiAnalysis.themes.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Related themes</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {aiAnalysis.themes.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {aiAnalysis.deeperQuestions && aiAnalysis.deeperQuestions.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Deeper questions</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                      {aiAnalysis.deeperQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
                {aiAnalysis.vocabularyHints && aiAnalysis.vocabularyHints.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Vocabulary hints</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {aiAnalysis.vocabularyHints.map((v, i) => (
                        <span key={i} className="badge badge-accent" style={{ fontSize: 11 }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {aiAnalysis?.description && !analyzing && (
          <div>
            <label className="label">
              AI image description{" "}
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-4)" }}>
                (read-only — used by the AI examiner)
              </span>
            </label>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--ink-2)",
                lineHeight: 1.5,
              }}
            >
              {aiAnalysis.description}
            </div>
          </div>
        )}

        <div>
          <label className="label">Add to library</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setScope("CLASS")}
              style={{
                flex: 1,
                minWidth: 200,
                padding: 14,
                textAlign: "left",
                borderRadius: 12,
                border: `1.5px solid ${scope === "CLASS" ? "var(--accent)" : "var(--line)"}`,
                background: scope === "CLASS" ? "var(--accent-softer)" : "var(--card)",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: scope === "CLASS" ? "var(--accent-2)" : "var(--ink)",
                  margin: 0,
                }}
              >
                Class library
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 0" }}>
                Available to your students immediately
              </p>
            </button>
            <button
              type="button"
              onClick={() => setScope("GLOBAL")}
              style={{
                flex: 1,
                minWidth: 200,
                padding: 14,
                textAlign: "left",
                borderRadius: 12,
                border: `1.5px solid ${scope === "GLOBAL" ? "var(--accent)" : "var(--line)"}`,
                background: scope === "GLOBAL" ? "var(--accent-softer)" : "var(--card)",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: scope === "GLOBAL" ? "var(--accent-2)" : "var(--ink)",
                  margin: 0,
                }}
              >
                Global library
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 0" }}>
                Reviewed before available to all students
              </p>
            </button>
          </div>
          {scope === "GLOBAL" && (
            <p style={{ fontSize: 12, color: "oklch(0.42 0.13 65)", marginTop: 8, marginBottom: 0 }}>
              Global submissions are reviewed before becoming available to all students.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            IB theme
            {aiAnalysis?.suggestedTheme && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "var(--ink-4)" }}>
                (AI suggested:{" "}
                {themes.find((t) => t.value === aiAnalysis.suggestedTheme)?.label ||
                  aiAnalysis.suggestedTheme})
              </span>
            )}
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="input"
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cultural context</label>
          <textarea
            value={culturalContext}
            onChange={(e) => setCulturalContext(e.target.value)}
            rows={4}
            required
            className="input"
            style={{ resize: "none" }}
            placeholder="Describe what the image depicts culturally and its relevance to the IB theme…"
          />
        </div>

        <div>
          <label className="label">
            Talking points{" "}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-4)" }}>(min 2)</span>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {talkingPoints.map((point, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  className="mono"
                  style={{
                    minWidth: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-4)",
                    textAlign: "right",
                  }}
                >
                  {i + 1}.
                </span>
                <input
                  value={point}
                  onChange={(e) => updatePoint(i, e.target.value)}
                  placeholder="Enter a discussion question or prompt…"
                  className="input"
                  style={{ flex: 1 }}
                />
                {talkingPoints.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePoint(i)}
                    style={{
                      padding: 4,
                      color: "var(--ink-4)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTalkingPoints([...talkingPoints, ""])}
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            + Add another
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
          <button
            type="submit"
            disabled={uploading || analyzing}
            className="btn-primary"
            style={{ opacity: uploading || analyzing ? 0.5 : 1 }}
          >
            {uploading ? "Saving…" : "Save image"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/teacher/images")}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
