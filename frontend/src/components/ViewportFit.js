import { useCallback, useEffect, useState } from 'react';
import './ViewportFit.css';

/** Фиксированный «макет» — масштаб только от размера окна, не от числа карт. */
const DESIGN_WIDTH = 1720;
const DESIGN_HEIGHT = 900;
const MIN_SCALE = 0.4;
const VIEWPORT_PADDING = 16;

function ViewportFit({ children }) {
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const availableHeight = window.innerHeight - VIEWPORT_PADDING;
    const availableWidth = window.innerWidth - VIEWPORT_PADDING;
    const scaleByHeight = availableHeight / DESIGN_HEIGHT;
    const scaleByWidth = availableWidth / DESIGN_WIDTH;
    const nextScale = Math.min(1, scaleByHeight, scaleByWidth);
    setScale(Math.max(MIN_SCALE, nextScale));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  return (
    <div className="viewport-fit">
      <div
        className="viewport-fit__scaled"
        style={{
          transform: `scale(${scale})`,
          width: DESIGN_WIDTH,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ViewportFit;
