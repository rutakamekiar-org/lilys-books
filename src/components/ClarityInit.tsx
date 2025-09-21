"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {
  useEffect(() => {
    const id = 'te9lhzi6aj';
    try {
      Clarity.init(id);
    } catch {
      // Silently ignore init errors (e.g., blocked script, adblockers)
    }
  }, []);

  return null;
}
