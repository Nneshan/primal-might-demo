export function hasRangedAttack(card) {
  return (card?.abilities ?? []).some(
    (ability) =>
      ability.key === 'RANGED' ||
      ability.name === 'Дальняя Атака' ||
      ability.name === 'Дальняя атака'
  );
}
