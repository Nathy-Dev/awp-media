import { Link } from "react-router-dom";
import type { Sermon } from "../types/sermon";
import { resolveImagePath } from "../lib/sermons";
import { buildArchiveImageUrl, parseArchiveUrl } from "../lib/download";
import type { CoverSource } from "../lib/image";

/**
 * Grid and detail-page cover size hints.
 *
 * The grid is 3 columns above 768px and 2 below, maxing out around 900px wide,
 * so a 960-wide variant covers the largest case.
 */
const GRID_SIZES = "(max-width: 768px) 45vw, (max-width: 900px) 30vw, 300px";
const DETAIL_SIZES = "(max-width: 768px) 90vw, 420px";

interface SermonCardProps {
  sermon: Sermon;
  /** Optimised variants from the build-time manifest, when available. */
  cover?: CoverSource | undefined;
  /** Detail page: single large image, loaded eagerly. */
  variant?: "grid" | "detail";
}

export function SermonCard({ sermon, cover, variant = "grid" }: SermonCardProps) {
  const isDetail = variant === "detail";

  // Prefer the optimised build output; fall back to the original, routed
  // through the Worker when it lives on archive.org (the raw /download/ URL
  // 500s for this item).
  const fallbackSrc = (() => {
    const path = resolveImagePath(sermon.image);
    return parseArchiveUrl(path) === null ? path : buildArchiveImageUrl(path);
  })();

  const src = cover?.src ?? fallbackSrc;
  const srcSet = cover?.srcSet;

  const image = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={isDetail ? DETAIL_SIZES : GRID_SIZES}
      alt={sermon.title}
      width={cover?.width}
      height={cover?.height}
      loading={isDetail ? "eager" : "lazy"}
      fetchPriority={isDetail ? "high" : "auto"}
      decoding="async"
    />
  );

  if (isDetail) {
    return <div className="sermon-card">{image}</div>;
  }

  return (
    <div className="sermon-card">
      <Link to={`/sermons/${encodeURIComponent(sermon.id)}`}>
        {image}
        <h3 className="sermon-title">{sermon.title}</h3>
      </Link>
    </div>
  );
}
