"use client";

import { useSyncExternalStore } from "react";

const key = "lws-pause-automatic-motion";
const event = "lws-automatic-motion";
let memoryPreference = false;

function snapshot(): "system" | "paused" | "playing" {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "system";
  try { memoryPreference = localStorage.getItem(key) === "true"; } catch { /* Storage is optional. */ }
  return memoryPreference ? "paused" : "playing";
}

function subscribe(update: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener(event, update);
  window.addEventListener("storage", update);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener(event, update);
    window.removeEventListener("storage", update);
    media.removeEventListener("change", update);
  };
}

export function automaticMotionPaused() {
  return snapshot() !== "playing";
}

export function useAutomaticMotion() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "playing" as const);
  return { paused: state !== "playing", systemReduced: state === "system" };
}

export function setAutomaticMotionPaused(paused: boolean) {
  memoryPreference = paused;
  try { localStorage.setItem(key, String(paused)); } catch { /* Keep the in-memory preference. */ }
  window.dispatchEvent(new Event(event));
}
