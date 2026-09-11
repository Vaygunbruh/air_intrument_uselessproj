export type Point3D = {
  x: number;
  y: number;
  z?: number;
};

// Map storing smooth positions for tracked hands keyed by hand index / handedness
const prevLandmarksMap: Map<string, Point3D[]> = new Map();
const velocityMap: Map<string, Point3D[]> = new Map();

/**
 * Adaptive LERP smoothing:
 * - Fast movements (large delta) → high alpha → snappy response
 * - Slow micro-jitter (tiny delta) → low alpha → stable skeleton
 */
export function smoothLandmarks(
  rawLandmarks: Point3D[],
  handId: string,
  baseAlpha: number = 0.65
): Point3D[] {
  const prev = prevLandmarksMap.get(handId);

  if (!prev || prev.length !== rawLandmarks.length) {
    const initial = rawLandmarks.map((pt) => ({ ...pt }));
    prevLandmarksMap.set(handId, initial);
    velocityMap.set(handId, rawLandmarks.map(() => ({ x: 0, y: 0, z: 0 })));
    return initial;
  }

  const prevVelocities = velocityMap.get(handId) || rawLandmarks.map(() => ({ x: 0, y: 0, z: 0 }));

  const smoothed = rawLandmarks.map((curr, idx) => {
    const p = prev[idx];
    const v = prevVelocities[idx];

    const dx = curr.x - p.x;
    const dy = curr.y - p.y;
    const distSq = dx * dx + dy * dy;

    // Adaptive alpha based on movement speed:
    // distSq > 0.002  → very fast movement → alpha 0.95 (near-instant follow)
    // distSq > 0.0005 → medium movement   → alpha 0.80 (fast smooth follow)
    // distSq < 0.0001 → micro jitter      → alpha 0.35 (heavy damping)
    let alpha: number;
    if (distSq > 0.002) {
      alpha = 0.95;
    } else if (distSq > 0.0005) {
      alpha = 0.80;
    } else if (distSq > 0.00005) {
      alpha = baseAlpha;
    } else {
      alpha = 0.35; // Damp micro-jitter hard
    }

    const newX = p.x + dx * alpha;
    const newY = p.y + dy * alpha;

    // Track velocity for future prediction if needed
    prevVelocities[idx] = {
      x: dx * alpha,
      y: dy * alpha,
    };

    return {
      x: newX,
      y: newY,
      z:
        curr.z !== undefined && p.z !== undefined
          ? p.z + (curr.z - p.z) * alpha
          : curr.z,
    };
  });

  prevLandmarksMap.set(handId, smoothed);
  velocityMap.set(handId, prevVelocities);
  return smoothed;
}

export function clearLandmarkCache() {
  prevLandmarksMap.clear();
  velocityMap.clear();
}
