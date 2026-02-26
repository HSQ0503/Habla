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

  async function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setAnalysisError("");

    // Upload to Vercel Blob immediately so we have a public URL for analysis
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

      // Now analyze with GPT-4o Vision
      const analyzeRes = await fetch("/api/images/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (analyzeRes.ok) {
        const { analysis } = await analyzeRes.json();
        setAiAnalysis(analysis);

        // Pre-fill form fields
        if (analysis.culturalContext) {
          setCulturalContext(analysis.culturalContext);
        }
        if (analysis.talkingPoints?.length) {
          setTalkingPoints(analysis.talkingPoints);
        }
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
        }),
      });

      if (!createRes.ok) {
        setError("Failed to save image record");
        setUploading(false);
        return;
      }

      router.push("/teacher/images");
    } catch {
      setError("Something went wrong");
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Upload New Image</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a culturally relevant image for student speaking practice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image
          </label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <div className="relative h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              {analyzing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-lg shadow-sm border border-gray-200">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Analyzing image with AI...</span>
                  </div>
                </div>
              )}
              {!analyzing && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                dragOver
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">
                Drop an image here or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Analysis status messages */}
        {analysisError && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {analysisError}
          </div>
        )}

        {aiAnalysis && !analyzing && (
          <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>AI analysis complete — fields have been pre-filled. Review and edit as needed.</span>
            </div>
          </div>
        )}

        {/* AI Analysis Details (collapsible) */}
        {aiAnalysis && !analyzing && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAnalysisExpanded(!analysisExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-700">AI Analysis Details</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${analysisExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {analysisExpanded && (
              <div className="px-4 py-4 space-y-4 text-sm bg-white">
                {aiAnalysis.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-gray-700 leading-relaxed">{aiAnalysis.description}</p>
                  </div>
                )}
                {aiAnalysis.themes && aiAnalysis.themes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Related Themes</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {aiAnalysis.themes.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {aiAnalysis.deeperQuestions && aiAnalysis.deeperQuestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Deeper Questions</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {aiAnalysis.deeperQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
                {aiAnalysis.vocabularyHints && aiAnalysis.vocabularyHints.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Vocabulary Hints</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiAnalysis.vocabularyHints.map((v, i) => (
                        <span key={i} className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
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

        {/* AI Description (read-only, for teacher reference) */}
        {aiAnalysis?.description && !analyzing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              AI Image Description <span className="text-xs font-normal text-gray-400">(read-only — used by the AI examiner)</span>
            </label>
            <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 leading-relaxed">
              {aiAnalysis.description}
            </div>
          </div>
        )}

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            IB Theme
            {aiAnalysis?.suggestedTheme && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (AI suggested: {themes.find((t) => t.value === aiAnalysis.suggestedTheme)?.label || aiAnalysis.suggestedTheme})
              </span>
            )}
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Cultural context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cultural Context
          </label>
          <textarea
            value={culturalContext}
            onChange={(e) => setCulturalContext(e.target.value)}
            rows={4}
            required
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            placeholder="Describe what the image depicts culturally and its relevance to the IB theme..."
          />
        </div>

        {/* Talking points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Talking Points <span className="text-gray-400 font-normal">(min 2)</span>
          </label>
          <div className="space-y-2">
            {talkingPoints.map((point, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex items-center justify-center w-6 h-10 text-xs text-gray-400 font-medium">
                  {i + 1}.
                </div>
                <input
                  value={point}
                  onChange={(e) => updatePoint(i, e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="Enter a discussion question or prompt..."
                />
                {talkingPoints.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePoint(i)}
                    className="px-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            + Add Another
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={uploading || analyzing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Image"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/teacher/images")}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
