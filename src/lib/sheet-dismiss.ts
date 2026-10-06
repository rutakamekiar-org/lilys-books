"use client";
import { useRef, useState, type PointerEvent } from "react";

/** Drag the header, leaving the sheet's scrollable content and controls alone. */
export function useSheetDismiss(onClose: () => void) {
  const gesture = useRef<{ id: number; x: number; y: number; height: number; samples: { y: number; time: number }[] } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const closing = useRef(false);
  const reset = () => {
    if (closing.current) return;
    gesture.current = null; setDragging(false); setOffset(0);
  };
  const dragHandleProps = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (closing.current || event.pointerType === "mouse" || !window.matchMedia("(max-width: 640px)").matches) return;
      if ((event.target as HTMLElement).closest("button,a,input")) return;
      gesture.current = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        height: event.currentTarget.parentElement!.getBoundingClientRect().height,
        samples: [{ y: event.clientY, time: event.timeStamp }],
      };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      start.samples = start.samples.filter(sample => event.timeStamp - sample.time <= 120);
      start.samples.push({ y: event.clientY, time: event.timeStamp });
      const distance = event.clientY - start.y;
      setOffset(distance > Math.abs(event.clientX - start.x) * 1.2 ? Math.max(0, distance - 8) : 0);
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const distance = event.clientY - start.y;
      const sample = start.samples.find(point => event.timeStamp - point.time <= 120);
      const velocity = sample ? (event.clientY - sample.y) / Math.max(1, event.timeStamp - sample.time) : 0;
      const dismiss = distance > Math.abs(event.clientX - start.x) * 1.2
        && (distance >= start.height * 0.27 || (distance >= 48 && velocity >= 0.65));
      if (!dismiss) { reset(); return; }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        reset(); onClose(); return;
      }
      const panel = event.currentTarget.parentElement!;
      closing.current = true;
      gesture.current = null;
      const animation = panel.animate([
        { transform: getComputedStyle(panel).transform },
        { transform: `translateY(${start.height + 64}px)` },
      ], { duration: 220, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" });
      void animation.finished.then(() => {
        if (panel.isConnected) onClose();
      }).catch(() => {}).finally(() => {
        animation.cancel();
        closing.current = false;
        reset();
      });
    },
    onPointerCancel: reset,
    onLostPointerCapture: reset,
  };
  return {
    dragHandleProps,
    dragStyle: { transform: `translateY(${offset}px)`, transition: dragging ? "none" : undefined },
  };
}
