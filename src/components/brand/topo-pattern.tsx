/**
 * Textura de curvas de nivel (sello visual de la marca).
 * Se calcula en el servidor de forma determinista: cero JavaScript en el cliente.
 * El mismo algoritmo está en la app (app/src/components/topo-pattern.tsx).
 */

/** [centro x, centro y, anillos, separación, semilla] en un lienzo de 1200 × 600. */
type Peak = readonly [cx: number, cy: number, rings: number, step: number, seed: number];

const VARIANTS = {
  hero: [
    [260, 180, 9, 26, 0.4],
    [940, 420, 11, 24, 1.7],
    [620, 40, 6, 30, 2.9],
  ],
  footer: [
    [1020, 120, 10, 26, 1.1],
    [180, 560, 8, 28, 2.4],
  ],
  band: [
    [180, 300, 8, 30, 0.7],
    [1040, 260, 9, 28, 2.1],
  ],
} satisfies Record<string, readonly Peak[]>;

export type TopoVariant = keyof typeof VARIANTS;

function contour([cx, cy, , step, seed]: Peak, ring: number): string {
  const points = 96;
  const base = step * (ring + 1);
  const coords: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const wobble =
      1 +
      0.14 * Math.sin(3 * t + seed + ring * 0.35) +
      0.07 * Math.sin(5 * t + seed * 2) +
      0.04 * Math.cos(7 * t + ring * 0.2);
    const r = base * wobble;
    coords.push(`${(cx + r * Math.cos(t) * 1.35).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${coords.join(' L')}Z`;
}

const PATHS = Object.fromEntries(
  Object.entries(VARIANTS).map(([name, peaks]) => [
    name,
    peaks.flatMap((peak) => Array.from({ length: peak[2] }, (_, ring) => contour(peak, ring))),
  ]),
) as Record<TopoVariant, string[]>;

export function TopoPattern({ className, variant = 'hero' }: { className?: string; variant?: TopoVariant }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
        {PATHS[variant].map((d, index) => (
          <path key={index} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
