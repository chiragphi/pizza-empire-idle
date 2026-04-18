"use client";

import React, { useRef, useCallback } from "react";
import { formatCoins } from "@/lib/formatNumber";

interface ClickTargetProps {
  clickValue: number;
  totalClicks: number;
  onClickPizza: (x: number, y: number) => void;
}

interface FlyingNumber {
  id: number;
  x: number;
  y: number;
  value: number;
}

let flyId = 0;

export default function ClickTarget({ clickValue, totalClicks, onClickPizza }: ClickTargetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flyingNums, setFlyingNums] = React.useState<FlyingNumber[]>([]);
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let cx: number, cy: number;
      if ("touches" in e && e.touches.length > 0) {
        cx = e.touches[0].clientX - rect.left;
        cy = e.touches[0].clientY - rect.top;
      } else if ("clientX" in e) {
        cx = e.clientX - rect.left;
        cy = e.clientY - rect.top;
      } else {
        cx = rect.width / 2;
        cy = rect.height / 2;
      }

      onClickPizza(cx + rect.left, cy + rect.top);

      const id = flyId++;
      const offsetX = (Math.random() - 0.5) * 80;
      setFlyingNums((prev) => [
        ...prev.slice(-8),
        { id, x: cx + offsetX, y: cy - 20, value: clickValue },
      ]);
      setTimeout(() => {
        setFlyingNums((prev) => prev.filter((n) => n.id !== id));
      }, 900);
    },
    [onClickPizza, clickValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          onClickPizza(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }
    },
    [onClickPizza]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-4 py-6 select-none"
    >
      {/* The Pizza Button */}
      <div className="relative flex flex-col items-center gap-3">
        {/* Glow ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            background: "radial-gradient(circle, rgba(255,233,74,0.15) 0%, transparent 70%)",
            animation: "pizzaFloat 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <button
          className="pizza-click-btn focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-navy rounded-full"
          onClick={handleClick}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={(e) => {
            setIsPressed(false);
            handleClick(e);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Toss pizza dough"
          title={`Click to earn ${formatCoins(clickValue)} coins`}
          style={{
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          <div
            className="relative"
            style={{
              width: 140,
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Drop shadow plate */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: 110,
                height: 20,
                background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)",
                borderRadius: "50%",
                transform: `translateX(-50%) scaleY(${isPressed ? 0.5 : 1})`,
                transition: "transform 0.08s ease",
              }}
            />

            {/* Pizza emoji */}
            <span
              className="pizza-emoji"
              style={{
                fontSize: isPressed ? 90 : 100,
                lineHeight: 1,
                transition: "font-size 0.08s ease",
                display: "block",
                textShadow: "0 4px 20px rgba(232,53,42,0.5)",
                filter: "drop-shadow(0 6px 12px rgba(232,53,42,0.4))",
              }}
            >
              🍕
            </span>

            {/* Spin ring on press */}
            {isPressed && (
              <div
                className="absolute inset-0 rounded-full border-2 border-neon/40"
                style={{
                  animation: "spin 0.4s linear",
                }}
              />
            )}
          </div>
        </button>

        {/* Click value badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            background: "rgba(255,233,74,0.1)",
            border: "1px solid rgba(255,233,74,0.2)",
          }}
        >
          <span className="text-neon text-xs font-body font-semibold">
            +{formatCoins(clickValue)} per toss
          </span>
        </div>

        <div className="text-cream/30 text-xs font-body">
          {totalClicks.toLocaleString()} tosses total
        </div>
      </div>

      {/* Flying coin numbers */}
      {flyingNums.map((fn) => (
        <div
          key={fn.id}
          className="pointer-events-none absolute font-display font-bold text-neon select-none"
          style={{
            left: fn.x,
            top: fn.y,
            fontSize: "1.1rem",
            zIndex: 50,
            textShadow: "0 0 8px rgba(255,233,74,0.8)",
            animation: "flyUp 0.85s ease-out forwards",
            transform: "translateX(-50%)",
          }}
        >
          +{formatCoins(fn.value)}
        </div>
      ))}

      <style jsx>{`
        @keyframes flyUp {
          0% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
          60% {
            transform: translateX(-50%) translateY(-55px) scale(1.1);
            opacity: 0.9;
          }
          100% {
            transform: translateX(-50%) translateY(-90px) scale(0.7);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
