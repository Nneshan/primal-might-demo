import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import '../App.css';
import './CardMotion.css';
import * as gameApi from '../api/gameApi';
import { GAME_TITLE } from '../constants';
import CardTooltip from './CardTooltip';
import CardBrief from './CardBrief';
import AttackLineOverlay from './AttackLineOverlay';
import AncientKnowledgeModal from './AncientKnowledgeModal';
import PlayerDeckPile from './PlayerDeckPile';
import PlayCardHandVanish from './PlayCardHandVanish';
import CardTearBurst from './CardTearBurst';
import CardAttackLunge from './CardAttackLunge';
import CardSprite from './CardSprite';
import { ensureSpritesReady, preloadCatalogSprites } from '../utils/cardSpritePreload';
import { getHandFanStyle } from '../utils/handFanLayout';
import { splitHandIntoRows, HAND_CARDS_PER_ROW } from '../utils/handLayout';
import {
  boardCreatureTransition,
  boardEnterMotion,
  BOARD_ENTER_DURATION,
  combatReturnTransition,
  drawFromDeckMotion,
  TEAR_DEATH_DELAY_MS,
} from '../cardMotion';
import {
  buildAttackTearRectOverrides,
  captureCreatureRect,
  captureFaceTargetRect,
  capturePlayerFaceRect,
  computeCombatDelta,
  diffPlayerCardMotion,
  emptyMotionHints,
  findPlayedToBoard,
  findRemovedBoardCreatures,
} from '../utils/gameStateDiff';
import {
  applyAttackOutcome,
  applyPlayOutcome,
  buildOpponentAttackMotion,
  cloneGameState,
  createTearPlayer,
  delay,
  hasOpponentReplay,
  runTearsBetweenStates,
  waitForLayoutPaint,
} from '../utils/opponentReplay';

function GameScreen({ onBack }) {
  const [game, setGame] = useState(null);
  const [spritesLoading, setSpritesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attackAiming, setAttackAiming] = useState(null);
  const [motionHints, setMotionHints] = useState(emptyMotionHints);
  const [playVanish, setPlayVanish] = useState(null);
  const [boardEnterIds, setBoardEnterIds] = useState([]);
  const [tearingCards, setTearingCards] = useState([]);
  const [hiddenTearIds, setHiddenTearIds] = useState([]);
  const [attackMotion, setAttackMotion] = useState(null);
  const [hiddenAttackIds, setHiddenAttackIds] = useState([]);
  const [hitTargetIds, setHitTargetIds] = useState([]);
  const [faceHitPulse, setFaceHitPulse] = useState(false);
  const [combatReturn, setCombatReturn] = useState(null);
  const [blockRecoil, setBlockRecoil] = useState(null);
  const [playerHitPulse, setPlayerHitPulse] = useState(false);
  const [opponentReplayBusy, setOpponentReplayBusy] = useState(false);
  const gameRef = useRef(game);
  const attackMotionRef = useRef(null);
  const lastCombatMotionRef = useRef(null);
  const replayStepResolveRef = useRef(null);
  const commitGameRef = useRef(null);
  const prevGameRef = useRef(null);
  const motionClearTimerRef = useRef(null);
  const boardEnterClearTimerRef = useRef(null);
  const pendingCommitTimerRef = useRef(null);
  const playBusyRef = useRef(false);
  const attackBusyRef = useRef(false);
  const hitClearTimerRef = useRef(null);

  gameRef.current = game;

  const scheduleMotionHintClear = useCallback(() => {
    if (motionClearTimerRef.current) {
      clearTimeout(motionClearTimerRef.current);
    }
    motionClearTimerRef.current = setTimeout(() => {
      setMotionHints(emptyMotionHints());
      motionClearTimerRef.current = null;
    }, 750);
  }, []);

  const finishCommit = useCallback(
    async (next, { boardEnterIds: enterIds = [] } = {}) => {
      setSpritesLoading(true);
      try {
        await ensureSpritesReady(next);
        setHiddenTearIds([]);
        prevGameRef.current = next;
        setGame(next);

        if (enterIds.length > 0) {
          setBoardEnterIds(enterIds);
          if (boardEnterClearTimerRef.current) {
            clearTimeout(boardEnterClearTimerRef.current);
          }
          boardEnterClearTimerRef.current = setTimeout(() => {
            setBoardEnterIds([]);
            boardEnterClearTimerRef.current = null;
          }, 720);
        }
      } finally {
        setSpritesLoading(false);
      }
    },
    []
  );

  const runOpponentReplaySequence = useCallback(
    async (startState, finalState, options = {}) => {
      const actions = finalState.opponentReplay ?? [];
      if (!startState || actions.length === 0) {
        await commitGameRef.current?.(finalState, {
          ...options,
          skipOpponentReplay: true,
        });
        return;
      }

      setOpponentReplayBusy(true);
      setLoading(true);
      try {
        await ensureSpritesReady(finalState);
        let display = cloneGameState(startState);
        setGame(display);

        const tearPlayer = createTearPlayer({
          setHiddenTearIds,
          setTearingCards,
          captureCreatureRect,
        });

        for (const action of actions) {
          if (action.type === 'PLAY_CARD') {
            display = applyPlayOutcome(display, finalState, action);
            flushSync(() => {
              setBoardEnterIds([action.instanceId]);
              setGame(display);
            });
            await waitForLayoutPaint();
            await delay(Math.round(BOARD_ENTER_DURATION * 1000) + 80);
            setBoardEnterIds([]);
            continue;
          }

          if (action.type !== 'ATTACK_CREATURE' && action.type !== 'ATTACK_FACE') {
            continue;
          }

          const attacker = display.opponentBoard?.find(
            (c) => c.instanceId === action.attackerInstanceId
          );
          const fromRect = captureCreatureRect(action.attackerInstanceId, 'opponent');
          const toRect =
            action.type === 'ATTACK_FACE'
              ? capturePlayerFaceRect()
              : captureCreatureRect(action.targetInstanceId, 'player');

          if (!attacker?.card?.spriteBoard || !fromRect || !toRect) {
            display = applyAttackOutcome(display, action);
            setGame(display);
            continue;
          }

          const beforeAttack = display;
          await new Promise((resolve) => {
            replayStepResolveRef.current = resolve;
            setHiddenAttackIds([action.attackerInstanceId]);
            const motion = buildOpponentAttackMotion(
              action,
              fromRect,
              toRect,
              attacker.card.spriteBoard
            );
            attackMotionRef.current = motion;
            setAttackMotion(motion);
          });

          const combatMotion = lastCombatMotionRef.current ?? attackMotionRef.current;
          lastCombatMotionRef.current = null;
          attackMotionRef.current = null;

          display = applyAttackOutcome(display, action);
          await runTearsBetweenStates(beforeAttack, display, combatMotion, tearPlayer);
          setGame(display);

          if (!action.attackerRemoved && combatMotion) {
            const offset = computeCombatDelta(combatMotion.fromRect, combatMotion.toRect);
            setCombatReturn({ instanceId: action.attackerInstanceId, ...offset });
            await delay(420);
            setCombatReturn(null);
          }
        }

        await commitGameRef.current?.(finalState, {
          ...options,
          skipOpponentReplay: true,
          skipTearDelay: true,
        });
      } finally {
        setOpponentReplayBusy(false);
        setLoading(false);
        setHiddenAttackIds([]);
        setAttackMotion(null);
        replayStepResolveRef.current = null;
      }
    },
    []
  );

  const commitGame = useCallback(
    async (next, options = {}) => {
      if (!options.skipOpponentReplay && hasOpponentReplay(next)) {
        await runOpponentReplaySequence(prevGameRef.current, next, options);
        return;
      }

      const prev = prevGameRef.current;
      const enterIds =
        options.boardEnterIds ?? (prev ? findPlayedToBoard(prev, next) : []);

      if (prev && next && prev.gameId === next.gameId && !options.skipTearDelay) {
        const tearRectOverrides = options.tearRectOverrides ?? {};
        const removed = findRemovedBoardCreatures(prev, next);
        if (removed.length > 0) {
          const tears = removed
            .map((entry) => {
              const rect =
                tearRectOverrides[entry.instanceId] ??
                captureCreatureRect(entry.instanceId, entry.board);
              if (!rect) {
                return null;
              }
              return {
                tearId: `${entry.instanceId}-${Date.now()}`,
                instanceId: entry.instanceId,
                sprite: entry.sprite,
                rect,
              };
            })
            .filter(Boolean);

          if (tears.length > 0) {
            const hideIds = tears.map((tear) => tear.instanceId);
            const tearIds = new Set(tears.map((tear) => tear.tearId));

            setHiddenTearIds((current) => [...new Set([...current, ...hideIds])]);
            setTearingCards((current) => [...current, ...tears]);

            if (pendingCommitTimerRef.current) {
              clearTimeout(pendingCommitTimerRef.current);
            }

            const hints = diffPlayerCardMotion(prev, next);
            pendingCommitTimerRef.current = setTimeout(async () => {
              setTearingCards((current) => current.filter((tear) => !tearIds.has(tear.tearId)));
              setMotionHints(hints);
              scheduleMotionHintClear();
              await finishCommit(next, { boardEnterIds: enterIds });
              pendingCommitTimerRef.current = null;
            }, TEAR_DEATH_DELAY_MS);
            return;
          }
        }
      }

      if (prev && next && prev.gameId === next.gameId) {
        setMotionHints(diffPlayerCardMotion(prev, next));
        scheduleMotionHintClear();
      } else {
        setMotionHints(emptyMotionHints());
      }
      await finishCommit(next, { boardEnterIds: enterIds });
    },
    [finishCommit, scheduleMotionHintClear, runOpponentReplaySequence]
  );

  commitGameRef.current = commitGame;

  useEffect(
    () => () => {
      if (motionClearTimerRef.current) {
        clearTimeout(motionClearTimerRef.current);
      }
      if (boardEnterClearTimerRef.current) {
        clearTimeout(boardEnterClearTimerRef.current);
      }
      if (pendingCommitTimerRef.current) {
        clearTimeout(pendingCommitTimerRef.current);
      }
      if (hitClearTimerRef.current) {
        clearTimeout(hitClearTimerRef.current);
      }
    },
    []
  );

  const scheduleHitClear = useCallback(() => {
    if (hitClearTimerRef.current) {
      clearTimeout(hitClearTimerRef.current);
    }
    hitClearTimerRef.current = setTimeout(() => {
      setHitTargetIds([]);
      setFaceHitPulse(false);
      setPlayerHitPulse(false);
      setBlockRecoil(null);
      hitClearTimerRef.current = null;
    }, 340);
  }, []);

  const run = useCallback(
    async (action) => {
      setLoading(true);
      setError('');
      try {
        const result = await action();
        await commitGame(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [commitGame]
  );

  useEffect(() => {
    preloadCatalogSprites();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await gameApi.createGame();
        if (!cancelled) {
          await ensureSpritesReady(result);
          prevGameRef.current = result;
          setMotionHints(emptyMotionHints());
          setGame(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSpritesLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPlayCard = async (handIndex, event) => {
    const g = gameRef.current;
    if (!g || loading || playBusyRef.current || playVanish) return;

    const item = g.playerHand[handIndex];
    if (!item) return;

    const target = event?.currentTarget;
    const bounds = target?.getBoundingClientRect?.();
    if (!bounds) return;

    playBusyRef.current = true;
    setLoading(true);
    setError('');
    setPlayVanish({
      instanceId: item.instanceId,
      card: item.card,
      handIndex,
      rect: {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
    });
  };

  const onPlayHandVanishComplete = useCallback(async () => {
    const vanish = playVanish;
    const g = gameRef.current;
    if (!vanish || !g) {
      playBusyRef.current = false;
      setLoading(false);
      setPlayVanish(null);
      return;
    }

    try {
      const result = await gameApi.playCard(g.gameId, vanish.handIndex);
      const enterIds = findPlayedToBoard(g, result);
      await commitGame(result, { boardEnterIds: enterIds, skipTearDelay: true });
    } catch (e) {
      setError(e.message);
    } finally {
      playBusyRef.current = false;
      setLoading(false);
      setPlayVanish(null);
    }
  }, [playVanish, commitGame]);

  const onEndPlay = () => game && run(() => gameApi.endPlayPhase(game.gameId));
  const onSkipAttack = () => game && run(() => gameApi.skipAttack(game.gameId));
  const onEndAttack = () => game && run(() => gameApi.endAttackPhase(game.gameId));

  const onPickAncientKnowledge = (pickedInstanceId) => {
    if (!game) return;
    run(() => gameApi.resolveAncientKnowledge(game.gameId, pickedInstanceId));
  };

  const executeAttackApi = useCallback(
    async (motion) => {
      const g = gameRef.current;
      if (!g) {
        return;
      }
      setLoading(true);
      setError('');
      try {
        const prev = prevGameRef.current;
        const result = await gameApi.attack(
          g.gameId,
          motion.attackerInstanceId,
          motion.targetType,
          motion.targetInstanceId
        );
        const tearRectOverrides = buildAttackTearRectOverrides(prev, result, motion);
        await commitGame(result, { tearRectOverrides });

        const survived = (result.playerBoard ?? []).some(
          (c) => c.instanceId === motion.attackerInstanceId
        );
        if (survived && motion.fromRect && motion.toRect) {
          const offset = computeCombatDelta(motion.fromRect, motion.toRect);
          setCombatReturn({ instanceId: motion.attackerInstanceId, ...offset });
          setTimeout(() => {
            setCombatReturn((current) =>
              current?.instanceId === motion.attackerInstanceId ? null : current
            );
          }, 420);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        attackBusyRef.current = false;
        setHiddenAttackIds([]);
        setAttackMotion(null);
        attackMotionRef.current = null;
        setLoading(false);
      }
    },
    [commitGame]
  );

  const performAttack = useCallback(
    (targetType, targetInstanceId = null) => {
      const g = gameRef.current;
      if (!g?.currentAttackerInstanceId || loading || attackBusyRef.current || attackMotion) {
        return;
      }
      setAttackAiming(null);

      const attackerId = g.currentAttackerInstanceId;
      const attacker = g.playerBoard?.find((c) => c.instanceId === attackerId);
      const fromRect = captureCreatureRect(attackerId, 'player');
      const toRect =
        targetType === 'OPPONENT'
          ? captureFaceTargetRect()
          : captureCreatureRect(targetInstanceId, 'opponent');

      if (!attacker?.card?.spriteBoard || !fromRect || !toRect) {
        attackBusyRef.current = true;
        setLoading(true);
        executeAttackApi({
          attackerInstanceId: attackerId,
          targetType,
          targetInstanceId,
        });
        return;
      }

      attackBusyRef.current = true;
      setLoading(true);
      setHiddenAttackIds([attackerId]);
      const motionPayload = {
        attackerInstanceId: attackerId,
        targetType,
        targetInstanceId,
        attackerBoard: 'player',
        targetBoard: 'opponent',
        sprite: attacker.card.spriteBoard,
        fromRect,
        toRect,
      };
      attackMotionRef.current = motionPayload;
      setAttackMotion(motionPayload);
    },
    [loading, attackMotion, executeAttackApi]
  );

  const onAttackMotionImpact = useCallback(() => {
    const motion = attackMotionRef.current;
    if (!motion) {
      return;
    }
    if (motion.attackerBoard === 'opponent') {
      if (motion.targetType === 'CREATURE' && motion.targetInstanceId) {
        setHitTargetIds([motion.targetInstanceId]);
        if (motion.fromRect && motion.toRect) {
          const { x, y } = computeCombatDelta(motion.fromRect, motion.toRect);
          setBlockRecoil({
            instanceId: motion.targetInstanceId,
            x: x * 0.14,
            y: y * 0.14,
          });
        }
      } else {
        setPlayerHitPulse(true);
      }
      scheduleHitClear();
      return;
    }
    if (motion.targetType === 'CREATURE' && motion.targetInstanceId) {
      setHitTargetIds([motion.targetInstanceId]);
      if (motion.fromRect && motion.toRect) {
        const { x, y } = computeCombatDelta(motion.fromRect, motion.toRect);
        setBlockRecoil({
          instanceId: motion.targetInstanceId,
          x: -x * 0.14,
          y: -y * 0.14,
        });
      }
    } else {
      setFaceHitPulse(true);
    }
    scheduleHitClear();
  }, [scheduleHitClear]);

  const onAttackStrikeComplete = useCallback(() => {
    if (replayStepResolveRef.current) {
      lastCombatMotionRef.current = attackMotionRef.current;
      const resolve = replayStepResolveRef.current;
      replayStepResolveRef.current = null;
      setHiddenAttackIds([]);
      setAttackMotion(null);
      resolve();
      return;
    }

    const motion = attackMotionRef.current;
    if (!motion) {
      attackBusyRef.current = false;
      setLoading(false);
      return;
    }
    executeAttackApi(motion);
  }, [executeAttackApi]);

  const phase = game?.phase;
  const isPlay = phase === 'PLAY';
  const isAttack = phase === 'ATTACK';
  const currentAttacker = game?.currentAttackerInstanceId;
  const currentAttackerCreature = game?.playerBoard?.find(
    (c) => c.instanceId === currentAttacker
  );
  const pendingAncientKnowledge = game?.pendingChoice === 'ANCIENT_KNOWLEDGE';
  const canAttackFace = isAttack && currentAttacker && Boolean(game?.canAttackFace);
  const targetsAvailable = (game?.opponentBoard?.length ?? 0) > 0;

  const startAttackAiming = (event, attackerInstanceId) => {
    if (!isAttack || attackerInstanceId !== currentAttacker || loading) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setAttackAiming({
      attackerId: attackerInstanceId,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onAttackerClick = (event, attackerInstanceId) => {
    if (!isAttack || attackerInstanceId !== currentAttacker || loading) {
      return;
    }
    if (attackAiming?.attackerId === attackerInstanceId) {
      setAttackAiming(null);
      return;
    }
    startAttackAiming(event, attackerInstanceId);
  };

  const onAttackTargetClick = (targetType, targetInstanceId = null, allowed = true) => {
    if (!attackAiming || loading || !allowed) {
      return;
    }
    performAttack(targetType, targetInstanceId);
  };

  const showFaceTargetHighlight = attackAiming && canAttackFace;

  const hiddenTearSet = useMemo(() => new Set(hiddenTearIds), [hiddenTearIds]);
  const hiddenAttackSet = useMemo(() => new Set(hiddenAttackIds), [hiddenAttackIds]);
  const hitTargetSet = useMemo(() => new Set(hitTargetIds), [hitTargetIds]);

  const visibleOpponentBoard = useMemo(
    () =>
      [...(game?.opponentBoard ?? [])]
        .filter(
          (c) => !hiddenTearSet.has(c.instanceId) && !hiddenAttackSet.has(c.instanceId)
        )
        .sort((a, b) => a.boardIndex - b.boardIndex),
    [game?.opponentBoard, hiddenTearSet, hiddenAttackSet]
  );

  const visiblePlayerBoard = useMemo(
    () =>
      [...(game?.playerBoard ?? [])]
        .filter(
          (c) => !hiddenTearSet.has(c.instanceId) && !hiddenAttackSet.has(c.instanceId)
        )
        .sort((a, b) => a.boardIndex - b.boardIndex),
    [game?.playerBoard, hiddenTearSet, hiddenAttackSet]
  );

  useEffect(() => {
    if (!attackAiming) {
      return undefined;
    }

    const onMove = (event) => {
      setAttackAiming((prev) =>
        prev ? { ...prev, x: event.clientX, y: event.clientY } : null
      );
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAttackAiming(null);
      }
    };

    const onPointerDown = (event) => {
      if (event.target.closest('[data-attack-valid-target], [data-attack-attacker]')) {
        return;
      }
      setAttackAiming(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [attackAiming]);

  useEffect(() => {
    if (!isAttack) {
      setAttackAiming(null);
    }
  }, [isAttack, currentAttacker]);

  return (
    <div className="app">
      <AttackLineOverlay line={attackAiming} />

      {attackMotion && (
        <CardAttackLunge
          key={`attack-${attackMotion.attackerInstanceId}`}
          attack={attackMotion}
          onImpact={onAttackMotionImpact}
          onStrikeComplete={onAttackStrikeComplete}
        />
      )}

      {playVanish && (
        <PlayCardHandVanish
          key={playVanish.instanceId}
          vanish={playVanish}
          onComplete={onPlayHandVanishComplete}
        />
      )}
      {tearingCards.map((tear) => (
        <CardTearBurst
          key={tear.tearId}
          sprite={tear.sprite}
          rect={tear.rect}
          onDone={() => {
            setTearingCards((current) => current.filter((t) => t.tearId !== tear.tearId));
          }}
        />
      ))}

      {game && !spritesLoading && pendingAncientKnowledge && (
        <AncientKnowledgeModal
          options={game.scryOptions}
          loading={loading}
          onPick={onPickAncientKnowledge}
        />
      )}

      {error && <p className="error">{error}</p>}

      {(spritesLoading || (!game && loading)) && (
        <p className={`game-loading${game ? ' game-loading--blocking' : ''}`}>Загрузка…</p>
      )}

      {!game && !loading && !spritesLoading && error && (
        <div className="game-load-fail">
          <p>Не удалось начать игру.</p>
          <button type="button" onClick={onBack}>
            В меню
          </button>
        </div>
      )}

      {game && !spritesLoading && (
        <div className="game-shell">
          <h1 className="game-title">{GAME_TITLE}</h1>

          <aside className="game-sidebar">
            <button type="button" className="btn-menu-back" onClick={onBack}>
              ← В главное меню
            </button>

            <section className="status">
              <h2 className="sidebar-title">Состояние</h2>
              <div className="status-block status-block--player-face">
                <h3>Вы</h3>
                <div className="player-face-zone">
                  <div
                    className={[
                      'face-target-ring',
                      'face-target-ring--player',
                      playerHitPulse ? 'face-target-ring--hit' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-player-face-target="true"
                    aria-hidden
                  />
                  <p>
                    {game.playerHealth} HP
                    <br />
                    Мана {game.playerMana}/{game.playerMaxMana}
                  </p>
                </div>
              </div>
              <div className="status-block">
                <h3>Ход</h3>
                <p>
                  {game.turnNumber}
                  <br />
                  Фаза: <strong>{isPlay ? 'разыгрывание' : 'атака'}</strong>
                </p>
              </div>
              {game.gameOver && (
                <p className="status-gameover">Победитель: {game.winner}</p>
              )}
            </section>

            {isAttack && (
              <section className="attack-phase-panel">
                <h2>Фаза атаки</h2>
                {game.attackQueue.length === 0 ? (
                  <p>Нет существ, которые могут атаковать. Завершите фазу атаки.</p>
                ) : currentAttacker ? (
                  <p>
                    Атакует: <strong>{currentAttackerCreature?.card?.name}</strong>.
                    <br />
                    Клик по атакующему, затем по цели
                    {canAttackFace ? ' или по кружку' : ''}.
                    <br />
                    Esc / клик мимо — отмена прицеливания.
                    <br />
                    В очереди:{' '}
                    {Math.max(0, game.attackQueue.length - game.attackQueueIndex)}.
                  </p>
                ) : (
                  <p>Все атакующие отходили. Завершите фазу атаки.</p>
                )}
              </section>
            )}

            {game.lastMessage && !isAttack && (
              <p className="message sidebar-message">{game.lastMessage}</p>
            )}

            <section className="actions">
              {isPlay && (
                <button
                  type="button"
                  onClick={onEndPlay}
                  disabled={
                    loading || opponentReplayBusy || game.gameOver || pendingAncientKnowledge
                  }
                >
                  Завершить ход
                </button>
              )}
              {isAttack && (
                <>
                  <button
                    type="button"
                    onClick={onSkipAttack}
                    disabled={loading || !currentAttacker}
                  >
                    Пропустить атаку
                  </button>
                  <button type="button" onClick={onEndAttack} disabled={loading || opponentReplayBusy}>
                    Завершить фазу атаки
                  </button>
                </>
              )}
            </section>
          </aside>

          <div className="game-boards">
          <section className="board opponent-board" aria-label="Поле противника">
            <div className="opponent-board-header">
              <div className="opponent-face-zone">
                <div
                  className={[
                    'face-target-ring',
                    isAttack && canAttackFace ? 'face-target-ring--active' : 'face-target-ring--idle',
                    showFaceTargetHighlight ? 'face-target-ring--aiming' : '',
                    faceHitPulse ? 'face-target-ring--hit' : '',
                    loading ? 'face-target-ring--loading' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-attack-face-target="true"
                  data-attack-valid-target={showFaceTargetHighlight ? 'face' : undefined}
                  role={showFaceTargetHighlight ? 'button' : undefined}
                  tabIndex={showFaceTargetHighlight ? 0 : undefined}
                  aria-label="Прямая атака по оппоненту"
                  onClick={() => onAttackTargetClick('OPPONENT', null, showFaceTargetHighlight)}
                  onKeyDown={(e) => {
                    if (showFaceTargetHighlight && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onAttackTargetClick('OPPONENT', null, true);
                    }
                  }}
                  title={
                    canAttackFace
                      ? 'Прямая атака по HP (сначала выберите атакующего)'
                      : 'Прямая атака сейчас недоступна'
                  }
                />
                <div className="opponent-face-stats">
                  <span className="opponent-face-label">ИИ</span>
                  <span>{game.opponentHealth} HP</span>
                  <span>
                    Мана {game.opponentMana}/{game.opponentMaxMana}
                  </span>
                </div>
              </div>
              <h2>Поле противника</h2>
            </div>
            <LayoutGroup id="opponent-board-layout">
            <div className="creature-row creature-row--layout" data-opponent-board-row="true">
              <AnimatePresence mode="popLayout">
                {visibleOpponentBoard.map((creature) => {
                  const isValidTarget = attackAiming && creature.attackable !== false;
                  const dimTarget = attackAiming && creature.attackable === false;
                  const isBoardEnter = boardEnterIds.includes(creature.instanceId);
                  const recoil =
                    !isBoardEnter && blockRecoil?.instanceId === creature.instanceId
                      ? blockRecoil
                      : null;
                  const returnOffset =
                    !isBoardEnter && combatReturn?.instanceId === creature.instanceId
                      ? combatReturn
                      : null;
                  const boardTransition = boardCreatureTransition(isBoardEnter);
                  return (
                    <motion.div
                      key={creature.instanceId}
                      className="creature-motion-wrap card-motion-board"
                      layout={isBoardEnter ? false : 'position'}
                      {...(isBoardEnter
                        ? {
                            ...boardEnterMotion,
                            transition: boardTransition,
                            animate: boardEnterMotion.animate,
                          }
                        : recoil || returnOffset
                          ? {
                              initial: { x: recoil?.x ?? returnOffset.x, y: recoil?.y ?? returnOffset.y },
                              animate: { x: 0, y: 0 },
                              transition: combatReturnTransition,
                            }
                          : { initial: false, transition: boardTransition })}
                      style={isBoardEnter ? { transformStyle: 'preserve-3d' } : undefined}
                    >
                      <CardTooltip
                        card={creature.card}
                        currentHealth={creature.currentHealth}
                        effectiveAttack={creature.effectiveAttack}
                        effectiveDefense={creature.effectiveDefense}
                        effectiveInitiative={creature.effectiveInitiative}
                      >
                        <div
                          className={[
                            'creature-slot',
                            'opponent',
                            isBoardEnter ? 'creature-slot--board-enter' : '',
                            isValidTarget ? 'attack-target' : '',
                            dimTarget ? 'attack-target-blocked' : '',
                            hitTargetSet.has(creature.instanceId) ? 'creature-slot--hit' : '',
                            opponentReplayBusy ? 'creature-slot--replay-lock' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-instance-id={creature.instanceId}
                          data-opponent-creature={creature.instanceId}
                          data-attack-valid-target={isValidTarget ? 'creature' : undefined}
                          onClick={() => {
                            onAttackTargetClick('CREATURE', creature.instanceId, isValidTarget);
                          }}
                          onKeyDown={(e) => {
                            if (
                              isValidTarget &&
                              (e.key === 'Enter' || e.key === ' ')
                            ) {
                              e.preventDefault();
                              onAttackTargetClick('CREATURE', creature.instanceId, true);
                            }
                          }}
                          role={isValidTarget ? 'button' : undefined}
                          tabIndex={isValidTarget ? 0 : undefined}
                        >
                          <CardSprite
                            src={creature.card.spriteBoard}
                            alt={creature.card.name}
                          />
                          <CardBrief
                            card={creature.card}
                            currentHealth={creature.currentHealth}
                            effectiveAttack={creature.effectiveAttack}
                            effectiveDefense={creature.effectiveDefense}
                            effectiveInitiative={creature.effectiveInitiative}
                          />
                        </div>
                      </CardTooltip>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {game.opponentBoard.length === 0 && isAttack && currentAttacker && !canAttackFace && (
                <p className="board-hint board-hint--inline">
                  На поле нет существ — завершите атаку или выберите другую цель.
                </p>
              )}
            </div>
            </LayoutGroup>
          </section>

            <section className="board player-board">
              <h2>Ваше поле</h2>
              <LayoutGroup id="player-board-layout">
              <div className="creature-row creature-row--layout">
                <AnimatePresence mode="popLayout">
                  {visiblePlayerBoard.map((creature) => {
                    const isCurrent = creature.instanceId === currentAttacker;
                    const isBoardEnter = boardEnterIds.includes(creature.instanceId);
                    const returnOffset =
                      combatReturn?.instanceId === creature.instanceId ? combatReturn : null;
                    const boardTransition = boardCreatureTransition(isBoardEnter);
                    return (
                      <motion.div
                        key={creature.instanceId}
                        className="creature-motion-wrap card-motion-board"
                        layout={isBoardEnter ? false : 'position'}
                        {...(isBoardEnter
                          ? {
                              ...boardEnterMotion,
                              transition: boardTransition,
                              animate: boardEnterMotion.animate,
                            }
                          : returnOffset
                            ? {
                                initial: { x: returnOffset.x, y: returnOffset.y },
                                animate: { x: 0, y: 0 },
                                transition: combatReturnTransition,
                              }
                            : { initial: false, transition: boardTransition })}
                        style={isBoardEnter ? { transformStyle: 'preserve-3d' } : undefined}
                      >
                        <CardTooltip
                          card={creature.card}
                          currentHealth={creature.currentHealth}
                          effectiveAttack={creature.effectiveAttack}
                          effectiveDefense={creature.effectiveDefense}
                          effectiveInitiative={creature.effectiveInitiative}
                        >
                          <div
                            className={[
                              'creature-slot',
                              isBoardEnter ? 'creature-slot--board-enter' : '',
                              isCurrent ? 'attacker-active' : '',
                              attackAiming?.attackerId === creature.instanceId ? 'attacker-aiming' : '',
                              isAttack && !creature.canAttack ? 'exhausted' : '',
                              hitTargetSet.has(creature.instanceId) ? 'creature-slot--hit' : '',
                              opponentReplayBusy ? 'creature-slot--replay-lock' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            data-attack-attacker={isCurrent ? 'true' : undefined}
                            data-player-creature={creature.instanceId}
                            onClick={(e) => onAttackerClick(e, creature.instanceId)}
                            onKeyDown={(e) => {
                              if (isCurrent && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                onAttackerClick(e, creature.instanceId);
                              }
                            }}
                            role={isCurrent ? 'button' : undefined}
                            tabIndex={isCurrent ? 0 : undefined}
                          >
                            <CardSprite
                              src={creature.card.spriteBoard}
                              alt={creature.card.name}
                            />
                            <CardBrief
                              card={creature.card}
                              currentHealth={creature.currentHealth}
                              effectiveAttack={creature.effectiveAttack}
                              effectiveDefense={creature.effectiveDefense}
                              effectiveInitiative={creature.effectiveInitiative}
                              extra={
                                !creature.canAttack
                                  ? 'не атакует'
                                  : isCurrent
                                    ? attackAiming
                                      ? 'клик по цели'
                                      : 'клик — прицелиться'
                                    : null
                              }
                            />
                          </div>
                        </CardTooltip>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              </LayoutGroup>
            </section>

            <div className="player-bottom-zone">
            <div
              className="hand-fan-rows"
              aria-label="Рука игрока"
              data-hand-rows={Math.ceil(game.playerHand.length / HAND_CARDS_PER_ROW) || 1}
            >
              {splitHandIntoRows(game.playerHand).map((row, rowIndex) => (
                <div
                  key={`hand-row-${rowIndex}`}
                  className={[
                    'hand-fan',
                    rowIndex > 0 ? 'hand-fan--lower' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <AnimatePresence mode="popLayout">
                  {row.map((item, indexInRow) => {
                    if (playVanish?.instanceId === item.instanceId) {
                      return null;
                    }
                    const handStackIndex = rowIndex * HAND_CARDS_PER_ROW + indexInRow;
                    const isDrawn = motionHints.newInHand.includes(item.instanceId);
                    return (
                      <div
                        key={item.instanceId}
                        className="hand-fan__slot"
                        style={getHandFanStyle(indexInRow, row.length)}
                      >
                        <motion.div
                          className="card-motion-hand"
                          {...(isDrawn ? drawFromDeckMotion : { initial: false })}
                        >
                          <CardTooltip card={item.card} handStackIndex={handStackIndex}>
                            <button
                              type="button"
                              className={[
                                'hand-card',
                                item.playable && isPlay && !loading && !game.gameOver && !pendingAncientKnowledge
                                  ? 'hand-card--playable'
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              disabled={
                                !isPlay || loading || game.gameOver || pendingAncientKnowledge || !item.playable
                              }
                              onClick={(e) => onPlayCard(item.handIndex, e)}
                            >
                              <CardSprite src={item.card.spriteHand} alt={item.card.name} />
                            </button>
                          </CardTooltip>
                        </motion.div>
                      </div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <PlayerDeckPile count={game.playerDeckSize ?? 0} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
