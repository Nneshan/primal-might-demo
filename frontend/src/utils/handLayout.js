export const HAND_CARDS_PER_ROW = 6;

export function splitHandIntoRows(hand, cardsPerRow = HAND_CARDS_PER_ROW) {
  if (!hand?.length) {
    return [];
  }
  const rows = [];
  for (let i = 0; i < hand.length; i += cardsPerRow) {
    rows.push(hand.slice(i, i + cardsPerRow));
  }
  return rows;
}
