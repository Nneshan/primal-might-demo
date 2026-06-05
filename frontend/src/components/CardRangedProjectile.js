import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import './CardAttackLunge.css';
import './CardRangedProjectile.css';
import {
  RANGED_IMPACT_FRACTION,
  RANGED_PROJECTILE_DURATION_MS,
  RANGED_PROJECTILE_DURATION_S,
  RANGED_PROJECTILE_HOLD_S,
} from '../cardMotion';

function CardRangedProjectile({ attack, onImpact, onStrikeComplete }) {
  const completedRef = useRef(false);
  const impactedRef = useRef(false);

  useEffect(() => {
    const impactMs = Math.round(RANGED_PROJECTILE_DURATION_MS * RANGED_IMPACT_FRACTION);
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
    }, RANGED_PROJECTILE_DURATION_MS);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(doneTimer);
    };
  }, [onImpact, onStrikeComplete]);

  if (!attack?.fromRect || !attack?.toRect) {
    return null;
  }

  const { fromRect, toRect } = attack;
  const startCx = fromRect.left + fromRect.width / 2;
  const startCy = fromRect.top + fromRect.height * 0.38;
  const endCx = toRect.left + toRect.width / 2;
  const endCy = toRect.top + toRect.height / 2;
  const deltaX = endCx - startCx;
  const deltaY = endCy - startCy;
  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

  return createPortal(
    <>
      <motion.div
        className="ranged-projectile"
        style={{ left: startCx, top: startCy }}
        aria-hidden
      >
        <motion.div
          className="ranged-projectile__bolt"
          style={{ rotate: angle }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.45 }}
          animate={{
            x: deltaX,
            y: deltaY,
            opacity: [0, 1, 1, 0.15],
            scale: [0.45, 1, 1, 0.55],
          }}
          transition={{
            duration: RANGED_PROJECTILE_DURATION_S,
            ease: [0.15, 0.85, 0.25, 1],
            times: [0, 0.12, 0.88, 1],
          }}
        />
        <motion.div
          className="ranged-projectile__trail"
          style={{ rotate: angle }}
          initial={{ x: 0, y: 0, opacity: 0, scaleX: 0.2 }}
          animate={{
            x: deltaX * 0.55,
            y: deltaY * 0.55,
            opacity: [0, 0.7, 0],
            scaleX: [0.2, 1.1, 0.4],
          }}
          transition={{
            duration: RANGED_PROJECTILE_DURATION_S * 0.7,
            ease: 'easeOut',
          }}
        />
      </motion.div>
      <motion.div
        className="card-attack-clash ranged-projectile__impact"
        style={{ left: endCx, top: endCy }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.2, 1.45] }}
        transition={{
          duration: RANGED_PROJECTILE_DURATION_S + RANGED_PROJECTILE_HOLD_S * 0.45,
          times: [0, RANGED_IMPACT_FRACTION, 1],
          ease: 'easeOut',
        }}
        aria-hidden
      />
    </>,
    document.body
  );
}

export default CardRangedProjectile;
