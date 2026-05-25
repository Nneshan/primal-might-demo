import { formatBoardHeader, formatStats } from './cardText';
import './CardBrief.css';

function CardBrief({
  card,
  currentHealth,
  effectiveAttack,
  effectiveDefense,
  effectiveInitiative,
  extra,
}) {
  if (!card) {
    return null;
  }

  return (
    <div className="card-brief">
      <div className="card-brief-line">{formatBoardHeader(card)}</div>
      <div className="card-brief-line">
        {formatStats(card, currentHealth, effectiveAttack, effectiveDefense, effectiveInitiative)}
      </div>
      {extra && <div className="card-brief-line card-brief-extra">{extra}</div>}
    </div>
  );
}

export default CardBrief;
