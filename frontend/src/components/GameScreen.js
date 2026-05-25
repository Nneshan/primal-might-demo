import { useCallback, useEffect, useRef, useState } from 'react';
import '../App.css';
import * as gameApi from '../api/gameApi';
import { GAME_TITLE } from '../constants';
import CardTooltip from './CardTooltip';
import CardBrief from './CardBrief';
import AttackLineOverlay from './AttackLineOverlay';
import AncientKnowledgeModal from './AncientKnowledgeModal';

function GameScreen({ onBack }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attackAiming, setAttackAiming] = useState(null);
  const gameRef = useRef(game);

  gameRef.current = game;

  const run = useCallback(async (action) => {
    setLoading(true);
    setError('');
    try {
      const result = await action();
      setGame(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await gameApi.createGame();
        if (!cancelled) {
          setGame(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPlayCard = (handIndex) => {
    if (!game) return;
    run(() => gameApi.playCard(game.gameId, handIndex));
  };

  const onEndPlay = () => game && run(() => gameApi.endPlayPhase(game.gameId));
  const onSkipAttack = () => game && run(() => gameApi.skipAttack(game.gameId));
  const onEndAttack = () => game && run(() => gameApi.endAttackPhase(game.gameId));

  const onPickAncientKnowledge = (pickedInstanceId) => {
    if (!game) return;
    run(() => gameApi.resolveAncientKnowledge(game.gameId, pickedInstanceId));
  };

  const performAttack = useCallback(
    (targetType, targetInstanceId = null) => {
      const g = gameRef.current;
      if (!g?.currentAttackerInstanceId) return;
      setAttackAiming(null);
      run(() =>
        gameApi.attack(
          g.gameId,
          g.currentAttackerInstanceId,
          targetType,
          targetInstanceId
        )
      );
    },
    [run]
  );

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

      {pendingAncientKnowledge && (
        <AncientKnowledgeModal
          options={game.scryOptions}
          loading={loading}
          onPick={onPickAncientKnowledge}
        />
      )}

      {error && <p className="error">{error}</p>}

      {!game && loading && <p className="game-loading">Загрузка игры…</p>}

      {!game && !loading && error && (
        <div className="game-load-fail">
          <p>Не удалось начать игру.</p>
          <button type="button" onClick={onBack}>
            В меню
          </button>
        </div>
      )}

      {game && (
        <div className="game-shell">
          <h1 className="game-title">{GAME_TITLE}</h1>

          <aside className="game-sidebar">
            <button type="button" className="btn-menu-back" onClick={onBack}>
              ← В главное меню
            </button>

            <section className="status">
              <h2 className="sidebar-title">Состояние</h2>
              <div className="status-block">
                <h3>Вы</h3>
                <p>
                  {game.playerHealth} HP
                  <br />
                  Мана {game.playerMana}/{game.playerMaxMana}
                </p>
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
                  disabled={loading || game.gameOver || pendingAncientKnowledge}
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
                  <button type="button" onClick={onEndAttack} disabled={loading}>
                    Завершить фазу атаки
                  </button>
                </>
              )}
            </section>
          </aside>

          <div className="game-boards">
          <section className="board opponent-board">
            <div className="opponent-board-header">
              <div className="opponent-face-zone">
                <div
                  className={[
                    'face-target-ring',
                    isAttack && canAttackFace ? 'face-target-ring--active' : 'face-target-ring--idle',
                    showFaceTargetHighlight ? 'face-target-ring--aiming' : '',
                    loading ? 'face-target-ring--loading' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
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
            <div className="creature-row">
              {game.opponentBoard.map((creature) => {
                const isValidTarget = attackAiming && creature.attackable !== false;
                const dimTarget = attackAiming && creature.attackable === false;
                return (
                <CardTooltip
                  key={creature.instanceId}
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
                      isValidTarget ? 'attack-target' : '',
                      dimTarget ? 'attack-target-blocked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-instance-id={creature.instanceId}
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
                    <img
                      src={creature.card.spriteBoard}
                      alt={creature.card.name}
                      draggable={false}
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
              );
              })}
              {game.opponentBoard.length === 0 && isAttack && currentAttacker && !canAttackFace && (
                <p className="board-hint board-hint--inline">
                  На поле нет существ — завершите атаку или выберите другую цель.
                </p>
              )}
            </div>
          </section>

          <section className="board player-board">
            <h2>Ваше поле</h2>
            <div className="creature-row">
              {game.playerBoard.map((creature) => {
                const isCurrent = creature.instanceId === currentAttacker;
                return (
                  <CardTooltip
                    key={creature.instanceId}
                    card={creature.card}
                    currentHealth={creature.currentHealth}
                    effectiveAttack={creature.effectiveAttack}
                    effectiveDefense={creature.effectiveDefense}
                    effectiveInitiative={creature.effectiveInitiative}
                  >
                    <div
                      className={[
                        'creature-slot',
                        isCurrent ? 'attacker-active' : '',
                        attackAiming?.attackerId === creature.instanceId ? 'attacker-aiming' : '',
                        isAttack && !creature.canAttack ? 'exhausted' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      data-attack-attacker={isCurrent ? 'true' : undefined}
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
                      <img
                        src={creature.card.spriteBoard}
                        alt={creature.card.name}
                        draggable={false}
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
                );
              })}
            </div>
          </section>

          <section className="hand">
            <h2>Рука</h2>
            <div
              className={[
                'hand-row',
                game.playerHand.length > 6 ? 'hand-row--stacked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {game.playerHand.map((item, index) => (
                <CardTooltip
                  key={item.instanceId}
                  card={item.card}
                  handStackIndex={index}
                >
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
                    onClick={() => onPlayCard(item.handIndex)}
                  >
                    <img src={item.card.spriteHand} alt={item.card.name} />
                  </button>
                </CardTooltip>
              ))}
            </div>
          </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
