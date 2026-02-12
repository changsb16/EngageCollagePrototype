import { useMemo, useState } from "react";
import EngagePostCard from "./components/EngagePostCard";
import type { MediaItem } from "./components/EngageImageCollage";
import { useLocalImages } from "./utils/useLocalImages";

type RatioKey = "16:9" | "3:2" | "4:3" | "1:1" | "4:5" | "3:4" | "9:16";

const RATIO_PRESETS: Record<RatioKey, { w: number; h: number; label: string }> = {
  "16:9": { w: 1600, h: 900, label: "16:9 Landscape" },
  "3:2": { w: 1500, h: 1000, label: "3:2 Landscape" },
  "4:3": { w: 1600, h: 1200, label: "4:3 Landscape" },
  "1:1": { w: 1200, h: 1200, label: "1:1 Square" },
  "4:5": { w: 1200, h: 1500, label: "4:5 Portrait (Instagram)" },
  "3:4": { w: 1200, h: 1600, label: "3:4 Portrait" },
  "9:16": { w: 900, h: 1600, label: "9:16 Portrait" },
};

type ScenarioKey = "1" | "2" | "3" | "4" | "7" | "missing-metadata";

const SCENARIOS: Array<{ key: ScenarioKey; label: string; count: number }> = [
  { key: "1", label: "1 image", count: 1 },
  { key: "2", label: "2 images", count: 2 },
  { key: "3", label: "3 images", count: 3 },
  { key: "4", label: "4 images", count: 4 },
  { key: "7", label: "7 images (+N overlay)", count: 7 },
  { key: "missing-metadata", label: "Missing metadata (no width/height)", count: 5 },
];

type PhotoSetKey = "people" | "mixed" | "local";

const PHOTO_SETS: Record<
  PhotoSetKey,
  {
    label: string;
    hero: string[];
    secondary: string[];
  }
> = {
  people: {
    label: "People (faces)",
    // Unsplash "photo id" strings (no domain), stable enough for demo
    hero: [
      "photo-1544005313-94ddf0286df2",
      "photo-1500648767791-00dcc994a43e",
      "photo-1529626455594-4ff0802cfb7e",
      "photo-1544717305-2782549b5136",
      "photo-1494790108377-be9c29b29330",
    ],
    secondary: [
      "photo-1524504388940-b1c1722653e1",
      "photo-1524503033411-fb36a5560d3f",
      "photo-1529156069898-49953e39b3ac",
      "photo-1517841905240-472988babdf9",
      "photo-1548142813-c348350df52b",
      "photo-1534528741775-53994a69daeb",
      "photo-1524502397800-2eeaad7c3fe5",
      "photo-1524504388940-b1c1722653e1",
      "photo-1524503033411-fb36a5560d3f",
      "photo-1529156069898-49953e39b3ac",
    ],
  },
  mixed: {
    label: "Mixed (objects/scenes)",
    hero: [
      "photo-1500530855697-b586d89ba3ee",
      "photo-1520975682031-a93b3f0a2d1a",
      "photo-1501785888041-af3ef285b470",
      "photo-1523413651479-597eb2da0ad6",
      "photo-1482192596544-9eb780fc7f66",
    ],
    secondary: [
      "photo-1500530855697-b586d89ba3ee",
      "photo-1501785888041-af3ef285b470",
      "photo-1519681393784-d120267933ba",
      "photo-1523413651479-597eb2da0ad6",
      "photo-1482192596544-9eb780fc7f66",
      "photo-1511765224389-37f0e77cf0eb",
      "photo-1500530855697-b586d89ba3ee",
      "photo-1501785888041-af3ef285b470",
      "photo-1519681393784-d120267933ba",
      "photo-1523413651479-597eb2da0ad6",
    ],
  },
  local: {
    label: "Local photos (public/photos)",
    hero: [], // Not used - images loaded dynamically via useLocalImages
    secondary: [], // Not used - images loaded dynamically via useLocalImages
  },
};

function makeUnsplashItem(
  id: string,
  photoId: string,
  w: number,
  h: number,
  alt?: string
): MediaItem {
  // Note: Unsplash supports dynamic sizing. We request center crop via parameters.
  return {
    id,
    src: `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&crop=center&auto=format`,
    width: w,
    height: h,
    alt: alt ?? photoId,
  };
}

export default function App() {
  const [scenario, setScenario] = useState<ScenarioKey>("4");
  const [containerWidth, setContainerWidth] = useState<number>(720);

  // Ratio controls
  const [heroRatio, setHeroRatio] = useState<RatioKey>("4:5");
  const [secondaryRatio, setSecondaryRatio] = useState<RatioKey>("4:3");

  // Photo set controls
  const [photoSet, setPhotoSet] = useState<PhotoSetKey>("people");

  // Load local images dynamically
  const { items: localImageItems, isLoading: localImagesLoading, error: localImagesError } = useLocalImages();

  const heroPreset = RATIO_PRESETS[heroRatio];
  const secondaryPreset = RATIO_PRESETS[secondaryRatio];

  const scenarioCount = useMemo(() => {
    const found = SCENARIOS.find((s) => s.key === scenario);
    return found?.count ?? 4;
  }, [scenario]);

  const mediaItems: MediaItem[] = useMemo(() => {
    // Special handling for local images
    if (photoSet === "local") {
      if (localImageItems.length === 0) {
        return [];
      }
      // Return the requested number of images from the local set
      return localImageItems.slice(0, scenarioCount);
    }

    // Existing Unsplash logic
    const set = PHOTO_SETS[photoSet];

    const hero: MediaItem =
      scenario === "missing-metadata"
        ? {
            id: "1",
            // still use Unsplash, but omit width/height to simulate missing metadata
            src: `https://images.unsplash.com/${set.hero[0]}?w=1200&h=900&fit=crop&crop=center&auto=format`,
            alt: "no metadata hero",
          }
        : makeUnsplashItem(
            "1",
            set.hero[0],
            heroPreset.w,
            heroPreset.h,
            `Hero (${set.label})`
          );

    const secondaries: MediaItem[] = Array.from({ length: Math.max(0, scenarioCount - 1) }).map(
      (_, i) => {
        const id = String(i + 2);
        const photoId = set.secondary[i % set.secondary.length];

        if (scenario === "missing-metadata") {
          return {
            id,
            src: `https://images.unsplash.com/${photoId}?w=1200&h=900&fit=crop&crop=center&auto=format`,
            alt: "no metadata",
          };
        }

        return makeUnsplashItem(
          id,
          photoId,
          secondaryPreset.w,
          secondaryPreset.h,
          `Secondary (${set.label})`
        );
      }
    );

    return [hero, ...secondaries];
  }, [
    scenario,
    scenarioCount,
    heroPreset.w,
    heroPreset.h,
    secondaryPreset.w,
    secondaryPreset.h,
    heroRatio,
    secondaryRatio,
    photoSet,
    localImageItems,
  ]);

  const heroOrientation =
    scenario === "missing-metadata"
      ? "unknown (no metadata)"
      : heroPreset.h > heroPreset.w
      ? "portrait"
      : heroPreset.h < heroPreset.w
      ? "landscape"
      : "square";

  return (
    <div
      style={{
        padding: 24,
        background: "#f5f5f5",
        minHeight: "100vh",
        fontFamily:
          'Segoe UI, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
            padding: 12,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Scenario
            <select value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioKey)}>
              {SCENARIOS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Width
            <input
              type="range"
              min={320}
              max={900}
              step={10}
              value={containerWidth}
              onChange={(e) => setContainerWidth(Number(e.target.value))}
            />
            <span style={{ width: 52, textAlign: "right" }}>{containerWidth}px</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Hero ratio
            <select value={heroRatio} onChange={(e) => setHeroRatio(e.target.value as RatioKey)}>
              {Object.entries(RATIO_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Secondary ratio
            <select
              value={secondaryRatio}
              onChange={(e) => setSecondaryRatio(e.target.value as RatioKey)}
            >
              {Object.entries(RATIO_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Photo set
            <select value={photoSet} onChange={(e) => setPhotoSet(e.target.value as PhotoSetKey)}>
              {Object.entries(PHOTO_SETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Hero: {heroPreset.w}×{heroPreset.h} → {heroOrientation}
          </div>

          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Tip: try 375 / 414 / 768 widths
          </div>
        </div>

        {/* Local images status */}
        {photoSet === "local" && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: localImagesError ? "#fee" : localImagesLoading ? "#fef3c7" : "#e0f2fe",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {localImagesLoading && "⏳ Loading local images from public/photos..."}
            {localImagesError && `❌ Error: ${localImagesError}`}
            {!localImagesLoading && !localImagesError && (
              <>
                ✅ Loaded {localImageItems.length} local image{localImageItems.length !== 1 ? "s" : ""} from
                public/photos
                {localImageItems.length === 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                    Add images to <code>public/photos/</code> folder to use them
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Post container with adjustable width */}
        <div style={{ width: containerWidth, margin: "0 auto" }}>
          <EngagePostCard
            author={{
              name: "Pallavi Verma",
              avatarSrc: "https://i.pravatar.cc/80?img=12",
              subtitle: "Shared on Pallavi Verma's storyline",
            }}
            dateText="Oct 22, 2025"
            seenByCount={274}
            text={`Scenario: ${scenario} images\nPhoto set: ${PHOTO_SETS[photoSet].label}\nHero ratio: ${heroRatio} | Secondary ratio: ${secondaryRatio}\nPrototype: improved Engage collage (no gray filler, center crop, orientation-aware hero).`}
            mediaItems={mediaItems}
            reactionsSummary={{ topReactorName: "Venkat Ayyadevara", othersCount: 43 }}
          />
        </div>
      </div>
    </div>
  );
}
