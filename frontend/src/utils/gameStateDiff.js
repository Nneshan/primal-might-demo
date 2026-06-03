const EMPTY_HINTS = { newInHand: [] };

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

  for (const entry of removed) {
    if (entry.instanceId === motion.attackerInstanceId && entry.board === attackerBoard) {
      overrides[entry.instanceId] = impactRect;
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
