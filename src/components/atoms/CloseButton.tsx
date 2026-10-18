import type { ButtonHTMLAttributes } from "react";
import styles from "./CloseButton.module.css";

type CloseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

// "×" button for dialog and sheet headers. Keeps a 44px touch target at every size.
export default function CloseButton({ className, type = "button", ...props }: CloseButtonProps) {
  return (
    <button
      type={type}
      aria-label="Закрити"
      className={className ? `${styles.close} ${className}` : styles.close}
      {...props}
    >
      ×
    </button>
  );
}
