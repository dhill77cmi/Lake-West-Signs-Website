"use client";

import { setAutomaticMotionPaused, useAutomaticMotion } from "@/lib/automatic-motion";

export function MotionPreference() {
  const { paused, systemReduced } = useAutomaticMotion();
  return <button type="button" className="footer-link text-small" aria-pressed={paused}
    disabled={systemReduced} onClick={() => setAutomaticMotionPaused(!paused)}>
    {systemReduced ? "Automatic motion paused by your device" : "Pause automatic motion"}
    {!systemReduced && paused && <span aria-hidden="true" className="ml-2">✓</span>}
  </button>;
}
