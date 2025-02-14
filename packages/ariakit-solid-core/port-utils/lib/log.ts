// @ts-expect-error No Bun types for now.
import { color } from "bun";

const ANSI_RESET = "\x1b[0m";

export function log(message: string, msgColor?: string, depth = 0) {
  console.log(
    "  ".repeat(depth) +
      (msgColor ? color(msgColor, "ansi") : ANSI_RESET) +
      message +
      ANSI_RESET,
  );
}

export function c(text: string, msgColor?: string) {
  return (msgColor ? color(msgColor, "ansi") : ANSI_RESET) + text + ANSI_RESET;
}

export function space() {
  console.log();
}
