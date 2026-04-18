"use client";

import React, { useEffect, useRef } from "react";
import { ToastMessage } from "@/lib/gameState";

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastMessage["type"], string> = {
  milestone: "🏆",
  purchase: "✅",
  unlock: "🔓",
  info: "ℹ️",
};

function ToastItem({ toast, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`toast ${toast.type} ${toast.exiting ? "exiting" : ""}`}
      role="alert"
      aria-live="polite"
      onClick={() => onDismiss(toast.id)}
      style={{ cursor: "pointer" }}
    >
      <span className="text-xl shrink-0">{toast.icon || TOAST_ICONS[toast.type]}</span>
      <span
        className="text-sm text-cream/90 leading-tight"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {toast.message}
      </span>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
