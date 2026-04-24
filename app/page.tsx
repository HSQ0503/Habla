"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";

/* ═══════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════ */

function Reveal({
  children,
  className = "",
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const { ref, isVisible } = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`${stagger ? "stagger" : "in-view"} ${isVisible ? "seen" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function FloatingMark({
  glyph = "¿",
  style = {},
}: {
  glyph?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        fontFamily: "var(--habla-display)",
        fontSize: 120,
        fontWeight: 500,
        color: "var(--accent)",
        opacity: 0.06,
        userSelect: "none",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        ...style,
      }}
    >
      {glyph}
    </span>
  );
}

function Sparkline({
  points,
  stroke = "var(--indigo)",
  fill = true,
  height = 40,
  width = 160,
}: {
  points: number[];
  stroke?: string;
  fill?: boolean;
  height?: number;
  width?: number;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const dx = width / (points.length - 1);
  const scale = (v: number) =>
    height - ((v - min) / Math.max(1, max - min)) * (height - 6) - 3;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${i * dx},${scale(p)}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={stroke} opacity="0.08" />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(points.length - 1) * dx}
        cy={scale(points[points.length - 1])}
        r="3.5"
        fill={stroke}
      />
    </svg>
  );
}

function HablaLogo({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--ink)" />
        <path
          d="M10 20 L10 12 M10 16 L18 16 M18 20 L18 12"
          stroke="var(--paper)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="11" r="2" fill="var(--accent)" />
      </svg>
      <span
        className="display"
        style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.03em" }}
      >
        Habla
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Mock UI components
   ═══════════════════════════════════════════════════════════ */

function Bubble({ role, text, visible }: { role: "examiner" | "you"; text: string; visible: boolean }) {
  const isYou = role === "you";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isYou ? "flex-end" : "flex-start",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div
        style={{
          maxWidth: "84%",
          background: isYou ? "var(--ink)" : "var(--indigo-softer)",
          color: isYou ? "var(--paper)" : "var(--ink)",
          padding: "9px 14px 10px",
          borderRadius: 16,
          borderTopLeftRadius: !isYou ? 6 : 16,
          borderTopRightRadius: isYou ? 6 : 16,
          fontSize: 13.5,
          lineHeight: 1.45,
          border: isYou ? "1px solid var(--ink)" : "1px solid oklch(0.88 0.04 280)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          background: "var(--indigo-softer)",
          padding: "10px 14px",
          borderRadius: 16,
          borderTopLeftRadius: 6,
          border: "1px solid oklch(0.88 0.04 280)",
          display: "flex",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--indigo)",
              animation: "habla-type-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ConversationMock() {
  const barPeaks = [18, 32, 22, 40, 16, 42, 26, 36, 20, 38, 14, 28, 22, 34, 18];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s + 1) % 5), 2600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{ position: "relative" }}>
      <FloatingMark glyph="¿" style={{ top: -60, left: -50, fontSize: 140, transform: "rotate(-10deg)" }} />
      <FloatingMark glyph="¡" style={{ bottom: -40, right: -20, fontSize: 100, transform: "rotate(12deg)", opacity: 0.1 }} />

      <div className="card" style={{ overflow: "hidden", position: "relative", background: "var(--card)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--line)",
            background: "var(--paper-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--rose)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--gold-2)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--sage)" }} />
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              session.habla / live
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "oklch(0.62 0.18 140)",
                animation: "habla-pulse-dot 1.6s ease-in-out infinite",
              }}
            />
            <span className="mono" style={{ fontSize: 11, color: "oklch(0.45 0.12 140)", fontWeight: 500 }}>
              REC 02:14
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "14px 20px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                padding: "4px 11px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: "var(--indigo-soft)",
                color: "var(--indigo-2)",
                border: "1px solid oklch(0.85 0.08 280)",
              }}
            >
              Identidades
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>·&nbsp; Stimulus #3</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            B2 · 14/30
          </span>
        </div>

        <div
          style={{
            margin: "14px 20px 8px",
            padding: "16px 10px",
            background: "var(--indigo-softer)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            height: 60,
          }}
        >
          {barPeaks.map((peak, i) => (
            <span
              key={i}
              style={
                {
                  width: 3,
                  background: "var(--indigo)",
                  borderRadius: 2,
                  height: 6,
                  animation: "habla-bar 0.9s ease-in-out infinite",
                  animationDelay: `${i * 55}ms`,
                  "--peak": `${peak}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div style={{ padding: "12px 20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Bubble role="examiner" text="¿Qué puedes observar en esta imagen sobre las tradiciones familiares?" visible={step >= 1} />
          <Bubble role="you" text="En la imagen veo una familia celebrando Nochebuena. Me recuerda a mi propia familia..." visible={step >= 2} />
          <Bubble role="examiner" text="Interesante. ¿Y cómo se comparan con las tuyas?" visible={step >= 3} />
          {step >= 4 && <TypingBubble />}
        </div>
      </div>

      {/* Floating score card */}
      <div
        className="card"
        style={{
          position: "absolute",
          bottom: -36,
          right: -22,
          width: 232,
          padding: 16,
          animation: "habla-float 6s ease-in-out infinite",
          background: "var(--gold-soft)",
          borderColor: "var(--ink)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>Live score</span>
          <span
            style={{
              fontFamily: "var(--habla-serif)",
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: "-0.02em",
            }}
          >
            24<span style={{ fontSize: 16, color: "var(--ink-4)" }}>/30</span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { l: "A · Language", v: 9, m: 12 },
            { l: "B1 · Present", v: 5, m: 6 },
            { l: "B2 · Convo", v: 5, m: 6 },
            { l: "C · Interact", v: 5, m: 6 },
          ].map((c, i) => (
            <div key={c.l}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--ink-2)",
                  marginBottom: 3,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{c.l}</span>
                <span className="mono">
                  {c.v}/{c.m}
                </span>
              </div>
              <div style={{ height: 5, background: "oklch(0.88 0.04 85)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(c.v / c.m) * 100}%`,
                    background: "var(--ink)",
                    borderRadius: 99,
                    transition: "width 1.4s ease",
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating "tense detected" chip */}
      <div
        style={{
          position: "absolute",
          top: -48,
          right: 24,
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "8px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "habla-float 4.5s ease-in-out 0.5s infinite",
          boxShadow: "0 4px 12px oklch(0.2 0.02 275 / 0.2)",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold-2)" }} />
        <span>Subjuntivo detected</span>
        <span className="mono" style={{ color: "var(--ink-4)", fontSize: 10 }}>+1</span>
      </div>
    </div>
  );
}

function ThemeSelectorMock() {
  const themes = [
    { label: "Identidades", color: "var(--indigo)", bg: "var(--indigo-softer)", selected: true },
    { label: "Experiencias", color: "oklch(0.55 0.18 150)", bg: "oklch(0.96 0.04 150)", selected: false },
    { label: "Ingenio humano", color: "oklch(0.55 0.22 320)", bg: "oklch(0.96 0.04 320)", selected: false },
    { label: "Organización social", color: "oklch(0.62 0.18 50)", bg: "var(--gold-soft)", selected: false },
    { label: "Compartir el planeta", color: "oklch(0.55 0.14 200)", bg: "oklch(0.96 0.04 200)", selected: false },
  ];
  return (
    <div className="card" style={{ padding: 22, background: "var(--card)" }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>01 · Elige un tema</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {themes.map((t) => (
          <div
            key={t.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 10,
              border: t.selected ? "1px solid var(--accent)" : "1px solid var(--line)",
              background: t.selected ? t.bg : "transparent",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: t.selected ? 600 : 400,
                color: t.selected ? "var(--ink)" : "var(--ink-2)",
              }}
            >
              {t.label}
            </span>
            {t.selected && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ marginLeft: "auto" }}
              >
                <path d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrepMock() {
  const [t, setT] = useState(15 * 60 - 166);
  useEffect(() => {
    const i = setInterval(() => setT((v) => (v > 0 ? v - 1 : v)), 1000);
    return () => clearInterval(i);
  }, []);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <div className="card" style={{ overflow: "hidden", background: "var(--card)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-2)",
        }}
      >
        <span className="eyebrow">02 · Prepare</span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--indigo)" }}>
          {mm}:{ss}
        </span>
      </div>
      <div style={{ padding: 18, display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
        <div
          style={{
            aspectRatio: "4/3",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--gold-soft), var(--rose-soft))",
            border: "1.5px solid var(--ink)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg viewBox="0 0 120 90" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="4" height="8" fill="oklch(0.88 0.1 55)" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="120" height="90" fill="url(#stripes)" />
            <circle cx="40" cy="55" r="12" fill="oklch(0.82 0.1 25)" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="62" cy="48" r="10" fill="oklch(0.85 0.08 85)" stroke="var(--ink)" strokeWidth="1" />
            <circle cx="82" cy="58" r="11" fill="oklch(0.78 0.09 150)" stroke="var(--ink)" strokeWidth="1" />
          </svg>
          <span
            className="mono"
            style={{ position: "absolute", bottom: 4, left: 6, fontSize: 9, color: "var(--ink-2)" }}
          >
            stimulus.jpg
          </span>
        </div>
        <div>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>
            Mis apuntes
          </div>
          <div
            style={{
              fontFamily: "var(--habla-serif)",
              fontStyle: "italic",
              fontSize: 14.5,
              lineHeight: 1.5,
              color: "var(--ink-2)",
            }}
          >
            Las tradiciones familiares... <br />
            <span style={{ color: "var(--ink-4)" }}>— Nochebuena, reunión</span>
            <br />
            <span style={{ color: "var(--ink-4)" }}>— mi abuela, paella</span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 16,
                background: "var(--indigo)",
                marginLeft: 2,
                verticalAlign: "middle",
                animation: "habla-pulse-dot 1s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceSessionMock() {
  return (
    <div className="card" style={{ overflow: "hidden", background: "var(--card)" }}>
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-2)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span className="eyebrow">03 · Speaking</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          04:12 / 08:00
        </span>
      </div>
      <div
        style={{
          padding: "26px 18px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              border: "1.5px solid var(--indigo)",
              opacity: 0.3,
              animation: "habla-pulse-dot 2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "var(--indigo-softer)",
              border: "1.5px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-stamp-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 2, height: 36 }}>
              {[14, 26, 18, 32, 22, 28, 16].map((p, i) => (
                <span
                  key={i}
                  style={
                    {
                      width: 3,
                      background: "var(--indigo)",
                      borderRadius: 2,
                      height: 6,
                      animation: "habla-bar 0.8s ease-in-out infinite",
                      animationDelay: `${i * 70}ms`,
                      "--peak": `${p}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 14 }}>
          <span style={{ color: "var(--indigo)", fontWeight: 600 }}>Examiner</span> · asking follow-up
        </div>
      </div>
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Bubble role="examiner" text="¿Cómo te relaciona esta imagen con tu vida?" visible />
        <Bubble role="you" text="Me recuerda a las celebraciones de mi familia en España..." visible />
      </div>
    </div>
  );
}

function FeedbackMock() {
  const { ref, isVisible } = useInView(0.2);
  const criteria = [
    { l: "A · Language", v: 9, m: 12, pct: 75 },
    { l: "B1 · Presentation", v: 5, m: 6, pct: 83 },
    { l: "B2 · Conversation", v: 5, m: 6, pct: 83 },
    { l: "C · Interactive", v: 5, m: 6, pct: 83 },
  ];
  return (
    <div ref={ref} className="card" style={{ overflow: "hidden", background: "var(--card)" }}>
      <div
        style={{
          background: "var(--sage-soft)",
          padding: "18px 20px",
          borderBottom: "1.5px solid var(--ink)",
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--habla-serif)",
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          24
        </span>
        <span style={{ fontSize: 18, color: "var(--ink-3)" }}>/30</span>
        <span
          style={{
            marginLeft: "auto",
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: "var(--ink)",
            color: "var(--paper)",
          }}
        >
          Strong B2
        </span>
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {criteria.map((c, i) => (
          <div key={c.l}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.l}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {c.v}/{c.m}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--paper-2)",
                borderRadius: 99,
                overflow: "hidden",
                border: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--ink)",
                  borderRadius: 99,
                  width: isVisible ? `${c.pct}%` : "0%",
                  transition: "width 1.2s ease",
                  transitionDelay: `${i * 120 + 200}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px 18px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { t: "Presente", n: 12 },
          { t: "Pretérito", n: 5 },
          { t: "Subjuntivo", n: 2 },
          { t: "Imperfecto", n: 4 },
        ].map((tag) => (
          <span
            key={tag.t}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              fontSize: 11,
              background: "var(--indigo-softer)",
              color: "var(--indigo-2)",
              borderRadius: 999,
              border: "1px solid oklch(0.88 0.04 280)",
            }}
          >
            {tag.t}{" "}
            <span className="mono" style={{ color: "var(--indigo)", fontWeight: 600 }}>
              {tag.n}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sections
   ═══════════════════════════════════════════════════════════ */

function Nav() {
  const links = [
    { l: "How it works", h: "#how" },
    { l: "Features", h: "#features" },
    { l: "Teachers", h: "#teachers" },
    { l: "Pricing", h: "#pricing" },
  ];
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "oklch(from var(--paper) l c h / 0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 68,
        }}
      >
        <HablaLogo />
        <div
          style={{ display: "flex", alignItems: "center", gap: 28, whiteSpace: "nowrap" }}
          className="nav-desktop"
        >
          {links.map((l) => (
            <a
              key={l.h}
              href={l.h}
              style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500, whiteSpace: "nowrap" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
            >
              {l.l}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
          <Link
            href="/auth/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink-2)",
              padding: "8px 14px",
              whiteSpace: "nowrap",
            }}
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="btn-primary"
            style={{ padding: "10px 18px 11px", fontSize: 14, whiteSpace: "nowrap" }}
          >
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section
      style={{ position: "relative", paddingTop: 60, paddingBottom: 120, overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 85% 20%, var(--indigo-softer) 0%, transparent 50%), radial-gradient(circle at 10% 90%, var(--gold-soft) 0%, transparent 40%)",
          opacity: 0.8,
        }}
      />

      <div className="wrap" style={{ position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 64,
            alignItems: "center",
          }}
          className="hero-grid"
        >
          <div>
            <div className="rise">
              <span className="pill" style={{ marginBottom: 26 }}>
                <span className="dot" />
                Built for IB Language B · Español
              </span>
            </div>

            <h1
              className="display rise rise-d1"
              style={{ fontSize: "clamp(44px, 5.6vw, 76px)", margin: 0 }}
            >
              Speak Spanish
              <br />
              like the exam <span style={{ color: "var(--accent)" }}>isn&apos;t</span>
              <br />
              the hard part.
            </h1>

            <p
              className="rise rise-d2"
              style={{
                marginTop: 24,
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--ink-3)",
                maxWidth: 480,
              }}
            >
              Unlimited practice with an AI examiner built for the IB Spanish Individual Oral.
              Real-time voice. Rubric-aligned scoring. Actionable feedback after every session.
            </p>

            <div
              className="rise rise-d3"
              style={{ marginTop: 34, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <Link href="/auth/signup" className="btn-primary">
                Start practicing free
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <a href="#how" className="btn-ghost">
                Watch demo
              </a>
            </div>

            <div
              className="rise rise-d4"
              style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16 }}
            >
              <div style={{ display: "flex" }}>
                {[
                  { i: "SM", c: "var(--indigo)" },
                  { i: "AL", c: "var(--gold-2)" },
                  { i: "JR", c: "var(--rose)" },
                  { i: "MK", c: "var(--sage)" },
                ].map((a, idx) => (
                  <div
                    key={a.i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: a.c,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      border: "1.5px solid var(--paper)",
                      marginLeft: idx ? -8 : 0,
                      boxShadow: "0 1px 2px oklch(0 0 0 / 0.15)",
                    }}
                  >
                    {a.i}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.4 }}>
                <strong style={{ color: "var(--ink)" }}>2,400+ IB students</strong>
                <br />
                practicing this week across 14 countries
              </div>
            </div>
          </div>

          <div className="rise rise-d2" style={{ position: "relative", minHeight: 480 }}>
            <ConversationMock />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 96, position: "relative" }}>
        <div className="wrap">
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 26 }}>
            Trusted by IB programs worldwide
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 48,
              flexWrap: "wrap",
              justifyContent: "center",
              opacity: 0.7,
            }}
          >
            {["Colegio San Jorge", "IB World · Zurich", "Berlin International", "IES Madrid", "St. Andrew's BA"].map(
              (s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: "var(--habla-display)",
                    fontSize: 15,
                    color: "var(--ink-3)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExamFlow() {
  const phases = [
    { n: "01", name: "Preparation", dur: "15 min", d: "Study the stimulus image" },
    { n: "02", name: "Presentation", dur: "3–4 min", d: "Present your analysis" },
    { n: "03", name: "Follow-up", dur: "4–5 min", d: "Examiner asks questions" },
    { n: "04", name: "Discussion", dur: "5–6 min", d: "Broader themes" },
  ];
  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Exact exam format</div>
            <h2 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: 0 }}>
              Practice the real thing.
            </h2>
            <p
              style={{
                color: "var(--ink-3)",
                fontSize: 17,
                marginTop: 14,
                maxWidth: 520,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Same four phases. Same timing. Same five themes. No surprises on exam day.
            </p>
          </div>
        </Reveal>

        <Reveal stagger>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              position: "relative",
            }}
            className="exam-flow-grid"
          >
            {phases.map((p, i) => (
              <div
                key={p.n}
                style={{
                  padding: "28px 24px 30px",
                  borderLeft: i === 0 ? "1px solid var(--line)" : "none",
                  borderRight: "1px solid var(--line)",
                  borderTop: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--card)",
                }}
              >
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 14, letterSpacing: "0.04em" }}
                >
                  {p.n}
                </div>
                <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4, fontWeight: 500 }}>
                  {p.dur}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 10, lineHeight: 1.5 }}>
                  {p.d}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Across all five IB themes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              { l: "Identidades", c: "var(--accent)" },
              { l: "Experiencias", c: "oklch(0.55 0.12 155)" },
              { l: "Ingenio humano", c: "oklch(0.55 0.16 320)" },
              { l: "Organización social", c: "oklch(0.58 0.14 55)" },
              { l: "Compartir el planeta", c: "oklch(0.55 0.12 200)" },
            ].map((t) => (
              <span
                key={t.l}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "var(--card)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.c }} />
                {t.l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps: { n: string; title: string; body: string; mock: ReactNode; flip: boolean }[] = [
    {
      n: "01",
      title: "Pick a theme that fits",
      body:
        "Five IB themes, hundreds of stimulus images. Pick one that genuinely interests you — you'll speak better about what you actually care about.",
      mock: <ThemeSelectorMock />,
      flip: false,
    },
    {
      n: "02",
      title: "Take your 15 minutes",
      body:
        "Same prep window as the real exam. Jot notes, map out your argument, plan your tenses. The timer keeps you honest.",
      mock: <PrepMock />,
      flip: true,
    },
    {
      n: "03",
      title: "Talk to the examiner",
      body:
        "Real-time voice. The AI adapts to your level — slowing down if you're nervous, pushing you if you're ready. No scripts.",
      mock: <VoiceSessionMock />,
      flip: false,
    },
    {
      n: "04",
      title: "See exactly where to improve",
      body:
        "Scored across all four IB criteria. Specific tenses detected. Vocabulary mapped to CEFR. Pace, pauses, filler words — everything.",
      mock: <FeedbackMock />,
      flip: true,
    },
  ];
  return (
    <section id="how" style={{ padding: "120px 0", scrollMarginTop: 80, position: "relative" }}>
      <FloatingMark glyph="¿" style={{ top: 80, right: 40, fontSize: 200, opacity: 0.04 }} />
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 80, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>How it works</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 4.8vw, 56px)", margin: 0 }}>
              Four steps, exactly like exam day.
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 100 }}>
          {steps.map((s) => (
            <Reveal key={s.n}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                  gap: 80,
                  alignItems: "center",
                  direction: s.flip ? "rtl" : "ltr",
                }}
                className="how-row"
              >
                <div style={{ direction: "ltr" }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      letterSpacing: "0.06em",
                      fontWeight: 500,
                      marginBottom: 18,
                    }}
                  >
                    STEP / {s.n}
                  </div>
                  <h3 className="display" style={{ fontSize: "clamp(26px, 2.6vw, 34px)", margin: "0 0 16px" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 16.5, color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 420 }}>
                    {s.body}
                  </p>
                </div>
                <div
                  style={{
                    direction: "ltr",
                    maxWidth: 420,
                    justifySelf: s.flip ? "end" : "start",
                  }}
                >
                  {s.mock}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { ref, isVisible } = useInView(0.1);
  return (
    <section
      id="features"
      style={{
        padding: "120px 0",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        scrollMarginTop: 80,
      }}
    >
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 60px" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>What you get</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 4.8vw, 56px)", margin: 0 }}>
              Feedback that actually <em>tells you</em> something.
            </h2>
            <p
              style={{
                color: "var(--ink-3)",
                fontSize: 17,
                marginTop: 16,
                maxWidth: 520,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Not a vague grade. Not a star rating. Specific, actionable feedback keyed to the IB rubric.
            </p>
          </div>
        </Reveal>

        <div
          ref={ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: "minmax(180px, auto)",
            gap: 16,
          }}
          className="bento"
        >
          {/* Voice — hero tile */}
          <div
            style={{
              gridColumn: "span 2",
              gridRow: "span 2",
              background: "var(--indigo)",
              color: "var(--paper)",
              borderRadius: "var(--radius-lg)",
              padding: 32,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <FloatingMark glyph="¿" style={{ top: -30, right: -20, fontSize: 240, color: "var(--gold)", opacity: 0.15 }} />
            <div>
              <div className="eyebrow" style={{ color: "var(--gold)", marginBottom: 12 }}>
                Real voice, real time
              </div>
              <h3 className="display" style={{ fontSize: 32, margin: 0, letterSpacing: "-0.02em" }}>
                Talk, don&apos;t type.
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "oklch(0.92 0.03 280)",
                  lineHeight: 1.5,
                  marginTop: 12,
                  maxWidth: 320,
                }}
              >
                Low-latency voice with an AI examiner that listens, interrupts politely, and adapts to your Spanish in real time.
              </p>
            </div>
            <div
              style={{
                background: "oklch(from var(--indigo) calc(l - 0.1) c h)",
                borderRadius: 14,
                padding: "22px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                height: 76,
              }}
            >
              {[14, 26, 20, 34, 18, 38, 22, 32, 18, 36, 14, 28, 22, 34, 18, 30, 16].map((p, i) => (
                <span
                  key={i}
                  style={
                    {
                      width: 3,
                      background: "var(--gold)",
                      borderRadius: 2,
                      height: 6,
                      animation: "habla-bar 0.9s ease-in-out infinite",
                      animationDelay: `${i * 45}ms`,
                      "--peak": `${p}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>

          {/* IB rubric */}
          <div
            style={{
              gridColumn: "span 2",
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              padding: 28,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>Official IB rubric</div>
            <h3 className="display" style={{ fontSize: 22, margin: "0 0 16px" }}>
              Scored on all four criteria
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { l: "A · Language", pct: 75, max: 12 },
                { l: "B1 · Presentation", pct: 83, max: 6 },
                { l: "B2 · Conversation", pct: 67, max: 6 },
                { l: "C · Interactive", pct: 83, max: 6 },
              ].map((c, i) => (
                <div key={c.l} style={{ marginBottom: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginBottom: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.l}</span>
                    <span className="mono">/{c.max}</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "var(--paper-2)",
                      borderRadius: 99,
                      overflow: "hidden",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "var(--ink)",
                        borderRadius: 99,
                        width: isVisible ? `${c.pct}%` : 0,
                        transition: "width 1s ease",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CEFR */}
          <div
            style={{
              background: "var(--gold-soft)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 8 }}>CEFR mapping</div>
            <div
              style={{
                fontFamily: "var(--habla-serif)",
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              B2<span style={{ color: "var(--ink-4)", fontSize: 22 }}>/C1</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
              Vocabulary level — heading toward C1
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 14 }}>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((l, i) => (
                <div
                  key={l}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 4,
                    background: i <= 3 ? "var(--ink)" : "oklch(0.88 0.05 85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: i <= 3 ? "var(--paper)" : "var(--ink-4)",
                    fontFamily: "var(--habla-mono)",
                    fontWeight: 500,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div className="eyebrow">Speaking pace</div>
            <div>
              <div
                style={{
                  fontFamily: "var(--habla-serif)",
                  fontSize: 52,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                124
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>words per minute</div>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 6,
                padding: "3px 9px",
                background: "var(--sage-soft)",
                color: "oklch(0.4 0.1 155)",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 500,
                border: "1px solid oklch(0.82 0.07 155)",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(0.55 0.14 155)" }} />
              Natural pace
            </span>
          </div>

          {/* Tenses */}
          <div
            style={{
              gridColumn: "span 2",
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              padding: 28,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>Grammar detection</div>
            <h3 className="display" style={{ fontSize: 22, margin: "0 0 14px" }}>
              Tenses you used — and missed
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { t: "Presente", n: 12, on: true },
                { t: "Pretérito", n: 8, on: true },
                { t: "Imperfecto", n: 5, on: true },
                { t: "Subjuntivo", n: 2, on: true },
                { t: "Futuro", n: 3, on: true },
                { t: "Condicional", n: 0, on: false },
                { t: "Pluscuamperfecto", n: 0, on: false },
              ].map((x) => (
                <span
                  key={x.t}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    borderRadius: 99,
                    background: x.on ? "var(--indigo-softer)" : "transparent",
                    color: x.on ? "var(--indigo-2)" : "var(--ink-4)",
                    border: x.on ? "1px solid oklch(0.85 0.08 280)" : "1.5px dashed oklch(0.8 0.03 25)",
                    fontFamily: "var(--habla-serif)",
                    fontStyle: x.on ? "normal" : "italic",
                  }}
                >
                  {x.t}{" "}
                  <span
                    className="mono"
                    style={{ fontWeight: 600, marginLeft: 4, fontStyle: "normal" }}
                  >
                    {x.n}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Progress sparkline */}
          <div
            style={{
              gridColumn: "span 2",
              background: "var(--card)",
              borderRadius: "var(--radius-lg)",
              padding: 28,
              border: "1.5px solid var(--ink)",
              boxShadow: "var(--shadow-stamp)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Progress</div>
                <h3 className="display" style={{ fontSize: 22, margin: 0 }}>12 sessions · 30 days</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--habla-serif)", fontSize: 28, fontWeight: 600 }}>+4</span>
                  <span style={{ fontSize: 12, color: "oklch(0.5 0.14 150)" }}>points</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>vs. last month</div>
              </div>
            </div>
            <svg viewBox="0 0 400 80" style={{ width: "100%", height: 80 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 L40,55 L80,48 L120,52 L160,40 L200,44 L240,32 L280,28 L320,22 L360,18 L400,12 L400,80 L0,80 Z"
                fill="url(#g1)"
              />
              <path
                d="M0,60 L40,55 L80,48 L120,52 L160,40 L200,44 L240,32 L280,28 L320,22 L360,18 L400,12"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="400" cy="12" r="4.5" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "I was terrified of the oral. Practiced 20 times, got a 7. Wish I'd found it in Year 1.", a: "Maria S.", r: "IB2 · Madrid", theme: "Identidades" },
    { q: "The tense detection is what sold me. Saw I never used subjuntivo, fixed it in a week.", a: "Daniel K.", r: "IB2 · Berlin", theme: "Experiencias" },
    { q: "I use it with all three of my Spanish B classes. The teacher dashboard saves me hours.", a: "Sra. Jiménez", r: "Teacher · Zurich", theme: "Ingenio humano" },
    { q: "Feedback was more specific than my actual teacher's. In a good way.", a: "Aisha L.", r: "IB2 · London", theme: "Organización social" },
    { q: "Went from a 4 to a 6. That's real. I'm not exaggerating.", a: "Carlos R.", r: "IB2 · Buenos Aires", theme: "Compartir el planeta" },
  ];
  const themeColor: Record<string, string> = {
    Identidades: "var(--indigo)",
    Experiencias: "oklch(0.55 0.18 150)",
    "Ingenio humano": "oklch(0.55 0.22 320)",
    "Organización social": "oklch(0.62 0.18 50)",
    "Compartir el planeta": "oklch(0.55 0.14 200)",
  };
  return (
    <section style={{ padding: "120px 0", position: "relative" }}>
      <div className="wrap">
        <Reveal>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              marginBottom: 50,
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>What students say</div>
              <h2 className="display" style={{ fontSize: "clamp(36px, 4.8vw, 56px)", margin: 0 }}>
                From <em>aterrado</em> to <span style={{ color: "var(--indigo)" }}>tranquilo</span>.
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontFamily: "var(--habla-serif)", fontSize: 40, fontWeight: 600 }}>4.9</div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--gold-2)">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>2,300+ reviews</div>
              </div>
            </div>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {quotes.map((q) => (
            <Reveal key={q.a}>
              <div
                className="card-soft"
                style={{
                  padding: 26,
                  background: "var(--card)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--habla-serif)",
                    fontSize: 54,
                    color: themeColor[q.theme],
                    lineHeight: 0.5,
                    marginBottom: 12,
                    height: 26,
                  }}
                >
                  “
                </div>
                <p
                  style={{
                    fontFamily: "var(--habla-serif)",
                    fontSize: 18,
                    lineHeight: 1.45,
                    color: "var(--ink)",
                    flex: 1,
                    margin: 0,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {q.q}
                </p>
                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                    borderTop: "1px solid var(--line)",
                    paddingTop: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{q.a}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{q.r}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: "var(--paper-2)",
                      border: "1px solid var(--line)",
                      color: themeColor[q.theme],
                      fontWeight: 500,
                    }}
                  >
                    {q.theme}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeachersSplit() {
  return (
    <section
      id="teachers"
      style={{
        padding: "120px 0",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        scrollMarginTop: 80,
      }}
    >
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 60px" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Two sides, one platform</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 4.8vw, 56px)", margin: 0 }}>
              Built for <em>both</em> sides of the desk.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          {/* Student */}
          <Reveal>
            <div
              className="card"
              style={{
                padding: 32,
                background: "var(--indigo-softer)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="eyebrow" style={{ color: "var(--indigo-2)" }}>For students</div>
                <span
                  style={{
                    fontFamily: "var(--habla-serif)",
                    fontSize: 44,
                    fontWeight: 600,
                    color: "var(--indigo)",
                    fontStyle: "italic",
                    lineHeight: 1,
                  }}
                >
                  hola.
                </span>
              </div>
              <h3 className="display" style={{ fontSize: 28, margin: 0, letterSpacing: "-0.01em" }}>
                Practice until you stop sweating.
              </h3>

              <div className="card-soft" style={{ padding: 18, background: "var(--card)" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  {[{ v: "12", l: "Sessions" }, { v: "22/30", l: "Average" }, { v: "26/30", l: "Best" }].map((s) => (
                    <div key={s.l}>
                      <div
                        style={{
                          fontFamily: "var(--habla-serif)",
                          fontSize: 22,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {s.v}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <div
                    style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 6 }}
                    className="mono"
                  >
                    SCORE TREND
                  </div>
                  <Sparkline points={[18, 19, 17, 20, 22, 21, 24, 23, 25, 26]} width={260} height={36} stroke="var(--indigo)" />
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  "Unlimited practice sessions",
                  "Scored on all four IB criteria",
                  "Track progress with detailed charts",
                  "Export transcripts for revision",
                ].map((t) => (
                  <li
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--indigo)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <path d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              <Link href="/auth/signup" className="btn-primary" style={{ alignSelf: "flex-start" }}>
                Start practicing free →
              </Link>
            </div>
          </Reveal>

          {/* Teacher */}
          <Reveal>
            <div
              className="card"
              style={{
                padding: 32,
                background: "var(--gold-soft)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="eyebrow">For teachers</div>
                <span
                  style={{
                    fontFamily: "var(--habla-serif)",
                    fontSize: 44,
                    fontWeight: 600,
                    color: "var(--gold-2)",
                    fontStyle: "italic",
                    lineHeight: 1,
                  }}
                >
                  clase.
                </span>
              </div>
              <h3 className="display" style={{ fontSize: 28, margin: 0, letterSpacing: "-0.01em" }}>
                Mock orals for your whole class — in a week, not a month.
              </h3>

              <div className="card-soft" style={{ padding: 18, background: "var(--card)" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  {[{ v: "24", l: "Students" }, { v: "86", l: "Sessions" }, { v: "21/30", l: "Class avg" }].map((s) => (
                    <div key={s.l}>
                      <div
                        style={{
                          fontFamily: "var(--habla-serif)",
                          fontSize: 22,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {s.v}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  {[
                    { n: "Maria S.", t: "Identidades", s: 24 },
                    { n: "Carlos R.", t: "Experiencias", s: 19 },
                    { n: "Ana L.", t: "Ingenio", s: 22 },
                  ].map((a) => (
                    <div
                      key={a.n}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "var(--gold-soft)",
                            border: "1px solid var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            fontWeight: 600,
                          }}
                        >
                          {a.n.charAt(0)}
                        </div>
                        <span style={{ color: "var(--ink-2)" }}>{a.n}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{a.t}</span>
                        <span className="mono" style={{ fontWeight: 600 }}>
                          {a.s}/30
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  "Share a 6-digit class code",
                  "Upload your own stimulus images",
                  "Review every transcript & score",
                  "Export to CSV or gradebook",
                ].map((t) => (
                  <li
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--ink)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <path d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="btn-ghost"
                style={{ alignSelf: "flex-start", background: "var(--card)" }}
              >
                Set up your classroom →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Try it",
      price: "0",
      per: "forever",
      blurb: "See if it works for you.",
      features: ["3 practice sessions", "Full IB rubric scoring", "Basic feedback"],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Student",
      price: "9",
      per: "per month",
      blurb: "The one everyone actually buys.",
      features: [
        "Unlimited sessions",
        "All feedback analytics",
        "Progress tracking",
        "Transcript exports",
        "Cancel anytime",
      ],
      cta: "Start 7-day trial",
      featured: true,
    },
    {
      name: "Classroom",
      price: "49",
      per: "per month",
      blurb: "For teachers and small schools.",
      features: [
        "Up to 30 students",
        "Teacher dashboard",
        "Custom stimulus uploads",
        "Gradebook export",
        "Priority support",
      ],
      cta: "Talk to us",
      featured: false,
    },
  ];
  return (
    <section id="pricing" style={{ padding: "120px 0", scrollMarginTop: 80, position: "relative" }}>
      <FloatingMark
        glyph="¡"
        style={{ top: 80, left: 40, fontSize: 200, opacity: 0.04, transform: "rotate(-10deg)" }}
      />
      <div className="wrap">
        <Reveal>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Pricing</div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 4.8vw, 56px)", margin: 0 }}>
              Cheaper than <em>one</em> tutoring session.
            </h2>
            <p
              style={{
                color: "var(--ink-3)",
                fontSize: 17,
                marginTop: 16,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Pay monthly. Cancel anytime. Free forever if you only need a few practice runs.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
          className="pricing-grid"
        >
          {tiers.map((t) => (
            <Reveal key={t.name}>
              <div
                style={{
                  padding: 26,
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--ink)",
                  boxShadow: t.featured ? "0 6px 0 0 var(--ink)" : "var(--shadow-stamp)",
                  background: t.featured ? "var(--ink)" : "var(--card)",
                  color: t.featured ? "var(--paper)" : "var(--ink)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  position: "relative",
                  transform: t.featured ? "translateY(-8px)" : "none",
                }}
              >
                {t.featured && (
                  <span
                    style={{
                      position: "absolute",
                      top: -12,
                      right: 18,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      background: "var(--gold)",
                      color: "var(--ink)",
                      borderRadius: 999,
                      border: "1.5px solid var(--ink)",
                      boxShadow: "0 2px 0 0 var(--ink)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </span>
                )}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--habla-display)",
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: t.featured ? "var(--gold)" : "var(--accent)",
                      textTransform: "uppercase",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>{t.blurb}</div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--habla-display)",
                      fontSize: 52,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    ${t.price}
                  </span>
                  <span style={{ fontSize: 13, opacity: 0.6 }}>/ {t.per}</span>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  {t.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "18px 1fr",
                        gap: 8,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        alignItems: "start",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.featured ? "var(--gold)" : "var(--accent)"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ marginTop: 4 }}
                      >
                        <path d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 22px",
                    borderRadius: 999,
                    background: t.featured ? "var(--gold)" : "var(--ink)",
                    color: t.featured ? "var(--ink)" : "var(--paper)",
                    border: "1.5px solid var(--ink)",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {t.cta} →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Is the scoring actually accurate?",
      a:
        "Our scoring is calibrated against the IB's official markband descriptors, reviewed with practicing Spanish B teachers. Individual sessions won't perfectly match an examiner, but trend lines across 5+ sessions are reliable.",
    },
    {
      q: "Does it work with HL or just SL?",
      a:
        "Both. The examiner adapts question depth and expected response length to your level. You set HL/SL once and it calibrates automatically.",
    },
    {
      q: "Can I use my own stimulus images?",
      a:
        "On Classroom plans, yes — upload any image, add cultural talking points, and your students can practice with it. Student plans use our curated library of 400+ images.",
    },
    {
      q: "What if I don't speak fluently yet?",
      a:
        "The examiner slows down, gives hints, and repeats questions on request. You can also switch to text mode if voice feels like too much at first.",
    },
    {
      q: "Is my voice recorded? Stored?",
      a:
        "Recordings are kept for 30 days so you can re-listen, then automatically deleted. You can purge on demand. We never train on your voice.",
    },
    {
      q: "How is this different from ChatGPT?",
      a:
        "ChatGPT is a generalist — it'll chat with you but has no idea what an IB oral actually looks like. Habla runs the exact 4-phase format, scores on the actual rubric, and tracks you against IB criteria over time.",
    },
  ];
  const [open, setOpen] = useState<number>(0);
  return (
    <section
      style={{
        padding: "120px 0",
        background: "var(--paper-2)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0, 1.4fr)",
          gap: 80,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>FAQ</div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 4.2vw, 48px)", margin: 0 }}>
            Yes, that&apos;s a <em>real</em> question students ask.
          </h2>
          <p style={{ color: "var(--ink-3)", fontSize: 16, marginTop: 18 }}>
            Everything we get asked on our first call. If you have something we haven&apos;t covered,{" "}
            <a
              href="mailto:hello@habla.app"
              style={{ color: "var(--indigo)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              email us
            </a>
            .
          </p>
        </div>
        <div>
          {items.map((it, i) => (
            <div key={it.q} style={{ borderTop: "1px solid var(--line)" }}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  padding: "22px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  textAlign: "left",
                  border: "none",
                  background: "none",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--habla-serif)",
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {it.q}
                </span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: open === i ? "var(--ink)" : "transparent",
                    color: open === i ? "var(--paper)" : "var(--ink)",
                    border: "1.5px solid var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      transform: open === i ? "rotate(45deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div
                style={{
                  maxHeight: open === i ? 240 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.35s ease",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    paddingBottom: 22,
                    fontSize: 15.5,
                    color: "var(--ink-2)",
                    lineHeight: 1.6,
                    maxWidth: 640,
                  }}
                >
                  {it.a}
                </p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)" }} />
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: "140px 0", position: "relative", overflow: "hidden" }}>
      <FloatingMark glyph="¿" style={{ top: 20, left: "8%", fontSize: 280, opacity: 0.06 }} />
      <FloatingMark
        glyph="!"
        style={{ bottom: 20, right: "10%", fontSize: 240, opacity: 0.06, transform: "rotate(8deg)" }}
      />
      <div className="wrap" style={{ position: "relative", textAlign: "center" }}>
        <Reveal>
          <h2
            className="display"
            style={{
              fontSize: "clamp(44px, 6.2vw, 84px)",
              margin: 0,
              maxWidth: 900,
              marginInline: "auto",
            }}
          >
            Your oral is in <em style={{ color: "var(--indigo)" }}>six weeks</em>.<br />
            Let&apos;s make you <span className="underline-wavy">ready</span>.
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "var(--ink-3)",
              marginTop: 22,
              maxWidth: 540,
              marginInline: "auto",
            }}
          >
            First three practice sessions are free. No card. No catch. Stop spiraling, start hablando.
          </p>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/auth/signup"
              className="btn-primary"
              style={{ padding: "16px 28px 17px", fontSize: 16 }}
            >
              Start free — take 2 min
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <a href="#pricing" className="btn-ghost">
              See pricing
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LandingFooter() {
  const cols = [
    { t: "Product", l: ["How it works", "Features", "Pricing", "For teachers", "Changelog"] },
    { t: "IB Resources", l: ["Rubric explainer", "Sample orals", "Theme guide", "Exam timing tips", "Blog"] },
    { t: "Company", l: ["About", "Careers", "Press", "Contact", "Affiliates"] },
    { t: "Legal", l: ["Privacy", "Terms", "Data & voice", "Accessibility"] },
  ];
  return (
    <footer
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "80px 0 32px",
        position: "relative",
      }}
    >
      <div className="wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) repeat(4, minmax(0, 1fr))",
            gap: 40,
            marginBottom: 60,
          }}
          className="footer-grid"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 40 40">
                <path
                  d="M4 14 C4 8, 8 4, 14 4 L28 4 C34 4, 38 8, 38 14 L38 24 C38 30, 34 34, 28 34 L18 34 L10 38 L12 32 C7 31, 4 28, 4 24 Z"
                  fill="var(--gold)"
                />
                <text
                  x="21"
                  y="26"
                  textAnchor="middle"
                  fontFamily="Spectral, serif"
                  fontStyle="italic"
                  fontWeight="600"
                  fontSize="20"
                  fill="var(--ink)"
                >
                  h
                </text>
              </svg>
              <span style={{ fontFamily: "var(--habla-serif)", fontSize: 24, fontWeight: 600 }}>
                Habla<span style={{ color: "var(--gold)" }}>.</span>
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "oklch(0.75 0.02 275)",
                marginTop: 14,
                maxWidth: 280,
                lineHeight: 1.5,
              }}
            >
              Confidence for the IB Spanish oral. No more exam-day panic.
            </p>
            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              {["Twitter", "Instagram", "TikTok"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid oklch(0.35 0.02 275)",
                    borderRadius: 99,
                    fontSize: 12,
                    color: "oklch(0.85 0.02 275)",
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div className="eyebrow" style={{ color: "var(--gold)", marginBottom: 14 }}>
                {c.t}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {c.l.map((x) => (
                  <li key={x}>
                    <a href="#" style={{ fontSize: 13, color: "oklch(0.82 0.02 275)" }}>
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid oklch(0.3 0.02 275)",
            paddingTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "oklch(0.6 0.02 275)" }}>
            © 2026 Habla · Made for IB students · Not affiliated with the IBO
          </span>
          <span
            style={{
              fontFamily: "var(--habla-serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: "oklch(0.75 0.02 275)",
            }}
          >
            Hecho con cariño en Madrid · Berlin · Buenos Aires
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="habla-ui">
      <Nav />
      <main>
        <Hero />
        <ExamFlow />
        <HowItWorks />
        <Features />
        <Testimonials />
        <TeachersSplit />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
