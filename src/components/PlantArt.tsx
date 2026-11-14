/**
 * Illustration used in the Photo Gallery when a photo has no uploaded image.
 * Draws a hydroponic net cup with a plant sized by its age in days.
 */
export function PlantArt({ day, hue = 'green', label }: { day: number; hue?: 'green' | 'red' | 'herb'; label: string }) {
  const g = Math.min(1, day / 45);
  const leaves = Math.max(2, Math.round(2 + g * 8));
  const len = 14 + g * 46;
  const fill = hue === 'red' ? 'var(--leaf-red)' : hue === 'herb' ? 'var(--leaf-herb)' : 'var(--leaf)';
  const items = Array.from({ length: leaves }, (_, i) => {
    const a = -90 + (i - (leaves - 1) / 2) * (150 / Math.max(1, leaves - 1));
    const l = len * (0.75 + 0.25 * Math.cos((i / leaves) * Math.PI));
    return { a, l };
  });
  return (
    <svg viewBox="0 0 160 120" className="plant-art" role="img" aria-label={label}>
      <rect width="160" height="120" fill="var(--photo-bg)" />
      <rect y="88" width="160" height="32" fill="var(--photo-ground)" />
      {items.map((it, i) => (
        <ellipse key={i} cx="80" cy={88 - it.l / 2} rx={4 + g * 9} ry={it.l / 2} fill={fill} opacity={0.75 + (i % 2) * 0.25}
          transform={`rotate(${it.a + 90} 80 88)`} />
      ))}
      <path d="M66 86h28l-4 18H70z" fill="var(--photo-cup)" />
      <path d="M66 86h28" stroke="var(--photo-ground)" strokeWidth="2" />
    </svg>
  );
}
