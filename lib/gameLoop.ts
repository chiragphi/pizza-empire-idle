import { GameState, GameAction } from "./gameState";
import { UPGRADES } from "./upgrades";
import { WORKERS, getWorkerCost } from "./workers";
import { checkNewMilestones } from "./milestones";

export function computeDerivedStats(state: GameState): {
  clickValue: number;
  coinsPerSecond: number;
  buildingStage: number;
} {
  let clickValue = 1;
  let coinsPerSecond = 0;

  // Apply upgrades
  let clickMultiplier = 1;
  let cpsMultiplier = 1;

  for (const upgrade of UPGRADES) {
    if (state.upgrades[upgrade.id]?.owned) {
      clickValue += upgrade.clickBonus;
      coinsPerSecond += upgrade.cpsBonus;
      clickMultiplier *= upgrade.clickMultiplier;
      cpsMultiplier *= upgrade.cpsMultiplier;
    }
  }

  // Apply workers
  for (const worker of WORKERS) {
    const count = state.workers[worker.id]?.count ?? 0;
    coinsPerSecond += worker.baseCps * count;
  }

  clickValue *= clickMultiplier;
  coinsPerSecond *= cpsMultiplier;

  // Building stage: 0-3 based on owned upgrades
  const ownedUpgrades = Object.values(state.upgrades).filter((u) => u.owned).length;
  const buildingStage =
    ownedUpgrades >= 10 ? 3 :
    ownedUpgrades >= 6  ? 2 :
    ownedUpgrades >= 3  ? 1 : 0;

  return { clickValue, coinsPerSecond, buildingStage };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CLICK": {
      const { clickValue } = computeDerivedStats(state);
      return {
        ...state,
        coins: state.coins + clickValue,
        totalCoinsEarned: state.totalCoinsEarned + clickValue,
        totalClicks: state.totalClicks + 1,
        clickValue,
      };
    }

    case "BUY_UPGRADE": {
      const upgrade = UPGRADES.find((u) => u.id === action.upgradeId);
      if (!upgrade) return state;
      if (state.upgrades[action.upgradeId]?.owned) return state;
      if (state.coins < upgrade.baseCost) return state;

      const newState = {
        ...state,
        coins: state.coins - upgrade.baseCost,
        upgrades: {
          ...state.upgrades,
          [action.upgradeId]: { id: action.upgradeId, owned: true },
        },
      };
      const derived = computeDerivedStats(newState);
      return {
        ...newState,
        clickValue: derived.clickValue,
        coinsPerSecond: derived.coinsPerSecond,
        buildingStage: derived.buildingStage,
      };
    }

    case "BUY_WORKER": {
      const worker = WORKERS.find((w) => w.id === action.workerId);
      if (!worker) return state;
      const currentCount = state.workers[action.workerId]?.count ?? 0;
      const count = action.count ?? 1;
      let totalCost = 0;
      for (let i = 0; i < count; i++) {
        totalCost += getWorkerCost(worker, currentCount + i);
      }
      if (state.coins < totalCost) return state;

      const newState = {
        ...state,
        coins: state.coins - totalCost,
        workers: {
          ...state.workers,
          [action.workerId]: {
            id: action.workerId,
            count: currentCount + count,
          },
        },
      };
      const derived = computeDerivedStats(newState);
      return {
        ...newState,
        clickValue: derived.clickValue,
        coinsPerSecond: derived.coinsPerSecond,
        buildingStage: derived.buildingStage,
      };
    }

    case "TICK": {
      const { coinsPerSecond, clickValue, buildingStage } = computeDerivedStats(state);
      const earned = coinsPerSecond * action.delta;
      return {
        ...state,
        coins: state.coins + earned,
        totalCoinsEarned: state.totalCoinsEarned + earned,
        coinsPerSecond,
        clickValue,
        buildingStage,
      };
    }

    case "APPLY_OFFLINE_EARNINGS": {
      return {
        ...state,
        coins: state.coins + action.coins,
        totalCoinsEarned: state.totalCoinsEarned + action.coins,
      };
    }

    case "TOGGLE_MUTE": {
      return {
        ...state,
        settings: { ...state.settings, muted: !state.settings.muted },
      };
    }

    case "RESET_GAME": {
      const { clickValue, coinsPerSecond, buildingStage } = computeDerivedStats({
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
        settings: state.settings,
        buildingStage: 0,
        toasts: [],
        showMilestoneOverlay: false,
        currentMilestoneOverlay: null,
      });
      return {
        coins: 0,
        totalCoinsEarned: 0,
        coinsPerSecond,
        clickValue,
        upgrades: {},
        workers: {},
        milestones: {},
        lastSaveTime: Date.now(),
        lastTabCloseTime: Date.now(),
        totalClicks: 0,
        settings: state.settings,
        buildingStage,
        toasts: [],
        showMilestoneOverlay: false,
        currentMilestoneOverlay: null,
      };
    }

    case "LOAD_SAVE": {
      const merged = { ...state, ...action.state };
      const derived = computeDerivedStats(merged);
      return {
        ...merged,
        clickValue: derived.clickValue,
        coinsPerSecond: derived.coinsPerSecond,
        buildingStage: derived.buildingStage,
        toasts: [],
        showMilestoneOverlay: false,
        currentMilestoneOverlay: null,
      };
    }

    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [...state.toasts.slice(-4), action.toast],
      };
    }

    case "REMOVE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    }

    case "DISMISS_MILESTONE_OVERLAY": {
      return {
        ...state,
        showMilestoneOverlay: false,
        currentMilestoneOverlay: null,
      };
    }

    default:
      return state;
  }
}

export function calculateOfflineEarnings(
  coinsPerSecond: number,
  lastCloseTime: number
): number {
  const now = Date.now();
  const elapsed = (now - lastCloseTime) / 1000; // seconds
  const cappedElapsed = Math.min(elapsed, 4 * 3600); // cap at 4 hours
  if (cappedElapsed < 10) return 0; // less than 10s, not worth showing
  return coinsPerSecond * cappedElapsed;
}

export function checkAndUnlockMilestones(
  state: GameState,
  dispatch: (action: GameAction) => void,
  onMilestone: (milestoneId: string) => void
): void {
  const newMilestones = checkNewMilestones(state);
  for (const m of newMilestones) {
    // Mark as unlocked
    state.milestones[m.id] = { id: m.id, unlocked: true, unlockedAt: Date.now() };
    onMilestone(m.id);
  }
}
