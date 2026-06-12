"use client";

import React from "react";

export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#15181c] px-6 py-12 text-center">
      {/* faixa de cores Bahia no topo */}
      <div className="absolute inset-x-0 top-0 flex h-1.5">
        {["#8BC53F", "#3FA9C9", "#E8862B", "#E6308A", "#E12B2B", "#F2C230"].map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      {/* brilho decorativo */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle,#3FA9C9,transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-white p-4 shadow-2xl sm:h-32 sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/logosufotur.png"
            alt="SUFOTUR — Superintendência de Fomento ao Turismo"
            className="h-full w-full object-contain"
          />
        </div>

        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/70">
          Dashboard de Mídia
        </span>

        <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          São João 2026
        </h1>
        <p className="mt-3 max-w-md text-base text-white/65 sm:text-lg">
          Performance das campanhas de mídia da <strong className="text-white">SUFOTUR</strong> —
          Superintendência de Fomento ao Turismo do Governo da Bahia.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
          <span className="rounded-md bg-white/5 px-3 py-1">Meta</span>
          <span className="rounded-md bg-white/5 px-3 py-1">YouTube</span>
          <span className="rounded-md bg-white/5 px-3 py-1">Kwai</span>
        </div>

        <button
          onClick={onEnter}
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-[#3FA9C9] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#3596b3] active:scale-[0.98]"
        >
          Acessar Dashboard
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="transition-transform group-hover:translate-x-1"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <p className="absolute bottom-5 text-[11px] text-white/30">
        Governo da Bahia · Do lado da gente
      </p>
    </div>
  );
}
