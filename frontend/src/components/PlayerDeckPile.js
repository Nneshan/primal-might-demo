import CardSprite from './CardSprite';
import { getFactionCardBackUrl } from '../factions';
import './PlayerDeckPile.css';

const MAX_VISIBLE_CARDS = 5;

function formatDeckCount(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) {
    return `${count} карт`;
  }
  if (n1 === 1) {
    return `${count} карта`;
  }
  if (n1 >= 2 && n1 <= 4) {
    return `${count} карты`;
  }
  return `${count} карт`;
}

function layerOpacity(layerIndex, layerCount) {
  if (layerCount <= 1) {
    return 0.97;
  }
  return 0.88 + (0.09 * layerIndex) / (layerCount - 1);
}

function PlayerDeckPile({ count, faction = 'MIGHT' }) {
  const backUrl = getFactionCardBackUrl(faction);
  const deckCount = Math.max(0, count ?? 0);
  const visibleCards = Math.min(MAX_VISIBLE_CARDS, deckCount);
  const layerCount = Math.max(0, visibleCards - 1);
  const label = formatDeckCount(deckCount);

  return (
    <div
      className="player-deck-pile"
      data-player-deck-pile="true"
      aria-label={`Колода игрока, ${label}`}
    >
      <div
        className="player-deck-pile__stack"
        style={{ '--deck-stack-depth': layerCount }}
      >
        {Array.from({ length: layerCount }, (_, layer) => (
          <CardSprite
            key={layer}
            className="player-deck-pile__layer"
            style={{
              '--deck-layer-offset': layer,
              zIndex: layer + 1,
              opacity: layerOpacity(layer, layerCount),
            }}
            src={backUrl}
            alt=""
          />
        ))}
        {visibleCards > 0 && (
          <CardSprite
            className="player-deck-pile__back player-deck-pile__back--top"
            src={backUrl}
            alt=""
          />
        )}
      </div>
      <span className="player-deck-pile__count" role="tooltip">
        {label}
      </span>
    </div>
  );
}

export default PlayerDeckPile;
