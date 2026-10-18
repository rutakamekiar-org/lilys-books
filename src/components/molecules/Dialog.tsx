"use client";
import { useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import CloseButton from "@/components/atoms/CloseButton";
import { useDialogA11y } from "@/lib/dialog-a11y";
import { useSheetDismiss } from "@/lib/sheet-dismiss";
import { useSheetPage } from "@/lib/sheet-page";

const noSubscription = () => () => {};

export interface DialogClassNames {
  overlay: string;
  panel: string;
  header: string;
  title?: string;
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Content of the dialog's h2, which also names it for assistive technology. */
  title: ReactNode;
  children: ReactNode;
  /** Look and layout stay with each dialog's own CSS module. */
  classNames: DialogClassNames;
  /** Set when other ids are derived from the title id (checkout field ids). */
  titleId?: string;
  /** Exposes the panel, e.g. to scroll an item into view. */
  panelRef?: RefObject<HTMLDivElement | null>;
  /** Prevent the page behind the dialog from scrolling while it is open. */
  lockScroll?: boolean;
  /** Phones can drag the header down to close the sheet. */
  dismissible?: boolean;
  /**
   * On phones, show the sheet as the page itself (see useSheetPage); larger screens get the
   * overlay with the page behind it locked. Renders into document.body, outside the hidden page.
   */
  sheetPage?: boolean;
}

/**
 * Shell shared by every storefront dialog: overlay, labelled panel, header with the
 * close button, and the behaviour from useDialogA11y (Escape, focus trap, focus return).
 */
export default function Dialog({
  open, onClose, title, children, classNames, titleId, panelRef, lockScroll = false, dismissible = false, sheetPage = false,
}: DialogProps) {
  const generatedTitleId = useId();
  const labelId = titleId ?? generatedTitleId;
  const ownPanelRef = useRef<HTMLDivElement>(null);
  const ref = panelRef ?? ownPanelRef;
  // A portal needs document.body: false while server rendering and hydrating, true on any
  // later client render, so a dialog that mounts already open renders in that same pass.
  const isClient = useSyncExternalStore(noSubscription, () => true, () => false);
  const pressedOverlay = useRef(false);
  const { dragHandleProps, dragStyle } = useSheetDismiss(onClose);

  const visible = open && (isClient || !sheetPage);
  // Page mode must start before focus moves in and end before focus returns to the opener,
  // which page mode hides; hook order gives exactly that on open and on close.
  const pageMode = useSheetPage(sheetPage && visible);
  useDialogA11y({ open: visible, onClose, dialogRef: ref, lockScroll: sheetPage ? !pageMode : lockScroll });

  if (!visible) return null;

  const dialog = (
    <div
      className={classNames.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      // Close only when the press both starts and ends on the backdrop, so selecting
      // text inside the panel and releasing outside it keeps the dialog open.
      onMouseDown={event => { pressedOverlay.current = event.target === event.currentTarget; }}
      onClick={event => {
        if (pressedOverlay.current && event.target === event.currentTarget) onClose();
        pressedOverlay.current = false;
      }}
    >
      <div className={classNames.panel} ref={ref} style={dismissible ? dragStyle : undefined}>
        <div className={classNames.header} {...(dismissible ? dragHandleProps : {})}>
          <h2 id={labelId} className={classNames.title}>{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );

  return sheetPage ? createPortal(dialog, document.body) : dialog;
}
