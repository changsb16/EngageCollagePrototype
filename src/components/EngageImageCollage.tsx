import React from "react";

export type MediaItem = {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
};

type EngageImageCollageProps = {
  items: MediaItem[];
  maxVisible?: number; // default 4 (Engage-like +N overlay)
  gapPx?: number; // default 6–8
  radiusPx?: number; // default 10–12
  portraitHeroWidthPct?: number; // default 66 (you liked ~66–70)
};

function arFromItem(item: MediaItem, fallback: string): string {
  const w = item.width;
  const h = item.height;
  if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
    return `${w} / ${h}`;
  }
  return fallback;
}

function isPortrait(item: MediaItem): boolean {
  const w = item.width;
  const h = item.height;
  if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
    return h > w;
  }
  // default to landscape if unknown
  return false;
}

function Tile({
  item,
  aspectRatio,
  overlayText,
}: {
  item: MediaItem;
  aspectRatio: string; // e.g. "4 / 5"
  overlayText?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <img
        src={item.src}
        alt={item.alt || ""}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          objectPosition: "center",
        }}
        draggable={false}
      />

      {overlayText ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          {overlayText}
        </div>
      ) : null}
    </div>
  );
}

export default function EngageImageCollage({
  items,
  maxVisible = 4,
  gapPx = 6,
  radiusPx = 12,
  portraitHeroWidthPct = 66,
}: EngageImageCollageProps) {
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) return null;

  // Show up to 4 (Engage-like). Overlay +N on last visible.
  const visible = safeItems.slice(0, maxVisible);
  const remaining = safeItems.length - visible.length;

  const hero = visible[0];
  const heroIsPortrait = isPortrait(hero);

  const secondary = visible.slice(1);
  const secondaryCount = secondary.length;

  const overlayOnIndex = remaining > 0 ? visible.length - 1 : -1;
  const overlayText = remaining > 0 ? `+${remaining} more` : undefined;

  // Fallback ARs (used only when metadata missing)
  const HERO_PORTRAIT_AR = "4 / 5";
  const SECONDARY_PORTRAIT_AR = "3 / 4";
  const LANDSCAPE_AR = "4 / 3";

  const wrapperStyle: React.CSSProperties = {
    borderRadius: radiusPx,
    overflow: "hidden",
    background: "#fff",
    width: "100%",
  };

  // ====== 1 IMAGE ======
  if (visible.length === 1) {
    const fallback = heroIsPortrait ? HERO_PORTRAIT_AR : LANDSCAPE_AR;
    return (
      <div style={wrapperStyle}>
        <Tile item={hero} aspectRatio={arFromItem(hero, fallback)} />
      </div>
    );
  }

  // ====== 2 IMAGES ======
  if (visible.length === 2) {
    // For 2-up, let each tile use its own metadata ratio; fallback uses hero orientation
    const fallback = heroIsPortrait ? SECONDARY_PORTRAIT_AR : LANDSCAPE_AR;

    return (
      <div style={wrapperStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: gapPx,
          }}
        >
          {visible.map((it, i) => (
            <Tile
              key={it.id}
              item={it}
              aspectRatio={arFromItem(it, fallback)}
              overlayText={i === overlayOnIndex ? overlayText : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  // ====== PORTRAIT HERO: hero left, images stacked right ======
  if (heroIsPortrait) {
    const rightStack = secondary.slice(0, Math.min(3, secondaryCount));

    return (
      <div style={wrapperStyle}>
        <div
          style={{
            display: "flex",
            gap: gapPx,
            alignItems: "stretch",
          }}
        >
          {/* Left hero: height-coupled to right column; no aspect-ratio here */}
          <div style={{ flex: "0 0 auto", width: `${portraitHeroWidthPct}%` }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <img
                src={hero.src}
                alt={hero.alt || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
                draggable={false}
              />
              {0 === overlayOnIndex && overlayText ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  {overlayText}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right stack */}
          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: gapPx,
            }}
          >
            {rightStack.map((it, idx) => {
              const visibleIndex = idx + 1; // hero is index 0
              const showOverlay = visibleIndex === overlayOnIndex;

              return (
                <Tile
                  key={it.id}
                  item={it}
                  // This makes your Secondary Ratio dropdown actually change tile shapes
                  aspectRatio={arFromItem(it, SECONDARY_PORTRAIT_AR)}
                  overlayText={showOverlay ? overlayText : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ====== LANDSCAPE HERO: hero top, 3 tiles below ======
  const bottomRow = secondary.slice(0, Math.min(3, secondaryCount));
  const cols = bottomRow.length;

  return (
    <div style={wrapperStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: gapPx }}>
        {/* Hero */}
        <Tile
          item={hero}
          aspectRatio={arFromItem(hero, LANDSCAPE_AR)}
          overlayText={0 === overlayOnIndex ? overlayText : undefined}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: gapPx,
          }}
        >
          {bottomRow.map((it, idx) => {
            const visibleIndex = idx + 1;
            const showOverlay = visibleIndex === overlayOnIndex;
            return (
              <Tile
                key={it.id}
                item={it}
                aspectRatio={arFromItem(it, LANDSCAPE_AR)}
                overlayText={showOverlay ? overlayText : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
