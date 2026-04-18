"use client";

import React from "react";
import { UPGRADES, Upgrade } from "@/lib/upgrades";
import { GameState } from "@/lib/gameState";
import { formatCoins } from "@/lib/formatNumber";
import { CheckIcon, LockIcon, ArrowUpIcon } from "./Icons";
import {
  FlourIcon, CheeseIcon, SauceIcon, OvenIcon, BikeIcon, RobotIcon,
  StorefrontIcon, TVIcon, FranchiseIcon, GlobeIcon, DroneIcon, RocketIcon,
} from "./Icons";

const UPGRADE_ICONS: Record<string, React.FC<{ size?: number; color?: string; className?: string }>> = {
  better_dough:       FlourIcon,
  fancy_cheese:       CheeseIcon,
  secret_sauce:       SauceIcon,
  wood_fired_oven:    OvenIcon,
  delivery_bike:      BikeIcon,
  pizza_robot:        RobotIcon,
  second_location:    StorefrontIcon,
  tv_ad:              TVIcon,
  franchise_deal:     FranchiseIcon,
  international_chain:GlobeIcon,
  drone_delivery:     DroneIcon,
  space_pizza_lab:    RocketIcon,
};

function UpgradeCard({
  upgrade, owned, canAfford, visible, coins, onBuy,
}: {
  upgrade: Upgrade;
  owned: boolean;
  canAfford: boolean;
  visible: boolean;
  coins: number;
  onBuy: () => void;
}) {
  const locked = !visible && !owned;
  const Icon = UPGRADE_ICONS[upgrade.id] ?? FlourIcon;

  const progress = Math.min(1, coins / upgrade.baseCost);

  const stats: string[] = [];
  if (upgrade.clickBonus > 0)      stats.push(`+${upgrade.clickBonus} click`);
  if (upgrade.cpsBonus > 0)        stats.push(`+${upgrade.cpsBonus}/s`);
  if (upgrade.clickMultiplier > 1) stats.push(`${upgrade.clickMultiplier}x click`);
  if (upgrade.cpsMultiplier > 1)   stats.push(`${upgrade.cpsMultiplier}x income`);

  let cls = "card upgrade-card";
  if (owned)       cls += " is-owned";
  else if (locked) cls += " is-locked";
  else if (canAfford) cls += " is-affordable";

  return (
    <div
      className={cls}
      onClick={() => !owned && !locked && canAfford && onBuy()}
      onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !owned && !locked && canAfford) onBuy(); }}
      tabIndex={!owned && !locked ? 0 : -1}
      role={!owned && !locked ? "button" : "article"}
      aria-label={
        owned ? `${upgrade.name} — purchased` :
        locked ? "Locked upgrade" :
        `Buy ${upgrade.name} for ${formatCoins(upgrade.baseCost)} coins`
      }
      style={{ outline: "none" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Icon box */}
        <div className="upgrade-icon-box">
          {locked
            ? <LockIcon size={16} />
            : owned
            ? <Icon size={18} color="var(--c-gold)" />
            : <Icon size={18} />
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span className="upgrade-name">
              {locked ? "???" : upgrade.name}
            </span>
            {owned ? (
              <CheckIcon size={14} color="var(--c-gold)" />
            ) : !locked ? (
              <span className={`upgrade-cost ${canAfford ? "" : "cant-afford"}`}>
                {formatCoins(upgrade.baseCost)}
              </span>
            ) : null}
          </div>

          {!locked && (
            <>
              <p className="upgrade-desc">{upgrade.description}</p>

              {/* Stat pills */}
              {stats.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                  {stats.map((s) => (
                    <span key={s} className="upgrade-stat-pill">
                      <ArrowUpIcon size={8} color="var(--c-green-hi)" />
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress toward cost */}
              {!owned && !canAfford && (
                <div className="cost-progress" style={{ marginTop: 6 }}>
                  <div className="cost-progress-fill" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

export default function UpgradeShop({ gameState, onBuyUpgrade }: Props) {
  const { coins, totalCoinsEarned, upgrades } = gameState;
  const ownedCount = Object.values(upgrades).filter((u) => u.owned).length;

  // Find cheapest unowned affordable — hint
  const nextAffordable = UPGRADES.find(
    (u) => !upgrades[u.id]?.owned && coins >= u.baseCost
  );
  const nextUnlocking = UPGRADES.find(
    (u) =>
      !upgrades[u.id]?.owned &&
      coins < u.baseCost &&
      totalCoinsEarned >= (u.requiredCoins ?? 0)
  );

  return (
    <>
      <div className="panel-head">
        <span className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--c-gold)" }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          Upgrades
        </span>
        <span className="panel-badge">{ownedCount}/{UPGRADES.length}</span>
      </div>

      <div className="panel-body">
        {UPGRADES.map((upgrade) => {
          const owned = upgrades[upgrade.id]?.owned ?? false;
          const canAfford = coins >= upgrade.baseCost;
          const visible =
            !upgrade.requiredCoins ||
            totalCoinsEarned >= (upgrade.requiredCoins ?? 0) ||
            owned;

          return (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              owned={owned}
              canAfford={canAfford}
              visible={visible}
              coins={coins}
              onBuy={() => onBuyUpgrade(upgrade.id)}
            />
          );
        })}
      </div>

      {/* Contextual hint */}
      {nextAffordable && (
        <div className="next-hint">
          Ready to buy: <strong>{nextAffordable.name}</strong>
        </div>
      )}
      {!nextAffordable && nextUnlocking && (
        <div className="next-hint">
          Saving for: <strong>{nextUnlocking.name}</strong> — {formatCoins(nextUnlocking.baseCost - coins)} to go
        </div>
      )}
    </>
  );
}
