'use client'
import dynamic from 'next/dynamic'
import {useMemo} from "react";

const Snowfall = dynamic(() => import('react-snowfall'), { ssr: false });

function isWinterNow() {
    const now = new Date()
    const m = now.getMonth()
    // Winter window: Dec, Jan, Feb
    return m === 11 || m === 0 || m === 1
}

export default function Snow() {
    const show = useMemo(() => isWinterNow(), [])
    if (!show) return null

    return <Snowfall
        color="#82C3D9" style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
    }}
    />
}
