"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/student/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Practice",
    href: "/student/practice",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
  },
  {
    label: "History",
    href: "/student/history",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Progress",
    href: "/student/progress",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

function HablaLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={26} height={26} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--ink)" />
        <path
          d="M10 20 L10 12 M10 16 L18 16 M18 20 L18 12"
          stroke="var(--paper)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="11" r="2" fill="var(--accent)" />
      </svg>
      <span className="display" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.03em" }}>
        Habla
      </span>
    </div>
  );
}

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

  const inSession = /^\/student\/practice\/[^/]+$/.test(pathname);
  if (inSession) {
    return <>{children}</>;
  }

  return (
    <div className="habla-ui">
      <div className="app-shell">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "oklch(0 0 0 / 0.25)",
              zIndex: 35,
            }}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Link href="/student/dashboard" style={{ padding: "4px 6px 14px" }}>
            <HablaLogo />
          </Link>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-link ${active ? "active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {session?.user && !session.user.classId && (
            <div
              className="card-soft"
              style={{
                marginTop: "auto",
                padding: 14,
                background: "var(--gold-soft)",
                border: "1px solid oklch(0.82 0.09 65)",
              }}
            >
              <div className="eyebrow" style={{ fontSize: 10, color: "oklch(0.42 0.13 65)", marginBottom: 4 }}>
                No class joined
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-2)", margin: "0 0 10px", lineHeight: 1.4 }}>
                Ask your teacher for a class code.
              </p>
              <button
                onClick={() => setJoinModalOpen(true)}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "7px 10px", fontSize: 13 }}
              >
                Join Class
              </button>
            </div>
          )}
        </aside>

        <div className="app-main">
          <header className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                display: "none",
                padding: 8,
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--ink-2)",
              }}
              className="mobile-menu-btn"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink-2)",
                  background: "none",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </div>
          </header>

          <main className="page-body">{children}</main>
        </div>
      </div>

      {joinModalOpen && (
        <>
          <div
            onClick={() => {
              setJoinModalOpen(false);
              setJoinCode("");
              setJoinError("");
              setJoinSuccess("");
            }}
            style={{ position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.4)", zIndex: 60 }}
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div className="card" style={{ padding: 28, width: "100%", maxWidth: 400, background: "var(--card)" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Join a class</div>
              <h2 className="display" style={{ fontSize: 24, margin: "0 0 8px" }}>
                Enter your code.
              </h2>
              <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "0 0 20px" }}>
                The 6-character code your teacher gave you.
              </p>

              {joinSuccess ? (
                <div
                  style={{
                    background: "var(--sage-soft)",
                    border: "1px solid oklch(0.82 0.07 155)",
                    borderRadius: 10,
                    padding: 14,
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "oklch(0.4 0.1 155)" }}>
                    {joinSuccess}
                  </p>
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
                    placeholder="ABC234"
                    maxLength={6}
                    autoFocus
                    className="input mono"
                    style={{
                      textAlign: "center",
                      fontSize: 22,
                      letterSpacing: "0.3em",
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  />
                  {joinError && (
                    <p style={{ fontSize: 12, color: "oklch(0.5 0.16 25)", margin: "0 0 12px" }}>{joinError}</p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        setJoinModalOpen(false);
                        setJoinCode("");
                        setJoinError("");
                      }}
                      className="btn-ghost"
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinClass}
                      disabled={joinCode.length !== 6 || joining}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        opacity: joinCode.length !== 6 || joining ? 0.5 : 1,
                      }}
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

      <style jsx>{`
        @media (max-width: 900px) {
          .mobile-menu-btn { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
