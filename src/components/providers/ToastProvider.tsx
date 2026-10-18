"use client";
import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { hasRequestedToasts, requestToasts, subscribeToToastRequests } from "@/lib/toast";

// react-toastify (JS and CSS) stays out of the initial bundle: it loads once the browser is idle,
// or earlier for the first toast. Toasts sent before the container mounts are queued by react-toastify.
const ToastContainerLazy = dynamic(() => import("./ToastContainerLazy"), { ssr: false });

export default function ToastProvider() {
  const requested = useSyncExternalStore(subscribeToToastRequests, hasRequestedToasts, () => false);

  useEffect(() => {
    if (!("requestIdleCallback" in window)) {
      const timeout = setTimeout(requestToasts, 1000);
      return () => clearTimeout(timeout);
    }
    const idle = window.requestIdleCallback(requestToasts, { timeout: 3000 });
    return () => window.cancelIdleCallback(idle);
  }, []);

  return requested ? <ToastContainerLazy /> : null;
}
