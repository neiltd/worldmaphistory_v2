/**
 * Shared display primitives for CountryPanel and its tab components.
 * Import T, flag, and Sec from here — do not redefine them per-tab.
 *
 * T      — Bloomberg/Palantir dark-theme CSS class tokens
 * flag() — ISO2 → emoji flag character
 * Sec    — Section wrapper with uppercase header, used across 5 tabs
 */

import type { ReactNode } from 'react'

// ── Design tokens ─────────────────────────────────────────────────────────────
export const T = {
  card:    'bg-[#0D1829] border border-[#1E2D4A] rounded-lg',
  section: 'text-[10px] uppercase tracking-widest font-semibold text-slate-500',
  label:   'text-[11px] text-slate-500',
  body:    'text-[12px] text-slate-300 leading-[1.65] break-words',
  value:   'text-[13px] font-semibold text-white',
  mono:    'font-mono text-blue-400',
}

// ── ISO 3166-1 alpha-2 → emoji flag ──────────────────────────────────────────
export function flag(iso2: string): string {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('')
}

// ── Section wrapper — consistent spacing + uppercase header ───────────────────
export function Sec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className={`${T.section} mb-2.5`}>{label}</p>
      {children}
    </div>
  )
}
