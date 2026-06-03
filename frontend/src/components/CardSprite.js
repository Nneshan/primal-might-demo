import { getSpriteSrc } from '../utils/cardSpritePreload';

function CardSprite({ src, alt = '', className, ...props }) {
  return (
    <img
      src={getSpriteSrc(src)}
      alt={alt}
      className={className}
      draggable={false}
      loading="eager"
      decoding="sync"
      {...props}
    />
  );
}

export default CardSprite;
