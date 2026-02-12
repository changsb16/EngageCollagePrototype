import { useEffect, useState } from "react";
import type { MediaItem } from "../components/EngageImageCollage";

/**
 * Loads an image and returns its natural dimensions
 */
function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Hook that automatically discovers and loads all images from the public/photos folder
 * Returns MediaItem array with proper dimensions for each image
 */
export function useLocalImages() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        setIsLoading(true);
        setError(null);

        // Use Vite's glob import to discover all images in public/photos
        // This works at build time and includes jpg, jpeg, png, webp, gif
        const imageModules = import.meta.glob('/public/photos/*.{jpg,jpeg,png,webp,gif}', {
          eager: true,
          as: 'url',
        });

        const imagePaths = Object.keys(imageModules);

        if (imagePaths.length === 0) {
          setError("No images found in public/photos folder");
          setIsLoading(false);
          return;
        }

        // Convert paths to public URLs
        // /public/photos/image.jpg -> /photos/image.jpg (dev) or /EngageCollagePrototype/photos/image.jpg (prod)
        const baseUrl = import.meta.env.BASE_URL || '/';
        const publicPaths = imagePaths.map(path => {
          const filename = path.split('/').pop();
          return `${baseUrl}photos/${filename}`;
        });

        // Load each image to get dimensions
        const loadPromises = publicPaths.map(async (src, index) => {
          try {
            const dimensions = await loadImageDimensions(src);
            return {
              id: `local-${index + 1}`,
              src,
              width: dimensions.width,
              height: dimensions.height,
              alt: `Local image ${index + 1}`,
            };
          } catch (err) {
            console.error(`Failed to load image: ${src}`, err);
            return null;
          }
        });

        const loadedItems = await Promise.all(loadPromises);
        const validItems = loadedItems.filter((item): item is MediaItem => item !== null);

        if (validItems.length === 0) {
          setError("Failed to load any images");
        } else {
          setItems(validItems);
        }
      } catch (err) {
        console.error("Error loading local images:", err);
        setError(err instanceof Error ? err.message : "Unknown error loading images");
      } finally {
        setIsLoading(false);
      }
    }

    loadImages();
  }, []);

  return { items, isLoading, error };
}
