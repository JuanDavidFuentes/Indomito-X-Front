/**
 * Textura de curvas de nivel (sello visual de la marca).
 * Se calcula en el servidor de forma determinista: cero JavaScript en el cliente.
 */

interface Peak {
  cx: number;
  cy: number;
  rings: number;
  step: number;
  seed: number;
}

const PEAKS: Peak[] = [
  { cx: 260, cy: 180, rings: 9, step: 26, seed: 0.4 },
  { cx: 940, cy: 420, rings: 11, step: 24, seed: 1.7 },
  { cx: 620, cy: 40, rings: 6, step: 30, seed: 2.9 },
];

function contour(peak: Peak, ring: number): string {
  const points = 96;
  const base = peak.step * (ring + 1);
  const coords: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const wobble =
      1 +
      0.14 * Math.sin(3 * t + peak.seed + ring * 0.35) +
      0.07 * Math.sin(5 * t + peak.seed * 2) +
      0.04 * Math.cos(7 * t + ring * 0.2);
    const r = base * wobble;
    const x = peak.cx + r * Math.cos(t) * 1.35;
    const y = peak.cy + r * Math.sin(t);
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${coords.join(' L')}Z`;
}

const PATHS = PEAKS.flatMap((peak) =>
  Array.from({ length: peak.rings }, (_, ring) => contour(peak, ring)),
);

export function TopoPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        {PATHS.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
    </svg>
  );
}
