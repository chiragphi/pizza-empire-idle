"use client";

import React from "react";
import { UPGRADES, Upgrade } from "@/lib/upgrades";
import { GameState } from "@/lib/gameState";
import { formatCoins } from "@/lib/formatNumber";

interface UpgradeShopProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

function UpgradeCard({
  upgrade,
  owned,
  canAfford,
  visible,
  onBuy,
}: {
  upgrade: Upgrade;
  owned: boolean;
  canAfford: boolean;
  visible: boolean;
  onBuy: () => void;
}) {
  const locked = !visible && !owned;

  let cardClass = "upgrade-card p-3 mb-2";
  if (owned) cardClass += " owned";
  else if (locked) cardClass += " locked";
  else if (canAfford) cardClass += " affordable";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !owned && !locked && canAfford) {
      e.preventDefault();
      onBuy();
    }
  };

  const statLine = [];
  if (upgrade.clickBonus > 0) statLine.push(`+${upgrade.clickBonus} click`);
  if (upgrade.cpsBonus > 0) statLine.push(`+${upgrade.cpsBonus}/sec`);
  if (upgrade.clickMultiplier > 1) statLine.push(`${upgrade.clickMultiplier}x click`);
  if (upgrade.cpsMultiplier > 1) statLine.push(`${upgrade.cpsMultiplier}x CPS`);

  return (
    <div
      className={cardClass}
      onClick={() => !owned && !locked && canAfford && onBuy()}
      onKeyDown={handleKeyDown}
      tabIndex={!owned && !locked ? 0 : -1}
      role={!owned && !locked ? "button" : "article"}
      aria-label={
        owned
          ? `${upgrade.name} — owned`
          : locked
          ? `${upgrade.name} — locked`
          : `Buy ${upgrade.name} for ${formatCoins(upgrade.baseCost)} coins`
      }
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="text-2xl shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
          style={{
            background: owned
              ? "rgba(255,233,74,0.1)"
              : "rgba(232,53,42,0.1)",
            fontSize: "1.4rem",
          }}
        >
          {locked ? "🔒" : upgrade.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-body font-semibold text-sm text-cream/90 truncate"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {upgrade.name}
            </span>
            {owned ? (
              <span className="shrink-0 text-xs text-neon/70 font-semibold">✓ Owned</span>
            ) : locked ? (
              <span className="shrink-0 text-xs text-cream/30">???</span>
            ) : (
              <span
                className={`shrink-0 text-xs font-bold tabular-nums ${
                  canAfford ? "text-basil" : "text-cream/40"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                🪙 {formatCoins(upgrade.baseCost)}
              </span>
            )}
          </div>

          {!locked && (
            <>
              <p className="text-xs text-cream/55 mt-0.5 leading-tight line-clamp-2">
                {upgrade.description}
              </p>
              {statLine.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {statLine.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        background: "rgba(45,106,79,0.2)",
                        color: "#90ee90",
                        border: "1px solid rgba(45,106,79,0.3)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UpgradeShop({ gameState, onBuyUpgrade }: UpgradeShopProps) {
  const { coins, totalCoinsEarned, upgrades } = gameState;

  const ownedCount = Object.values(upgrades).filter((u) => u.owned).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="panel-header text-sm flex items-center justify-between">
          <span>🔧 Upgrades</span>
          <span className="text-xs text-cream/40 font-body font-normal">
            {ownedCount}/{UPGRADES.length}
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-3"
        style={{ scrollbarWidth: "thin" }}
        role="list"
        aria-label="Available upgrades"
      >
        {UPGRADES.map((upgrade) => {
          const owned = upgrades[upgrade.id]?.owned ?? false;
          const canAfford = coins >= upgrade.baseCost;
          const visible = !upgrade.requiredCoins || totalCoinsEarned >= (upgrade.requiredCoins ?? 0) || owned;

          return (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              owned={owned}
              canAfford={canAfford}
              visible={visible}
              onBuy={() => onBuyUpgrade(upgrade.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
