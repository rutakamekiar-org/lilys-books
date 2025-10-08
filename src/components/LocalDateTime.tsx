"use client";
import { useEffect, useState } from "react";

export default function LocalDateTime({
                                          iso,
                                          locale,
                                          hour12 = false,
                                          showDate = true,
                                          showTime = true,
                                          separator = " · ",
                                          className,
                                      }: {
    iso: string;
    locale?: string;
    hour12?: boolean;
    showDate?: boolean;
    showTime?: boolean;
    separator?: string;
    className?: string;
}) {
    const [text, setText] = useState("");

    useEffect(() => {
        const d = new Date(iso);
        const loc = locale ?? navigator.language;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const parts: string[] = [];
        if (showDate) {
            parts.push(
                d.toLocaleDateString(loc, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: tz,
                })
            );
        }
        if (showTime) {
            parts.push(
                d.toLocaleTimeString(loc, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12,
                    timeZone: tz,
                })
            );
        }
        setText(parts.join(separator));
    }, [iso, locale, hour12, showDate, showTime, separator]);

    // Уникаємо попередження про розсинхронізацію
    return <span className={className} suppressHydrationWarning>{text}</span>;
}
