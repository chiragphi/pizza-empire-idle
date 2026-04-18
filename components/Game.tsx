"use client";

import React, {
  useReducer, useEffect, useRef, useCallback, useState,
} from "react";
import dynamic from "next/dynamic";

import { GameState, GameAction, ToastMessage } from "@/lib/gameState";
import { gameReducer, computeDerivedStats, calculateOfflineEarnings } from "@/lib/gameLoop";
import { saveGame, loadGame, resetGame, getLastCloseTime, setCloseTime, getInitialState } from "@/lib/storage";
import { checkNewMilestones, getMilestoneById, MILESTONES } from "@/lib/milestones";
import { UPGRADES } from "@/lib/upgrades";
import { WORKERS } from "@/lib/workers";
import {
  playClickSound, playCoinSound, playPurchaseSound,
  playMilestoneSound, startAmbientSound, setMuted, resumeAudio,
} from "@/lib/audio";
import {
  createClickParticles, createCoinParticles,
  createConfettiParticles, createSparkleParticles, Particle,
} from "@/lib/particles";
import { formatCoins, formatDuration } from "@/lib/formatNumber";
import { getEmpireRank } from "@/lib/milestones";

import HUD           from "./HUD";
import ClickTarget   from "./ClickTarget";
import UpgradeShop   from "./UpgradeShop";
import WorkersPanel  from "./WorkersPanel";
import MilestoneLog  from "./MilestoneLog";
import ToastContainer from "./Toast";
import SettingsModal from "./SettingsModal";
import {
  TrophyIcon, ClockIcon, CrownIcon, PizzaIcon,
  StarIcon, CheckIcon,
} from "./Icons";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

let _toastId = 0;
const makeToastId = () => `t_${++_toastId}_${Date.now()}`;

export default function Game() {
  const [gameState, dispatch] = useReducer(gameReducer, null, getInitialState);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [milestoneOverlay, setMilestoneOverlay] = useState<string | null>(null);
  const [offlineCoins, setOfflineCoins] = useState<{ amount: number; duration: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const lastSaveRef    = useRef(Date.now());
  const milestoneQueue = useRef<string[]>([]);
  const showingMs      = useRef(false);

  // ── Toast helper ─────────────────────────────────────
  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    dispatch({ type: "ADD_TOAST", toast: { ...msg, id: makeToastId() } });
  }, []);

  // ── Milestone queue processor ─────────────────────────
  const processMilestoneQueue = useCallback(() => {
    if (showingMs.current || milestoneQueue.current.length === 0) return;
    const id = milestoneQueue.current.shift()!;
    const m  = getMilestoneById(id);
    if (!m) { processMilestoneQueue(); return; }
    showingMs.current = true;
    setMilestoneOverlay(id);
    playMilestoneSound(stateRef.current.settings.muted, m.audioType);
    setParticles((prev) => [
      ...prev,
      ...createConfettiParticles(
        typeof window !== "undefined" ? window.innerWidth / 2 : 600,
        200,
        60
      ),
    ]);
    toast({ icon: "", message: m.name, type: "milestone" });
  }, [toast]);

  // ── Load save on mount ───────────────────────────────
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      dispatch({ type: "LOAD_SAVE", state: saved });
      const merged = { ...getInitialState(), ...saved };
      const derived = computeDerivedStats(merged as GameState);
      const offline = calculateOfflineEarnings(derived.coinsPerSecond, getLastCloseTime());
      if (offline > 0) {
        const dur = Math.min((Date.now() - getLastCloseTime()) / 1000, 4 * 3600);
        dispatch({ type: "APPLY_OFFLINE_EARNINGS", coins: offline });
        setOfflineCoins({ amount: offline, duration: dur });
      }
    }
    setHydrated(true);
    startAmbientSound(false);
    return () => { setCloseTime(); saveGame(stateRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tick ─────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      dispatch({ type: "TICK", delta: 0.1 });

      // Check milestones
      const s = stateRef.current;
      const newMs = checkNewMilestones(s);
      for (const m of newMs) {
        if (!s.milestones[m.id]?.unlocked) {
          s.milestones[m.id] = { id: m.id, unlocked: true, unlockedAt: Date.now() };
          milestoneQueue.current.push(m.id);
        }
      }
      if (!showingMs.current && milestoneQueue.current.length > 0) processMilestoneQueue();

      // Passive particle trickle
      if (s.coinsPerSecond > 0 && Math.random() < 0.04) {
        setParticles((prev) => [
          ...prev.slice(-60),
          ...createCoinParticles(
            typeof window !== "undefined" ? window.innerWidth * 0.5 + (Math.random() - 0.5) * 80 : 400,
            typeof window !== "undefined" ? window.innerHeight * 0.55 : 300,
            1
          ),
        ]);
      }

      // Auto-save
      if (Date.now() - lastSaveRef.current > 30000) {
        saveGame(stateRef.current);
        lastSaveRef.current = Date.now();
      }
    }, 100);
    return () => clearInterval(id);
  }, [hydrated, processMilestoneQueue]);

  // ── Mute sync ────────────────────────────────────────
  useEffect(() => { setMuted(gameState.settings.muted); }, [gameState.settings.muted]);

  // ── Click handler ────────────────────────────────────
  const handleClick = useCallback((x: number, y: number) => {
    resumeAudio();
    dispatch({ type: "CLICK" });
    playClickSound(stateRef.current.settings.muted);
    setParticles((prev) => [...prev.slice(-80), ...createClickParticles(x, y, 4)]);
    setTimeout(() => playCoinSound(stateRef.current.settings.muted), 60);
  }, []);

  // ── Buy upgrade ──────────────────────────────────────
  const handleBuyUpgrade = useCallback((upgradeId: string) => {
    const s = stateRef.current;
    const u = UPGRADES.find((u) => u.id === upgradeId);
    if (!u || s.upgrades[upgradeId]?.owned || s.coins < u.baseCost) return;
    playPurchaseSound(s.settings.muted);
    dispatch({ type: "BUY_UPGRADE", upgradeId });
    setParticles((prev) => [
      ...prev,
      ...createSparkleParticles(
        typeof window !== "undefined" ? 140 : 200,
        typeof window !== "undefined" ? window.innerHeight * 0.5 : 300,
        8
      ),
    ]);
    toast({ icon: "", message: `Upgraded: ${u.name}`, type: "purchase" });
  }, [toast]);

  // ── Buy worker ───────────────────────────────────────
  const handleBuyWorker = useCallback((workerId: string, count = 1) => {
    const s = stateRef.current;
    const w = WORKERS.find((w) => w.id === workerId);
    if (!w) return;
    playPurchaseSound(s.settings.muted);
    dispatch({ type: "BUY_WORKER", workerId, count });
    toast({ icon: "", message: `Hired: ${w.name}`, type: "purchase" });
  }, [toast]);

  // ── Reset ────────────────────────────────────────────
  const handleReset = useCallback(() => {
    resetGame();
    dispatch({ type: "RESET_GAME" });
    setParticles([]);
    milestoneQueue.current = [];
    showingMs.current = false;
    setMilestoneOverlay(null);
  }, []);

  const dismissMilestone = useCallback(() => {
    setMilestoneOverlay(null);
    showingMs.current = false;
    setTimeout(processMilestoneQueue, 500);
  }, [processMilestoneQueue]);

  const workerCounts: Record<string, number> = {};
  for (const [id, ws] of Object.entries(gameState.workers)) {
    workerCounts[id] = ws.count;
  }

  const currentMs = milestoneOverlay ? getMilestoneById(milestoneOverlay) : null;
  const { title: rankTitle } = getEmpireRank(gameState.totalCoinsEarned);

  // ── Loading screen ───────────────────────────────────
  if (!hydrated) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--c-bg)", gap: 16,
      }}>
        <div className="bobble">
          <PizzaIcon size={72} color="var(--c-gold)" />
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem", fontWeight: 700, fontStyle: "italic",
          color: "var(--c-gold-hi)",
        }}>
          Pizza Empire
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--c-dim)" }}>
          Preheating ovens...
        </p>
      </div>
    );
  }

  return (
    <div className="game-root">
      {/* ── HUD ── */}
      <HUD
        coins={gameState.coins}
        clickValue={gameState.clickValue}
        coinsPerSecond={gameState.coinsPerSecond}
        totalCoinsEarned={gameState.totalCoinsEarned}
        onSettings={() => setShowSettings(true)}
      />

      {/* ── Body: 3 columns ── */}
      <div className="game-body">

        {/* LEFT: Upgrades */}
        <div className="panel" style={{ borderLeft: "none" }}>
          <UpgradeShop gameState={gameState} onBuyUpgrade={handleBuyUpgrade} />
        </div>

        {/* CENTER: Canvas world + click target */}
        <div className="center-col">
          {/* 2D world */}
          <div className="canvas-world">
            <WorldCanvas
              buildingStage={gameState.buildingStage}
              workerCounts={workerCounts}
              particles={particles}
              onParticlesUpdate={setParticles}
            />
          </div>

          {/* Click target */}
          <ClickTarget
            clickValue={gameState.clickValue}
            coinsPerSecond={gameState.coinsPerSecond}
            totalClicks={gameState.totalClicks}
            onClickPizza={handleClick}
          />
        </div>

        {/* RIGHT: Workers + Milestones */}
        <div className="panel" style={{ borderRight: "none" }}>
          {/* Workers (top 60%) */}
          <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", overflow: "hidden", borderBottom: "1px solid var(--c-border)" }}>
            <WorkersPanel gameState={gameState} onBuyWorker={handleBuyWorker} />
          </div>
          {/* Milestones (bottom 40%) */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <MilestoneLog gameState={gameState} />
          </div>
        </div>
      </div>

      {/* ── Toasts ── */}
      <ToastContainer
        toasts={gameState.toasts}
        onDismiss={(id) => dispatch({ type: "REMOVE_TOAST", id })}
      />

      {/* ── Settings Modal ── */}
      {showSettings && (
        <SettingsModal
          muted={gameState.settings.muted}
          onToggleMute={() => dispatch({ type: "TOGGLE_MUTE" })}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Milestone Overlay ── */}
      {milestoneOverlay && currentMs && (
        <div
          className="overlay-backdrop"
          onClick={dismissMilestone}
          role="dialog"
          aria-modal="true"
        >
          <div className="milestone-modal" onClick={(e) => e.stopPropagation()}>
            <div className="milestone-icon-ring">
              <TrophyIcon size={36} color="var(--c-gold-hi)" />
            </div>

            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem", fontWeight: 700, fontStyle: "italic",
              color: "var(--c-gold-hi)", marginBottom: 10,
            }}>
              {currentMs.name}
            </h2>

            <p style={{
              fontSize: "0.85rem", color: "var(--c-dim)",
              lineHeight: 1.6, marginBottom: 24,
            }}>
              {currentMs.celebrationText}
            </p>

            {/* Progress stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
              {MILESTONES.map((m) => (
                <StarIcon
                  key={m.id}
                  size={16}
                  color={
                    gameState.milestones[m.id]?.unlocked
                      ? "var(--c-gold)"
                      : "rgba(255,255,255,0.1)"
                  }
                />
              ))}
            </div>

            {/* Rank display */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px",
              background: "var(--c-gold-soft)",
              border: "1px solid rgba(212,149,42,0.2)",
              borderRadius: 20, marginBottom: 24,
            }}>
              <CrownIcon size={14} color="var(--c-gold-hi)" />
              <span style={{
                fontSize: "0.78rem", fontFamily: "var(--font-display)",
                fontStyle: "italic", fontWeight: 700, color: "var(--c-gold-hi)",
              }}>
                {rankTitle}
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", fontSize: "0.9rem" }}
              onClick={dismissMilestone}
              autoFocus
            >
              Keep Building
            </button>
          </div>
        </div>
      )}

      {/* ── Offline popup ── */}
      {offlineCoins && (
        <div className="overlay-backdrop" onClick={() => setOfflineCoins(null)}>
          <div className="offline-popup" onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--c-gold-soft)",
              border: "1px solid rgba(212,149,42,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <ClockIcon size={28} color="var(--c-gold-hi)" />
            </div>

            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.3rem", fontWeight: 700, fontStyle: "italic",
              color: "var(--c-cream)", marginBottom: 8,
            }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--c-dim)", marginBottom: 4 }}>
              Your staff kept working while you were away.
            </p>
            <p style={{ fontSize: "0.68rem", color: "var(--c-ghost)", marginBottom: 20 }}>
              {formatDuration(offlineCoins.duration)} offline
            </p>

            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "2rem", fontWeight: 700,
              color: "var(--c-gold-hi)",
              marginBottom: 20,
            }}>
              +{formatCoins(offlineCoins.amount)}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px" }}
              onClick={() => setOfflineCoins(null)}
              autoFocus
            >
              <CheckIcon size={15} />
              Claim Earnings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
