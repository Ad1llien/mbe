export const Logo = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex flex-col items-center gap-1.5 select-none">
    <svg width={compact ? 22 : 30} height={compact ? 22 : 30} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M4 26h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="6" y="16" width="4" height="8" rx="1" fill="currentColor" />
      <rect x="14" y="11" width="4" height="13" rx="1" fill="currentColor" />
      <rect x="22" y="6" width="4" height="18" rx="1" fill="currentColor" />
      <path d="M7 14 L16 8 L24 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
    {!compact && (
      <span className="text-[15px] font-semibold tracking-[0.28em] text-foreground">MBE</span>
    )}
  </div>
);
