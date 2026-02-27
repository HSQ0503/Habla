"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/student/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Practice",
    href: "/student/practice",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/student/history",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Progress",
    href: "/student/progress",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, update: updateSession } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoinClass() {
    if (!joinCode.trim()) return;
    setJoinError("");
    setJoining(true);
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Failed to join class");
      } else {
        setJoinSuccess(`Joined ${data.class.name}!`);
        setTimeout(() => {
          setJoinModalOpen(false);
          setJoinCode("");
          setJoinSuccess("");
          updateSession();
          window.location.reload();
        }, 1500);
      }
    } catch {
      setJoinError("Something went wrong");
    }
    setJoining(false);
  }

  // Hide sidebar shell during active practice sessions
  const inSession = /^\/student\/practice\/[^/]+$/.test(pathname);
  if (inSession) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/student/dashboard">
            <Image src="/logo.png" alt="Habla" width={100} height={32} priority />
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Join class prompt if no class */}
        {session?.user && !session.user.classId && (
          <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-medium text-amber-800 mb-1">No class joined</p>
            <p className="text-xs text-amber-600 mb-2">
              Ask your teacher for a class code to join.
            </p>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="w-full px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Join Class
            </button>
          </div>
        )}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="lg:hidden" />

          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-600">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* Join Class Modal */}
      {joinModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => {
              setJoinModalOpen(false);
              setJoinCode("");
              setJoinError("");
              setJoinSuccess("");
            }}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Join a Class</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter the 6-character code your teacher gave you.
              </p>

              {joinSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-green-700">{joinSuccess}</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                      setJoinError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                    placeholder="e.g. ABC234"
                    maxLength={6}
                    className="w-full px-3 py-2 text-center font-mono text-xl tracking-widest border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                    autoFocus
                  />

                  {joinError && (
                    <p className="text-xs text-red-600 mb-3">{joinError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setJoinModalOpen(false);
                        setJoinCode("");
                        setJoinError("");
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinClass}
                      disabled={joinCode.length !== 6 || joining}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {joining ? "Joining..." : "Join"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
