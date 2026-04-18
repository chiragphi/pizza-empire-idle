"use client";

import React from "react";
import { MILESTONES } from "@/lib/milestones";
import { GameState } from "@/lib/gameState";
import { formatCoins } from "@/lib/formatNumber";
import { CheckIcon, TrophyIcon, StarIcon } from "./Icons";

function getMilestoneProgress(id: string, state: GameState): number {
  switch (id) {
    case "first_hundred":   return Math.min(1, state.totalCoinsEarned / 100);
    case "hired_help":      return Object.values(state.workers).some((w) => w.count > 0) ? 1 : 0;
    case "second_location": return state.upgrades["second_location"]?.owned ? 1 : 0;
    case "going_viral":     return Math.min(1, state.totalCoinsEarned / 50000);
    case "drone_launch":    return state.upgrades["drone_delivery"]?.owned ? 1 : 0;
    case "pizza_empire":    return Math.min(1, state.totalCoinsEarned / 1000000);
    default:                return 0;
  }
}

function getMilestoneLabel(id: string, state: GameState): string {
  switch (id) {
    case "first_hundred":   return `${formatCoins(Math.min(state.totalCoinsEarned, 100))} / 100`;
    case "hired_help":      return Object.values(state.workers).some((w) => w.count > 0) ? "Done" : "Hire anyone";
    case "second_location": return state.upgrades["second_location"]?.owned ? "Done" : "Buy upgrade";
    case "going_viral":     return `${formatCoins(Math.min(state.totalCoinsEarned, 50000))} / 50K`;
    case "drone_launch":    return state.upgrades["drone_delivery"]?.owned ? "Done" : "Buy upgrade";
    case "pizza_empire":    return `${formatCoins(Math.min(state.totalCoinsEarned, 1_000_000))} / 1M`;
    default:                return "";
  }
}

interface Props { gameState: GameState; }

export default function MilestoneLog({ gameState }: Props) {
  const { milestones } = gameState;
  const completed = MILESTONES.filter((m) => milestones[m.id]?.unlocked);
  const upcoming  = MILESTONES.filter((m) => !milestones[m.id]?.unlocked);

  return (
    <>
      <div className="panel-head">
        <span className="panel-title">
          <TrophyIcon size={14} color="var(--c-gold)" />
          Milestones
        </span>
        <span className="panel-badge">{completed.length}/{MILESTONES.length}</span>
      </div>

      <div className="panel-body">
        {/* Next 2 upcoming */}
        {upcoming.slice(0, 2).map((m) => {
          const progress = getMilestoneProgress(m.id, gameState);
          const label    = getMilestoneLabel(m.id, gameState);

          return (
            <div key={m.id} className="milestone-item is-next">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <StarIcon size={14} color="var(--c-gold)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--c-cream)" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: "0.63rem", color: "var(--c-dim)", marginTop: 1 }}>
                    {m.description}
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress * 100}%`,
                    background: "linear-gradient(90deg, var(--c-red), var(--c-gold))",
                    borderRadius: 2,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--c-dim)", marginTop: 3, textAlign: "right" }}>
                {label}
              </div>
            </div>
          );
        })}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--c-ghost)",
                padding: "4px 2px",
              }}
            >
              Completed
            </div>
            {[...completed].reverse().map((m) => (
              <div key={m.id} className="milestone-item is-done">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckIcon size={13} color="var(--c-green-hi)" />
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--c-dim)" }}>
                    {m.name}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {completed.length === 0 && upcoming.length === 0 && (
          <p style={{ fontSize: "0.72rem", color: "var(--c-ghost)", textAlign: "center", padding: "16px 0" }}>
            Start tossing to unlock milestones.
          </p>
        )}
      </div>
    </>
  );
}
