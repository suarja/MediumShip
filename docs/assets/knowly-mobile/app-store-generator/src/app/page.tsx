"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import {
  COPY,
  LOCALES,
  LOCALE_LABEL,
  MOCKUP_LOCALE_FOR,
  SLIDE_IDS,
  SLIDE_LAYOUT,
  SLIDE_DARK,
  type Locale,
  type SlideId,
} from "./_data/copy";

/* ─────────────────────────────────────────────────────────
   Canvas (iPhone 6.9" — largest required size; smaller
   resolutions are produced by re-rendering at export time)
───────────────────────────────────────────────────────── */
const W = 1320;
const H = 2868;

const IPHONE_SIZES = [
  { label: '6.9"', w: 1320, h: 2868 },
  { label: '6.5"', w: 1284, h: 2778 },
  { label: '6.3"', w: 1206, h: 2622 },
  { label: '6.1"', w: 1125, h: 2436 },
] as const;

/* ─────────────────────────────────────────────────────────
   Brand tokens — Knowly "brick" palette (warm editorial).
   Mirrors src/features/theme/palette-catalog.ts.
───────────────────────────────────────────────────────── */
const T = {
  // light slide
  canvas: "#F5EFE8",
  canvasAccent: "#ECE1D4",
  surface: "#FFFDFC",
  ink: "#2B211D",
  fg1: "#43332B",
  fg2: "#7A665C",
  accent: "#B14F2E",
  accentSoft: "#F2DED3",
  premium: "#C8964A",
  line: "rgba(87,56,36,0.12)",
  // dark slide
  dBg0: "#241813",
  dBg1: "#150D09",
  dInk: "#F6EFE7",
  dFg1: "#D8C7BB",
  dFg2: "#A8927F",
  dAccent: "#E08C5A",
  dPremium: "#E7B85C",
  dLine: "rgba(246,239,231,0.14)",
  fontDisplay: 'var(--font-display), Georgia, serif',
  fontUi: "var(--font-ui), -apple-system, system-ui, sans-serif",
  fontMono: "var(--font-mono), ui-monospace, monospace",
};

type Pal = {
  bg0: string;
  bg1: string;
  ink: string;
  fg1: string;
  fg2: string;
  accent: string;
  premium: string;
  line: string;
  glow: string;
};

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg0: T.dBg0,
        bg1: T.dBg1,
        ink: T.dInk,
        fg1: T.dFg1,
        fg2: T.dFg2,
        accent: T.dAccent,
        premium: T.dPremium,
        line: T.dLine,
        glow: "rgba(224,140,90,0.20)",
      }
    : {
        bg0: T.canvas,
        bg1: T.canvasAccent,
        ink: T.ink,
        fg1: T.fg1,
        fg2: T.fg2,
        accent: T.accent,
        premium: T.premium,
        line: T.line,
        glow: "rgba(177,79,46,0.12)",
      };
}

/* ─────────────────────────────────────────────────────────
   Copy formatting: "\n" → <br />, "*word*" → accent italic
───────────────────────────────────────────────────────── */
function fmtCopy(text: string, accentColor: string): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <span key={i} style={{ color: accentColor, fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    const lines = part.split("\n");
    return (
      <span key={i}>
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

/* ─────────────────────────────────────────────────────────
   Image preload (data URIs) — prevents blank html-to-image exports
───────────────────────────────────────────────────────── */
function buildImagePaths(): string[] {
  const paths = ["/mockup.png", "/app-icon.png"];
  const mockupLocales = new Set<string>(Object.values(MOCKUP_LOCALE_FOR));
  for (const loc of mockupLocales) {
    for (const id of SLIDE_IDS) paths.push(`/screenshots/${loc}/${id}.png`);
  }
  return paths;
}

const IMAGE_PATHS = buildImagePaths();
const imageCache: Record<string, string> = {};
const imageMissing: Record<string, boolean> = {};

async function preloadAllImages(): Promise<void> {
  const PER_IMAGE_TIMEOUT_MS = 12_000;
  await Promise.all(
    IMAGE_PATHS.map(async (path) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PER_IMAGE_TIMEOUT_MS);
      try {
        const resp = await fetch(path, { signal: ctrl.signal });
        if (!resp.ok) {
          imageMissing[path] = true;
          return;
        }
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imageCache[path] = dataUrl;
      } catch {
        imageMissing[path] = true;
      } finally {
        clearTimeout(timer);
      }
    })
  );
}

function img(path: string): string {
  return imageCache[path] || path;
}
function hasImage(path: string): boolean {
  return Boolean(imageCache[path]) && !imageMissing[path];
}

/* ─────────────────────────────────────────────────────────
   Phone (mockup.png — pre-measured screen window)
───────────────────────────────────────────────────────── */
const MK_W = 1022;
const MK_H = 2082;
const SC_L = (52 / MK_W) * 100;
const SC_T = (46 / MK_H) * 100;
const SC_W = (918 / MK_W) * 100;
const SC_H = (1990 / MK_H) * 100;
const SC_RX = (126 / 918) * 100;
const SC_RY = (126 / 1990) * 100;

function Phone({
  children,
  screenSrc,
  style,
}: {
  children?: ReactNode;
  screenSrc?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: "relative", aspectRatio: `${MK_W}/${MK_H}`, ...style }}>
      <img
        src={img("/mockup.png")}
        alt=""
        style={{ display: "block", width: "100%", height: "100%" }}
        draggable={false}
      />
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          overflow: "hidden",
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
          background: T.surface,
        }}
      >
        {screenSrc ? (
          <img
            src={screenSrc}
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
            draggable={false}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Editorial ScreenMock — fallback shown inside the bezel until a
   real capture is dropped in public/screenshots/<loc>/<id>.png.
───────────────────────────────────────────────────────── */
function ScreenMock({ id, locale }: { id: SlideId; locale: Locale }) {
  const c = COPY[locale][id];
  const screenW = SC_W / 100 * (W * 0.62); // approx device px for type scale
  const u = (n: number) => `${n}px`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: T.surface,
        color: T.ink,
        fontFamily: T.fontUi,
        padding: u(screenW * 0.085),
        paddingTop: u(screenW * 0.16),
        display: "flex",
        flexDirection: "column",
        gap: u(screenW * 0.05),
        boxSizing: "border-box",
      }}
    >
      {/* status bar */}
      <div
        style={{
          position: "absolute",
          top: u(screenW * 0.05),
          left: u(screenW * 0.085),
          right: u(screenW * 0.085),
          display: "flex",
          justifyContent: "space-between",
          fontSize: u(screenW * 0.04),
          fontWeight: 700,
          color: T.ink,
        }}
      >
        <span>14:42</span>
        <span style={{ letterSpacing: 2, opacity: 0.55 }}>●●● ●●● 100%</span>
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: u(screenW * 0.044),
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: T.accent,
        }}
      >
        {c.kicker}
      </div>
      <div
        style={{
          width: "100%",
          height: u(screenW * 0.52),
          borderRadius: u(screenW * 0.045),
          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.premium} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.30) 0%, transparent 60%)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: u(screenW * 0.095),
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
        }}
      >
        {(c.headline || "").replace(/\*/g, "").replace(/\n/g, " ")}
      </div>
      <div style={{ fontSize: u(screenW * 0.05), fontWeight: 500, color: T.fg2 }}>
        Camille Roy · Aujourd&apos;hui
      </div>
      <div
        style={{
          marginTop: "auto",
          height: u(screenW * 0.16),
          background: T.accent,
          borderRadius: u(screenW * 0.05),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: u(screenW * 0.052),
          fontWeight: 700,
          color: "#FFF8F4",
        }}
      >
        {c.chipValue ?? "Ouvrir"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Caption (kicker + headline + sub)
───────────────────────────────────────────────────────── */
function Caption({
  pal,
  c,
  align,
}: {
  pal: Pal;
  c: { kicker: string; headline: string; sub: string };
  align: "left" | "center";
}) {
  return (
    <div style={{ textAlign: align, color: pal.ink }}>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: W * 0.0225,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: pal.accent,
          marginBottom: W * 0.028,
          fontWeight: 600,
        }}
      >
        {c.kicker}
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 600,
          fontSize: W * 0.108,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          color: pal.ink,
        }}
      >
        {fmtCopy(c.headline, pal.accent)}
      </div>
      <div
        style={{
          fontFamily: T.fontUi,
          fontWeight: 400,
          fontSize: W * 0.0265,
          lineHeight: 1.4,
          color: pal.fg1,
          marginTop: W * 0.028,
          maxWidth: align === "center" ? "84%" : "82%",
          marginLeft: align === "center" ? "auto" : 0,
          marginRight: align === "center" ? "auto" : 0,
        }}
      >
        {c.sub}
      </div>
    </div>
  );
}

function Chip({ pal, label, value }: { pal: Pal; label: string; value: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: W * 0.012,
        background: pal.bg0 === T.canvas ? T.accentSoft : "rgba(224,140,90,0.16)",
        border: `1px solid ${pal.accent}55`,
        padding: `${W * 0.013}px ${W * 0.026}px`,
        borderRadius: 999,
        fontFamily: T.fontUi,
      }}
    >
      <span style={{ fontSize: W * 0.018, fontWeight: 600, color: pal.fg2 }}>{label}</span>
      <span style={{ fontSize: W * 0.024, fontWeight: 700, color: pal.accent }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SlideFrame — full 1320×2868 composition for one screenshot
───────────────────────────────────────────────────────── */
function SlideFrame({ id, locale }: { id: SlideId; locale: Locale }) {
  const dark = SLIDE_DARK[id];
  const layout = SLIDE_LAYOUT[id];
  const pal = palette(dark);
  const c = COPY[locale][id];
  const mockLoc = MOCKUP_LOCALE_FOR[locale];
  const path = `/screenshots/${mockLoc}/${id}.png`;
  const real = hasImage(path);
  const screenSrc = real ? img(path) : undefined;

  const PAD = W * 0.085;

  const phone = (
    <Phone screenSrc={screenSrc}>
      {!real && <ScreenMock id={id} locale={locale} />}
    </Phone>
  );

  const chip =
    c.chipLabel && c.chipValue ? (
      <Chip pal={pal} label={c.chipLabel} value={c.chipValue} />
    ) : null;

  let body: ReactNode;
  if (layout === "bottom") {
    body = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `${W * 0.13}px ${PAD}px 0`,
        }}
      >
        <Caption pal={pal} c={c} align="center" />
        {chip && <div style={{ marginTop: W * 0.04 }}>{chip}</div>}
        <div
          style={{
            position: "absolute",
            bottom: -W * 0.28,
            left: "50%",
            transform: "translateX(-50%)",
            width: W * 0.88,
          }}
        >
          {phone}
        </div>
      </div>
    );
  } else {
    const phoneRight = layout === "right";
    body = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: phoneRight ? "row" : "row-reverse",
          alignItems: "center",
        }}
      >
        {/* caption column */}
        <div
          style={{
            flex: "0 0 46%",
            padding: `0 ${W * 0.02}px 0 ${phoneRight ? PAD : W * 0.04}px`,
            ...(phoneRight ? {} : { paddingRight: PAD, paddingLeft: W * 0.04 }),
            display: "flex",
            flexDirection: "column",
            gap: W * 0.04,
            zIndex: 5,
          }}
        >
          <Caption pal={pal} c={c} align="left" />
          {chip}
        </div>
        {/* phone column — slightly oversized & pushed off-edge for depth */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: phoneRight ? "flex-start" : "flex-end",
          }}
        >
          <div
            style={{
              width: W * 0.74,
              transform: `translateX(${phoneRight ? W * 0.06 : -W * 0.06}px)`,
            }}
          >
            {phone}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        overflow: "hidden",
        background: `linear-gradient(165deg, ${pal.bg0} 0%, ${pal.bg1} 100%)`,
        fontFamily: T.fontUi,
      }}
    >
      {/* warm glow */}
      <div
        style={{
          position: "absolute",
          top: -W * 0.3,
          right: -W * 0.25,
          width: W * 1.2,
          height: W * 1.2,
          background: `radial-gradient(circle, ${pal.glow} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      {body}
      {/* footer wordmark */}
      <div
        style={{
          position: "absolute",
          bottom: W * 0.05,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: W * 0.03,
          color: pal.fg2,
          zIndex: 20,
        }}
      >
        Knowly
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Export plumbing
───────────────────────────────────────────────────────── */
function sizeLabelToSlug(label: string): string {
  return label.replace(/"/g, "").replace(/\s+/g, "-");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

type ZoomMode = "grid" | "focus";

export default function ScreenshotsPage() {
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [zoom, setZoom] = useState<ZoomMode>("grid");
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    let mounted = true;
    const safety = setTimeout(() => mounted && setReady(true), 18_000);
    preloadAllImages().then(() => {
      if (mounted) setReady(true);
      clearTimeout(safety);
    });
    return () => {
      mounted = false;
      clearTimeout(safety);
    };
  }, []);

  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  async function captureSlide(el: HTMLElement, w: number, h: number): Promise<string> {
    el.style.left = "0px";
    el.style.opacity = "1";
    el.style.zIndex = "-1";
    const opts = { width: w, height: h, pixelRatio: 1, cacheBust: true };
    await toPng(el, opts); // warm up
    const dataUrl = await toPng(el, opts);
    el.style.left = "-9999px";
    el.style.opacity = "";
    el.style.zIndex = "";
    return dataUrl;
  }

  async function exportOne(i: number) {
    const size = IPHONE_SIZES[sizeIdx];
    const el = exportRefs.current[i];
    if (!el) return;
    setExporting("1/1");
    try {
      const dataUrl = await captureSlide(el, size.w, size.h);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${String(i + 1).padStart(2, "0")}-${SLIDE_IDS[i]}-${locale}-${size.w}x${size.h}.png`;
      a.click();
    } finally {
      setExporting(null);
    }
  }

  async function exportCurrentSet() {
    const size = IPHONE_SIZES[sizeIdx];
    const sizeSlug = sizeLabelToSlug(size.label);
    const folder = `knowly-screenshots-${locale}-iphone-${sizeSlug}`;
    const zip = new JSZip();
    const dir = zip.folder(folder)!;
    for (let i = 0; i < SLIDE_IDS.length; i++) {
      setExporting(`${i + 1}/${SLIDE_IDS.length} · ${locale} · ${size.label}`);
      const el = exportRefs.current[i];
      if (!el) continue;
      try {
        const dataUrl = await captureSlide(el, size.w, size.h);
        const base64 = dataUrl.split(",")[1] ?? "";
        dir.file(`${String(i + 1).padStart(2, "0")}-${SLIDE_IDS[i]}.png`, base64, {
          base64: true,
        });
      } catch (err) {
        console.error(`[export] slide ${i}`, err);
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    setExporting("Building ZIP…");
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `${folder}.zip`);
    setExporting(null);
  }

  async function exportAll() {
    const root = "knowly-screenshots-full";
    const zip = new JSZip();
    const rootDir = zip.folder(root)!;
    let total = 0;
    let done = 0;
    for (const _l of LOCALES) for (const _s of IPHONE_SIZES) total += SLIDE_IDS.length;
    for (const loc of LOCALES) {
      setLocale(loc);
      await new Promise((r) => setTimeout(r, 200));
      for (let s = 0; s < IPHONE_SIZES.length; s++) {
        const size = IPHONE_SIZES[s];
        const sizeSlug = sizeLabelToSlug(size.label);
        const dir = rootDir.folder(`iphone-${sizeSlug}`)!.folder(loc)!;
        for (let i = 0; i < SLIDE_IDS.length; i++) {
          done += 1;
          setExporting(`${done}/${total} · ${loc} · ${size.label}`);
          const el = exportRefs.current[i];
          if (!el) continue;
          try {
            const dataUrl = await captureSlide(el, size.w, size.h);
            const base64 = dataUrl.split(",")[1] ?? "";
            dir.file(`${String(i + 1).padStart(2, "0")}-${SLIDE_IDS[i]}.png`, base64, {
              base64: true,
            });
          } catch (err) {
            console.error(`[export-all] ${loc} ${size.label} slide ${i}`, err);
          }
          await new Promise((r) => setTimeout(r, 50));
        }
      }
    }
    setExporting("Building ZIP…");
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `${root}.zip`);
    setExporting(null);
  }

  if (!ready) {
    return (
      <div style={{ padding: 60, fontFamily: T.fontUi, color: T.fg2 }}>
        Loading images…
      </div>
    );
  }

  const size = IPHONE_SIZES[sizeIdx];
  const btn = (active: boolean): CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${active ? T.accent : T.line}`,
    background: active ? T.accent : T.surface,
    color: active ? "#FFF8F4" : T.fg1,
    fontFamily: T.fontUi,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  });

  const PREVIEW_W = zoom === "grid" ? 264 : 420;
  const scale = PREVIEW_W / W;

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 80px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 30,
            margin: 0,
            marginRight: 8,
            color: T.ink,
          }}
        >
          Knowly · App Store
        </h1>

        <div style={{ display: "flex", gap: 8 }}>
          {LOCALES.map((l) => (
            <button key={l} style={btn(l === locale)} onClick={() => setLocale(l)}>
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {IPHONE_SIZES.map((s, i) => (
            <button key={s.label} style={btn(i === sizeIdx)} onClick={() => setSizeIdx(i)}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button style={btn(zoom === "grid")} onClick={() => setZoom("grid")}>
            Grid
          </button>
          <button style={btn(zoom === "focus")} onClick={() => setZoom("focus")}>
            Focus
          </button>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
        <button style={btn(false)} onClick={exportCurrentSet} disabled={!!exporting}>
          Export current → ZIP ({locale} · {size.label})
        </button>
        <button style={btn(false)} onClick={exportAll} disabled={!!exporting}>
          Export all → ZIP ({LOCALES.length}×{IPHONE_SIZES.length}×{SLIDE_IDS.length})
        </button>
        {exporting && (
          <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.accent }}>
            ⏳ {exporting}
          </span>
        )}
        <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.fg2 }}>
          Export size: {size.w}×{size.h}
        </span>
      </div>

      {/* grid / focus */}
      {zoom === "grid" ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            marginTop: 28,
          }}
        >
          {SLIDE_IDS.map((id, i) => (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  width: PREVIEW_W,
                  height: H * scale,
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px -10px rgba(43,33,29,0.35)",
                  border: `1px solid ${T.line}`,
                }}
              >
                <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <SlideFrame id={id} locale={locale} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.fg2 }}>
                  {String(i + 1).padStart(2, "0")} · {id}
                </span>
                <button
                  style={{ ...btn(false), padding: "5px 10px", fontSize: 12 }}
                  onClick={() => exportOne(i)}
                  disabled={!!exporting}
                >
                  PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={btn(false)} onClick={() => setFocused((f) => (f - 1 + SLIDE_IDS.length) % SLIDE_IDS.length)}>
              ←
            </button>
            <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.fg1 }}>
              {String(focused + 1).padStart(2, "0")} · {SLIDE_IDS[focused]}
            </span>
            <button style={btn(false)} onClick={() => setFocused((f) => (f + 1) % SLIDE_IDS.length)}>
              →
            </button>
            <button style={{ ...btn(false), marginLeft: 10 }} onClick={() => exportOne(focused)} disabled={!!exporting}>
              Export PNG
            </button>
          </div>
          <div
            style={{
              width: PREVIEW_W,
              height: H * scale,
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 16px 50px -16px rgba(43,33,29,0.4)",
              border: `1px solid ${T.line}`,
            }}
          >
            <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <SlideFrame id={SLIDE_IDS[focused]} locale={locale} />
            </div>
          </div>
        </div>
      )}

      {/* offscreen full-size export copies */}
      <div style={{ position: "absolute", left: -9999, top: 0, opacity: 0, pointerEvents: "none" }}>
        {SLIDE_IDS.map((id, i) => (
          <div
            key={id}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: W, height: H, position: "absolute", left: -9999, top: 0 }}
          >
            <SlideFrame id={id} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}
