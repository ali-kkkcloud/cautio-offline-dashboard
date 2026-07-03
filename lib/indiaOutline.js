// lib/indiaOutline.js
// A hand-simplified outline of mainland India (lat, lng pairs). Stylised —
// good enough for a dark "ops dashboard" background silhouette.

export const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 37.0,
  minLng: 68.0,
  maxLng: 97.5,
};

export const INDIA_OUTLINE = [
  [34.8, 74.0], [35.5, 76.0], [34.6, 78.0], [33.0, 79.0], [31.5, 79.2],
  [30.3, 81.0], [29.0, 80.2], [28.2, 81.0], [27.5, 84.5], [27.0, 88.0],
  [26.5, 89.0], [26.8, 90.0], [26.0, 91.5], [25.2, 92.0], [24.0, 91.8],
  [23.0, 91.2], [22.0, 92.3], [21.5, 92.8], [20.8, 92.5], [19.8, 92.9],
  [16.5, 82.3], [15.9, 80.4], [13.9, 80.3], [12.0, 79.9], [10.3, 79.9],
  [9.0, 78.9], [8.1, 77.5], [8.9, 77.0], [9.5, 76.3], [10.8, 75.8],
  [12.9, 74.8], [14.7, 74.1], [15.9, 73.8], [17.0, 73.3], [18.9, 72.8],
  [20.6, 71.0], [21.6, 69.6], [22.5, 69.0], [23.6, 68.2], [24.3, 68.8],
  [24.4, 71.0], [25.7, 70.2], [26.9, 70.2], [28.0, 70.2], [29.0, 71.5],
  [29.5, 73.0], [30.5, 73.5], [32.0, 74.5], [33.5, 74.0], [34.8, 74.0],
];

export function makeProjector({ width, height, padding = 20 }) {
  const { minLat, maxLat, minLng, maxLng } = INDIA_BOUNDS;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const lngRange = maxLng - minLng;
  const latRange = maxLat - minLat;

  return function project(lat, lng) {
    const x = padding + ((lng - minLng) / lngRange) * w;
    const y = padding + (1 - (lat - minLat) / latRange) * h;
    return [x, y];
  };
}

export function outlineToPath(project) {
  return (
    INDIA_OUTLINE.map(([lat, lng], i) => {
      const [x, y] = project(lat, lng);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + " Z"
  );
}
