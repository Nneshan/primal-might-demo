import { API_BASE } from '../config';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Ошибка ${response.status}`);
  }
  return data;
}

export function createGame() {
  return request('/api/games', { method: 'POST' });
}

export function getGame(gameId) {
  return request(`/api/games/${gameId}`);
}

export function playCard(gameId, handIndex) {
  return request(`/api/games/${gameId}/play-card`, {
    method: 'POST',
    body: JSON.stringify({ handIndex }),
  });
}

export function endPlayPhase(gameId) {
  return request(`/api/games/${gameId}/end-play-phase`, { method: 'POST' });
}

export function attack(gameId, attackerInstanceId, targetType, targetInstanceId) {
  return request(`/api/games/${gameId}/attack`, {
    method: 'POST',
    body: JSON.stringify({ attackerInstanceId, targetType, targetInstanceId }),
  });
}

export function skipAttack(gameId) {
  return request(`/api/games/${gameId}/skip-attack`, { method: 'POST' });
}

export function endAttackPhase(gameId) {
  return request(`/api/games/${gameId}/end-attack-phase`, { method: 'POST' });
}

export function resolveAncientKnowledge(gameId, pickedInstanceId) {
  return request(`/api/games/${gameId}/ancient-knowledge`, {
    method: 'POST',
    body: JSON.stringify({ pickedInstanceId }),
  });
}
