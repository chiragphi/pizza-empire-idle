"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { formatCoins, formatCps } from "@/lib/formatNumber";
import { PizzaIcon, BoltIcon, TrendIcon } from "./Icons";

interface Props {
  clickValue: number;
  coinsPerSecond: number;
  totalClicks: number;
  onClickPizza: (x: number, y: number) => void;
}

interface FlyNum {
  id: number;
  x: number;
  y: number;
  value: number;
}

let _fid = 0;

export default function ClickTarget({ clickValue, coinsPerSecond, totalClicks, onClickPizza }: Props) {
  const [pressing, setPressing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [flyNums, setFlyNums] = useState<FlyNum[]>([]);
  const [combo, setCombo] = useState(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  // Combo system
  const bumpCombo = useCallback(() => {
    setCombo((c) => c + 1);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setCombo(0), 1200);
  }, []);

  useEffect(() => () => { if (comboTimerRef.current) clearTimeout(comboTimerRef.current); }, []);

  const handleActivate = useCallback((clientX: number, clientY: number) => {
    onClickPizza(clientX, clientY);
    bumpCombo();

    // Visual feedback
    setPressing(true);
    setPulseKey((k) => k + 1);
    setTimeout(() => setPressing(false), 90);

    // Fly number
    const id = _fid++;
    const jitter = (Math.random() - 0.5) * 60;
    setFlyNums((prev) => [
      ...prev.slice(-10),
      { id, x: clientX + jitter, y: clientY - 10, value: clickValue },
    ]);
    setTimeout(() => setFlyNums((prev) => prev.filter((n) => n.id !== id)), 850);
  }, [onClickPizza, bumpCombo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleActivate(e.clientX, e.clientY);
  }, [handleActivate]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleActivate(t.clientX, t.clientY);
  }, [handleActivate]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) handleActivate(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, [handleActivate]);

  const comboLabel = combo >= 20 ? "FRENZY" : combo >= 10 ? "HOT" : combo >= 5 ? "COMBO" : null;

  return (
    <div className="click-stage">
      {/* Combo badge */}
      {comboLabel && (
        <div key={combo} className="combo-badge">
          {comboLabel} x{combo}
        </div>
      )}

      {/* Pizza button */}
      <div
        ref={btnRef}
        className="pizza-btn-wrap"
        role="button"
        tabIndex={0}
        aria-label={`Toss pizza — earn ${formatCoins(clickValue)} coins`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouch}
        onKeyDown={handleKey}
        style={{ outline: "none" }}
      >
        {/* Rings */}
        <div className="pizza-ring-outer" />
        <div className="pizza-ring-inner" />

        {/* Pulse rings on click */}
        {pulseKey > 0 && (
          <div key={pulseKey} className="pizza-pulse" />
        )}

        {/* Core */}
        <div className={`pizza-btn-core ${pressing ? "pressing" : ""}`}>
          <PizzaIcon
            className="pizza-svg"
            size={82}
            color={pressing ? "var(--c-gold-hi)" : "var(--c-gold)"}
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="click-stats">
        <div className="click-stat">
          <span className="click-stat-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BoltIcon size={12} color="var(--c-gold-hi)" />
            {formatCoins(clickValue)}
          </span>
          <span className="click-stat-label">per click</span>
        </div>
        <div className="click-divider" />
        <div className="click-stat">
          <span className="click-stat-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <TrendIcon size={12} color="var(--c-gold-hi)" />
            {formatCps(coinsPerSecond)}
          </span>
          <span className="click-stat-label">per second</span>
        </div>
        <div className="click-divider" />
        <div className="click-stat">
          <span className="click-stat-value">{totalClicks.toLocaleString()}</span>
          <span className="click-stat-label">tosses</span>
        </div>
      </div>

      {/* Fly numbers (portaled to fixed) */}
      {flyNums.map((fn) => (
        <div
          key={fn.id}
          className="fly-number"
          style={{ left: fn.x, top: fn.y }}
        >
          +{formatCoins(clickValue)}
        </div>
      ))}
    </div>
  );
}
