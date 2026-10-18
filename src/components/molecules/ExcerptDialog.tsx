"use client";
import { useEffect, useState } from "react";
import styles from "./ExcerptDialog.module.css";
import Dialog from "@/components/molecules/Dialog";

export default function ExcerptDialog({
  open,
  onClose,
  title,
  slug,
}: { open: boolean; onClose: () => void; title: string; slug: string; }){
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  // The dialog title is an h2, which keeps the heading order valid: excerpt bodies start their own sections at h2.
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<><span>Читати уривок</span><span className={styles.titleSeparator}> — </span><span className={styles.bookTitle}>{title}</span></>}
      classNames={{ overlay: styles.overlay, panel: styles.panel, header: styles.header, title: styles.title }}
      lockScroll
      dismissible
    >
      <div className={styles.body} role="region" aria-label="Текст уривку" tabIndex={0}>
        {loading ? <p>Завантаження...</p> : <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </Dialog>
  );
}
