"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { themeColors } from "@/lib/theme-colors";

type ImageRecord = {
  id: string;
  url: string;
  theme: string;
  culturalContext: string;
  talkingPoints: string[];
  aiAnalysis: Record<string, unknown> | null;
  approvalStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  creator: { name: string; email: string } | null;
};

type Tab = "pending" | "approved" | "rejected";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<ImageRecord[]>([]);
  const [approved, setApproved] = useState<ImageRecord[]>([]);
  const [rejected, setRejected] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.replace("/teacher/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!session?.user?.isAdmin) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/pending"),
      fetch("/api/admin/images?status=APPROVED"),
      fetch("/api/admin/images?status=REJECTED"),
    ]).then(async ([pendingRes, approvedRes, rejectedRes]) => {
      if (cancelled) return;
      if (pendingRes.ok) setPending(await pendingRes.json());
      if (approvedRes.ok) setApproved(await approvedRes.json());
      if (rejectedRes.ok) setRejected(await rejectedRes.json());
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.isAdmin]);

  async function handleApprove(id: string) {
    setActing(id);
    const res = await fetch(`/api/admin/images/${id}/approve`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setPending((prev) => prev.filter((i) => i.id !== id));
      setApproved((prev) => [
        { ...updated, creator: pending.find((i) => i.id === id)?.creator ?? null },
        ...prev,
      ]);
    }
    setActing(null);
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setActing(id);
    const res = await fetch(`/api/admin/images/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPending((prev) => prev.filter((i) => i.id !== id));
      setRejected((prev) => [
        { ...updated, creator: pending.find((i) => i.id === id)?.creator ?? null },
        ...prev,
      ]);
    }
    setRejectingId(null);
    setRejectReason("");
    setActing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this image from the global library?")) return;
    setActing(id);
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApproved((prev) => prev.filter((i) => i.id !== id));
      setRejected((prev) => prev.filter((i) => i.id !== id));
    }
    setActing(null);
  }

  if (status === "loading" || !session?.user?.isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "var(--ink-3)",
        }}
      >
        Loading…
      </div>
    );
  }

  const tabData: Record<Tab, ImageRecord[]> = { pending, approved, rejected };
  const currentImages = tabData[tab];

  const Tab = ({
    value,
    label,
    count,
    badge,
  }: {
    value: Tab;
    label: string;
    count: number;
    badge?: boolean;
  }) => {
    const active = tab === value;
    return (
      <button
        onClick={() => setTab(value)}
        style={{
          padding: "12px 0 14px",
          fontSize: 14,
          fontWeight: 500,
          background: "none",
          border: "none",
          borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
          color: active ? "var(--ink)" : "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        {label}
        {badge && count > 0 && (
          <span className="badge badge-gold" style={{ fontSize: 10 }}>
            {count}
          </span>
        )}
        {!badge && <span style={{ color: "var(--ink-4)", fontSize: 12 }}>({count})</span>}
      </button>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Library curation</div>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
          Admin console.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 8, fontSize: 15 }}>
          Review global image submissions and manage the shared library.
        </p>
      </div>

      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
        <nav style={{ display: "flex", gap: 28 }}>
          <Tab value="pending" label="Pending review" count={pending.length} badge />
          <Tab value="approved" label="Global library" count={approved.length} />
          <Tab value="rejected" label="Rejected" count={rejected.length} />
        </nav>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 18,
                display: "flex",
                gap: 16,
                animation: "habla-pulse-dot 2s ease-in-out infinite",
              }}
            >
              <div style={{ width: 128, height: 96, borderRadius: 10, background: "var(--paper-2)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 12, background: "var(--paper-2)", borderRadius: 4, width: "30%" }} />
                <div style={{ height: 10, background: "var(--paper-2)", borderRadius: 4 }} />
                <div style={{ height: 10, background: "var(--paper-2)", borderRadius: 4, width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : currentImages.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
            {tab === "pending" && "No pending submissions. All caught up!"}
            {tab === "approved" && "No approved global images yet."}
            {tab === "rejected" && "No rejected submissions."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {currentImages.map((image) => {
            const theme = themeColors[image.theme];
            return (
              <div key={image.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.culturalContext}
                    style={{
                      width: 148,
                      height: 112,
                      borderRadius: 12,
                      objectFit: "cover",
                      background: "var(--paper-2)",
                      border: "1px solid var(--line)",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: "wrap",
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
                      {image.creator && (
                        <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                          by {image.creator.name} ({image.creator.email})
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: 13.5,
                        color: "var(--ink-2)",
                        margin: "0 0 6px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {image.culturalContext}
                    </p>

                    <p className="mono" style={{ fontSize: 11, color: "var(--ink-4)", margin: 0 }}>
                      {image.talkingPoints.length} talking points ·{" "}
                      {new Date(image.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    {image.aiAnalysis && (
                      <button
                        onClick={() =>
                          setExpandedAnalysis(expandedAnalysis === image.id ? null : image.id)
                        }
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--accent)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {expandedAnalysis === image.id ? "Hide AI analysis" : "View AI analysis"}
                      </button>
                    )}

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
                          <strong>Reason:</strong> {image.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    {tab === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(image.id)}
                          disabled={acting === image.id}
                          className="btn-primary"
                          style={{
                            background: "oklch(0.5 0.14 155)",
                            borderColor: "oklch(0.5 0.14 155)",
                            padding: "7px 14px",
                            fontSize: 13,
                          }}
                        >
                          {acting === image.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectingId(image.id)}
                          disabled={acting === image.id}
                          className="btn-ghost"
                          style={{
                            color: "oklch(0.5 0.16 25)",
                            borderColor: "oklch(0.82 0.09 25)",
                            padding: "6px 14px",
                            fontSize: 13,
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(tab === "approved" || tab === "rejected") && (
                      <button
                        onClick={() => handleDelete(image.id)}
                        disabled={acting === image.id}
                        style={{
                          padding: "6px 14px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--ink-3)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {expandedAnalysis === image.id && image.aiAnalysis && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2)" }}>
                    <pre
                      className="mono"
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: 11,
                        background: "var(--paper-2)",
                        border: "1px solid var(--line)",
                        padding: 12,
                        borderRadius: 8,
                        maxHeight: 200,
                        overflow: "auto",
                        margin: 0,
                        color: "var(--ink-2)",
                      }}
                    >
                      {JSON.stringify(image.aiAnalysis, null, 2)}
                    </pre>
                  </div>
                )}

                {rejectingId === image.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2)" }}>
                    <label className="label">Rejection reason (required)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="Explain why this image is being rejected…"
                      autoFocus
                      className="input"
                      style={{ resize: "none" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => handleReject(image.id)}
                        disabled={!rejectReason.trim() || acting === image.id}
                        className="btn-primary"
                        style={{
                          background: "oklch(0.5 0.17 25)",
                          borderColor: "oklch(0.5 0.17 25)",
                          padding: "7px 14px",
                          fontSize: 13,
                          opacity: !rejectReason.trim() || acting === image.id ? 0.5 : 1,
                        }}
                      >
                        Confirm rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="btn-ghost"
                        style={{ padding: "6px 14px", fontSize: 13 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
