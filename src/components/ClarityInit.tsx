"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {

  // Initialize Clarity after a small delay
  useEffect(() => {
    const id = 'te9lhzi6aj';
    const timeout = setTimeout(() => {
      try {
        Clarity.init(id);
      } catch {
        // Ignore adblocker or CSP errors
      }
    }, 800); // Delay 0.8s to allow styles to apply

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
