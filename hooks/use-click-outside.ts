"use client"

import { useEffect, type RefObject } from "react"

// Calls `handler` when a click/touch happens outside the referenced element.
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = ref.current
      if (!el || el.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
    }
  }, [ref, handler, enabled])
}
