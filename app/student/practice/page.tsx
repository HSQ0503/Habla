"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { themeColors } from "@/lib/theme-colors";

type ImageRecord = {
  id: string;
  url: string;
  theme: string;
  culturalContext: string;
  talkingPoints: string[];
};

type ClassInfo = {
  id: string;
  name: string;
  teacher: { id: string; name: string };
} | null;

type Library = "global" | "class";

const themes = [
  { value: "IDENTITIES", label: "Identidades", sublabel: "Identities" },
  { value: "EXPERIENCES", label: "Experiencias", sublabel: "Experiences" },
  { value: "HUMAN_INGENUITY", label: "Ingenio humano", sublabel: "Human Ingenuity" },
  { value: "SOCIAL_ORGANIZATION", label: "Organización social", sublabel: "Social Organization" },
  { value: "SHARING_THE_PLANET", label: "Compartir el planeta", sublabel: "Sharing the Planet" },
];

export default function PracticePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<"theme" | "image" | "confirm">("theme");
  const [library, setLibrary] = useState<Library>("global");
  const [classInfo, setClassInfo] = useState<ClassInfo>(null);
  const [classLoaded, setClassLoaded] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [starting, setStarting] = useState(false);

  // Fetch class info for library toggle
  useEffect(() => {
    if (!session?.user?.classId) return;
    fetch("/api/classes/mine")
      .then((res) => res.json())
      .then((data) => setClassInfo(data.class))
      .finally(() => setClassLoaded(true));
  }, [session?.user?.classId]);

  useEffect(() => {
    if (step !== "image") return;
    const params = new URLSearchParams();
    if (selectedTheme) params.set("theme", selectedTheme);

    if (library === "class" && classInfo?.teacher.id) {
      params.set("scope", "CLASS");
      params.set("teacherId", classInfo.teacher.id);
    } else {
      params.set("scope", "GLOBAL");
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/images${query}`)
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        setLoadingImages(false);
      });
  }, [step, selectedTheme, library, classInfo?.teacher.id]);

  function handleThemeSelect(theme: string | null) {
    setSelectedTheme(theme);
    setLoadingImages(true);
    setStep("image");
  }

  function handleImageSelect(image: ImageRecord) {
    setSelectedImage(image);
    setStep("confirm");
  }

  function handleSurpriseMe() {
    if (images.length === 0) return;
    const random = images[Math.floor(Math.random() * images.length)];
    handleImageSelect(random);
  }

  async function handleBegin() {
    if (!selectedImage) return;
    setStarting(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selectedImage.id }),
    });
    const sess = await res.json();
    router.push(`/student/practice/${sess.id}`);
  }

  const hasClass = !!classInfo;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["Theme", "Image", "Confirm"].map((label, i) => {
          const stepIndex = ["theme", "image", "confirm"].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-indigo-400" : "bg-gray-200"}`} />}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isDone
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Theme Selection */}
      {step === "theme" && (
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Start IO Practice</h1>
          <p className="text-sm text-gray-500 mb-6">Choose a theme to explore.</p>

          {/* Library toggle */}
          {classLoaded && hasClass && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Image Library
              </label>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  onClick={() => setLibrary("global")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    library === "global"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Global Library
                </button>
                <button
                  onClick={() => setLibrary("class")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    library === "class"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {classInfo?.teacher.name}&apos;s Library
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
              const colors = themeColors[t.value];
              return (
                <button
                  key={t.value}
                  onClick={() => handleThemeSelect(t.value)}
                  className={`text-left p-5 rounded-xl border-2 border-transparent bg-white hover:border-gray-200 shadow-sm hover:shadow transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <div className={`w-5 h-5 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="6" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.sublabel}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => handleThemeSelect(null)}
              className="text-left p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Random Theme</p>
                  <p className="text-xs text-gray-500 mt-0.5">Surprise me with any theme</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Image Selection */}
      {step === "image" && (
        <div>
          <button
            onClick={() => { setStep("theme"); setSelectedTheme(null); setImages([]); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to themes
          </button>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Choose an Image</h1>
          <p className="text-sm text-gray-500 mb-6">
            {selectedTheme
              ? `Showing images for ${themeColors[selectedTheme]?.label || selectedTheme}`
              : "Showing images from all themes"}
            {library === "class" && classInfo ? ` from ${classInfo.teacher.name}'s library` : " from the global library"}
          </p>

          {loadingImages ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">No images available{library === "class" ? " in your teacher's library" : ""} for this theme yet.</p>
              <button
                onClick={() => { setStep("theme"); setSelectedTheme(null); }}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Choose a different theme
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={handleSurpriseMe}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                  Surprise Me
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => {
                  const theme = themeColors[img.theme];
                  return (
                    <button
                      key={img.id}
                      onClick={() => handleImageSelect(img)}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent hover:border-indigo-400 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt="Practice image"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {theme && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
                          {theme.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedImage && (
        <div>
          <button
            onClick={() => { setStep("image"); setSelectedImage(null); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to images
          </button>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Ready to Begin</h1>
          <p className="text-sm text-gray-500 mb-6">
            Review your selection and start when ready.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.url}
              alt="Selected practice image"
              className="w-full max-h-80 object-contain bg-gray-100"
            />
            <div className="p-5">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${themeColors[selectedImage.theme]?.bg || "bg-gray-100"} ${themeColors[selectedImage.theme]?.text || "text-gray-700"}`}>
                {themeColors[selectedImage.theme]?.label || selectedImage.theme}
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-medium text-indigo-900 mb-2">Session Structure</h3>
            <div className="space-y-1.5 text-sm text-indigo-700">
              <p>1. <strong>Preparation</strong> — 15 minutes to study the image and plan</p>
              <p>2. <strong>Presentation</strong> — 3–4 minutes to present your analysis</p>
              <p>3. <strong>Conversation</strong> — 8–10 minutes discussing with the examiner</p>
            </div>
          </div>

          <button
            onClick={handleBegin}
            disabled={starting}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {starting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Begin Practice
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
