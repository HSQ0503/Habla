"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ClassInfo = {
  id: string;
  name: string;
  code: string;
  _count?: { students: number };
};

type Student = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  sessionCount: number;
  avgScore: number | null;
  lastActive: string | null;
};

type SortKey = "name" | "email" | "joinedAt" | "sessionCount" | "avgScore" | "lastActive";

export default function ClassPage() {
  const router = useRouter();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [className, setClassName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [copied, setCopied] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const fetchClass = useCallback(async () => {
    const res = await fetch("/api/teacher/class");
    const data = await res.json();
    setClassInfo(data.class);
    if (data.class) setEditName(data.class.name);
    setLoading(false);
  }, []);

  const fetchStudents = useCallback(async () => {
    const res = await fetch("/api/teacher/students");
    const data = await res.json();
    setStudents(data.students || []);
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([fetchClass(), fetchStudents()]);
    })();
  }, [fetchClass, fetchStudents]);

  async function createClass() {
    if (!className.trim()) return;
    setCreating(true);
    const res = await fetch("/api/teacher/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className.trim() }),
    });
    if (res.ok) await fetchClass();
    setCreating(false);
  }

  async function updateName() {
    if (!editName.trim() || editName.trim() === classInfo?.name) {
      setEditingName(false);
      return;
    }
    await fetch("/api/teacher/class", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    await fetchClass();
    setEditingName(false);
  }

  async function regenerateCode() {
    await fetch("/api/teacher/class", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateCode: true }),
    });
    await fetchClass();
    setConfirmRegenerate(false);
  }

  async function removeStudent(studentId: string) {
    await fetch(`/api/teacher/students/${studentId}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setRemoveId(null);
  }

  function copyCode() {
    if (classInfo?.code) {
      navigator.clipboard.writeText(classInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...students].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
    return ((av as number) - (bv as number)) * dir;
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          color: "var(--ink-3)",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div style={{ maxWidth: 460, margin: "48px auto 0" }}>
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--sage-soft)",
              border: "1px solid oklch(0.82 0.07 155)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="oklch(0.4 0.1 155)">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <h1 className="display" style={{ fontSize: 24, margin: "0 0 8px" }}>
            Create your class
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 20 }}>
            Create a class to start managing students and tracking their progress.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createClass()}
              placeholder="Class name (e.g. Spanish B SL)"
              className="input"
              style={{ flex: 1 }}
            />
            <button
              onClick={createClass}
              disabled={!className.trim() || creating}
              className="btn-primary"
              style={{ opacity: !className.trim() || creating ? 0.5 : 1 }}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2.5}
      stroke={active ? "var(--ink)" : "var(--ink-4)"}
      style={{ marginLeft: 4, display: "inline" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={active && !asc ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M4.5 15.75l7.5-7.5 7.5 7.5"} />
    </svg>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Classroom</div>
        <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 38px)", margin: 0 }}>
          Class management.
        </h1>
      </div>

      <div className="card" style={{ padding: 26, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingName ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={updateName}
                onKeyDown={(e) => e.key === "Enter" && updateName()}
                className="input"
                style={{ fontSize: 18, fontWeight: 600, width: "auto" }}
              />
            ) : (
              <>
                <h2
                  className="display"
                  style={{ fontSize: 22, margin: 0, fontWeight: 600 }}
                >
                  {classInfo.name}
                </h2>
                <button
                  onClick={() => setEditingName(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ink-4)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label="Edit name"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="eyebrow" style={{ fontSize: 10 }}>Join code</span>
            <span
              className="mono"
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "var(--accent)",
                letterSpacing: "0.2em",
              }}
            >
              {classInfo.code}
            </span>
            <button
              onClick={copyCode}
              title="Copy code"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: copied ? "oklch(0.55 0.14 155)" : "var(--ink-4)",
                padding: 4,
              }}
            >
              {copied ? (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={() => setConfirmRegenerate(true)}
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Regenerate code
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 12, marginBottom: 0 }}>
          Share this code with students so they can join your class.
        </p>
      </div>

      {confirmRegenerate && (
        <div
          className="card"
          style={{
            padding: 18,
            marginBottom: 20,
            background: "var(--rose-soft)",
            borderColor: "oklch(0.82 0.09 25)",
          }}
        >
          <p style={{ fontSize: 14, color: "oklch(0.42 0.14 25)", margin: "0 0 12px" }}>
            Are you sure? The old code will stop working immediately.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={regenerateCode}
              className="btn-primary"
              style={{ background: "oklch(0.5 0.17 25)", borderColor: "oklch(0.5 0.17 25)" }}
            >
              Yes, regenerate
            </button>
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {removeId && (
        <div
          className="card"
          style={{
            padding: 18,
            marginBottom: 20,
            background: "var(--rose-soft)",
            borderColor: "oklch(0.82 0.09 25)",
          }}
        >
          <p style={{ fontSize: 14, color: "oklch(0.42 0.14 25)", margin: "0 0 12px" }}>
            Remove {students.find((s) => s.id === removeId)?.name} from your class?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => removeStudent(removeId)}
              className="btn-primary"
              style={{ background: "oklch(0.5 0.17 25)", borderColor: "oklch(0.5 0.17 25)" }}
            >
              Remove
            </button>
            <button onClick={() => setRemoveId(null)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="eyebrow">Students</div>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {students.length} total
          </span>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>
              No students have joined yet. Share your class code to get started.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {(
                    [
                      ["name", "Name"],
                      ["email", "Email"],
                      ["joinedAt", "Joined"],
                      ["sessionCount", "Sessions"],
                      ["avgScore", "Avg score"],
                      ["lastActive", "Last active"],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      {label}
                      <SortIcon active={sortKey === key} asc={sortAsc} />
                    </th>
                  ))}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/teacher/students/${s.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ color: "var(--ink)", fontWeight: 500 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{new Date(s.joinedAt).toLocaleDateString()}</td>
                    <td>{s.sessionCount}</td>
                    <td>{s.avgScore !== null ? `${s.avgScore}/30` : "—"}</td>
                    <td>{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveId(s.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--ink-4)",
                          padding: 4,
                        }}
                        title="Remove student"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
