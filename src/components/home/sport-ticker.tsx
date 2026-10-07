'use client';

import { Pause, Play, X } from '@phosphor-icons/react';
import { useState } from 'react';

/**
 * Cinta de deportes cruzada en diagonal (2°, la misma pendiente del corte del hero).
 * Se mueve despacio; se detiene al pasar el cursor o con el botón (WCAG 2.2.2) y queda quieta
 * si el sistema pide reducir el movimiento.
 */
export function SportTicker({
  items,
  pauseLabel,
  playLabel,
}: {
  items: string[];
  pauseLabel: string;
  playLabel: string;
}) {
  const [paused, setPaused] = useState(false);

  const track = (copy: number) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy > 0 || undefined}>
      {items.map((item) => (
        <li key={`${copy}-${item}`} className="flex items-center">
          <span className="px-5 font-display text-2xl font-extrabold whitespace-nowrap uppercase italic sm:text-3xl">
            {item}
          </span>
          <X size={22} weight="bold" className="text-night-foreground" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative z-10 -mt-[calc(1.75vw+3rem)] overflow-hidden py-5">
      <div className="group relative -mx-[2%] w-[104%] -rotate-2 bg-brand text-night shadow-[0_6px_0_var(--night)]">
        <div
          className={`flex w-max animate-marquee py-3 group-hover:[animation-play-state:paused] ${
            paused ? '[animation-play-state:paused]' : ''
          }`}
        >
          {track(0)}
          {track(1)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? playLabel : pauseLabel}
        title={paused ? playLabel : pauseLabel}
        className="absolute top-1/2 right-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-night text-night-foreground shadow-lg transition-transform duration-150 active:scale-90 motion-reduce:hidden sm:right-6"
      >
        {paused ? <Play size={18} weight="fill" aria-hidden="true" /> : <Pause size={18} weight="fill" aria-hidden="true" />}
      </button>
    </div>
  );
}
