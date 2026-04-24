"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { themeColors } from "@/lib/theme-colors";

type ImageRecord = {
  id: string;
  url: string;
  theme: string;
  culturalContext: string;
  talkingPoints: string[];
  scope: string;
  approvalStatus: string;
  rejectionReason: string | null;
  createdAt: string;
};

const SCOPE_FILTERS = [
  { value: "", label: "All images" },
  { value: "CLASS", label: "Class images" },
  { value: "GLOBAL", label: "Global submissions" },
];

function scopeBadgeClass(scope: string) {
  if (scope === "GLOBAL") return "badge badge-accent";
  return "badge";
}

function statusBadgeClass(status: string) {
  if (status === "APPROVED") return "badge badge-sage";
  if (status === "REJECTED") return "badge badge-rose";
  return "badge badge-gold";
}

function canEdit(image: ImageRecord) {
  if (image.scope === "CLASS") return true;
  if (image.scope === "GLOBAL" && image.approvalStatus === "PENDING") return true;
  return false;
}

export default function ImagesPage() {
  const { data: session } = useSession();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageRecord | null>(null);
  const [viewingImage, setViewingImage] = useState<ImageRecord | null>(null);
  const [scopeFilter, setScopeFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    const params = new URLSearchParams({ creatorId: session.user.id });
    if (scopeFilter) params.set("scope", scopeFilter);
    fetch(`/api/images?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        setLoading(false);
      });
  }, [session?.user?.id, scopeFilter, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (res.ok) setImages((prev) => prev.filter((img) => img.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Your library</div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
            Image library.
          </h1>
          <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 14 }}>
            {images.length} image{images.length !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Link href="/teacher/images/upload" className="btn-primary">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload image
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={scopeFilter}
          onChange={(e) => {
            setScopeFilter(e.target.value);
            setLoading(true);
          }}
          className="input"
          style={{ width: "auto", fontSize: 13, padding: "8px 12px" }}
        >
          {SCOPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                overflow: "hidden",
                animation: "habla-pulse-dot 2s ease-in-out infinite",
              }}
            >
              <div style={{ height: 180, background: "var(--paper-2)" }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 12, background: "var(--paper-2)", borderRadius: 4, width: "30%" }} />
                <div style={{ height: 10, background: "var(--paper-2)", borderRadius: 4 }} />
                <div style={{ height: 10, background: "var(--paper-2)", borderRadius: 4, width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--paper-2)",
              border: "1px solid var(--line)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="var(--ink-3)">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 16 }}>
            {scopeFilter
              ? "No images match this filter."
              : "No images yet. Upload your first image to get started."}
          </p>
          <Link href="/teacher/images/upload" className="btn-primary">
            Upload image
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {images.map((image) => {
            const theme = themeColors[image.theme];
            const editable = canEdit(image);

            return (
              <div key={image.id} className="card" style={{ overflow: "hidden" }}>
                <button
                  onClick={() => setViewingImage(image)}
                  style={{
                    position: "relative",
                    height: 180,
                    width: "100%",
                    background: "var(--paper-2)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "block",
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.culturalContext}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    {theme && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "2px 9px",
                          borderRadius: 999,
                          background: theme.soft,
                          color: theme.accent,
                          border: `1px solid ${theme.accent}20`,
                          fontSize: 11.5,
                          fontWeight: 500,
                        }}
                      >
                        <span
                          style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }}
                        />
                        {theme.label}
                      </span>
                    )}
                    <span className={scopeBadgeClass(image.scope)} style={{ fontSize: 11 }}>
                      {image.scope === "GLOBAL" ? "Global" : "Class"}
                    </span>
                    {image.scope === "GLOBAL" && (
                      <span className={statusBadgeClass(image.approvalStatus)} style={{ fontSize: 11 }}>
                        {image.approvalStatus === "APPROVED"
                          ? "Approved"
                          : image.approvalStatus === "REJECTED"
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--ink-2)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      margin: 0,
                    }}
                  >
                    {image.culturalContext}
                  </p>

                  {image.approvalStatus === "REJECTED" && image.rejectionReason && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 10,
                        background: "var(--rose-soft)",
                        border: "1px solid oklch(0.82 0.09 25)",
                        borderRadius: 8,
                      }}
                    >
                      <p style={{ fontSize: 12, color: "oklch(0.42 0.14 25)", margin: 0 }}>
                        <strong>Rejected:</strong> {image.rejectionReason}
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid var(--line-2)",
                    }}
                  >
                    <button
                      onClick={() => setViewingImage(image)}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--ink-2)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    {editable && (
                      <>
                        <button
                          onClick={() => setEditingImage(image)}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--ink-2)",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          disabled={deleting === image.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "oklch(0.5 0.16 25)",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            marginLeft: "auto",
                          }}
                        >
                          {deleting === image.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingImage && (
        <DetailModal
          image={viewingImage}
          onClose={() => setViewingImage(null)}
          onEdit={() => {
            const img = viewingImage;
            setViewingImage(null);
            if (canEdit(img)) setEditingImage(img);
          }}
          canEdit={canEdit(viewingImage)}
        />
      )}

      {editingImage && (
        <EditModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSaved={() => {
            setEditingImage(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function DetailModal({
  image,
  onClose,
  onEdit,
  canEdit: editable,
}: {
  image: ImageRecord;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const theme = themeColors[image.theme];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "oklch(0 0 0 / 0.4)" }}
      />
      <div
        className="card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--card)",
        }}
      >
        <div style={{ position: "relative", background: "var(--paper-2)", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.culturalContext}
            style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block" }}
          />
          <button
            onClick={onClose}
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
        </div>

        <div style={{ padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {theme && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: theme.soft,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}20`,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }} />
                {theme.label}
              </span>
            )}
            <span className={scopeBadgeClass(image.scope)}>
              {image.scope === "GLOBAL" ? "Global" : "Class"}
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              {new Date(image.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Cultural context</div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>
              {image.culturalContext}
            </p>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Talking points</div>
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {image.talkingPoints.map((point, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--ink-2)" }}>
                  <span
                    className="mono"
                    style={{ color: "var(--ink-4)", fontWeight: 500, flexShrink: 0, minWidth: 20 }}
                  >
                    {i + 1}.
                  </span>
                  <span style={{ lineHeight: 1.6 }}>{point}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 24px",
            borderTop: "1px solid var(--line)",
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
          {editable && (
            <button onClick={onEdit} className="btn-primary">
              Edit image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EditModal({
  image,
  onClose,
  onSaved,
}: {
  image: ImageRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [theme, setTheme] = useState(image.theme);
  const [culturalContext, setCulturalContext] = useState(image.culturalContext);
  const [talkingPoints, setTalkingPoints] = useState<string[]>(image.talkingPoints);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updatePoint(index: number, value: string) {
    const updated = [...talkingPoints];
    updated[index] = value;
    setTalkingPoints(updated);
  }

  function removePoint(index: number) {
    if (talkingPoints.length <= 2) return;
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const filtered = talkingPoints.filter((p) => p.trim());
    if (filtered.length < 2) {
      setError("At least 2 talking points required");
      return;
    }
    if (!culturalContext.trim()) {
      setError("Cultural context is required");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch(`/api/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, culturalContext, talkingPoints: filtered }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save changes");
      setSaving(false);
      return;
    }

    onSaved();
  }

  const themes = [
    { value: "IDENTITIES", label: "Identities" },
    { value: "EXPERIENCES", label: "Experiences" },
    { value: "HUMAN_INGENUITY", label: "Human Ingenuity" },
    { value: "SOCIAL_ORGANIZATION", label: "Social Organization" },
    { value: "SHARING_THE_PLANET", label: "Sharing the Planet" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "oklch(0 0 0 / 0.3)" }}
      />
      <div
        className="card"
        style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", background: "var(--card)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 20,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Edit image</h2>
          <button
            onClick={onClose}
            style={{
              color: "var(--ink-4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
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
            <label className="label">Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input">
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
              rows={3}
              className="input"
              style={{ resize: "none" }}
            />
          </div>

          <div>
            <label className="label">Talking points</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {talkingPoints.map((point, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={point}
                    onChange={(e) => updatePoint(i, e.target.value)}
                    placeholder={`Talking point ${i + 1}`}
                    className="input"
                    style={{ flex: 1 }}
                  />
                  {talkingPoints.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePoint(i)}
                      style={{
                        padding: "0 8px",
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
                marginTop: 8,
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
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            padding: 20,
            borderTop: "1px solid var(--line)",
          }}
        >
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
