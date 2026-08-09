"use client";

import { useState } from "react";

export function SiteLogo({ src, compact = false }: { src?: string | null; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoSrc = src || "/LOGO.png";
  if (!imageFailed) {
    return <img className={compact ? "h-10 w-10 rounded-full border border-rose/30 bg-[#fff8f2] object-cover p-1" : "h-12 w-12 rounded-full border border-rose/30 bg-[#fff8f2] object-cover p-1"} src={logoSrc} alt="Soft Shine Cosmetic" onError={() => setImageFailed(true)} />;
  }

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap" aria-label="Soft Shine Cosmetic logo placeholder">
      <span className={compact ? "grid size-9 place-items-center rounded-md border border-dashed border-rose/60 text-[.48rem] font-bold uppercase tracking-[.08em] text-rose" : "grid size-10 place-items-center rounded-md border border-dashed border-rose/60 text-[.5rem] font-bold uppercase tracking-[.08em] text-rose"}>Logo</span>
      <span className={compact ? "font-sans text-sm font-semibold leading-none" : "font-sans text-[.95rem] font-semibold leading-none"}>
        <span>Soft Shine</span>
        {!compact && <small className="mt-1 block text-[.5rem] font-bold uppercase tracking-[.18em] text-muted">Cosmetic · upload logo in settings</small>}
      </span>
    </span>
  );
}
