"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatCoins, formatCps } from "@/lib/formatNumber";
import { getEmpireRank } from "@/lib/milestones";
import { CrownIcon, GearIcon, TrendIcon, BoltIcon, CoinIcon } from "./Icons";

interface HUDProps {
  coins: number;
  clickValue: number;
  coinsPerSecond: number;
  totalCoinsEarned: number;
  onSettings: () => void;
}

export default function HUD({ coins, clickValue, coinsPerSecond, totalCoinsEarned, onSettings }: HUDProps) {
  const [animKey, setAnimKey] = useState(0);
  const prevRef = useRef(coins);
  const { title: rankTitle } = getEmpireRank(totalCoinsEarned);

  useEffect(() => {
    if (Math.abs(coins - prevRef.current) > 0.5) {
      setAnimKey((k) => k + 1);
      prevRef.current = coins;
    }
  }, [coins]);

  return (
    <header className="hud">
      {/* Logo */}
      <div className="hud-logo" style={{ minWidth: 130 }}>
        <CoinIcon size={16} color="var(--c-gold)" />
        Pizza Empire
      </div>

      {/* Coins */}
      <div className="hud-stat" style={{ flex: 1 }}>
        <span className="hud-stat-label">Coins</span>
        <span
          key={animKey}
          className="hud-stat-value gold-shimmer num-pop"
          style={{ fontSize: "1.15rem" }}
          aria-live="polite"
          aria-label={`${Math.floor(coins)} coins`}
        >
          {formatCoins(coins)}
        </span>
      </div>

      {/* Per click */}
      <div className="hud-stat" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 70 }}>
        <span className="hud-stat-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <BoltIcon size={9} color="var(--c-dim)" /> Per Click
        </span>
        <span className="hud-stat-value" style={{ fontSize: "0.85rem" }}>
          {formatCoins(clickValue)}
        </span>
      </div>

      {/* Per second */}
      <div className="hud-stat" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 80 }}>
        <span className="hud-stat-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TrendIcon size={9} color="var(--c-dim)" /> Per Second
        </span>
        <span className="hud-stat-value" style={{ fontSize: "0.85rem" }}>
          {formatCps(coinsPerSecond)}
        </span>
      </div>

      {/* Rank */}
      <div className="hud-rank" style={{ display: "flex" }}>
        <CrownIcon size={13} color="var(--c-gold-hi)" />
        <span className="hud-rank-text">{rankTitle}</span>
      </div>

      {/* Settings */}
      <button
        className="icon-btn"
        onClick={onSettings}
        aria-label="Settings"
        title="Settings"
      >
        <GearIcon size={16} />
      </button>
    </header>
  );
}
