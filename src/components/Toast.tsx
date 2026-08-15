import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        let bg = "bg-slate-900 border-slate-700 text-white";
        let Icon = Info;
        let iconColor = "text-blue-400";

        if (toast.type === "success") {
          bg = "bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-xl shadow-emerald-950/40";
          Icon = CheckCircle2;
          iconColor = "text-emerald-400";
        } else if (toast.type === "warning") {
          bg = "bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-xl shadow-amber-950/40";
          Icon = AlertTriangle;
          iconColor = "text-amber-400";
        } else if (toast.type === "error") {
          bg = "bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-xl shadow-rose-950/40";
          Icon = XCircle;
          iconColor = "text-rose-400";
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-snug">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              id={`toast-close-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="關閉提示"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
