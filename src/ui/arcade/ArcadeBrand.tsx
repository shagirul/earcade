export function ArcadeBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <div className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 13v-2m4 6V7m4 13V4m4 13V7m4 6v-2" />
        </svg>
      </div>
      <div>
        <div className="brand-name">PITCH<span>.</span></div>
        <div className="brand-sub">{subtitle}</div>
      </div>
    </div>
  );
}
