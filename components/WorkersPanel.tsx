"use client";

import React from "react";
import { WORKERS, Worker, getWorkerCost } from "@/lib/workers";
import { GameState } from "@/lib/gameState";
import { formatCoins, formatCps } from "@/lib/formatNumber";

interface WorkersPanelProps {
  gameState: GameState;
  onBuyWorker: (id: string, count?: number) => void;
}

function WorkerCard({
  worker,
  count,
  cost,
  canAfford,
  visible,
  totalCps,
  onBuy,
}: {
  worker: Worker;
  count: number;
  cost: number;
  canAfford: boolean;
  visible: boolean;
  totalCps: number;
  onBuy: (amt: number) => void;
}) {
  const locked = !visible && count === 0;

  let cardClass = "worker-card p-3 mb-2";
  if (locked) cardClass += " locked";
  else if (canAfford) cardClass += " affordable";

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-2.5">
        {/* Big count + icon */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div
            className="text-2xl w-9 h-9 flex items-center justify-center rounded-lg"
            style={{
              background: count > 0 ? "rgba(232,53,42,0.15)" : "rgba(255,255,255,0.04)",
              fontSize: "1.4rem",
            }}
          >
            {locked ? "🔒" : worker.icon}
          </div>
          {count > 0 && (
            <span
              className="text-xs font-bold text-neon tabular-nums"
              style={{ fontFamily: "var(--font-body)" }}
            >
              ×{count}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div>
              <span
                className="font-semibold text-sm text-cream/90"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {locked ? "???" : worker.name}
              </span>
              {!locked && (
                <div className="text-xs text-cream/45 mt-0.5">
                  {formatCps(worker.baseCps)}/sec each
                  {count > 0 && (
                    <span className="text-basil ml-1.5 font-semibold">
                      = {formatCps(totalCps)}/sec
                    </span>
                  )}
                </div>
              )}
            </div>

            {!locked && (
              <div className="flex gap-1 shrink-0">
                <button
                  className={`text-xs px-2 py-1 rounded font-semibold transition-all ${
                    canAfford
                      ? "bg-tomato/80 text-mozz hover:bg-tomato cursor-pointer"
                      : "bg-white/5 text-cream/30 cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                  onClick={() => canAfford && onBuy(1)}
                  disabled={!canAfford}
                  aria-label={`Hire 1 ${worker.name}`}
                >
                  🪙 {formatCoins(cost)}
                </button>
              </div>
            )}
          </div>

          {!locked && count === 0 && (
            <p className="text-xs text-cream/40 mt-1 leading-tight line-clamp-1">
              {worker.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkersPanel({ gameState, onBuyWorker }: WorkersPanelProps) {
  const { coins, totalCoinsEarned, workers, coinsPerSecond } = gameState;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="panel-header text-sm flex items-center justify-between">
          <span>👥 Staff</span>
          <span className="text-xs text-cream/40 font-body font-normal">
            {formatCps(coinsPerSecond)}/sec total
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-3"
        style={{ scrollbarWidth: "thin" }}
        role="list"
        aria-label="Available workers"
      >
        {WORKERS.map((worker) => {
          const count = workers[worker.id]?.count ?? 0;
          const cost = getWorkerCost(worker, count);
          const canAfford = coins >= cost;
          const visible =
            !worker.requiredCoins ||
            totalCoinsEarned >= (worker.requiredCoins ?? 0) ||
            count > 0;
          const totalCps = worker.baseCps * count;

          return (
            <WorkerCard
              key={worker.id}
              worker={worker}
              count={count}
              cost={cost}
              canAfford={canAfford}
              visible={visible}
              totalCps={totalCps}
              onBuy={(amt) => onBuyWorker(worker.id, amt)}
            />
          );
        })}
      </div>
    </div>
  );
}
