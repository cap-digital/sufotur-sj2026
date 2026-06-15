"use client";

import React, { useState } from "react";

// Credenciais de acesso ao dashboard
const AUTH_EMAIL = "saojoaosufotur@capdigital.company";
const AUTH_PASSWORD = "Sufotursaojoao26";

const BAHIA = ["#8BC53F", "#3FA9C9", "#E8862B", "#E6308A", "#E12B2B", "#F2C230"];

export function Landing({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() === AUTH_EMAIL && password === AUTH_PASSWORD) {
      setError(null);
      onLogin();
    } else {
      setError("E-mail ou senha incorretos.");
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#fff7e8] via-[#fdeef3] to-[#e8f5fb]">
      {/* brilhos festivos coloridos */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle,#F2C230,transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -right-20 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle,#3FA9C9,transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle,#E6308A,transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* ---------- ESQUERDA: identidade / informações ---------- */}
        <div className="flex flex-col">
          <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/logosufotur.png"
              alt="SUFOTUR — Superintendência de Fomento ao Turismo"
              className="h-full w-full object-contain"
            />
          </div>

          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#3FA9C9]/30 bg-[#3FA9C9]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2a7d96]">
            Dashboard de Mídia
          </span>

          <h1 className="text-4xl font-extrabold leading-[1.05] text-[var(--ink)] sm:text-5xl lg:text-6xl">
            São João
            <br />
            <span className="text-[#3FA9C9]">2026</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Performance das campanhas de mídia da{" "}
            <strong className="text-[var(--ink)]">SUFOTUR</strong> — Superintendência de Fomento ao
            Turismo do Governo da Bahia.
          </p>

          {/* faixa de cores da Bahia */}
          <div className="mt-7 flex h-1.5 w-44 overflow-hidden rounded-full">
            {BAHIA.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Meta", "Kwai", "Criativos", "Metas"].map((t) => (
              <span
                key={t}
                className="rounded-lg border border-black/5 bg-white/60 px-3 py-1 text-xs font-semibold text-[var(--muted)] backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- DIREITA: login (sem caixa, direto no fundo) ---------- */}
        <div className="w-full max-w-sm lg:justify-self-end">
          <h2 className="text-2xl font-bold text-[var(--ink)]">Acesse o painel</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Entre com suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--ink)] shadow-sm outline-none backdrop-blur-sm transition focus:border-[#3FA9C9] focus:bg-white focus:ring-2 focus:ring-[#3FA9C9]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3 pr-11 text-sm text-[var(--ink)] shadow-sm outline-none backdrop-blur-sm transition focus:border-[#3FA9C9] focus:bg-white focus:ring-2 focus:ring-[#3FA9C9]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3FA9C9] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#3596b3] active:scale-[0.98]"
            >
              Acessar Dashboard
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <p className="mt-8 text-[11px] text-[var(--muted)]">
            Governo da Bahia · Do lado da gente
          </p>
        </div>
      </div>
    </div>
  );
}
