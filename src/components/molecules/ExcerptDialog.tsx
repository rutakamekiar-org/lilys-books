import { useEffect, useRef, useState } from "react";
import type React from "react";
import styles from "./ExcerptDialog.module.css";
import { addBasePath } from "@/lib/paths";

export default function ExcerptDialog({
  open,
  onClose,
  title,
  slug,
}: { open: boolean; onClose: () => void; title: string; slug: string; }){
  const panelRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !slug) return;

    async function loadExcerpt() {
      setLoading(true);
      try {
        const res = await fetch(addBasePath(`/content/excerpts/${slug}.html`));
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
        <div className={styles.body}>
          {loading ? <p>Завантаження...</p> : <div dangerouslySetInnerHTML={{ __html: html }} />}
        </div>
      </div>
    </div>
  );
}
