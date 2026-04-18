import { GameState, INITIAL_GAME_STATE } from "./gameState";

const SAVE_KEY = "pizza_empire_save_v2";
const CLOSE_TIME_KEY = "pizza_empire_close_time";

export function saveGame(state: GameState): void {
  try {
    const saveData = {
      coins: state.coins,
      totalCoinsEarned: state.totalCoinsEarned,
      upgrades: state.upgrades,
      workers: state.workers,
      milestones: state.milestones,
      totalClicks: state.totalClicks,
      settings: state.settings,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    localStorage.setItem(CLOSE_TIME_KEY, Date.now().toString());
  } catch {
    // Storage might be full
  }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data as Partial<GameState>;
  } catch {
    return null;
  }
}

export function getLastCloseTime(): number {
  try {
    const t = localStorage.getItem(CLOSE_TIME_KEY);
    return t ? parseInt(t, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

export function setCloseTime(): void {
  try {
    localStorage.setItem(CLOSE_TIME_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

export function resetGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(CLOSE_TIME_KEY);
  } catch {
    // ignore
  }
}

export function getInitialState(): GameState {
  return JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
}
