import { getHandFanStyle } from './handFanLayout';
import { HAND_CARDS_PER_ROW } from './handLayout';

const EMPTY_HINTS = { newInHand: [] };

const HAND_CARD_WIDTH_FALLBACK = 192;
const HAND_CARD_HEIGHT_FALLBACK = 268;

export function emptyMotionHints() {
  return { newInHand: [] };
}

export function diffPlayerCardMotion(prev, next) {
  if (!prev || !next || prev.gameId !== next.gameId) {
    return emptyMotionHints();
  }

  const prevHandIds = new Set((prev.playerHand ?? []).map((c) => c.instanceId));
  const nextHandIds = new Set((next.playerHand ?? []).map((c) => c.instanceId));
  const newInHand = [...nextHandIds].filter((id) => !prevHandIds.has(id));

  return { newInHand };
}

export function findPlayedToBoard(prev, next) {
  if (!prev || !next) {
    return [];
  }

  const prevHandIds = new Set((prev.playerHand ?? []).map((c) => c.instanceId));
  const prevBoardIds = new Set((prev.playerBoard ?? []).map((c) => c.instanceId));

  return (next.playerBoard ?? [])
    .filter((c) => prevHandIds.has(c.instanceId) && !prevBoardIds.has(c.instanceId))
    .map((c) => c.instanceId);
}

export function findRemovedBoardCreatures(prev, next) {
  if (!prev || !next) {
    return [];
  }

  const removed = [];

  for (const creature of prev.playerBoard ?? []) {
    const stillAlive = (next.playerBoard ?? []).some(
      (c) => c.instanceId === creature.instanceId
    );
    if (!stillAlive) {
      removed.push({
        instanceId: creature.instanceId,
        sprite: creature.card?.spriteBoard,
        board: 'player',
      });
    }
  }

  for (const creature of prev.opponentBoard ?? []) {
    const stillAlive = (next.opponentBoard ?? []).some(
      (c) => c.instanceId === creature.instanceId
    );
    if (!stillAlive) {
      removed.push({
        instanceId: creature.instanceId,
        sprite: creature.card?.spriteBoard,
        board: 'opponent',
      });
    }
  }

  return removed.filter((entry) => entry.sprite);
}

export function captureCreatureRect(instanceId, board) {
  const attr =
    board === 'player' ? 'data-player-creature' : 'data-opponent-creature';
  const el = document.querySelector(`[${attr}="${instanceId}"]`);
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function captureFaceTargetRect() {
  const el = document.querySelector('[data-attack-face-target]');
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Позиция карты в точке столкновения (для разрыва / отката как в MTG). */
export function computeCombatImpactRect(fromRect, toRect, progress = 0.9) {
  const startCx = fromRect.left + fromRect.width / 2;
  const startCy = fromRect.top + fromRect.height / 2;
  const endCx = toRect.left + toRect.width / 2;
  const endCy = toRect.top + toRect.height / 2;
  const cx = startCx + (endCx - startCx) * progress;
  const cy = startCy + (endCy - startCy) * progress;
  return {
    left: cx - fromRect.width / 2,
    top: cy - fromRect.height / 2,
    width: fromRect.width,
    height: fromRect.height,
  };
}

export function computeCombatDelta(fromRect, toRect, progress = 0.9) {
  const impact = computeCombatImpactRect(fromRect, toRect, progress);
  return {
    x: impact.left - fromRect.left,
    y: impact.top - fromRect.top,
  };
}

/** Rect для разрыва, если карта скрыта порталом атаки или уже снята с DOM. */
export function buildCombatTearRectOverrides(prev, next, motion) {
  if (!prev || !next || !motion?.fromRect || !motion?.toRect) {
    return {};
  }

  const overrides = {};
  const impactRect = computeCombatImpactRect(motion.fromRect, motion.toRect);
  const removed = findRemovedBoardCreatures(prev, next);
  const attackerBoard = motion.attackerBoard ?? 'player';
  const targetBoard = motion.targetBoard ?? 'opponent';

  const attackerTearRect =
    motion.attackStyle === 'ranged' ? motion.fromRect : impactRect;

  for (const entry of removed) {
    if (entry.instanceId === motion.attackerInstanceId && entry.board === attackerBoard) {
      overrides[entry.instanceId] = attackerTearRect;
      continue;
    }
    if (
      motion.targetType === 'CREATURE' &&
      entry.instanceId === motion.targetInstanceId &&
      entry.board === targetBoard
    ) {
      overrides[entry.instanceId] = motion.toRect;
    }
  }

  return overrides;
}

export function buildAttackTearRectOverrides(prev, next, motion) {
  return buildCombatTearRectOverrides(prev, next, {
    ...motion,
    attackerBoard: 'player',
    targetBoard: 'opponent',
  });
}

export function capturePlayerDeckRect() {
  const el =
    document.querySelector('[data-player-deck-pile] .player-deck-pile__back--top') ||
    document.querySelector('[data-player-deck-pile]');
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function captureHandRowsRect() {
  const rowsRoot =
    document.querySelector('[data-hand-fan-rows]') ||
    document.querySelector('.hand-fan-rows');
  if (!rowsRoot) {
    return null;
  }
  return rectToPlain(rowsRoot.getBoundingClientRect());
}

function rectToPlain(rect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

const HAND_FAN_MIN_HEIGHT = 150;
const HAND_CARD_CHROME = 12;

function sampleHandCardRect() {
  const handCard = document.querySelector('.hand-card');
  if (handCard) {
    return rectToPlain(handCard.getBoundingClientRect());
  }

  const sample =
    document.querySelector('.ancient-knowledge-card img') ||
    document.querySelector('.hand-card img');
  const sampleRect = sample?.getBoundingClientRect();
  const width = sampleRect?.width ?? HAND_CARD_WIDTH_FALLBACK;
  const height = sampleRect?.height ?? HAND_CARD_HEIGHT_FALLBACK;

  return {
    left: 0,
    top: 0,
    width: width + HAND_CARD_CHROME,
    height: height + HAND_CARD_CHROME,
  };
}

/** Позиция новой карты в руке после выбора (добавляется в конец). */
export function estimateNextHandCardRect(handCount) {
  const rowsRoot =
    document.querySelector('[data-hand-fan-rows]') ||
    document.querySelector('.hand-fan-rows');
  if (!rowsRoot) {
    return null;
  }

  const cardRect = sampleHandCardRect();
  const totalAfter = handCount + 1;
  const rowIndex = Math.floor(handCount / HAND_CARDS_PER_ROW);
  const rows = rowsRoot.querySelectorAll('.hand-fan');
  let rowEl = rows[rowIndex];
  if (!rowEl) {
    rowEl = rows[rows.length - 1] ?? rowsRoot.querySelector('.hand-fan');
  }

  const indexInRow = handCount % HAND_CARDS_PER_ROW;
  const cardsInRow = Math.min(
    HAND_CARDS_PER_ROW,
    totalAfter - rowIndex * HAND_CARDS_PER_ROW
  );
  const fanStyle = getHandFanStyle(indexInRow, cardsInRow);
  const offsetPx =
    parseFloat(String(fanStyle['--fan-offset'] ?? '0').replace('px', '')) || 0;
  const liftPx =
    parseFloat(String(fanStyle['--fan-lift'] ?? '0').replace('px', '')) || 0;

  const rootRect = rowsRoot.getBoundingClientRect();
  const rowRect = rowEl
    ? rowEl.getBoundingClientRect()
    : {
        left: rootRect.left,
        top: rootRect.bottom - HAND_FAN_MIN_HEIGHT,
        width: rootRect.width,
        bottom: rootRect.bottom,
        height: HAND_FAN_MIN_HEIGHT,
      };

  const centerX = rowRect.left + rowRect.width / 2 + offsetPx;
  const bottomY = (rowRect.bottom ?? rowRect.top + rowRect.height) - liftPx;

  return {
    left: centerX - cardRect.width / 2,
    top: bottomY - cardRect.height,
    width: cardRect.width,
    height: cardRect.height,
  };
}

export function capturePlayerFaceRect() {
  const el = document.querySelector('[data-player-face-target]');
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export { EMPTY_HINTS };
