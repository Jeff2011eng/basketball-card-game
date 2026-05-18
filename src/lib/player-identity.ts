const STORAGE_KEY = 'nba_battle_player_id';

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setPlayerId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
}
