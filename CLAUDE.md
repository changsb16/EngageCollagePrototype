# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive React prototype for testing an Engage-style image collage component. The demo provides controls to test different image counts (1-7 images), aspect ratios (16:9, 4:5, etc.), photo sets, and container widths. Built with React 19, TypeScript, and Vite.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (default: http://localhost:5173)
npm run build        # Type check and build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## Architecture

### Component Hierarchy

- **App.tsx**: Demo harness with interactive controls for testing scenarios. Generates MediaItem arrays using Unsplash API with configurable aspect ratios and photo sets.
- **EngagePostCard.tsx**: Card wrapper component that mimics a social media post (header, body text, media, reactions, actions).
- **EngageImageCollage.tsx**: Core collage layout component with orientation-aware layouts.

### EngageImageCollage Layout Logic

The collage uses different layout strategies based on the hero image orientation (determined from width/height metadata):

**Portrait Hero (h > w)**:
- Hero image on left (66% width by default, configurable via `portraitHeroWidthPct`)
- Secondary images stacked vertically on right (2-3 images)
- Hero height couples to right column height (no fixed aspect ratio on hero)

**Landscape Hero (h ≤ w)**:
- Hero image on top (full width)
- Secondary images in horizontal grid below (up to 3 images)

**Missing Metadata**:
- Falls back to landscape layout with default aspect ratios (4/5 for portrait, 4/3 for landscape)

**Special Cases**:
- 1 image: Single tile using intrinsic aspect ratio
- 2 images: Side-by-side grid (1fr 1fr), each tile uses its own metadata
- 3-4+ images: Orientation-aware layouts above
- 5+ images: Shows first 4 with "+N more" overlay on the 4th image

### Key Files

- `src/components/EngageImageCollage.tsx:19-26`: `arFromItem` function extracts aspect ratio from MediaItem metadata
- `src/components/EngageImageCollage.tsx:28-36`: `isPortrait` function determines orientation
- `src/components/EngageImageCollage.tsx:164-248`: Portrait hero layout implementation
- `src/components/EngageImageCollage.tsx:251-288`: Landscape hero layout implementation
- `src/App.tsx:85-100`: `makeUnsplashItem` helper for generating demo images

## Deployment

The project deploys to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`). The build uses `base: "/EngageCollagePrototype/"` in `vite.config.ts` to match the GitHub Pages URL structure.

To deploy: push to `main` branch or trigger the workflow manually.

## MediaItem Type

```typescript
type MediaItem = {
  id: string;
  src: string;
  width?: number;   // Used for aspect ratio calculation
  height?: number;  // Used for aspect ratio calculation
  alt?: string;
}
```

The collage relies on `width` and `height` metadata to determine image orientation and calculate aspect ratios. When missing, it falls back to predefined aspect ratios.
