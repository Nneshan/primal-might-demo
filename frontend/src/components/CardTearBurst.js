import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import CardSprite from './CardSprite';
import './CardTearBurst.css';

import { TEAR_DURATION_MS } from '../cardMotion';

export { TEAR_DURATION_MS };

function CardTearBurst({ sprite, rect, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, TEAR_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!rect) {
    return null;
  }

  return createPortal(
    <div
      className="card-tear-burst"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    >
      <motion.div
        className="card-tear-burst__half card-tear-burst__half--left"
        initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        animate={{ x: -36, y: 8, rotate: -22, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
      >
        <div className="card-tear-burst__clip card-tear-burst__clip--left">
          <CardSprite src={sprite} alt="" />
        </div>
      </motion.div>
      <motion.div
        className="card-tear-burst__half card-tear-burst__half--right"
        initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        animate={{ x: 36, y: 8, rotate: 22, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
      >
        <div className="card-tear-burst__clip card-tear-burst__clip--right">
          <CardSprite src={sprite} alt="" />
        </div>
      </motion.div>
      <div className="card-tear-burst__rip" aria-hidden />
    </div>,
    document.body
  );
}

export default CardTearBurst;
