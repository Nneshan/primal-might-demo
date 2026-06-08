import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import CardTooltip from './CardTooltip';
import CardSprite from './CardSprite';
import { capturePlayerDeckRect } from '../utils/gameStateDiff';
import { ANCIENT_KNOWLEDGE_REVEAL_DURATION_S } from '../cardMotion';
import './AncientKnowledgeModal.css';
import './DivinationModal.css';

const CARD_BACK_URL = '/cards/MightBack.png';
const CARD_WIDTH = 192;
const CARD_HEIGHT = 268;
const CAPTION_GAP = 44;
const RETURN_FLIP_MS = 360;
const RETURN_FLY_MS = 520;

const revealTween = {
  type: 'tween',
  duration: ANCIENT_KNOWLEDGE_REVEAL_DURATION_S,
  ease: [0.22, 0.61, 0.36, 1],
};

function centerInRect(outer, inner) {
  return {
    left: outer.left + (outer.width - inner.width) / 2,
    top: outer.top + (outer.height - inner.height) / 2,
    width: inner.width,
    height: inner.height,
  };
}

function computeLayout() {
  const cardTop = window.innerHeight * 0.44 - CARD_HEIGHT / 2;
  const cardLeft = window.innerWidth / 2 - CARD_WIDTH / 2;
  return {
    rect: { left: cardLeft, top: cardTop, width: CARD_WIDTH, height: CARD_HEIGHT },
    captionTop: cardTop - CAPTION_GAP,
    actionsTop: cardTop + CARD_HEIGHT + 20,
  };
}

function resolveDeckTargetRect() {
  const deckRect = capturePlayerDeckRect();
  if (deckRect) {
    return centerInRect(deckRect, { width: CARD_WIDTH, height: CARD_HEIGHT });
  }
  return {
    left: window.innerWidth * 0.78 - CARD_WIDTH / 2,
    top: window.innerHeight * 0.82 - CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

function DivinationReturnCard({ rect, toRect, faceSprite, onComplete }) {
  const [stage, setStage] = useState('hold');

  useEffect(() => {
    const flipTimer = setTimeout(() => setStage('flip'), 0);
    const flyTimer = setTimeout(() => setStage('fly'), RETURN_FLIP_MS);
    const doneTimer = setTimeout(onComplete, RETURN_FLIP_MS + RETURN_FLY_MS + 40);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(flyTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const atDeck = stage === 'fly';

  return (
    <motion.div
      className="ak-return-card"
      initial={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        opacity: 1,
      }}
      animate={{
        left: atDeck ? toRect.left : rect.left,
        top: atDeck ? toRect.top : rect.top,
        width: atDeck ? toRect.width : rect.width,
        height: atDeck ? toRect.height : rect.height,
        opacity: atDeck ? 0.75 : 1,
      }}
      transition={{
        type: 'tween',
        duration: atDeck ? RETURN_FLY_MS / 1000 : 0,
        ease: [0.32, 0.72, 0.36, 1],
      }}
    >
      <motion.div
        className="ak-return-card__flip"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: stage === 'hold' ? 0 : 180 }}
        transition={{
          type: 'tween',
          duration: RETURN_FLIP_MS / 1000,
          ease: 'easeInOut',
        }}
      >
        <CardSprite className="ak-return-card__face" src={faceSprite} alt="" />
        <CardSprite className="ak-return-card__back" src={CARD_BACK_URL} alt="" />
      </motion.div>
    </motion.div>
  );
}

function DivinationModal({ option, divinationIndex, divinationTotal, loading, onResolve }) {
  const resolveTimerRef = useRef(null);
  const phaseRef = useRef('reveal');
  const [phase, setPhase] = useState('reveal');
  const [layout, setLayout] = useState(() => computeLayout());
  const [deckFromRect, setDeckFromRect] = useState(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [resolveMotion, setResolveMotion] = useState(null);

  phaseRef.current = phase;

  const clearResolveTimer = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearResolveTimer(), [clearResolveTimer]);

  useLayoutEffect(() => {
    setLayout(computeLayout());
    setHasLanded(false);
    setPhase('reveal');

    const deckRect = capturePlayerDeckRect();
    if (!deckRect) {
      setPhase('choose');
      setHasLanded(true);
      return undefined;
    }

    setDeckFromRect(centerInRect(deckRect, { width: CARD_WIDTH, height: CARD_HEIGHT }));
    return undefined;
  }, [option?.instanceId, divinationIndex]);

  const progressLabel =
    divinationTotal > 1 ? ` (${divinationIndex} из ${divinationTotal})` : '';

  const startResolve = useCallback(
    (putOnBottom) => {
      if (phaseRef.current !== 'choose' || loading || !option) {
        return;
      }

      const deckTarget = resolveDeckTargetRect();
      clearResolveTimer();

      flushSync(() => {
        setPhase('resolve');
        setResolveMotion({
          rect: layout.rect,
          sprite: option.card.spriteHand,
          deckTarget,
          putOnBottom,
        });
      });

      resolveTimerRef.current = setTimeout(() => {
        setResolveMotion(null);
        onResolve(putOnBottom);
        resolveTimerRef.current = null;
      }, RETURN_FLIP_MS + RETURN_FLY_MS + 80);
    },
    [clearResolveTimer, layout.rect, loading, onResolve, option]
  );

  if (!option) {
    return null;
  }

  const showText = phase === 'choose' || phase === 'resolve';
  const revealReady = deckFromRect !== null;
  const showScryCard = (phase === 'reveal' && revealReady) || phase === 'choose';
  const revealOffset = deckFromRect
    ? {
        x: deckFromRect.left - layout.rect.left,
        y: deckFromRect.top - layout.rect.top,
      }
    : { x: 0, y: 0 };

  return createPortal(
    <>
      <div
        className={[
          'ancient-knowledge-overlay',
          phase === 'resolve' ? 'ancient-knowledge-overlay--resolving' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="divination-title"
      >
        {showText && (
          <div
            className="ancient-knowledge-caption"
            style={{ top: layout.captionTop }}
          >
            <h2 id="divination-title">Прорицание{progressLabel}</h2>
            <p>
              {phase === 'resolve'
                ? 'Карта возвращается в колоду…'
                : 'Верхняя карта колоды. Оставьте её сверху или отправьте вниз.'}
            </p>
          </div>
        )}
      </div>

      {showScryCard && !resolveMotion && (
        <div
          className={[
            'ak-scry-anchor',
            phase === 'choose' ? 'ak-scry-anchor--choose' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            left: layout.rect.left,
            top: layout.rect.top,
            width: layout.rect.width,
            height: layout.rect.height,
          }}
        >
          <motion.div
            className="ak-scry-anchor__motion"
            initial={{ x: revealOffset.x, y: revealOffset.y, opacity: 0.92 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={hasLanded ? { duration: 0 } : revealTween}
            onAnimationComplete={() => {
              if (!hasLanded && revealReady) {
                setHasLanded(true);
                setPhase('choose');
              }
            }}
          >
            <CardTooltip card={option.card} elevated={phase === 'choose'}>
              <div className="ancient-knowledge-card ancient-knowledge-card--static">
                <span className="ancient-knowledge-card__frame">
                  <CardSprite
                    className="ak-scry-anchor__sprite"
                    src={option.card.spriteHand}
                    alt={option.card.name}
                  />
                </span>
              </div>
            </CardTooltip>
          </motion.div>
        </div>
      )}

      {phase === 'choose' && (
        <div className="divination-actions" style={{ top: layout.actionsTop }}>
          <button
            type="button"
            className="divination-actions__btn"
            disabled={loading}
            onClick={() => startResolve(false)}
          >
            Оставить сверху
          </button>
          <button
            type="button"
            className="divination-actions__btn divination-actions__btn--primary"
            disabled={loading}
            onClick={() => startResolve(true)}
          >
            В низ колоды
          </button>
        </div>
      )}

      {resolveMotion && (
        <DivinationReturnCard
          rect={resolveMotion.rect}
          toRect={resolveMotion.deckTarget}
          faceSprite={resolveMotion.sprite}
          onComplete={() => {}}
        />
      )}
    </>,
    document.body
  );
}

export default DivinationModal;
