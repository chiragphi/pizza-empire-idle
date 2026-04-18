"use client";

import React, {
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import dynamic from "next/dynamic";

import { GameState, GameAction, ToastMessage } from "@/lib/gameState";
import { gameReducer, computeDerivedStats, calculateOfflineEarnings } from "@/lib/gameLoop";
import { saveGame, loadGame, resetGame, getLastCloseTime, setCloseTime, getInitialState } from "@/lib/storage";
import { checkNewMilestones, getMilestoneById, MILESTONES } from "@/lib/milestones";
import { UPGRADES } from "@/lib/upgrades";
import { WORKERS } from "@/lib/workers";
import {
  playClickSound,
  playCoinSound,
  playPurchaseSound,
  playMilestoneSound,
  startAmbientSound,
  setMuted,
  resumeAudio,
} from "@/lib/audio";
import {
  createClickParticles,
  createCoinParticles,
  createConfettiParticles,
  createSparkleParticles,
  Particle,
} from "@/lib/particles";
import { formatCoins, formatDuration } from "@/lib/formatNumber";

import HUD from "./HUD";
import ClickTarget from "./ClickTarget";
import UpgradeShop from "./UpgradeShop";
import WorkersPanel from "./WorkersPanel";
import MilestoneLog from "./MilestoneLog";
import ToastContainer from "./Toast";
import SettingsModal from "./SettingsModal";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

let toastIdCounter = 0;

function makeToastId() {
  return `toast_${++toastIdCounter}_${Date.now()}`;
}

interface OfflinePopup {
  show: boolean;
  coins: number;
  duration: number;
}

export default function Game() {
  const [gameState, dispatch] = useReducer(gameReducer, null, () => {
    const initial = getInitialState();
    return initial;
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showMilestoneOverlay, setShowMilestoneOverlay] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [offlinePopup, setOfflinePopup] = useState<OfflinePopup>({ show: false, coins: 0, duration: 0 });
  const [hydrated, setHydrated] = useState(false);

  const gameStateRef = useRef(gameState);
  const lastSaveRef = useRef(Date.now());
  const milestoneQueueRef = useRef<string[]>([]);
  const showingMilestoneRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  gameStateRef.current = gameState;

  // Add toast helper
  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    dispatch({
      type: "ADD_TOAST",
      toast: { ...toast, id: makeToastId() },
    });
  }, []);

  // Process milestone queue
  const processMilestoneQueue = useCallback(() => {
    if (showingMilestoneRef.current || milestoneQueueRef.current.length === 0) return;
    const nextId = milestoneQueueRef.current.shift()!;
    const milestone = getMilestoneById(nextId);
    if (!milestone) {
      processMilestoneQueue();
      return;
    }
    showingMilestoneRef.current = true;
    setCurrentMilestone(nextId);
    setShowMilestoneOverlay(true);
    playMilestoneSound(gameStateRef.current.settings.muted, milestone.audioType);

    // Add confetti particles from center
    setParticles((prev) => [
      ...prev,
      ...createConfettiParticles(
        typeof window !== "undefined" ? window.innerWidth / 2 : 600,
        typeof window !== "undefined" ? window.innerHeight / 2 : 300,
        60
      ),
    ]);

    // Add toast too
    addToast({
      icon: milestone.icon,
      message: milestone.name,
      type: "milestone",
    });
  }, [addToast]);

  // Load save on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      dispatch({ type: "LOAD_SAVE", state: saved });

      // Calculate offline earnings
      const lastClose = getLastCloseTime();
      const savedState = { ...getInitialState(), ...saved };
      const derived = computeDerivedStats(savedState as GameState);
      const offlineCoins = calculateOfflineEarnings(derived.coinsPerSecond, lastClose);

      if (offlineCoins > 0) {
        const elapsed = (Date.now() - lastClose) / 1000;
        dispatch({ type: "APPLY_OFFLINE_EARNINGS", coins: offlineCoins });
        setOfflinePopup({
          show: true,
          coins: offlineCoins,
          duration: Math.min(elapsed, 4 * 3600),
        });
        addToast({
          icon: "⏰",
          message: `Welcome back! Earned ${formatCoins(offlineCoins)} while away.`,
          type: "info",
        });
      }
    }

    setHydrated(true);
    startAmbientSound(false);

    return () => {
      setCloseTime();
      const state = gameStateRef.current;
      saveGame(state);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main game tick (1/10 second)
  useEffect(() => {
    if (!hydrated) return;

    tickRef.current = setInterval(() => {
      dispatch({ type: "TICK", delta: 0.1 });

      // Check milestones
      const state = gameStateRef.current;
      const newMs = checkNewMilestones(state);
      for (const m of newMs) {
        if (!state.milestones[m.id]?.unlocked) {
          // Mark unlocked in state
          state.milestones[m.id] = { id: m.id, unlocked: true, unlockedAt: Date.now() };
          milestoneQueueRef.current.push(m.id);
        }
      }

      if (!showingMilestoneRef.current && milestoneQueueRef.current.length > 0) {
        processMilestoneQueue();
      }

      // Passive coin particles
      if (state.coinsPerSecond > 0 && Math.random() < 0.05) {
        setParticles((prev) => [
          ...prev.slice(-80),
          ...createCoinParticles(
            typeof window !== "undefined" ? window.innerWidth * 0.35 + Math.random() * 100 : 400,
            typeof window !== "undefined" ? window.innerHeight * 0.45 : 300,
            1
          ),
        ]);
      }

      // Auto-save every 30s
      if (Date.now() - lastSaveRef.current > 30000) {
        saveGame(gameStateRef.current);
        lastSaveRef.current = Date.now();
      }
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [hydrated, processMilestoneQueue]);

  // Sync mute state
  useEffect(() => {
    setMuted(gameState.settings.muted);
  }, [gameState.settings.muted]);

  // Handle click
  const handleClickPizza = useCallback(
    (x: number, y: number) => {
      resumeAudio();
      dispatch({ type: "CLICK" });
      playClickSound(gameStateRef.current.settings.muted);

      // Particle burst at click position
      setParticles((prev) => [
        ...prev.slice(-100),
        ...createClickParticles(x, y, 5),
      ]);

      // Coin sound slightly delayed
      setTimeout(() => {
        playCoinSound(gameStateRef.current.settings.muted);
      }, 60);
    },
    []
  );

  // Handle buy upgrade
  const handleBuyUpgrade = useCallback(
    (upgradeId: string) => {
      const state = gameStateRef.current;
      const upgrade = UPGRADES.find((u) => u.id === upgradeId);
      if (!upgrade || state.upgrades[upgradeId]?.owned) return;
      if (state.coins < upgrade.baseCost) return;

      playPurchaseSound(state.settings.muted);
      dispatch({ type: "BUY_UPGRADE", upgradeId });

      // Sparkle particles
      setParticles((prev) => [
        ...prev,
        ...createSparkleParticles(
          typeof window !== "undefined" ? window.innerWidth * 0.15 : 200,
          typeof window !== "undefined" ? window.innerHeight * 0.5 : 300,
          10
        ),
      ]);

      addToast({
        icon: upgrade.icon,
        message: `Upgraded: ${upgrade.name}!`,
        type: "purchase",
      });
    },
    [addToast]
  );

  // Handle buy worker
  const handleBuyWorker = useCallback(
    (workerId: string, count: number = 1) => {
      const state = gameStateRef.current;
      const worker = WORKERS.find((w) => w.id === workerId);
      if (!worker) return;

      playPurchaseSound(state.settings.muted);
      dispatch({ type: "BUY_WORKER", workerId, count });

      addToast({
        icon: worker.icon,
        message: `Hired: ${worker.name}!`,
        type: "purchase",
      });
    },
    [addToast]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    resetGame();
    dispatch({ type: "RESET_GAME" });
    setParticles([]);
    milestoneQueueRef.current = [];
    showingMilestoneRef.current = false;
    setShowMilestoneOverlay(false);
    setCurrentMilestone(null);
  }, []);

  // Handle milestone dismiss
  const handleDismissMilestone = useCallback(() => {
    setShowMilestoneOverlay(false);
    setCurrentMilestone(null);
    showingMilestoneRef.current = false;
    // Process next in queue
    setTimeout(processMilestoneQueue, 500);
  }, [processMilestoneQueue]);

  const workerCounts: Record<string, number> = {};
  for (const [id, ws] of Object.entries(gameState.workers)) {
    workerCounts[id] = ws.count;
  }

  const currentMilestoneData = currentMilestone
    ? getMilestoneById(currentMilestone) ?? null
    : null;

  if (!hydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="text-7xl mb-4 pizza-float">🍕</div>
          <div
            className="text-neon font-display text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pizza Empire
          </div>
          <div
            className="text-cream/40 text-sm mt-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Preheating ovens...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout" style={{ height: "100dvh" }}>
      {/* HUD */}
      <HUD
        coins={gameState.coins}
        coinsPerSecond={gameState.coinsPerSecond}
        totalCoinsEarned={gameState.totalCoinsEarned}
        onSettings={() => setShowSettings(true)}
      />

      {/* Main content */}
      <div className="game-main" style={{ minHeight: 0 }}>
        {/* Left/Canvas area */}
        <div className="game-canvas-area" style={{ minHeight: 0 }}>
          {/* World Canvas (60% height) */}
          <div style={{ flex: "0 0 60%", minHeight: 0, position: "relative" }}>
            <WorldCanvas
              buildingStage={gameState.buildingStage}
              workerCounts={workerCounts}
              particles={particles}
              onParticlesUpdate={setParticles}
            />
          </div>

          {/* Bottom: Click target + milestones */}
          <div className="game-bottom-panel" style={{ flex: "1 1 40%", minHeight: 0 }}>
            {/* Click area */}
            <div
              className="relative overflow-hidden border-r"
              style={{ borderColor: "rgba(232,53,42,0.2)" }}
            >
              <div className="absolute inset-0 checkered opacity-30" />
              <ClickTarget
                clickValue={gameState.clickValue}
                totalClicks={gameState.totalClicks}
                onClickPizza={handleClickPizza}
              />
            </div>

            {/* Milestones */}
            <div
              className="game-panel overflow-hidden m-2"
              style={{ height: "calc(100% - 1rem)" }}
            >
              <MilestoneLog gameState={gameState} />
            </div>
          </div>
        </div>

        {/* Right side panel */}
        <div className="game-side-panel">
          {/* Upgrades */}
          <div
            className="flex-1 overflow-hidden border-b"
            style={{ borderColor: "rgba(232,53,42,0.15)" }}
          >
            <UpgradeShop gameState={gameState} onBuyUpgrade={handleBuyUpgrade} />
          </div>
          {/* Workers */}
          <div className="flex-1 overflow-hidden">
            <WorkersPanel gameState={gameState} onBuyWorker={handleBuyWorker} />
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer
        toasts={gameState.toasts}
        onDismiss={(id) => dispatch({ type: "REMOVE_TOAST", id })}
      />

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          muted={gameState.settings.muted}
          onToggleMute={() => dispatch({ type: "TOGGLE_MUTE" })}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Milestone overlay */}
      {showMilestoneOverlay && currentMilestoneData && (
        <div
          className="milestone-overlay"
          onClick={handleDismissMilestone}
          role="dialog"
          aria-modal="true"
          aria-label={`Milestone unlocked: ${currentMilestoneData.name}`}
        >
          <div
            className="milestone-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-7xl mb-4"
              style={{ animation: "pizzaFloat 2s ease-in-out infinite" }}
            >
              {currentMilestoneData.icon}
            </div>
            <h2
              className="text-2xl font-bold text-neon mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {currentMilestoneData.name}
            </h2>
            <p
              className="text-cream/70 text-sm mb-4 leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {currentMilestoneData.celebrationText}
            </p>
            <div className="flex justify-center gap-1 mb-5">
              {["🍕", "🧀", "🍅", "✨", "🍕"].map((e, i) => (
                <span
                  key={i}
                  className="text-xl"
                  style={{
                    animation: `confettiFall ${0.5 + i * 0.15}s ease-out forwards`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
            <button
              className="btn-primary w-full"
              onClick={handleDismissMilestone}
              autoFocus
            >
              Keep Building the Empire! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Offline earnings popup */}
      {offlinePopup.show && (
        <div
          className="offline-popup"
          onClick={() => setOfflinePopup((p) => ({ ...p, show: false }))}
          role="dialog"
          aria-modal="true"
          aria-label="Offline earnings"
        >
          <div className="text-5xl mb-3">⏰</div>
          <h2
            className="text-xl font-bold text-neon mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome Back!
          </h2>
          <p
            className="text-cream/70 text-sm mb-1"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Your staff kept working while you were away.
          </p>
          <p
            className="text-cream/50 text-xs mb-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            ({formatDuration(offlinePopup.duration)} offline)
          </p>
          <div
            className="coin-display text-3xl font-bold mb-5"
          >
            🪙 +{formatCoins(offlinePopup.coins)}
          </div>
          <button
            className="btn-primary"
            onClick={() => setOfflinePopup((p) => ({ ...p, show: false }))}
            autoFocus
          >
            Claim Earnings!
          </button>
        </div>
      )}
    </div>
  );
}
