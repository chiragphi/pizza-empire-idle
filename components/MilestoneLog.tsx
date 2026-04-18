"use client";

import React from "react";
import { MILESTONES } from "@/lib/milestones";
import { GameState } from "@/lib/gameState";
import { formatCoins } from "@/lib/formatNumber";

interface MilestoneLogProps {
  gameState: GameState;
}

function getMilestoneProgress(milestoneId: string, state: GameState): number {
  switch (milestoneId) {
    case "first_hundred":
      return Math.min(1, state.totalCoinsEarned / 100);
    case "hired_help":
      return Object.values(state.workers).some((w) => w.count > 0) ? 1 : 0;
    case "second_location":
      return state.upgrades["second_location"]?.owned ? 1 : 0;
    case "going_viral":
      return Math.min(1, state.totalCoinsEarned / 50000);
    case "drone_launch":
      return state.upgrades["drone_delivery"]?.owned ? 1 : 0;
    case "pizza_empire":
      return Math.min(1, state.totalCoinsEarned / 1000000);
    default:
      return 0;
  }
}

function getMilestoneProgressLabel(milestoneId: string, state: GameState): string {
  switch (milestoneId) {
    case "first_hundred":
      return `${formatCoins(Math.min(state.totalCoinsEarned, 100))} / 100`;
    case "hired_help":
      return Object.values(state.workers).some((w) => w.count > 0) ? "Done!" : "0 workers";
    case "second_location":
      return state.upgrades["second_location"]?.owned ? "Done!" : "Buy upgrade";
    case "going_viral":
      return `${formatCoins(Math.min(state.totalCoinsEarned, 50000))} / 50K`;
    case "drone_launch":
      return state.upgrades["drone_delivery"]?.owned ? "Done!" : "Buy upgrade";
    case "pizza_empire":
      return `${formatCoins(Math.min(state.totalCoinsEarned, 1000000))} / 1M`;
    default:
      return "";
  }
}

export default function MilestoneLog({ gameState }: MilestoneLogProps) {
  const { milestones } = gameState;

  const completed = MILESTONES.filter((m) => milestones[m.id]?.unlocked);
  const upcoming = MILESTONES.filter((m) => !milestones[m.id]?.unlocked);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="panel-header text-sm flex items-center justify-between">
          <span>🏆 Milestones</span>
          <span className="text-xs text-cream/40 font-body font-normal">
            {completed.length}/{MILESTONES.length}
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Next upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-3">
            {upcoming.slice(0, 2).map((m) => {
              const progress = getMilestoneProgress(m.id, gameState);
              const label = getMilestoneProgressLabel(m.id, gameState);
              return (
                <div
                  key={m.id}
                  className="mb-2 p-2.5 rounded-lg"
                  style={{
                    background: "rgba(255,233,74,0.05)",
                    border: "1px solid rgba(255,233,74,0.15)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-semibold text-cream/80 truncate"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {m.name}
                      </div>
                      <div
                        className="text-xs text-cream/40 truncate"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {m.description}
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="milestone-progress">
                    <div
                      className="milestone-progress-fill"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div
                    className="text-xs text-cream/40 mt-1 text-right tabular-nums"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <div
              className="text-xs text-cream/30 mb-1.5 font-semibold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Completed
            </div>
            {[...completed].reverse().map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg mb-1"
                style={{
                  background: "rgba(45,106,79,0.1)",
                  border: "1px solid rgba(45,106,79,0.2)",
                }}
              >
                <span className="text-sm">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-semibold text-basil/90 truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ✓ {m.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {completed.length === 0 && upcoming.length === 0 && (
          <div className="text-center text-cream/30 text-xs py-4">
            Start clicking to unlock milestones!
          </div>
        )}
      </div>
    </div>
  );
}
