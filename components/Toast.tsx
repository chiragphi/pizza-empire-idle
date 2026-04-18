"use client";

import React, { useEffect, useRef } from "react";
import { ToastMessage } from "@/lib/gameState";
import { TrophyIcon, CheckIcon, InfoIcon, CoinIcon } from "./Icons";

const ICON_MAP: Record<ToastMessage["type"], React.ReactNode> = {
  milestone: <TrophyIcon size={14} />,
  purchase:  <CheckIcon  size={14} />,
  unlock:    <CoinIcon   size={14} />,
  info:      <InfoIcon   size={14} />,
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current = setTimeout(() => onDismiss(toast.id), 3200);
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`toast-item toast-${toast.type} ${toast.exiting ? "is-exiting" : ""}`}
      onClick={() => onDismiss(toast.id)}
      role="status"
      aria-live="polite"
    >
      <div className="toast-icon">{ICON_MAP[toast.type]}</div>
      <span className="toast-text">{toast.message}</span>
    </div>
  );
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="toast-stack" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
