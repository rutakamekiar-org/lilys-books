import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type StyleProps = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

type ButtonAsButton = StyleProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = StyleProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Internal links only: forwarded to next/link. */
  prefetch?: boolean;
};

// Shared storefront button. Layout (margins, placement) stays with the caller via className;
// colour, radius, typography and interaction states live here. Passing `href` renders a link
// styled as a button: next/link for internal paths, a plain anchor for everything else.
export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", fullWidth = false, className, ...rest } = props;
  const classes = [styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(" ");

  if (rest.href !== undefined) {
    const { href, prefetch, ...anchorProps } = rest as ButtonAsLink;
    return href.startsWith("/")
      ? <Link href={href} prefetch={prefetch} className={classes} {...anchorProps} />
      : <a href={href} className={classes} {...anchorProps} />;
  }

  const { type = "button", ...buttonProps } = rest as ButtonAsButton;
  return <button type={type} className={classes} {...buttonProps} />;
}
