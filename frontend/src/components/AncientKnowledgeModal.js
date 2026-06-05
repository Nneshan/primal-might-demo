import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import CardTooltip from './CardTooltip';
import CardSprite from './CardSprite';
import {
  captureHandRowsRect,
  capturePlayerDeckRect,
  estimateNextHandCardRect,
} from '../utils/gameStateDiff';
import {
  ANCIENT_KNOWLEDGE_RESOLVE_STAGGER_S,
  ANCIENT_KNOWLEDGE_REVEAL_STAGGER_S,
} from '../cardMotion';
import './AncientKnowledgeModal.css';

const CARD_BACK_URL = '/cards/MightBack.png';
const CARD_WIDTH = 192;
const CARD_HEIGHT = 268;
const CARD_GAP = 24;
const CAPTION_GAP = 44;
const RETURN_FLIP_MS = 360;
const RETURN_FLY_MS = 520;
const PICK_TWEEN_S = 0.52;
const PICK_TWEEN_MS = Math.round(PICK_TWEEN_S * 1000);
const REVEAL_TWEEN_S = 0.52;

function revealTransition(delay) {
  return {
    type: 'tween',
    duration: REVEAL_TWEEN_S,
    ease: [0.22, 0.61, 0.36, 1],
    delay,
  };
}

const pickTween = {
  type: 'tween',
  duration: PICK_TWEEN_S,
  ease: [0.32, 0.72, 0.36, 1],
};

function computeLayout(count) {
  const totalWidth = count * CARD_WIDTH + Math.max(0, count - 1) * CARD_GAP;
  const startX = (window.innerWidth - totalWidth) / 2;
  const cardTop = window.innerHeight * 0.44 - CARD_HEIGHT / 2;

  const rects = Array.from({ length: count }, (_, index) => ({
    left: startX + index * (CARD_WIDTH + CARD_GAP),
    top: cardTop,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  }));

  return {
    rects,
    captionTop: cardTop - CAPTION_GAP,
  };
}

function centerInRect(outer, inner) {
  return {
    left: outer.left + (outer.width - inner.width) / 2,
    top: outer.top + (outer.height - inner.height) / 2,
    width: inner.width,
    height: inner.height,
  };
}

function resolveHandTargetRect(handCount) {
  return (
    estimateNextHandCardRect(handCount) ??
    (() => {
      const handRoot = captureHandRowsRect();
      if (!handRoot) {
        return null;
      }
      return {
        left: handRoot.left + handRoot.width / 2 - CARD_WIDTH / 2,
        top: handRoot.top + handRoot.height - CARD_HEIGHT - 8,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      };
    })()
  );
}

function resolveDeckTargetRect() {
  const deckRect = capturePlayerDeckRect();
  if (deckRect) {
    return centerInRect(deckRect, { width: CARD_WIDTH, height: CARD_HEIGHT });
  }

  const handRoot = captureHandRowsRect();
  if (handRoot) {
    return {
      left: handRoot.left + handRoot.width + 20,
      top: handRoot.top + handRoot.height - CARD_HEIGHT,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  }

  return {
    left: window.innerWidth * 0.78 - CARD_WIDTH / 2,
    top: window.innerHeight * 0.82 - CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

function AncientKnowledgeModal({ options, handCount, loading, onResolve }) {
  const resolveTimerRef = useRef(null);
  const phaseRef = useRef('reveal');
  const [phase, setPhase] = useState('reveal');
  const [layout, setLayout] = useState(() => computeLayout(options.length));
  const [deckFromRect, setDeckFromRect] = useState(null);
  const [landedIds, setLandedIds] = useState(() => new Set());
  const [resolveMotion, setResolveMotion] = useState(null);

  phaseRef.current = phase;

  const clearResolveTimer = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearResolveTimer(), [clearResolveTimer]);

  const markLanded = useCallback((instanceId) => {
    setLandedIds((prev) => {
      if (prev.has(instanceId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(instanceId);
      if (next.size >= options.length) {
        setPhase('choose');
      }
      return next;
    });
  }, [options.length]);

  useLayoutEffect(() => {
    const nextLayout = computeLayout(options.length);
    setLayout(nextLayout);
    setLandedIds(new Set());
    setPhase('reveal');

    const deckRect = capturePlayerDeckRect();
    if (!deckRect) {
      setPhase('choose');
      setLandedIds(new Set(options.map((o) => o.instanceId)));
      return undefined;
    }

    setDeckFromRect(
      centerInRect(deckRect, { width: CARD_WIDTH, height: CARD_HEIGHT })
    );

    return undefined;
  }, [options]);

  const startResolve = useCallback(
    (pickedInstanceId) => {
      if (phaseRef.current !== 'choose' || loading) {
        return;
      }

      const handRect = resolveHandTargetRect(handCount);
      const deckTarget = resolveDeckTargetRect();
      if (!handRect && !deckTarget) {
        onResolve(pickedInstanceId);
        return;
      }

      const pickedIndex = options.findIndex((o) => o.instanceId === pickedInstanceId);
      if (pickedIndex < 0) {
        return;
      }

      const pickedOption = options[pickedIndex];
      const returnOptions = options.filter((o) => o.instanceId !== pickedInstanceId);
      const pickedRect = layout.rects[pickedIndex];

      clearResolveTimer();

      flushSync(() => {
        setPhase('resolve');
        setResolveMotion({
          pickedInstanceId,
          picked: handRect
            ? {
                rect: pickedRect,
                sprite: pickedOption.card.spriteHand,
                toRect: handRect,
              }
            : null,
          returns: returnOptions.map((option) => {
            const index = options.findIndex((o) => o.instanceId === option.instanceId);
            return {
              key: option.instanceId,
              rect: layout.rects[index],
              sprite: option.card.spriteHand,
            };
          }),
          deckTarget,
        });
      });

      const returnCount = returnOptions.length;
      const resolveMs =
        Math.max(
          PICK_TWEEN_MS,
          RETURN_FLIP_MS +
            RETURN_FLY_MS +
            Math.max(0, returnCount - 1) * ANCIENT_KNOWLEDGE_RESOLVE_STAGGER_S * 1000
        ) + 100;

      resolveTimerRef.current = setTimeout(() => {
        setResolveMotion(null);
        onResolve(pickedInstanceId);
        resolveTimerRef.current = null;
      }, resolveMs);
    },
    [clearResolveTimer, handCount, layout.rects, loading, onResolve, options]
  );

  if (!options?.length) {
    return null;
  }

  const showText = phase === 'choose' || phase === 'resolve';
  const revealReady = deckFromRect !== null;
  const showScryCards =
    (phase === 'reveal' && revealReady) || phase === 'choose';
  const resolveHiddenIds = new Set(
    resolveMotion
      ? [
          resolveMotion.pickedInstanceId,
          ...(resolveMotion.returns ?? []).map((r) => r.key),
        ].filter(Boolean)
      : []
  );

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
        aria-labelledby="ak-title"
      >
        {showText && (
          <div
            className="ancient-knowledge-caption"
            style={{ top: layout.captionTop }}
          >
            <h2 id="ak-title">Древние Знания</h2>
            <p>
              {phase === 'resolve'
                ? 'Карта уходит в руку, остальные — в колоду…'
                : 'Выберите одну карту в руку. Остальные уйдут вниз колоды.'}
            </p>
          </div>
        )}
      </div>

      {showScryCards &&
        options.map((option, index) => {
          const rect = layout.rects[index];
          if (!rect) {
            return null;
          }

          const hasLanded = landedIds.has(option.instanceId);
          const isChoose = phase === 'choose';
          const isHiddenDuringResolve =
            phase === 'resolve' && resolveHiddenIds.has(option.instanceId);
          const revealOffset = deckFromRect
            ? {
                x: deckFromRect.left - rect.left,
                y: deckFromRect.top - rect.top,
              }
            : { x: 0, y: 0 };

          if (isHiddenDuringResolve) {
            return null;
          }

          return (
            <div
              key={option.instanceId}
              className={[
                'ak-scry-anchor',
                isChoose ? 'ak-scry-anchor--choose' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            >
              <motion.div
                className="ak-scry-anchor__motion"
                initial={{ x: revealOffset.x, y: revealOffset.y, opacity: 0.92 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={
                  hasLanded
                    ? { duration: 0 }
                    : revealTransition(index * ANCIENT_KNOWLEDGE_REVEAL_STAGGER_S)
                }
                onAnimationComplete={() => {
                  if (!hasLanded && revealReady) {
                    markLanded(option.instanceId);
                  }
                }}
              >
                <CardTooltip card={option.card} elevated={isChoose}>
                  <button
                    type="button"
                    className="ancient-knowledge-card"
                    disabled={!isChoose || loading}
                    tabIndex={isChoose ? 0 : -1}
                    onClick={() => startResolve(option.instanceId)}
                  >
                    <span className="ancient-knowledge-card__frame">
                      <CardSprite
                        className="ak-scry-anchor__sprite"
                        src={option.card.spriteHand}
                        alt={option.card.name}
                      />
                    </span>
                  </button>
                </CardTooltip>
              </motion.div>
            </div>
          );
        })}

      {resolveMotion?.picked && (
        <motion.div
          className="ak-pick-card"
          initial={{
            left: resolveMotion.picked.rect.left,
            top: resolveMotion.picked.rect.top,
            width: resolveMotion.picked.rect.width,
            height: resolveMotion.picked.rect.height,
          }}
          animate={{
            left: resolveMotion.picked.toRect.left,
            top: resolveMotion.picked.toRect.top,
            width: resolveMotion.picked.toRect.width,
            height: resolveMotion.picked.toRect.height,
          }}
          transition={pickTween}
        >
          <CardSprite
            className="ak-pick-card__sprite"
            src={resolveMotion.picked.sprite}
            alt=""
          />
        </motion.div>
      )}

      {resolveMotion?.returns?.map((item, index) => (
        <AncientKnowledgeReturnCard
          key={item.key}
          rect={item.rect}
          toRect={resolveMotion.deckTarget}
          faceSprite={item.sprite}
          staggerIndex={index}
        />
      ))}
    </>,
    document.body
  );
}

function AncientKnowledgeReturnCard({ rect, toRect, faceSprite, staggerIndex }) {
  const [stage, setStage] = useState('hold');
  const delay = staggerIndex * ANCIENT_KNOWLEDGE_RESOLVE_STAGGER_S;

  useEffect(() => {
    const flipTimer = setTimeout(() => setStage('flip'), delay * 1000);
    const flyTimer = setTimeout(
      () => setStage('fly'),
      delay * 1000 + RETURN_FLIP_MS
    );
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(flyTimer);
    };
  }, [delay]);

  if (!toRect) {
    return null;
  }

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
      style={{ zIndex: 26000 + staggerIndex }}
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

export default AncientKnowledgeModal;
