// A peaked/service cap standing in for the General (a military rank, not a
// chess piece, so it gets a custom icon rather than a chess glyph). The cap
// body uses `currentColor` so it automatically follows the same ink-color
// rule as every other mark on a tile: dark normally, red when promoted. The
// star and button are cut out to the tile's own wood color instead, giving a
// punched-through look regardless of ink color.
export function GeneralIcon() {
  return (
    <svg viewBox="0 0 64 64" width="30" height="30" className="general-icon">
      <path className="cap-body" d="M10 40 Q32 51 54 40 L54 45 Q32 56 10 45 Z" />
      <rect className="cap-body" x="12" y="31" width="40" height="10" rx="2.5" />
      <path className="cap-body" d="M13 32 Q13 7 32 7 Q51 7 51 32 Z" />
      <circle className="cap-cutout" cx="32" cy="8.5" r="2.3" />
      <polygon
        className="cap-cutout"
        points="32,29.5 33.5,33.2 37.5,33.5 34.4,36 35.5,39.9 32,37.7 28.5,39.9 29.6,36 26.5,33.5 30.5,33.2"
      />
    </svg>
  );
}
