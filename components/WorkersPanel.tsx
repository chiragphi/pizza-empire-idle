"use client";

import React from "react";
import { WORKERS, Worker, getWorkerCost } from "@/lib/workers";
import { GameState } from "@/lib/gameState";
import { formatCoins, formatCps } from "@/lib/formatNumber";
import { LockIcon, PlusIcon } from "./Icons";
import {
  ScooterIcon, CookIcon, ChefHatIcon, ClipboardIcon,
  BriefcaseIcon, BuildingIcon, ExecutiveIcon,
} from "./Icons";

const WORKER_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  pizza_boy:        ScooterIcon,
  line_cook:        CookIcon,
  head_chef:        ChefHatIcon,
  kitchen_manager:  ClipboardIcon,
  restaurant_manager: BriefcaseIcon,
  regional_director:  BuildingIcon,
  corporate_exec:     ExecutiveIcon,
};

function WorkerCard({
  worker, count, cost, canAfford, visible, cpsShare, totalCps, onBuy,
}: {
  worker: Worker;
  count: number;
  cost: number;
  canAfford: boolean;
  visible: boolean;
  cpsShare: number; // fraction of total income
  totalCps: number;
  onBuy: () => void;
}) {
  const locked = !visible && count === 0;
  const Icon = WORKER_ICONS[worker.id] ?? CookIcon;
  const workerCps = worker.baseCps * count;

  return (
    <div className={`card worker-card ${locked ? "is-locked" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Icon + count */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: count > 0 ? "var(--c-red-soft)" : "var(--c-raised)",
              border: `1px solid ${count > 0 ? "rgba(232,53,42,0.25)" : "var(--c-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: count > 0 ? "var(--c-red)" : "var(--c-ghost)",
            }}
          >
            {locked ? <LockIcon size={16} /> : <Icon size={20} />}
          </div>
          {count > 0 && (
            <span
              className="worker-count-badge has-workers"
              aria-label={`${count} hired`}
            >
              {count}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--c-cream)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {locked ? "???" : worker.name}
            </span>
            {!locked && (
              <button
                className={`hire-btn ${canAfford ? "affordable" : ""}`}
                onClick={onBuy}
                disabled={!canAfford}
                aria-label={`Hire ${worker.name} for ${formatCoins(cost)}`}
              >
                <PlusIcon size={10} />
                {formatCoins(cost)}
              </button>
            )}
          </div>

          {!locked && (
            <>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--c-dim)",
                  marginTop: 2,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span>{formatCps(worker.baseCps)}/s each</span>
                {count > 0 && (
                  <span style={{ color: "var(--c-gold)", fontWeight: 600 }}>
                    = {formatCps(workerCps)}/s
                  </span>
                )}
              </div>

              {/* CPS contribution bar */}
              {count > 0 && totalCps > 0 && (
                <div className="cps-bar">
                  <div
                    className="cps-bar-fill"
                    style={{ width: `${Math.max(3, cpsShare * 100)}%` }}
                  />
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
  onBuyWorker: (id: string, count?: number) => void;
}

export default function WorkersPanel({ gameState, onBuyWorker }: Props) {
  const { coins, totalCoinsEarned, workers, coinsPerSecond } = gameState;

  return (
    <>
      <div className="panel-head">
        <span className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--c-red)" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Staff
        </span>
        <span className="panel-badge">
          {formatCps(coinsPerSecond)}/s
        </span>
      </div>

      <div className="panel-body">
        {WORKERS.map((worker) => {
          const count = workers[worker.id]?.count ?? 0;
          const cost = getWorkerCost(worker, count);
          const canAfford = coins >= cost;
          const visible =
            !worker.requiredCoins ||
            totalCoinsEarned >= (worker.requiredCoins ?? 0) ||
            count > 0;
          const workerCps = worker.baseCps * count;
          const cpsShare = coinsPerSecond > 0 ? workerCps / coinsPerSecond : 0;

          return (
            <WorkerCard
              key={worker.id}
              worker={worker}
              count={count}
              cost={cost}
              canAfford={canAfford}
              visible={visible}
              cpsShare={cpsShare}
              totalCps={coinsPerSecond}
              onBuy={() => onBuyWorker(worker.id, 1)}
            />
          );
        })}
      </div>
    </>
  );
}
