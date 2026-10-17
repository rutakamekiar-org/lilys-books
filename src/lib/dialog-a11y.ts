"use client";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

// Only the topmost dialog reacts to Escape and traps Tab, so a nested dialog
// (the Nova Poshta picker inside checkout) does not close its parent as well.
const openDialogs: object[] = [];

function focusableElementsIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
      && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden",
  );
}

export interface DialogA11yOptions {
  open: boolean;
  onClose: () => void;
  /** The dialog panel that owns the focusable content. */
  dialogRef: RefObject<HTMLElement | null>;
  /** Prevent the page behind the dialog from scrolling while it is open. */
  lockScroll?: boolean;
}

let scrollLocks = 0;
let lockedScrollY = 0;
let lastTouch: { x: number; y: number } | null = null;

/** Whether `element` or an ancestor handles a drag of (dx, dy) itself: a drag handle or a scroller with room left. */
function handlesDrag(element: Element | null, dx: number, dy: number): boolean {
  const vertical = Math.abs(dy) >= Math.abs(dx);
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    if (!(node instanceof HTMLElement)) continue;
    const style = getComputedStyle(node);
    // Drag handles opt out of browser panning already and track the gesture themselves.
    if (style.touchAction === "none") return true;
    if (vertical) {
      if (!/auto|scroll/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue;
      if (dy > 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true;
    } else {
      if (!/auto|scroll/.test(style.overflowX) || node.scrollWidth <= node.clientWidth) continue;
      if (dx > 0 ? node.scrollLeft > 0 : node.scrollLeft + node.clientWidth < node.scrollWidth - 1) return true;
    }
  }
  return false;
}

function onLockedTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null;
}

// With the keyboard open, iOS Safari pans the visual viewport for any drag that no
// scroller consumes, sliding the page behind a sheet and making the sheet jump.
// Only let drags through when a dialog region can actually scroll that way.
function onLockedTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch || event.touches.length !== 1 || !lastTouch || !event.cancelable) return;
  const dx = touch.clientX - lastTouch.x;
  const dy = touch.clientY - lastTouch.y;
  lastTouch = { x: touch.clientX, y: touch.clientY };
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("input, textarea, select")) return;
  if (!handlesDrag(target, dx, dy)) event.preventDefault();
}

/**
 * Keyboard and focus behaviour shared by every storefront dialog: Escape closes,
 * focus moves into the dialog on open, Tab stays inside, and focus returns to the
 * element that opened it.
 */
export function useDialogA11y({ open, onClose, dialogRef, lockScroll = false }: DialogA11yOptions) {
  const dialogId = useRef({});

  useEffect(() => {
    if (!open) return;
    const id = dialogId.current;
    openDialogs.push(id);
    return () => {
      const index = openDialogs.lastIndexOf(id);
      if (index !== -1) openDialogs.splice(index, 1);
    };
  }, [open]);

  // Move focus into the dialog, then hand it back to the opener when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    if (root) focusableElementsIn(root)[0]?.focus();
    return () => opener?.focus?.();
  }, [open, dialogRef]);

  useEffect(() => {
    if (!open) return;
    const isTopmost = () => openDialogs[openDialogs.length - 1] === dialogId.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopmost()) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;
      const focusable = focusableElementsIn(root);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!root.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, dialogRef]);

  useEffect(() => {
    if (!open || !lockScroll) return;
    // Counted so handing over between dialogs (cart -> checkout) never unlocks early.
    if (scrollLocks++ === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      lockedScrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      // overflow: hidden alone does not stop iOS Safari from scrolling the document to a focused
      // field, so pin the body in place and leave nothing to scroll.
      Object.assign(document.body.style, { position: "fixed", top: `-${lockedScrollY}px`, left: "0", right: "0" });
      document.addEventListener("touchstart", onLockedTouchStart, { passive: true });
      document.addEventListener("touchmove", onLockedTouchMove, { passive: false });
    }
    return () => {
      if (--scrollLocks > 0) return;
      document.removeEventListener("touchstart", onLockedTouchStart);
      document.removeEventListener("touchmove", onLockedTouchMove);
      lastTouch = null;
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
      Object.assign(document.body.style, { position: "", top: "", left: "", right: "" });
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
    };
  }, [open, lockScroll]);
}
