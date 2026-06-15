import React from "react";

// Paleta São João / Bahia
const PALETTE = ["#8BC53F", "#3FA9C9", "#E8862B", "#E6308A", "#E12B2B", "#F2C230"];

// Formas das bandeirinhas do varal (cicladas)
const SHAPES = ["tri", "swallow", "check", "tri", "swallow"] as const;
type Shape = (typeof SHAPES)[number];

/**
 * Faixa temática de São João no topo de todas as páginas:
 * fina faixa de cores da Bahia + varal de bandeirinhas.
 * Cabeçalho coeso, fixo e sem interação (pointer-events-none).
 * O tema também é tecido nas barras de acento dos cards (classe sj-flagbar).
 */
export function SaoJoaoDecor() {
  return (
    <div className="sj-decor" aria-hidden="true">
      <div className="sj-glow" />
      <div className="sj-bahia-stripe" />
      <div className="sj-bunting">
        {Array.from({ length: 54 }).map((_, i) => {
          const shape = SHAPES[i % SHAPES.length] as Shape;
          const color = PALETTE[i % PALETTE.length];
          const delay = `${(i % 8) * 0.18}s`;
          return (
            <span
              key={i}
              className={`sj-flag sj-flag--${shape}`}
              style={shape === "check" ? { color, animationDelay: delay } : { background: color, animationDelay: delay }}
            />
          );
        })}
      </div>
    </div>
  );
}
