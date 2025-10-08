"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavBar.module.css";
import { withCacheBust } from "@/lib/paths";

export default function NavBar() {
  const pathname = usePathname() || "/";
  const cls = (href: string) =>
    `${styles.link} ${pathname === href ? styles.active : ""}`;
  return (
    <nav className={styles.nav}>
      <Link href={withCacheBust("/")} className={cls("/")} aria-current={pathname === "/" ? "page" : undefined}>Головна</Link>
      <Link href={withCacheBust("/events")} className={cls("/events")} aria-current={pathname === "/events" ? "page" : undefined}>Події</Link>
      <Link href={withCacheBust("/about")} className={cls("/about")} aria-current={pathname === "/about" ? "page" : undefined}>Про мене</Link>
    </nav>
  );
}