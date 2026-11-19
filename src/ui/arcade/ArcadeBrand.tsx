import navLogo from "./earcade-nav.svg";

export function ArcadeBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <img className="brand-icon" src={navLogo} width="97" height="69" alt="" />
      <div>
        <div className="brand-name">EARCADE<span>.</span></div>
        <div className="brand-sub">{subtitle}</div>
      </div>
    </div>
  );
}
