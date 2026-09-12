"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import styles from "./ExcerptDialog.module.css";
import { useDialogA11y } from "@/lib/dialog-a11y";

export default function ExcerptDialog({
  open,
  onClose,
  title,
  slug,
}: { open: boolean; onClose: () => void; title: string; slug: string; }){
  const panelRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useDialogA11y({ open, onClose, dialogRef: panelRef });

  useEffect(() => {
    if (!open || !slug) return;

    async function loadExcerpt() {
      setLoading(true);
      try {
        const res = await fetch(`/content/excerpts/${slug}.html`);
        if (res.ok) {
          const text = await res.text();
          setHtml(text);
        } else {
          setHtml("<p>Уривок тимчасово недоступний.</p>");
        }
      } catch (e) {
        console.error("Failed to load excerpt", e);
        setHtml("<p>Помилка завантаження уривку.</p>");
      } finally {
        setLoading(false);
      }
    }

    loadExcerpt();
  }, [open, slug]);

  // click outside to close
  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>){
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="excerpt-title" onMouseDown={onOverlayClick}>
      <div className={styles.panel} ref={panelRef}>
        {/* h2 keeps the heading order valid: excerpt bodies start their own sections at h2. */}
        <div className={styles.header}>
          <h2 id="excerpt-title" className={styles.title}>Читати уривок — {title}</h2>
          <button aria-label="Закрити" className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {loading ? <p>Завантаження...</p> : <div dangerouslySetInnerHTML={{ __html: html }} />}
        </div>
      </div>
    </div>
  );
}
