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
    if (data.class) {
      setEditName(data.class.name);
    }
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
    if (res.ok) {
      await fetchClass();
    }
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
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No class yet — show create form
  if (!classInfo) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Create Your Class</h1>
          <p className="text-sm text-gray-500 mb-6">
            Create a class to start managing students and tracking their progress.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createClass()}
              placeholder="Class name (e.g. Spanish B SL)"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={createClass}
              disabled={!className.trim() || creating}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <svg className={`w-3 h-3 ml-1 inline ${active ? "text-indigo-600" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={active && !asc ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M4.5 15.75l7.5-7.5 7.5 7.5"} />
    </svg>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Class Management</h1>

      {/* Class Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={updateName}
                onKeyDown={(e) => e.key === "Enter" && updateName()}
                className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{classInfo.name}</h2>
                <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Join Code</span>
            <span className="font-mono text-2xl font-bold text-indigo-600 tracking-widest">{classInfo.code}</span>
            <button
              onClick={copyCode}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="Copy code"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={() => setConfirmRegenerate(true)}
            className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
          >
            Regenerate code
          </button>
        </div>
        <p className="text-xs text-gray-400">Share this code with students so they can join your class.</p>
      </div>

      {/* Regenerate confirmation */}
      {confirmRegenerate && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700 mb-3">
            Are you sure? The old code will stop working immediately.
          </p>
          <div className="flex gap-2">
            <button
              onClick={regenerateCode}
              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, regenerate
            </button>
            <button
              onClick={() => setConfirmRegenerate(false)}
              className="px-3 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {removeId && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700 mb-3">
            Remove {students.find((s) => s.id === removeId)?.name} from your class?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => removeStudent(removeId)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={() => setRemoveId(null)}
              className="px-3 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Student Roster */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Students ({students.length})
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No students have joined yet. Share your class code to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {([
                    ["name", "Name"],
                    ["email", "Email"],
                    ["joinedAt", "Joined"],
                    ["sessionCount", "Sessions"],
                    ["avgScore", "Avg Score"],
                    ["lastActive", "Last Active"],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                    >
                      {label}
                      <SortIcon active={sortKey === key} asc={sortAsc} />
                    </th>
                  ))}
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/teacher/students/${s.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-3 text-gray-500">{s.email}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(s.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{s.sessionCount}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {s.avgScore !== null ? `${s.avgScore}/30` : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveId(s.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove student"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
