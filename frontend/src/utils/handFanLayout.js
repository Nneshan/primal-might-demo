/**
 * Веер без rotate — пиксель-арт не размывается при повороте в CSS.
 * Дуга: горизонтальный разброс + подъём центральных карт.
 */
/** Фактическая ширина *Hand.png в public/cards — 192px */
const HAND_CARD_WIDTH_ESTIMATE = 192;
/** Лёгкое перекрытие краёв соседних карт */
const HAND_CARD_OVERLAP = 14;

export function getHandFanStyle(index, total) {
  if (total <= 0) {
    return {};
  }

  if (total === 1) {
    return {
      '--fan-offset': '0px',
      '--fan-lift': '0px',
      zIndex: 0,
    };
  }

  const spread = HAND_CARD_WIDTH_ESTIMATE - HAND_CARD_OVERLAP;
  const offset = Math.round((index - (total - 1) / 2) * spread);

  const centered = (index / (total - 1)) * 2 - 1;
  const maxLift = Math.min(22, 6 + total * 2);
  const lift = Math.round((1 - centered * centered) * maxLift);

  return {
    '--fan-offset': `${offset}px`,
    '--fan-lift': `${lift}px`,
    zIndex: index,
  };
}
