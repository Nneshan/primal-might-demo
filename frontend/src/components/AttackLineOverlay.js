import { createPortal } from 'react-dom';

function AttackLineOverlay({ line }) {
  if (!line) {
    return null;
  }

  return createPortal(
    <svg className="attack-line-overlay" aria-hidden="true">
      <line
        x1={line.startX}
        y1={line.startY}
        x2={line.x}
        y2={line.y}
        className="attack-line"
      />
    </svg>,
    document.body
  );
}

export default AttackLineOverlay;
