"use client";

import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

export type AlertKind = "info" | "success" | "warning" | "danger";

export interface AlertPopupData {
  kind?: AlertKind;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const kindStyles: Record<AlertKind, { iconBg: string; iconColor: string; icon: typeof Info; confirmBtn: string }> = {
  info: { iconBg: "bg-info-soft", iconColor: "text-info", icon: Info, confirmBtn: "bg-info" },
  success: { iconBg: "bg-safe-soft", iconColor: "text-safe", icon: CheckCircle2, confirmBtn: "bg-safe" },
  warning: { iconBg: "bg-warning-soft", iconColor: "text-warning", icon: AlertTriangle, confirmBtn: "bg-warning" },
  danger: { iconBg: "bg-danger-soft", iconColor: "text-danger", icon: ShieldAlert, confirmBtn: "sp-gradient-primary" },
};

/**
 * Generic app-wide pop-up alert — used for SOS confirmations, send
 * results, and any other spot that needs a modal-style prompt instead of
 * a silent state change. Rendered by AlertProvider (lib/alerts.tsx); call
 * useAlerts().showAlert(...) rather than mounting this directly.
 */
export default function AlertPopup({
  data,
  onClose,
}: {
  data: AlertPopupData;
  onClose: (confirmed: boolean) => void;
}) {
  const { kind = "info", title, message, confirmText = "OK", cancelText } = data;
  const style = kindStyles[kind];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onClose(false)} />
      <div className="relative w-full max-w-[420px] mx-auto sp-card rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${style.iconBg}`}>
          <Icon className={`w-7 h-7 ${style.iconColor}`} />
        </div>
        <h2 className="text-lg font-bold text-foreground text-center mb-1.5">{title}</h2>
        {message && <p className="text-sm text-muted text-center leading-relaxed mb-5">{message}</p>}
        <div className={`flex gap-3 ${!message ? "mt-5" : ""}`}>
          {cancelText && (
            <button
              onClick={() => onClose(false)}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-muted-strong bg-surface-hover active:scale-[0.98] transition-transform"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => onClose(true)}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-transform ${style.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
