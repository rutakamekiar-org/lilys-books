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

/** Mounts the toast container (loading react-toastify) so later toasts appear without a delay. */
export function requestToasts() {
    if (requested) return;
    requested = true;
    listeners.forEach(listener => listener());
}

function show(level: "success" | "error" | "info" | "warn", msg: string, opts?: ToastOptions) {
    requestToasts();
    void import("react-toastify").then(({ toast }) => toast[level](msg, { ...base, ...opts }));
}

export const notify = {
  success: (msg: string, opts?: ToastOptions) => show("success", msg, opts),
  error: (msg: string, opts?: ToastOptions) => show("error", msg, opts),
  info: (msg: string, opts?: ToastOptions) => show("info", msg, opts),
  warn: (msg: string, opts?: ToastOptions) => show("warn", msg, opts),
};

export default notify;
