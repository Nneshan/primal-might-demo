import { API_BASE } from '../config';

export function getAllCards() {
  return fetch(`${API_BASE}/api/cards`, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }
      return data;
    });
}
