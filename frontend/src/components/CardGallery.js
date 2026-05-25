import { useEffect, useState } from 'react';
import * as cardApi from '../api/cardApi';
import CardTooltip from './CardTooltip';
import { GAME_TITLE } from '../constants';
import './CardGallery.css';

function CardGallery({ onBack }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    cardApi
      .getAllCards()
      .then((data) => {
        if (!cancelled) {
          setCards(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card-gallery">
      <header className="card-gallery-header">
        <button type="button" className="card-gallery-back" onClick={onBack}>
          ← Меню
        </button>
        <div>
          <h1 className="card-gallery-title">Галерея карт</h1>
          <p className="card-gallery-game">{GAME_TITLE}</p>
        </div>
      </header>

      {loading && <p className="card-gallery-status">Загрузка каталога…</p>}
      {error && <p className="card-gallery-error">{error}</p>}

      {!loading && !error && (
        <div className="card-gallery-grid">
          {cards.map((card) => (
            <CardTooltip key={card.id} card={card} elevated>
              <div className="card-gallery-item">
                <img src={card.spriteHand} alt={card.name} draggable={false} />
              </div>
            </CardTooltip>
          ))}
        </div>
      )}
    </div>
  );
}

export default CardGallery;
