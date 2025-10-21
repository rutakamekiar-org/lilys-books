"use client";
import { useEffect, useRef } from "react";
import type React from "react";
import styles from "./ExcerptDialog.module.css";

export default function ExcerptDialog({
  open,
  onClose,
  title,
  html,
}: { open: boolean; onClose: () => void; title: string; html: TrustedHTML; }){
  const panelRef = useRef<HTMLDivElement>(null);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // click outside to close
  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>){
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="excerpt-title" onMouseDown={onOverlayClick}>
      <div className={styles.panel} ref={panelRef}>
        <header className={styles.header}>
          <h3 id="excerpt-title" className={styles.title}>Читати уривок — {title}</h3>
          <button aria-label="Закрити" className={styles.close} onClick={onClose}>×</button>
        </header>
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
