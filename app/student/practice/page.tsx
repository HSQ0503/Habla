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

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--line)",
        borderRadius: 10,
        background: "var(--card)",
        padding: 3,
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 7,
              border: "none",
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--paper)" : "var(--ink-2)",
              cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

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
  const [language, setLanguage] = useState<"es" | "en">("es");

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
      body: JSON.stringify({ imageId: selectedImage.id, language }),
    });
    const sess = await res.json();
    router.push(`/student/practice/${sess.id}`);
  }

  const hasClass = !!classInfo;
  const stepIndex = ["theme", "image", "confirm"].indexOf(step);

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
        {["Theme", "Image", "Confirm"].map((label, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && (
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: isDone ? "var(--accent)" : "var(--line)",
                  }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    background: isActive ? "var(--ink)" : isDone ? "var(--accent-softer)" : "var(--paper-2)",
                    color: isActive ? "var(--paper)" : isDone ? "var(--accent-2)" : "var(--ink-4)",
                    border: `1px solid ${isDone || isActive ? "var(--ink)" : "var(--line)"}`,
                  }}
                >
                  {isDone ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isActive ? "var(--ink)" : "var(--ink-4)",
                  }}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {step === "theme" && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Step 01 · Theme</div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 36px)", margin: 0 }}>
            Start IO practice.
          </h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8, marginBottom: 24, fontSize: 15 }}>
            Pick a theme you actually care about.
          </p>

          {classLoaded && hasClass && (
            <div style={{ marginBottom: 22 }}>
              <label className="label">Image library</label>
              <Segmented
                value={library}
                onChange={setLibrary}
                options={[
                  { value: "global", label: "Global library" },
                  { value: "class", label: `${classInfo?.teacher.name}'s library` },
                ]}
              />
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {themes.map((t) => {
              const colors = themeColors[t.value];
              return (
                <button
                  key={t.value}
                  onClick={() => handleThemeSelect(t.value)}
                  className="card-soft"
                  style={{
                    textAlign: "left",
                    padding: 18,
                    border: "1px solid var(--line)",
                    background: "var(--card)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    transition: "border-color 150ms ease, transform 150ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: colors.soft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${colors.accent}20`,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: colors.accent,
                      }}
                    />
                  </span>
                  <div>
                    <p
                      className="display"
                      style={{ margin: 0, fontSize: 16, fontWeight: 600 }}
                    >
                      {t.label}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>
                      {t.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => handleThemeSelect(null)}
              style={{
                textAlign: "left",
                padding: 18,
                border: "1.5px dashed var(--line)",
                borderRadius: "var(--radius-lg)",
                background: "var(--paper-2)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="var(--ink-3)">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </span>
              <div>
                <p className="display" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  Surprise me
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>
                  Random theme from the library
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === "image" && (
        <div>
          <button
            onClick={() => {
              setStep("theme");
              setSelectedTheme(null);
              setImages([]);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ink-3)",
              marginBottom: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to themes
          </button>

          <div className="eyebrow" style={{ marginBottom: 10 }}>Step 02 · Image</div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 36px)", margin: 0 }}>
            Choose an image.
          </h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8, marginBottom: 20, fontSize: 14 }}>
            {selectedTheme
              ? `Showing ${themeColors[selectedTheme]?.label || selectedTheme}`
              : "Showing all themes"}
            {library === "class" && classInfo
              ? ` from ${classInfo.teacher.name}'s library`
              : " from the global library"}
            .
          </p>

          {loadingImages ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "4/3",
                    background: "var(--paper-2)",
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                  }}
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
                No images available
                {library === "class" ? " in your teacher's library" : ""} for this theme yet.
              </p>
              <button
                onClick={() => {
                  setStep("theme");
                  setSelectedTheme(null);
                }}
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Choose a different theme
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <button onClick={handleSurpriseMe} className="btn-ghost">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  Surprise me
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {images.map((img) => {
                  const theme = themeColors[img.theme];
                  return (
                    <button
                      key={img.id}
                      onClick={() => handleImageSelect(img)}
                      style={{
                        position: "relative",
                        aspectRatio: "4/3",
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "var(--paper-2)",
                        border: "1.5px solid var(--line)",
                        padding: 0,
                        cursor: "pointer",
                        transition: "border-color 150ms ease, transform 150ms ease",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt="Practice image"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {theme && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: theme.soft,
                            color: theme.accent,
                            border: `1px solid ${theme.accent}20`,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
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

      {step === "confirm" && selectedImage && (
        <div>
          <button
            onClick={() => {
              setStep("image");
              setSelectedImage(null);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ink-3)",
              marginBottom: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to images
          </button>

          <div className="eyebrow" style={{ marginBottom: 10 }}>Step 03 · Confirm</div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 36px)", margin: 0 }}>
            Ready to begin.
          </h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8, marginBottom: 24, fontSize: 15 }}>
            Review your selection and start when ready.
          </p>

          <div className="card" style={{ overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.url}
              alt="Selected practice image"
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "contain",
                background: "var(--paper-2)",
                display: "block",
              }}
            />
            <div style={{ padding: 18 }}>
              {themeColors[selectedImage.theme] && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: themeColors[selectedImage.theme].soft,
                    color: themeColors[selectedImage.theme].accent,
                    border: `1px solid ${themeColors[selectedImage.theme].accent}20`,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: themeColors[selectedImage.theme].accent,
                    }}
                  />
                  {themeColors[selectedImage.theme].label}
                </span>
              )}
            </div>
          </div>

          <div
            className="card-soft"
            style={{
              marginTop: 20,
              padding: 20,
              background: "var(--indigo-softer)",
              border: "1px solid var(--accent-soft)",
            }}
          >
            <div className="eyebrow" style={{ color: "var(--accent-2)", marginBottom: 10 }}>
              Session structure
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>
              <li>
                <strong style={{ color: "var(--ink)" }}>Preparation</strong> — 15 minutes to study and plan
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>Presentation</strong> — 3–4 minutes to present
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>Follow-up</strong> — 4–5 minutes discussing your presentation
              </li>
              <li>
                <strong style={{ color: "var(--ink)" }}>Discussion</strong> — 5–6 minutes on broader themes
              </li>
            </ol>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="label">Exam language</label>
            <Segmented
              value={language}
              onChange={setLanguage}
              options={[
                { value: "es", label: "Español" },
                { value: "en", label: "English (practice)" },
              ]}
            />
            {language === "en" && (
              <p
                style={{
                  fontSize: 12,
                  color: "oklch(0.42 0.13 65)",
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                English mode is for familiarization only. Official IB exams are conducted in Spanish.
              </p>
            )}
          </div>

          <button
            onClick={handleBegin}
            disabled={starting}
            className="btn-primary"
            style={{
              marginTop: 24,
              width: "100%",
              justifyContent: "center",
              padding: "14px 18px",
              fontSize: 15,
              opacity: starting ? 0.6 : 1,
            }}
          >
            {starting ? (
              "Starting…"
            ) : (
              <>
                Begin practice
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
