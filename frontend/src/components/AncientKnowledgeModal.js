import CardTooltip from './CardTooltip';
import './AncientKnowledgeModal.css';

function AncientKnowledgeModal({ options, loading, onPick }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="ancient-knowledge-overlay" role="dialog" aria-modal="true" aria-labelledby="ak-title">
      <div className="ancient-knowledge-panel">
        <h2 id="ak-title">Древние Знания</h2>
        <p>Посмотрите верхние карты колоды и выберите одну в руку. Остальные уйдут вниз колоды.</p>
        <div className="ancient-knowledge-cards">
          {options.map((option) => (
            <CardTooltip key={option.instanceId} card={option.card} elevated>
              <button
                type="button"
                className="ancient-knowledge-card"
                disabled={loading}
                onClick={() => onPick(option.instanceId)}
              >
                <img src={option.card.spriteHand} alt={option.card.name} />
              </button>
            </CardTooltip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AncientKnowledgeModal;
