export const FACTIONS = {
  MIGHT: {
    label: 'Могущество',
    nameEn: 'Might',
    accent: '#e8c547',
    border: '#c9a227',
    background: '#3d3520',
    cardBack: '/cards/MightBack.png',
  },
};

export function getFactionCardBackUrl(factionCode = 'MIGHT') {
  return getFactionStyle(factionCode).cardBack ?? FACTIONS.MIGHT.cardBack;
}

export function getFactionStyle(factionCode) {
  return FACTIONS[factionCode] ?? FACTIONS.MIGHT;
}

export function formatFactionLabel(card) {
  return card?.factionLabel ?? getFactionStyle(card?.faction).label;
}
