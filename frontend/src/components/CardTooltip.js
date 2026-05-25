import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatHandHeader, formatStats } from './cardText';
import { renderRichText } from './richText';
import './CardTooltip.css';

const VIEWPORT_MARGIN = 12;
const GAP = 10;

/** Одно описание из card_definitions + card_descriptions — и для руки, и для поля. */
function CardTooltip({
  card,
  currentHealth,
  effectiveAttack,
  effectiveDefense,
  effectiveInitiative,
  elevated,
  handStackIndex,
  children,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'above' });
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);

  const clampToViewport = useCallback(() => {
    const wrap = wrapRef.current;
    const tip = tooltipRef.current;
    if (!wrap || !tip) {
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const tipWidth = tipRect.width;
    const tipHeight = tipRect.height;

    let centerX = wrapRect.left + wrapRect.width / 2;
    const halfW = tipWidth / 2;
    if (centerX - halfW < VIEWPORT_MARGIN) {
      centerX = VIEWPORT_MARGIN + halfW;
    }
    if (centerX + halfW > window.innerWidth - VIEWPORT_MARGIN) {
      centerX = window.innerWidth - VIEWPORT_MARGIN - halfW;
    }

    const spaceAbove = wrapRect.top - VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - wrapRect.bottom - VIEWPORT_MARGIN;
    let placement = 'above';
    let top = wrapRect.top - GAP;

    if (tipHeight + GAP > spaceAbove && spaceBelow >= spaceAbove) {
      placement = 'below';
      top = wrapRect.bottom + GAP;
    }

    setCoords({ top, left: centerX, placement });
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }
    clampToViewport();
  }, [visible, card, currentHealth, effectiveAttack, effectiveDefense, effectiveInitiative, clampToViewport]);

  const show = () => {
    const wrap = wrapRef.current;
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      setCoords({
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        placement: 'above',
      });
    }
    setVisible(true);
  };

  const hide = () => setVisible(false);

  if (!card) {
    return children;
  }

  const tooltip =
    visible &&
    createPortal(
      <div
        ref={tooltipRef}
        className={`card-tooltip card-tooltip--portal card-tooltip--${coords.placement}`}
        role="tooltip"
        style={{
          top: coords.top,
          left: coords.left,
          zIndex: elevated ? 25000 : undefined,
        }}
      >
        <div className="tooltip-line">{formatHandHeader(card)}</div>
        <div className="tooltip-line">
          {formatStats(card, currentHealth, effectiveAttack, effectiveDefense, effectiveInitiative)}
        </div>
        {(card.abilities || []).map((ability) => (
          <div className="tooltip-line" key={ability.name}>
            <em className="tooltip-ability-name">{ability.name}</em>
            {ability.text && (
              <span> — {renderRichText(ability.text)}</span>
            )}
          </div>
        ))}
        {card.flavorText && (
          <div className="tooltip-line tooltip-flavor">
            <em>{card.flavorText}</em>
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <>
      <div
        ref={wrapRef}
        className="card-tooltip-wrap"
        style={handStackIndex != null ? { zIndex: handStackIndex + 1 } : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}

export default CardTooltip;
