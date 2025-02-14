import type { MutableRefObject } from "react";

/**
 * Sets both a function and "object" ref.
 */
export function setRef<T>(
  ref: ((element: T) => void) | MutableRefObject<T> | undefined,
  value: T,
) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}
