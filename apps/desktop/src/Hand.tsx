import type { Color, PieceType } from '@chegi/engine';

interface Props {
  color: Color;
  hand: Partial<Record<PieceType, number>>;
  selectedType: PieceType | null;
  active: boolean;
  onSelect: (type: PieceType) => void;
}

export default function Hand({ color, hand, selectedType, active, onSelect }: Props) {
  const entries = Object.entries(hand) as [PieceType, number][];

  return (
    <div className={`hand hand-${color}`}>
      <div className="hand-label">{color === 'w' ? 'White' : 'Black'} captured</div>
      <div className="hand-pieces">
        {entries.length === 0 && <span className="hand-empty">—</span>}
        {entries
          .filter(([, count]) => count > 0)
          .map(([type, count]) => (
            <button
              key={type}
              className={`hand-piece ${selectedType === type ? 'selected' : ''}`}
              disabled={!active}
              onClick={() => onSelect(type)}
            >
              {type}
              <span className="hand-count">{count}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
