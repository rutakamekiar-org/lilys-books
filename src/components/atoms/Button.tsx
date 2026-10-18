import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

// Shared storefront button. Layout (margins, placement) stays with the caller via className;
// colour, radius, typography and interaction states live here.
export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...props} />;
}
