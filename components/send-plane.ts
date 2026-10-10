"use client";

import { useState, type CSSProperties } from "react";

export const sendPlaneMs = 1170;

// Play the paper-plane GIF once when a complete request is sent: a fresh query string restarts it,
// and the still frame returns after one cycle (1170 ms). Reduced motion keeps the still frame.
export function useSendPlane() {
  const [stamp, setStamp] = useState(0);
  const play = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStamp(Date.now());
    setTimeout(() => setStamp(0), sendPlaneMs);
  };
  const iconStyle: CSSProperties | undefined = stamp ? { backgroundImage: `url(/send.gif?${stamp})` } : undefined;
  return { play, iconStyle };
}
