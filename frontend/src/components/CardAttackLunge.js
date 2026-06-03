import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import CardSprite from './CardSprite';
import './CardAttackLunge.css';
import {
  ATTACK_HOLD_DURATION_S,
  ATTACK_IMPACT_FRACTION,
  ATTACK_STRIKE_DURATION_MS,
  ATTACK_STRIKE_DURATION_S,
} from '../cardMotion';
import { computeCombatDelta } from '../utils/gameStateDiff';

function CardAttackLunge({ attack, onImpact, onStrikeComplete }) {
  const completedRef = useRef(false);
  const impactedRef = useRef(false);

  useEffect(() => {
    const impactMs = Math.round(ATTACK_STRIKE_DURATION_MS * ATTACK_IMPACT_FRACTION);
    const impactTimer = setTimeout(() => {
      if (impactedRef.current) {
        return;
      }
      impactedRef.current = true;
      onImpact?.();
    }, impactMs);

    const doneTimer = setTimeout(() => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      onStrikeComplete?.();
    }, ATTACK_STRIKE_DURATION_MS);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(doneTimer);
    };
  }, [onImpact, onStrikeComplete]);

  if (!attack?.fromRect || !attack?.toRect) {
    return null;
  }

  const { fromRect, toRect, sprite } = attack;
  const { x: deltaX, y: deltaY } = computeCombatDelta(fromRect, toRect);
  const tilt = deltaX >= 0 ? 6 : -6;
  const clashLeft = fromRect.left + deltaX + fromRect.width / 2;
  const clashTop = fromRect.top + deltaY + fromRect.height / 2;

  return createPortal(
    <>
      <div
        className="card-attack-lunge"
        style={{
          left: fromRect.left,
          top: fromRect.top,
          width: fromRect.width,
          height: fromRect.height,
        }}
        aria-hidden
      >
        <motion.div
          className="card-attack-lunge__card"
          initial={{ x: 0, y: 0, scale: 1, rotate: 0, filter: 'brightness(1)' }}
          animate={{
            x: deltaX,
            y: deltaY,
            scale: 1.14,
            rotate: tilt,
            filter: 'brightness(1.2)',
          }}
          transition={{
            duration: ATTACK_STRIKE_DURATION_S,
            ease: [0.2, 0.9, 0.3, 1],
          }}
        >
          <CardSprite src={sprite} alt="" />
        </motion.div>
      </div>
      <motion.div
        className="card-attack-clash"
        style={{ left: clashLeft, top: clashTop }}
        initial={{ opacity: 0, scale: 0.35 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.35, 1.35, 1.6] }}
        transition={{
          duration: ATTACK_STRIKE_DURATION_S + ATTACK_HOLD_DURATION_S * 0.5,
          times: [0, ATTACK_IMPACT_FRACTION, 1],
          ease: 'easeOut',
        }}
        aria-hidden
      />
    </>,
    document.body
  );
}

export default CardAttackLunge;
