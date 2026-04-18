"use client";

import React, { useState } from "react";
import { CloseIcon, SoundIcon, MuteIcon, TrashIcon, WarningIcon, PizzaIcon } from "./Icons";

interface Props {
  muted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onClose: () => void;
}

export default function SettingsModal({ muted, onToggleMute, onReset, onClose }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="overlay-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="settings-modal">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--c-cream)" }}>
            Settings
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Sound toggle */}
        <div className="settings-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              {muted ? <MuteIcon size={15} color="var(--c-dim)" /> : <SoundIcon size={15} color="var(--c-cream)" />}
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-cream)" }}>
                Sound {muted ? "Off" : "On"}
              </span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--c-dim)" }}>
              Toggle all game audio
            </p>
          </div>
          <label className="toggle" aria-label="Toggle sound">
            <input type="checkbox" checked={!muted} onChange={onToggleMute} />
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
          </label>
        </div>

        {/* How to play */}
        <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PizzaIcon size={15} color="var(--c-gold)" />
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-cream)" }}>
              How to Play
            </span>
          </div>
          <ul style={{ fontSize: "0.7rem", color: "var(--c-dim)", lineHeight: 1.7, paddingLeft: 4 }}>
            <li>Click the pizza to earn coins</li>
            <li>Buy upgrades (left panel) to increase earnings</li>
            <li>Hire staff (right panel) for automatic income</li>
            <li>Unlock milestones as your empire grows</li>
            <li>Earn coins passively while you are away (up to 4h)</li>
          </ul>
        </div>

        {/* Save info */}
        <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--c-dim)" }}>
            Progress auto-saves every 30 seconds and on window close.
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--c-ghost)" }}>
            Pizza Empire v1.0
          </span>
        </div>

        {/* Reset */}
        <div style={{ marginTop: 16 }}>
          {confirmReset ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                <WarningIcon size={16} color="#ff8888" />
                <span style={{ fontSize: "0.78rem", color: "#ff8888" }}>
                  This will permanently delete all progress.
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn btn-danger" onClick={() => { onReset(); onClose(); }}>
                  Reset Everything
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                color: "var(--c-ghost)",
                fontSize: "0.72rem",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff8888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-ghost)")}
              onClick={() => setConfirmReset(true)}
            >
              <TrashIcon size={13} />
              Reset Save Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
