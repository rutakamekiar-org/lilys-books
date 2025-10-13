"use client"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

export default function Analytics() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!pathname) return
        const url = pathname + searchParams.toString()

        // Send a pageview to Google Analytics
        // @ts-expect-error
        window.gtag?.("config",
            GA_MEASUREMENT_ID, {
            page_path: url,
        })
    }, [pathname, searchParams])

    return null
}
