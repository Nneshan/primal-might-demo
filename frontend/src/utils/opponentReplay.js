import { TEAR_DEATH_DELAY_MS } from '../cardMotion';
import { buildAttackMotionPayload } from './attackMotion';
import {
  buildCombatTearRectOverrides,
  findRemovedBoardCreatures,
} from './gameStateDiff';

export function cloneGameState(game) {
  return JSON.parse(JSON.stringify(game));
}

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Даём React и layout отрисовать новую карту в ряду до старта boardEnter. */
export function waitForLayoutPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

export function hasOpponentReplay(game) {
  return (game?.opponentReplay?.length ?? 0) > 0;
}

export function applyPlayOutcome(display, finalState, action) {
  const creature = finalState.opponentBoard?.find((c) => c.instanceId === action.instanceId);
  const alreadyOnBoard = (display.opponentBoard ?? []).some(
    (c) => c.instanceId === action.instanceId
  );

  return {
    ...display,
    opponentBoard: creature && !alreadyOnBoard
      ? [...(display.opponentBoard ?? []), creature]
      : display.opponentBoard,
    opponentMana: finalState.opponentMana,
    opponentHandSize: finalState.opponentHandSize,
    opponentDeckSize: finalState.opponentDeckSize,
  };
}

export function applyAttackOutcome(display, action) {
  let opponentBoard = [...(display.opponentBoard ?? [])];
  let playerBoard = [...(display.playerBoard ?? [])];
  let playerHealth = display.playerHealth;

  if (action.attackerRemoved) {
    opponentBoard = opponentBoard.filter((c) => c.instanceId !== action.attackerInstanceId);
  } else if (action.attackerHealthAfter != null) {
    opponentBoard = opponentBoard.map((c) =>
      c.instanceId === action.attackerInstanceId
        ? { ...c, currentHealth: action.attackerHealthAfter }
        : c
    );
  }

  if (action.type === 'ATTACK_FACE') {
    if (action.playerHealthAfter != null) {
      playerHealth = action.playerHealthAfter;
    }
    return { ...display, opponentBoard, playerBoard, playerHealth };
  }

  if (action.targetRemoved) {
    playerBoard = playerBoard.filter((c) => c.instanceId !== action.targetInstanceId);
  } else if (action.targetHealthAfter != null) {
    playerBoard = playerBoard.map((c) =>
      c.instanceId === action.targetInstanceId
        ? { ...c, currentHealth: action.targetHealthAfter }
        : c
    );
  }

  return { ...display, opponentBoard, playerBoard, playerHealth };
}

export function buildOpponentAttackMotion(action, fromRect, toRect, sprite, card) {
  const isFace = action.type === 'ATTACK_FACE';
  return buildAttackMotionPayload({
    attackerInstanceId: action.attackerInstanceId,
    targetType: isFace ? 'OPPONENT' : 'CREATURE',
    targetInstanceId: isFace ? null : action.targetInstanceId,
    attackerBoard: 'opponent',
    targetBoard: 'player',
    sprite,
    card,
    fromRect,
    toRect,
  });
}

export function runTearsBetweenStates(before, after, motion, tearApi) {
  const removed = findRemovedBoardCreatures(before, after);
  if (removed.length === 0) {
    return Promise.resolve();
  }

  const overrides = motion ? buildCombatTearRectOverrides(before, after, motion) : {};
  return tearApi.playTears(removed, overrides);
}

export function createTearPlayer(tearApi) {
  return {
    playTears(removed, overrides) {
      return new Promise((resolve) => {
        const tears = removed
          .map((entry) => {
            const rect =
              overrides[entry.instanceId] ??
              tearApi.captureCreatureRect(entry.instanceId, entry.board);
            if (!rect) {
              return null;
            }
            return {
              tearId: `${entry.instanceId}-${Date.now()}-${Math.random()}`,
              instanceId: entry.instanceId,
              sprite: entry.sprite,
              rect,
            };
          })
          .filter(Boolean);

        if (tears.length === 0) {
          resolve();
          return;
        }

        const hideIds = tears.map((tear) => tear.instanceId);
        const tearIds = new Set(tears.map((tear) => tear.tearId));

        tearApi.setHiddenTearIds((current) => [...new Set([...current, ...hideIds])]);
        tearApi.setTearingCards((current) => [...current, ...tears]);

        setTimeout(() => {
          tearApi.setTearingCards((current) =>
            current.filter((tear) => !tearIds.has(tear.tearId))
          );
          tearApi.setHiddenTearIds((current) =>
            current.filter((id) => !hideIds.includes(id))
          );
          resolve();
        }, TEAR_DEATH_DELAY_MS);
      });
    },
  };
}
