import { getFactionStyle } from '../factions';
import './FactionBadge.css';

function FactionBadge({ card, compact }) {
  if (!card?.faction && !card?.factionLabel) {
    return null;
  }

  const style = getFactionStyle(card.faction);
  const label = card.factionLabel ?? style.label;

  return (
    <span
      className={['faction-badge', compact ? 'faction-badge--compact' : '']
        .filter(Boolean)
        .join(' ')}
      style={{
        color: style.accent,
        borderColor: style.border,
        backgroundColor: style.background,
      }}
      title={card.factionNameEn ?? style.nameEn}
    >
      {label}
    </span>
  );
}

export default FactionBadge;
