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
  { value: "", label: "All Images" },
  { value: "CLASS", label: "Class Images" },
  { value: "GLOBAL", label: "Global Submissions" },
];

function scopeBadge(scope: string) {
  if (scope === "GLOBAL") return { label: "Global", className: "bg-blue-50 text-blue-600" };
  return { label: "Class", className: "bg-gray-100 text-gray-600" };
}

function statusBadge(status: string) {
  if (status === "APPROVED") return { label: "Approved", className: "bg-green-50 text-green-600" };
  if (status === "REJECTED") return { label: "Rejected", className: "bg-red-50 text-red-600" };
  return { label: "Pending Review", className: "bg-yellow-50 text-yellow-600" };
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
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    }
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Image Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            {images.length} image{images.length !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Link
          href="/teacher/images/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload New Image
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <select
          value={scopeFilter}
          onChange={(e) => { setScopeFilter(e.target.value); setLoading(true); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SCOPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <p className="text-gray-500 text-sm mb-4">
            {scopeFilter ? "No images match this filter." : "No images yet. Upload your first image to get started."}
          </p>
          <Link
            href="/teacher/images/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload Image
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => {
            const theme = themeColors[image.theme] || { bg: "bg-gray-100", text: "text-gray-700", label: image.theme };
            const scope = scopeBadge(image.scope);
            const status = image.scope === "GLOBAL" ? statusBadge(image.approvalStatus) : null;
            const editable = canEdit(image);

            return (
              <div
                key={image.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
              >
                <button
                  onClick={() => setViewingImage(image)}
                  className="relative h-48 bg-gray-100 w-full cursor-pointer group/img"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.culturalContext}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                      View Details
                    </span>
                  </div>
                </button>

                <div className="p-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
                      {theme.label}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${scope.className}`}>
                      {scope.label}
                    </span>
                    {status && (
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {image.culturalContext}
                  </p>

                  {/* Rejection reason */}
                  {image.approvalStatus === "REJECTED" && image.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">Rejected:</span> {image.rejectionReason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setViewingImage(image)}
                      className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors"
                    >
                      View
                    </button>
                    {editable && (
                      <>
                        <button
                          onClick={() => setEditingImage(image)}
                          className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          disabled={deleting === image.id}
                          className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                        >
                          {deleting === image.id ? "Deleting..." : "Delete"}
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

      {/* View Detail Modal */}
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

      {/* Edit Modal */}
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
  const theme = themeColors[image.theme] || { bg: "bg-gray-100", text: "text-gray-700", label: image.theme };
  const scope = scopeBadge(image.scope);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="relative bg-gray-100 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.culturalContext}
            className="w-full max-h-80 object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
              {theme.label}
            </span>
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${scope.className}`}>
              {scope.label}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(image.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mb-5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Cultural Context
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {image.culturalContext}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Talking Points
            </h3>
            <ol className="space-y-2">
              {image.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 font-medium shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
          {editable && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Image
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Theme</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cultural Context</label>
            <textarea
              value={culturalContext}
              onChange={(e) => setCulturalContext(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Talking Points
            </label>
            <div className="space-y-2">
              {talkingPoints.map((point, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={point}
                    onChange={(e) => updatePoint(i, e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder={`Talking point ${i + 1}`}
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
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
