import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { ReactNode } from "react";
import { C, SANS, MONO, SHADOW_CARD, SHADOW_SOFT, appear, ramp } from "./theme";

/* ------------------------------------------------------------------ *
 * Timeline (30fps · 360 frames · 12s)                                *
 * The store quietly captures what you do, and assembles it into the  *
 * advisor's context — mirroring assembleContext():                   *
 *   current product · review themes · cart · recently-viewed.        *
 * ------------------------------------------------------------------ */
const T = {
  intro: 10,
  outroStart: 338,
  outroEnd: 354,
  handoff: 206,
};

// Geometry (composition is 1120 x 620).
const CARD = { x: 96, y: 104, w: 290, h: 416 };
const PANEL = { x: 470, y: 92, w: 468, h: 456 };

// Each captured signal: cursor action -> flies into a context block.
const SIGNALS = [
  {
    emit: 52,
    src: { x: 372, y: 224 },
    label: "Current product",
    blockTop: PANEL.y + 70,
  },
  {
    emit: 100,
    src: { x: 372, y: 330 },
    label: "Review themes",
    blockTop: PANEL.y + 70 + 92,
  },
  {
    emit: 146,
    src: { x: 372, y: 430 },
    label: "Cart",
    blockTop: PANEL.y + 70 + 184,
  },
  {
    emit: 178,
    src: { x: 372, y: 280 },
    label: "Recently viewed",
    blockTop: PANEL.y + 70 + 276,
  },
];

const BLOCKS = [
  {
    label: "CURRENT PRODUCT",
    lines: ["AirPods Pro 2 · Apple", "1199 lei · 4.6 ★ (38 reviews)"],
  },
  {
    label: "REVIEW THEMES",
    lines: [
      "battery life (14) · comfortable fit (11)",
      "divided — fit for small ears: 11 vs 5",
    ],
  },
  {
    label: "CART",
    lines: ["AirPods Pro 2 ×1 · USB-C Cable ×2"],
  },
  {
    label: "RECENTLY VIEWED",
    lines: ["MacBook Air · iPad Air"],
  },
];

/* ------------------------------------------------------------------ */

const Cursor = ({ x, y, press }: { x: number; y: number; press: number }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `scale(${1 - press * 0.18})`,
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
      zIndex: 40,
    }}
  >
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3l14 7-6 1.6L9.5 18 5 3Z"
        fill="#fff"
        stroke={C.fg}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const FlyingSignal = ({
  frame,
  emit,
  src,
  dst,
  label,
}: {
  frame: number;
  emit: number;
  src: { x: number; y: number };
  dst: { x: number; y: number };
  label: string;
}) => {
  const dur = 24;
  if (frame < emit - 2 || frame > emit + dur + 3) return null;
  const p = ramp(frame, emit, emit + dur, 0, 1);
  const x = src.x + (dst.x - src.x) * p;
  const y = src.y + (dst.y - src.y) * p - Math.sin(p * Math.PI) * 26;
  const op = Math.min(
    ramp(frame, emit, emit + 5, 0, 1),
    ramp(frame, emit + dur - 7, emit + dur, 1, 0),
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        opacity: op,
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        boxShadow: SHADOW_SOFT,
        padding: "6px 12px 6px 10px",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 500,
        color: C.fg,
        whiteSpace: "nowrap",
        zIndex: 30,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: C.blue,
        }}
      />
      {label}
    </div>
  );
};

const Block = ({
  label,
  lines,
  frame,
  start,
}: {
  label: string;
  lines: string[];
  frame: number;
  start: number;
}) => (
  <div
    style={{
      ...appear(frame, start),
      display: "flex",
      gap: 12,
      background: C.bg2,
      border: `1px solid ${C.borderSoft}`,
      borderRadius: 11,
      padding: "11px 14px",
    }}
  >
    <span
      style={{
        width: 3,
        alignSelf: "stretch",
        borderRadius: 2,
        background: C.blue,
        flex: "none",
      }}
    />
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          letterSpacing: "0.06em",
          color: C.fg3,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontSize: 14,
            color: C.fg,
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  </div>
);

const Tag = ({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) => (
  <span
    style={{
      fontSize: 13,
      fontWeight: 500,
      padding: "5px 11px",
      borderRadius: 8,
      color: active ? C.blue : C.fg3,
      background: active ? C.blueSoft : "transparent",
      border: `1px solid ${active ? "transparent" : C.borderSoft}`,
    }}
  >
    {children}
  </span>
);

export const ContextDemo = () => {
  const frame = useCurrentFrame();

  const intro = ramp(frame, 0, T.intro, 0, 1);
  const outro = ramp(frame, T.outroStart, T.outroEnd, 1, 0);
  const globalOpacity = Math.min(intro, outro);

  // cursor path across the browsing actions
  const cx = interpolate(
    frame,
    [16, 40, 90, 138, 175, 200],
    [300, 300, 250, 250, 280, 280],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cy = interpolate(
    frame,
    [16, 40, 90, 138, 175, 200],
    [430, 220, 326, 430, 300, 300],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const click = Math.max(
    ramp(frame, 132, 140, 0, 1) - ramp(frame, 140, 150, 0, 1),
    0,
  );

  // states driven by the cursor
  const dwellRing = Math.min(ramp(frame, 30, 40, 0, 1), ramp(frame, 56, 64, 1, 0));
  const reviewsActive = frame >= 88 && frame < 150;
  const cartPress = click;

  const handoffOn = ramp(frame, T.handoff, T.handoff + 12, 0, 1);

  return (
    <AbsoluteFill style={{ fontFamily: SANS, opacity: globalOpacity }}>
      {/* ----------------------- product browser ----------------------- */}
      <div
        style={{
          ...appear(frame, T.intro),
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          boxShadow: SHADOW_CARD,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* image */}
        <div
          style={{
            height: 132,
            borderRadius: 12,
            background: "linear-gradient(150deg, #eaf1ff, #ffffff)",
            border: `1px solid ${C.borderSoft}`,
            display: "grid",
            placeItems: "center",
            marginBottom: 14,
          }}
        >
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 14a4 4 0 1 1 4-4v8a2 2 0 0 1-4 0v-4Z"
              stroke={C.fg2}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M17 14a4 4 0 1 0-4-4v8a2 2 0 0 0 4 0v-4Z"
              stroke={C.fg2}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 12, color: C.fg3, marginBottom: 3 }}>Apple</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          AirPods Pro 2
        </div>
        {/* tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Tag>Overview</Tag>
          <Tag active={reviewsActive}>Reviews</Tag>
        </div>
        {/* add to cart */}
        <div
          style={{
            marginTop: "auto",
            height: 44,
            borderRadius: 11,
            background: C.fg,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 14.5,
            fontWeight: 500,
            transform: `scale(${1 - cartPress * 0.04})`,
            boxShadow: cartPress
              ? `0 0 0 4px ${C.blueSoft}`
              : "0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          Add to cart
        </div>

        {/* dwell ring */}
        {dwellRing > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 150,
              top: 96,
              width: 54,
              height: 54,
              marginLeft: -27,
              marginTop: -27,
              borderRadius: "50%",
              border: `2px solid ${C.blue}`,
              opacity: dwellRing * 0.7,
              transform: `scale(${0.7 + (1 - dwellRing) * 0.6})`,
            }}
          />
        ) : null}
      </div>

      {/* tracking caption under the card */}
      <div
        style={{
          ...appear(frame, T.intro + 6),
          position: "absolute",
          left: CARD.x,
          top: CARD.y + CARD.h + 16,
          width: CARD.w,
          fontFamily: MONO,
          fontSize: 11.5,
          color: C.fg3,
          textAlign: "center",
          letterSpacing: "0.01em",
        }}
      >
        session state · rebuilt on every question
      </div>

      {/* ----------------------- context panel ----------------------- */}
      <div
        style={{
          ...appear(frame, T.intro + 3),
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          boxShadow: SHADOW_CARD,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.blue,
              boxShadow: `0 0 0 4px ${C.blueSoft}`,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Advisor context
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: MONO,
              fontSize: 11,
              color: C.fg3,
            }}
          >
            assembled per question
          </span>
        </div>

        {BLOCKS.map((b, i) => (
          <Block
            key={b.label}
            label={b.label}
            lines={b.lines}
            frame={frame}
            start={SIGNALS[i].emit + 18}
          />
        ))}

        {/* handoff footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 9,
            paddingTop: 12,
            borderTop: `1px solid ${C.borderSoft}`,
            opacity: 0.4 + handoffOn * 0.6,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9Z"
              fill={handoffOn > 0.5 ? C.blue : "none"}
              stroke={handoffOn > 0.5 ? C.blue : C.fg3}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: handoffOn > 0.5 ? C.blue : C.fg2,
            }}
          >
            Handed to the advisor with every question
          </span>
        </div>
      </div>

      {/* flying signals */}
      {SIGNALS.map((s) => (
        <FlyingSignal
          key={s.label}
          frame={frame}
          emit={s.emit}
          src={s.src}
          dst={{ x: PANEL.x + 26, y: s.blockTop + 24 }}
          label={s.label}
        />
      ))}

      {/* cursor */}
      <Cursor x={cx} y={cy} press={cartPress} />
    </AbsoluteFill>
  );
};
