import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import { C, SANS, MONO, SHADOW_CARD, SHADOW_SOFT, appear, ramp } from "./theme";

/* ------------------------------------------------------------------ *
 * Timeline (30fps · 420 frames · 14s)                                *
 * ------------------------------------------------------------------ */
const T = {
  intro: 10,
  u1: 24,
  a1Bubble: 50,
  a1Start: 64,
  a1End: 152,
  dim1: 200,
  swapStart: 190,
  swapEnd: 214,
  u2: 224,
  a2Bubble: 250,
  a2Start: 264,
  a2End: 352,
  outroStart: 402,
  outroEnd: 418,
};

const STAR = "#f5b301";

const PRODUCT_A = {
  name: "AirPods Pro 2",
  price: "1199 lei",
  was: "1399 lei",
  off: "−14%",
  rating: 4.6,
  reviews: "38",
  tint: "#eef1f4",
  kind: "earbuds" as const,
};
const PRODUCT_B = {
  name: "MacBook Air",
  price: "5999 lei",
  was: "",
  off: "",
  rating: 4.8,
  reviews: "52",
  tint: "#f0eefc",
  kind: "laptop" as const,
};

const Q1 = "Are these good for the gym?";
const A1 =
  "The AirPods Pro 2 are IPX4 sweat-resistant, and 11 reviewers call the fit secure for workouts. A few with smaller ears say they can work loose.";
const Q2 = "And the battery on this one?";
const A2 =
  "The MacBook Air is rated up to 18 hours, and 22 reviewers highlight its all-day battery in real use.";

/* ------------------------------------------------------------------ */

const EarbudsIcon = () => (
  <svg width="78" height="78" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 14a4 4 0 1 1 4-4v8a2 2 0 0 1-4 0v-4Z"
      stroke={C.fg2}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M17 14a4 4 0 1 0-4-4v8a2 2 0 0 0 4 0v-4Z"
      stroke={C.fg2}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const LaptopIcon = () => (
  <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="11" rx="1.6" stroke={C.fg2} strokeWidth="1.4" />
    <path d="M2.5 19h19" stroke={C.fg2} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Stars = ({ rating }: { rating: number }) => {
  const filled = Math.round(rating);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < filled ? STAR : "#e3e3e3"}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 18.5 6.1 21.6l1.2-6.6L2.5 9.4l6.6-.9 2.9-6Z" />
        </svg>
      ))}
    </div>
  );
};

// A faithful echo of the real store card (apps/web product-card.tsx):
// square photo + discount pill, no brand, 2-line title, yellow stars + count,
// bold "lei" price with struck original, full-width add-to-cart.
const CardContent = ({ p }: { p: typeof PRODUCT_A }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <div
      style={{
        position: "relative",
        height: 230,
        borderRadius: 10,
        background: `linear-gradient(155deg, ${p.tint}, #ffffff)`,
        border: `1px solid ${C.borderSoft}`,
        display: "grid",
        placeItems: "center",
        marginBottom: 14,
      }}
    >
      {p.off ? (
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            fontSize: 12,
            fontWeight: 600,
            color: C.red,
            background: "rgba(234,0,29,0.10)",
            borderRadius: 999,
            padding: "3px 9px",
          }}
        >
          {p.off}
        </span>
      ) : null}
      {p.kind === "earbuds" ? <EarbudsIcon /> : <LaptopIcon />}
    </div>
    <div
      style={{
        fontSize: 19,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: C.fg,
        lineHeight: 1.25,
        marginBottom: 11,
      }}
    >
      {p.name}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
      <Stars rating={p.rating} />
      <span style={{ fontSize: 14, color: C.fg3 }}>({p.reviews})</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 16 }}>
      <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.price}</span>
      {p.was ? (
        <span style={{ fontSize: 14, color: C.fg3, textDecoration: "line-through" }}>{p.was}</span>
      ) : null}
    </div>
    <div
      style={{
        marginTop: "auto",
        height: 44,
        borderRadius: 10,
        background: C.fg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 14.5,
        fontWeight: 500,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 6h15l-1.5 9h-12L6 6Zm0 0l-.8-3H2m6 18a1 1 0 100-2 1 1 0 000 2Zm10 0a1 1 0 100-2 1 1 0 000 2Z"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Add to cart
    </div>
  </div>
);

const TypingDots = ({ frame }: { frame: number }) => {
  const dot = (i: number) => {
    const y = Math.sin(frame / 5 - i * 0.95) * 3;
    return (
      <span
        key={i}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: C.fg3,
          display: "inline-block",
          transform: `translateY(${y}px)`,
        }}
      />
    );
  };
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", height: 18 }}>
      {[0, 1, 2].map(dot)}
    </div>
  );
};

const Bubble = ({
  role,
  children,
  style,
}: {
  role: "user" | "assistant";
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          background: isUser ? C.fg : C.bg,
          color: isUser ? "#fff" : C.fg,
          border: isUser ? "none" : `1px solid ${C.border}`,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 5 : 16,
          borderBottomLeftRadius: isUser ? 16 : 5,
          padding: "12px 16px",
          fontSize: 16,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
          boxShadow: isUser ? "0 2px 8px rgba(0,0,0,0.14)" : SHADOW_SOFT,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const StreamText = ({
  text,
  shown,
  streaming,
  frame,
}: {
  text: string;
  shown: number;
  streaming: boolean;
  frame: number;
}) => {
  const caret = frame % 16 < 8;
  return (
    <span>
      {text.slice(0, shown)}
      {streaming ? (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: C.fg,
            marginLeft: 1,
            transform: "translateY(2px)",
            opacity: caret ? 1 : 0,
          }}
        />
      ) : null}
    </span>
  );
};

export const ChatDemo = () => {
  const frame = useCurrentFrame();

  const intro = ramp(frame, 0, T.intro, 0, 1);
  const outro = ramp(frame, T.outroStart, T.outroEnd, 1, 0);
  const globalOpacity = Math.min(intro, outro);

  const bIn = ramp(frame, T.swapStart, T.swapEnd, 0, 1);

  const a1Shown = Math.floor(ramp(frame, T.a1Start, T.a1End, 0, A1.length));
  const a2Shown = Math.floor(ramp(frame, T.a2Start, T.a2End, 0, A2.length));

  const scene1Dim = ramp(frame, T.dim1, T.dim1 + 18, 1, 0.4);
  const stackShift = ramp(frame, T.dim1, T.dim1 + 22, 0, -14);

  const showA1Text = frame >= T.a1Start;
  const showA2Text = frame >= T.a2Start;

  return (
    <AbsoluteFill style={{ fontFamily: SANS, opacity: globalOpacity }}>
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
        }}
      >
        {/* ---------------- product card ---------------- */}
        <div
          style={{
            ...appear(frame, T.intro),
            position: "relative",
            width: 300,
            height: 470,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: SHADOW_CARD,
            padding: 18,
          }}
        >
          <div style={{ position: "absolute", inset: 18, opacity: 1 - bIn }}>
            <CardContent p={PRODUCT_A} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 18,
              opacity: bIn,
              transform: `scale(${0.97 + bIn * 0.03})`,
            }}
          >
            <CardContent p={PRODUCT_B} />
          </div>
        </div>

        {/* ---------------- chat panel ---------------- */}
        <div
          style={{
            ...appear(frame, T.intro + 4),
            width: 588,
            height: 496,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            boxShadow: SHADOW_CARD,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 20px",
              borderBottom: `1px solid ${C.borderSoft}`,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Shopping advisor
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: MONO,
                fontSize: 11,
                color: C.fg3,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              grounded
            </span>
          </div>

          {/* messages */}
          <div
            style={{
              flex: 1,
              padding: "20px 20px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 13,
              transform: `translateY(${stackShift}px)`,
            }}
          >
            <Bubble role="user" style={{ ...appear(frame, T.u1), opacity: undefined }}>
              <div style={{ opacity: Math.min(ramp(frame, T.u1, T.u1 + 12, 0, 1), scene1Dim) }}>
                {Q1}
              </div>
            </Bubble>

            <Bubble role="assistant" style={appear(frame, T.a1Bubble)}>
              <div style={{ opacity: scene1Dim }}>
                {showA1Text ? (
                  <StreamText text={A1} shown={a1Shown} streaming={frame < T.a1End} frame={frame} />
                ) : (
                  <TypingDots frame={frame} />
                )}
              </div>
            </Bubble>

            {frame >= T.u2 - 6 ? (
              <Bubble role="user" style={appear(frame, T.u2)}>
                {Q2}
              </Bubble>
            ) : null}

            {frame >= T.a2Bubble - 6 ? (
              <Bubble role="assistant" style={appear(frame, T.a2Bubble)}>
                {showA2Text ? (
                  <StreamText text={A2} shown={a2Shown} streaming={frame < T.a2End} frame={frame} />
                ) : (
                  <TypingDots frame={frame} />
                )}
              </Bubble>
            ) : null}
          </div>

          {/* input */}
          <div style={{ padding: "12px 16px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 44,
                background: C.bg2,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "0 8px 0 15px",
              }}
            >
              <span style={{ fontSize: 14.5, color: C.fg3 }}>Ask about this product…</span>
              <span
                style={{
                  marginLeft: "auto",
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: C.fg,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
