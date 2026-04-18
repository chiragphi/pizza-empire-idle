"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatCoins, formatCps } from "@/lib/formatNumber";
import { getEmpireRank } from "@/lib/milestones";

interface HUDProps {
  coins: number;
  coinsPerSecond: number;
  totalCoinsEarned: number;
  onSettings: () => void;
}

export default function HUD({ coins, coinsPerSecond, totalCoinsEarned, onSettings }: HUDProps) {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [ticking, setTicking] = useState(false);
  const prevCoinsRef = useRef(coins);
  const rank = getEmpireRank(totalCoinsEarned);

  useEffect(() => {
    if (Math.abs(coins - prevCoinsRef.current) > 0.01) {
      setTicking(true);
      const t = setTimeout(() => setTicking(false), 150);
      setDisplayCoins(coins);
      prevCoinsRef.current = coins;
      return () => clearTimeout(t);
    }
  }, [coins]);

  return (
    <div className="hud-bar px-4 py-2 flex items-center justify-between gap-4 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xl">🍕</span>
        <span
          className="font-display font-bold text-sm md:text-base neon-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pizza Empire
        </span>
      </div>

      {/* Coins */}
      <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
        <div
          className={`coin-display text-2xl md:text-3xl font-bold tabular-nums ${ticking ? "number-tick updating" : "number-tick"}`}
        >
          🪙 {formatCoins(displayCoins)}
        </div>
        <div className="text-xs text-cream/60 font-body">
          {formatCps(coinsPerSecond)}/sec
        </div>
      </div>

      {/* Empire rank */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <div className="empire-rank text-xs font-display">
          {rank.emoji} {rank.title}
        </div>
        <div className="text-xs text-cream/40 font-body tabular-nums">
          Total: {formatCoins(totalCoinsEarned)}
        </div>
      </div>

      {/* Settings */}
      <button
        onClick={onSettings}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-cream/60 hover:text-cream hover:bg-white/10 transition-all text-base"
        title="Settings"
        aria-label="Open settings"
      >
        ⚙️
      </button>
    </div>
  );
}
