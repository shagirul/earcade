export function ArcadeBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <img className="brand-icon" src="/icons/earcade.svg" width="36" height="36" alt="" />
      <div>
        <div className="brand-name">EARCADE<span>.</span></div>
        <div className="brand-sub">{subtitle}</div>
      </div>
    </div>
  );
}
