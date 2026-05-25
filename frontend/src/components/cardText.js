export function formatTypes(card) {
  return (card?.creatureTypes || []).join(', ');
}

export function formatStats(
  card,
  currentHealth,
  effectiveAttack,
  effectiveDefense,
  effectiveInitiative
) {
  const hp = currentHealth ?? card.health;
  const atk = effectiveAttack ?? card.attack;
  const def = effectiveDefense ?? card.defense;
  const ini = effectiveInitiative ?? card.initiative;
  const atkLabel = effectiveAttack != null && effectiveAttack !== card.attack ? `${atk}*` : `${atk}`;
  const defLabel = effectiveDefense != null && effectiveDefense !== card.defense ? `${def}*` : `${def}`;
  const iniLabel =
    effectiveInitiative != null && effectiveInitiative !== card.initiative ? `${ini}*` : `${ini}`;
  return `${hp} HP, ${atkLabel} ATK, ${defLabel} DEF, ${iniLabel} INI`;
}

export function formatHandHeader(card) {
  return `${card.name} • ${card.manaCost} маны • ${formatTypes(card)}`;
}

export function formatBoardHeader(card) {
  return `${card.name} • ${formatTypes(card)}`;
}
