import type { ButtonHTMLAttributes } from "react";
import Icon from "./Icon";
import styles from "./CloseButton.module.css";

type CloseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

// Close button for dialog and sheet headers. Keeps a 44px touch target at every size.
// The cross is an SVG, not the "×" character: iOS WebKit painted that glyph in its system blue.
export default function CloseButton({ className, type = "button", ...props }: CloseButtonProps) {
  return (
    <button
      type={type}
      aria-label="Закрити"
      className={className ? `${styles.close} ${className}` : styles.close}
      {...props}
    >
      <Icon name="xmark" />
    </button>
  );
}
