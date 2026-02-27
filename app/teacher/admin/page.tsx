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

  // Redirect non-admins
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
    return () => { cancelled = true; };
  }, [session?.user?.isAdmin]);

  async function handleApprove(id: string) {
    setActing(id);
    const res = await fetch(`/api/admin/images/${id}/approve`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setPending((prev) => prev.filter((i) => i.id !== id));
      setApproved((prev) => [{ ...updated, creator: pending.find((i) => i.id === id)?.creator ?? null }, ...prev]);
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
      setRejected((prev) => [{ ...updated, creator: pending.find((i) => i.id === id)?.creator ?? null }, ...prev]);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  const tabData: Record<Tab, ImageRecord[]> = { pending, approved, rejected };
  const currentImages = tabData[tab];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review global image submissions and manage the shared library.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab("pending")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === "pending"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Review
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "approved"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Global Library ({approved.length})
          </button>
          <button
            onClick={() => setTab("rejected")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "rejected"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Rejected ({rejected.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-100 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentImages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">
            {tab === "pending" && "No pending submissions. All caught up!"}
            {tab === "approved" && "No approved global images yet."}
            {tab === "rejected" && "No rejected submissions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentImages.map((image) => {
            const theme = themeColors[image.theme] || { bg: "bg-gray-100", text: "text-gray-700", label: image.theme };

            return (
              <div
                key={image.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.culturalContext}
                    className="w-36 h-28 rounded-lg object-cover bg-gray-100 shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
                        {theme.label}
                      </span>
                      {image.creator && (
                        <span className="text-xs text-gray-400">
                          by {image.creator.name} ({image.creator.email})
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                      {image.culturalContext}
                    </p>

                    <p className="text-xs text-gray-400 mb-2">
                      {image.talkingPoints.length} talking points · Submitted {new Date(image.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>

                    {/* AI Analysis expandable */}
                    {image.aiAnalysis && (
                      <button
                        onClick={() => setExpandedAnalysis(expandedAnalysis === image.id ? null : image.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        {expandedAnalysis === image.id ? "Hide AI Analysis" : "View AI Analysis"}
                      </button>
                    )}

                    {/* Rejection reason (for rejected tab) */}
                    {image.approvalStatus === "REJECTED" && image.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs text-red-600">
                          <span className="font-medium">Reason:</span> {image.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    {tab === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(image.id)}
                          disabled={acting === image.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {acting === image.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectingId(image.id)}
                          disabled={acting === image.id}
                          className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(tab === "approved" || tab === "rejected") && (
                      <button
                        onClick={() => handleDelete(image.id)}
                        disabled={acting === image.id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded AI Analysis */}
                {expandedAnalysis === image.id && image.aiAnalysis && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                    <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-48">
                      {JSON.stringify(image.aiAnalysis, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Reject form */}
                {rejectingId === image.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rejection Reason (required)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                      placeholder="Explain why this image is being rejected..."
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReject(image.id)}
                        disabled={!rejectReason.trim() || acting === image.id}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
