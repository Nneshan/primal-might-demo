import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import CardSprite from './CardSprite';
import './PlayCardHandVanish.css';

export const HAND_VANISH_DURATION = 0.62;

function PlayCardHandVanish({ vanish, onComplete }) {
  const completedRef = useRef(false);

  if (!vanish?.rect) {
    return null;
  }

  const { left, top, width, height } = vanish.rect;

  const handleComplete = () => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onComplete();
  };

  return createPortal(
    <motion.div
      className="play-hand-vanish"
      style={{ left, top, width, height }}
      aria-hidden
    >
      <motion.div
        className="play-hand-vanish__stage"
        initial={{ rotateY: 0, opacity: 1, scale: 1 }}
        animate={{ rotateY: 540, opacity: 0, scale: 0.88 }}
        transition={{ duration: HAND_VANISH_DURATION, ease: [0.42, 0, 0.58, 1] }}
        onAnimationComplete={handleComplete}
      >
        <CardSprite src={vanish.card.spriteHand} alt="" />
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default PlayCardHandVanish;
