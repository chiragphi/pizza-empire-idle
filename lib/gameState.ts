export interface UpgradeState {
  id: string;
  owned: boolean;
}

export interface WorkerState {
  id: string;
  count: number;
}

export interface MilestoneState {
  id: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ToastMessage {
  id: string;
  icon: string;
  message: string;
  type: "milestone" | "purchase" | "unlock" | "info";
  exiting?: boolean;
}

export interface GameState {
  coins: number;
  totalCoinsEarned: number;
  coinsPerSecond: number;
  clickValue: number;
  upgrades: Record<string, UpgradeState>;
  workers: Record<string, WorkerState>;
  milestones: Record<string, MilestoneState>;
  lastSaveTime: number;
  lastTabCloseTime: number;
  totalClicks: number;
  settings: {
    muted: boolean;
  };
  buildingStage: number; // 0-3 based on progress
  toasts: ToastMessage[];
  showMilestoneOverlay: boolean;
  currentMilestoneOverlay: string | null;
}

export const INITIAL_GAME_STATE: GameState = {
  coins: 0,
  totalCoinsEarned: 0,
  coinsPerSecond: 0,
  clickValue: 1,
  upgrades: {},
  workers: {},
  milestones: {},
  lastSaveTime: Date.now(),
  lastTabCloseTime: Date.now(),
  totalClicks: 0,
  settings: {
    muted: false,
  },
  buildingStage: 0,
  toasts: [],
  showMilestoneOverlay: false,
  currentMilestoneOverlay: null,
};

export type GameAction =
  | { type: "CLICK" }
  | { type: "BUY_UPGRADE"; upgradeId: string }
  | { type: "BUY_WORKER"; workerId: string; count?: number }
  | { type: "TICK"; delta: number }
  | { type: "APPLY_OFFLINE_EARNINGS"; coins: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "RESET_GAME" }
  | { type: "LOAD_SAVE"; state: Partial<GameState> }
  | { type: "ADD_TOAST"; toast: ToastMessage }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "DISMISS_MILESTONE_OVERLAY" };
