"use client";
import type { ToastOptions } from "react-toastify";

const base: ToastOptions = {
    style: {
        whiteSpace: 'pre-line',
    },
};

let requested = false;
const listeners = new Set<() => void>();

export const hasRequestedToasts = () => requested;

export function subscribeToToastRequests(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

function show(level: "success" | "error" | "info" | "warn", msg: string, opts?: ToastOptions) {
    if (!requested) {
        requested = true;
        listeners.forEach(listener => listener());
    }
    void import("react-toastify").then(({ toast }) => toast[level](msg, { ...base, ...opts }));
}

export const notify = {
  success: (msg: string, opts?: ToastOptions) => show("success", msg, opts),
  error: (msg: string, opts?: ToastOptions) => show("error", msg, opts),
  info: (msg: string, opts?: ToastOptions) => show("info", msg, opts),
  warn: (msg: string, opts?: ToastOptions) => show("warn", msg, opts),
};

export default notify;
