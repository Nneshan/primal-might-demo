import * as cardApi from '../api/cardApi';

const preloaded = new Set();
let catalogPreloadPromise = null;

function resolveSpriteUrl(url) {
  if (!url) {
    return null;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

function preloadUrl(url) {
  const resolved = resolveSpriteUrl(url);
  if (!resolved || preloaded.has(resolved)) {
    return Promise.resolve();
  }
  preloaded.add(resolved);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'sync';
    img.loading = 'eager';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = resolved;
  });
}

export function collectSpriteUrlsFromCards(cards) {
  const urls = new Set();
  for (const card of cards ?? []) {
    if (card.spriteHand) {
      urls.add(card.spriteHand);
    }
    if (card.spriteBoard) {
      urls.add(card.spriteBoard);
    }
  }
  return [...urls];
}

export function preloadSpriteUrls(urls) {
  return Promise.all(urls.map(preloadUrl));
}

export function preloadCatalogSprites() {
  if (!catalogPreloadPromise) {
    catalogPreloadPromise = cardApi
      .getAllCards()
      .then((cards) => preloadSpriteUrls(collectSpriteUrlsFromCards(cards)))
      .catch(() => {});
  }
  return catalogPreloadPromise;
}

function addCardSprites(urls, card) {
  if (card?.spriteHand) {
    urls.add(card.spriteHand);
  }
  if (card?.spriteBoard) {
    urls.add(card.spriteBoard);
  }
}

export function preloadSpritesFromGameState(game) {
  if (!game) {
    return Promise.resolve();
  }
  const urls = new Set();
  game.playerHand?.forEach((item) => addCardSprites(urls, item.card));
  game.playerBoard?.forEach((creature) => addCardSprites(urls, creature.card));
  game.opponentBoard?.forEach((creature) => addCardSprites(urls, creature.card));
  game.scryOptions?.forEach((option) => addCardSprites(urls, option.card));
  return preloadSpriteUrls([...urls]);
}
