"use client";

import React, { useState } from "react";

interface SettingsModalProps {
  muted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  muted,
  onToggleMute,
  onReset,
  onClose,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (confirmReset) {
      onReset();
      onClose();
    } else {
      setConfirmReset(true);
    }
  };

  return (
    <div
      className="settings-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="settings-modal">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-bold text-neon"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⚙️ Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-cream/50 hover:text-cream hover:bg-white/10 transition-all text-lg"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Audio toggle */}
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <div>
            <div
              className="text-sm font-semibold text-cream/90"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {muted ? "🔇 Sound Off" : "🔊 Sound On"}
            </div>
            <div className="text-xs text-cream/40 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
              Toggle all game audio
            </div>
          </div>
          <label className="toggle-switch" aria-label="Toggle sound">
            <input
              type="checkbox"
              checked={!muted}
              onChange={onToggleMute}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Version info */}
        <div className="py-3 border-b border-white/10">
          <div
            className="text-xs text-cream/30"
            style={{ fontFamily: "var(--font-body)" }}
          >
            🍕 Pizza Empire v1.0 — Idle Tycoon
          </div>
          <div
            className="text-xs text-cream/25 mt-1"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Your progress saves automatically every 30 seconds.
          </div>
        </div>

        {/* How to play */}
        <div className="py-3 border-b border-white/10">
          <div
            className="text-xs font-semibold text-cream/60 mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            How to Play
          </div>
          <ul
            className="text-xs text-cream/40 space-y-1"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <li>🍕 Click the pizza to earn coins</li>
            <li>🔧 Buy upgrades to increase earnings</li>
            <li>👥 Hire staff for passive income</li>
            <li>🏆 Unlock milestones to grow your empire</li>
            <li>⏰ Earn coins even when you&apos;re away (up to 4h)</li>
          </ul>
        </div>

        {/* Reset */}
        <div className="pt-4">
          {confirmReset ? (
            <div className="text-center">
              <p
                className="text-sm text-red-300 mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                ⚠️ This will permanently delete all progress!
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  className="btn-danger"
                  onClick={handleReset}
                >
                  Yes, reset everything
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full text-xs text-cream/25 hover:text-red-400 transition-colors py-2"
              onClick={handleReset}
              style={{ fontFamily: "var(--font-body)" }}
            >
              🗑️ Reset Save Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
