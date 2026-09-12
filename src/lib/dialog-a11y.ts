"use client";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

// Only the topmost dialog reacts to Escape and traps Tab, so a nested dialog
// (the Nova Poshta picker inside checkout) does not close its parent as well.
const openDialogs: object[] = [];

function focusableElementsIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
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
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };
  }, [open, lockScroll]);
}
