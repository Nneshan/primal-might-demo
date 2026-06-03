import * as cardApi from '../api/cardApi';
import { getFactionCardBackUrl } from '../factions';

/** @type {Map<string, Promise<void>>} */
const preloadByUrl = new Map();
/** @type {Map<string, string>} resolved or raw path -> blob object URL */
const spriteSrcByUrl = new Map();
let catalogPreloadPromise = null;

export function resolveSpriteUrl(url) {
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

function rememberSpriteSrc(originalUrl, objectUrl) {
  spriteSrcByUrl.set(originalUrl, objectUrl);
  const resolved = resolveSpriteUrl(originalUrl);
  if (resolved) {
    spriteSrcByUrl.set(resolved, objectUrl);
  }
}

/** Use after preload so <img> shows the same bytes that were prefetched. */
export function getSpriteSrc(url) {
  if (!url) {
    return '';
  }
  return spriteSrcByUrl.get(url) ?? spriteSrcByUrl.get(resolveSpriteUrl(url)) ?? url;
}

async function preloadUrl(url) {
  const resolved = resolveSpriteUrl(url);
  if (!resolved) {
    return;
  }
  if (spriteSrcByUrl.has(url) || spriteSrcByUrl.has(resolved)) {
    return;
  }
  const existing = preloadByUrl.get(resolved);
  if (existing) {
    return existing;
  }

  const pending = fetch(resolved)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Sprite failed (${response.status}): ${resolved}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      rememberSpriteSrc(url, objectUrl);
    });

  preloadByUrl.set(resolved, pending);
  return pending;
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

function loadCatalogSprites() {
  return cardApi.getAllCards().then((cards) =>
    preloadSpriteUrls([
      ...collectSpriteUrlsFromCards(cards),
      getFactionCardBackUrl('MIGHT'),
    ])
  );
}

export function preloadCatalogSprites() {
  if (!catalogPreloadPromise) {
    catalogPreloadPromise = loadCatalogSprites().catch((err) => {
      catalogPreloadPromise = null;
      throw err;
    });
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

/** Visible hand/board first, then the rest of the catalog. */
export async function ensureSpritesReady(game) {
  if (game) {
    await preloadSpritesFromGameState(game);
  }
  await preloadCatalogSprites();
}
