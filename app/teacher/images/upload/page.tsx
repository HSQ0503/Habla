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

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState("IDENTITIES");
  const [culturalContext, setCulturalContext] = useState("");
  const [talkingPoints, setTalkingPoints] = useState(["", "", ""]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
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

    if (!file) {
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
      // Upload file to Vercel Blob
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const { url } = await uploadRes.json();

      // Create image record
      const createRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          theme,
          culturalContext,
          talkingPoints: filteredPoints,
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
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
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

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            IB Theme
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
            rows={3}
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
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              "Upload Image"
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
