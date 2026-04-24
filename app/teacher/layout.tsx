"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.isAdmin) return;
    fetch("/api/admin/pending")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingCount(Array.isArray(data) ? data.length : 0));
  }, [session?.user?.isAdmin]);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/teacher/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: "Images",
      href: "/teacher/images",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      ),
    },
    ...(session?.user?.isAdmin
      ? [
          {
            label: "Admin",
            href: "/teacher/admin",
            badge: pendingCount,
            icon: (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      label: "Class",
      href: "/teacher/class",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="habla-ui">
      <div className="app-shell">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.25)", zIndex: 35 }}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Link href="/teacher/dashboard" style={{ padding: "4px 6px 14px" }}>
            <HablaLogo />
          </Link>

          <div className="eyebrow" style={{ padding: "0 10px", marginTop: 4, marginBottom: 6 }}>
            Teacher
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      style={{
                        marginLeft: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: "var(--gold-soft)",
                        color: "oklch(0.42 0.13 65)",
                        border: "1px solid oklch(0.82 0.09 65)",
                        borderRadius: 999,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="app-main">
          <header
            className="page-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 40px",
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="mobile-menu-btn"
              style={{
                display: "none",
                padding: 8,
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--ink-2)",
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{session?.user?.name}</span>
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

      <style jsx>{`
        @media (max-width: 900px) {
          .mobile-menu-btn { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
