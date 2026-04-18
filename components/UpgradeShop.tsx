"use client";

import React, { useState } from "react";
import { UPGRADES, Upgrade } from "@/lib/upgrades";
import { GameState } from "@/lib/gameState";
import { formatCoins } from "@/lib/formatNumber";
import { CheckIcon, LockIcon, ArrowUpIcon } from "./Icons";
import {
  FlourIcon, CheeseIcon, SauceIcon, OvenIcon, BikeIcon, RobotIcon,
  StorefrontIcon, TVIcon, FranchiseIcon, GlobeIcon, DroneIcon, RocketIcon,
} from "./Icons";

const UPGRADE_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  better_dough:        FlourIcon,
  fancy_cheese:        CheeseIcon,
  secret_sauce:        SauceIcon,
  wood_fired_oven:     OvenIcon,
  delivery_bike:       BikeIcon,
  pizza_robot:         RobotIcon,
  second_location:     StorefrontIcon,
  tv_ad:               TVIcon,
  franchise_deal:      FranchiseIcon,
  international_chain: GlobeIcon,
  drone_delivery:      DroneIcon,
  space_pizza_lab:     RocketIcon,
};

function statLines(u: Upgrade): string[] {
  const s: string[] = [];
  if (u.clickBonus > 0)      s.push(`+${u.clickBonus} click`);
  if (u.cpsBonus > 0)        s.push(`+${u.cpsBonus}/s`);
  if (u.clickMultiplier > 1) s.push(`${u.clickMultiplier}× click`);
  if (u.cpsMultiplier > 1)   s.push(`${u.cpsMultiplier}× income`);
  return s;
}

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
  const [expanded, setExpanded] = useState(false);
  const locked = !visible && !owned;
  const Icon = UPGRADE_ICONS[upgrade.id] ?? FlourIcon;
  const stats = statLines(upgrade);
  const progress = Math.min(1, coins / upgrade.baseCost);

  let cls = "card upgrade-card";
  if (owned)        cls += " is-owned";
  else if (locked)  cls += " is-locked";
  else if (canAfford) cls += " is-affordable";

  return (
    <div
      className={cls}
      onClick={() => {
        if (!owned && !locked && canAfford) { onBuy(); return; }
        if (!locked && !owned) setExpanded((e) => !e);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && canAfford && !owned && !locked) onBuy();
      }}
      tabIndex={!owned && !locked ? 0 : -1}
      role={!owned && !locked ? "button" : "article"}
      style={{ padding: "8px 10px", outline: "none" }}
      aria-label={
        owned ? `${upgrade.name} — purchased` :
        locked ? "Locked upgrade" :
        `Buy ${upgrade.name} for ${formatCoins(upgrade.baseCost)} coins`
      }
    >
      {/* ── Row 1: icon + name + cost/check ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="upgrade-icon-box" style={{ width: 30, height: 30, flexShrink: 0 }}>
          {locked
            ? <LockIcon size={13} />
            : <Icon size={15} color={owned ? "var(--c-gold)" : undefined} />
          }
        </div>

        <span
          style={{
            flex: 1,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: owned ? "var(--c-dim)" : "var(--c-cream)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {locked ? "???" : upgrade.name}
        </span>

        {owned ? (
          <CheckIcon size={13} color="var(--c-gold)" />
        ) : !locked ? (
          <span
            className={`upgrade-cost ${canAfford ? "" : "cant-afford"}`}
            style={{ flexShrink: 0, fontSize: "0.7rem" }}
          >
            {formatCoins(upgrade.baseCost)}
          </span>
        ) : null}
      </div>

      {/* ── Row 2: stat pills (always visible if unlocked + not owned) ── */}
      {!locked && !owned && stats.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5, paddingLeft: 38 }}>
          {stats.map((s) => (
            <span key={s} className="upgrade-stat-pill" style={{ fontSize: "0.58rem" }}>
              <ArrowUpIcon size={7} color="var(--c-green-hi)" />
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Description (expands on click when can't afford) ── */}
      {expanded && !locked && !owned && !canAfford && (
        <p
          style={{
            fontSize: "0.66rem",
            color: "var(--c-dim)",
            marginTop: 5,
            paddingLeft: 38,
            lineHeight: 1.4,
          }}
        >
          {upgrade.description}
        </p>
      )}

      {/* ── Progress bar ── */}
      {!owned && !locked && !canAfford && (
        <div className="cost-progress" style={{ marginTop: 6, marginLeft: 38 }}>
          <div className="cost-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
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

  const nextAffordable = UPGRADES.find((u) => !upgrades[u.id]?.owned && coins >= u.baseCost);
  const nextUnlocking  = UPGRADES.find(
    (u) => !upgrades[u.id]?.owned && coins < u.baseCost && totalCoinsEarned >= (u.requiredCoins ?? 0)
  );

  return (
    <>
      <div className="panel-head">
        <span className="panel-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--c-gold)", flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Upgrades
        </span>
        <span className="panel-badge">{ownedCount}/{UPGRADES.length}</span>
      </div>

      <div className="panel-body" style={{ gap: 4 }}>
        {UPGRADES.map((upgrade) => {
          const owned    = upgrades[upgrade.id]?.owned ?? false;
          const canAfford = coins >= upgrade.baseCost;
          const visible  = totalCoinsEarned >= (upgrade.requiredCoins ?? 0) || owned;
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

      {nextAffordable && (
        <div className="next-hint">
          Ready: <strong>{nextAffordable.name}</strong>
        </div>
      )}
      {!nextAffordable && nextUnlocking && (
        <div className="next-hint">
          Saving for <strong>{nextUnlocking.name}</strong> — {formatCoins(nextUnlocking.baseCost - coins)} to go
        </div>
      )}
    </>
  );
}
