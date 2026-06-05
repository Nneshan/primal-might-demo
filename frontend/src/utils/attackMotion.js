import { hasRangedAttack } from './cardAbilities';

export function buildAttackMotionPayload({
  attackerInstanceId,
  targetType,
  targetInstanceId,
  attackerBoard,
  targetBoard,
  sprite,
  card,
  fromRect,
  toRect,
}) {
  return {
    attackerInstanceId,
    targetType,
    targetInstanceId,
    attackerBoard,
    targetBoard,
    sprite,
    fromRect,
    toRect,
    attackStyle: hasRangedAttack(card) ? 'ranged' : 'melee',
  };
}

export function shouldHideAttackerDuringAttack(motion) {
  return motion?.attackStyle !== 'ranged';
}
