"use client";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { hasRequestedToasts, subscribeToToastRequests } from "@/lib/toast";

// react-toastify (JS and CSS) loads only when the first toast is shown; toasts sent
// before the container mounts are queued by react-toastify and shown once it does.
const ToastContainerLazy = dynamic(() => import("./ToastContainerLazy"), { ssr: false });

export default function ToastProvider() {
  const requested = useSyncExternalStore(subscribeToToastRequests, hasRequestedToasts, () => false);
  return requested ? <ToastContainerLazy /> : null;
}
