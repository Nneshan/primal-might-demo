export const TEAR_DURATION_MS = 520;

/** Ждём конец разрыва, затем обновляем поле (новые карты ИИ не появляются раньше). */
export const TEAR_DEATH_DELAY_MS = TEAR_DURATION_MS + 80;

export const BOARD_ENTER_DURATION = 0.62;

export const boardLayoutTransition = {
  type: 'spring',
  stiffness: 360,
  damping: 34,
};

export const boardEnterTransition = {
  layout: boardLayoutTransition,
  duration: BOARD_ENTER_DURATION,
  ease: [0.22, 0.61, 0.36, 1],
};

export const boardCreatureTransition = (isBoardEnter) =>
  isBoardEnter ? boardEnterTransition : { layout: boardLayoutTransition };

export const boardEnterMotion = {
  initial: { opacity: 0, rotateY: -420, scale: 0.75 },
  animate: { opacity: 1, rotateY: 0, scale: 1 },
};

export const drawFromDeckMotion = {
  initial: { opacity: 0, x: 88, y: 18, scale: 0.86 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  transition: {
    type: 'spring',
    stiffness: 340,
    damping: 28,
  },
};

/** MTG-стиль: быстрый выпад к цели (сек). */
export const ATTACK_STRIKE_DURATION_S = 0.22;

/** Короткая пауза в точке столкновения (сек). */
export const ATTACK_HOLD_DURATION_S = 0.1;

export const ATTACK_STRIKE_TOTAL_S = ATTACK_STRIKE_DURATION_S + ATTACK_HOLD_DURATION_S;

export const ATTACK_STRIKE_DURATION_MS = Math.round(ATTACK_STRIKE_TOTAL_S * 1000);

/** Момент удара — конец выпада, до паузы. */
export const ATTACK_IMPACT_FRACTION = ATTACK_STRIKE_DURATION_S / ATTACK_STRIKE_TOTAL_S;

/** Откат живого атакующего на поле после боя (сек). */
export const ATTACK_RETURN_DURATION_S = 0.3;

export const combatReturnTransition = {
  type: 'spring',
  stiffness: 440,
  damping: 34,
};

/** Полёт снаряда дальней атаки (сек). */
export const RANGED_PROJECTILE_DURATION_S = 0.34;

export const RANGED_PROJECTILE_HOLD_S = 0.1;

export const RANGED_PROJECTILE_TOTAL_S =
  RANGED_PROJECTILE_DURATION_S + RANGED_PROJECTILE_HOLD_S;

export const RANGED_PROJECTILE_DURATION_MS = Math.round(RANGED_PROJECTILE_TOTAL_S * 1000);

export const RANGED_IMPACT_FRACTION =
  RANGED_PROJECTILE_DURATION_S / RANGED_PROJECTILE_TOTAL_S;
