import { PlaygroundStoreState } from "../playground-store";

export function getValue(state?: PlaygroundStoreState, filename?: string) {
  if (!state) return "";
  if (!filename) return "";
  return state.values[filename] ?? "";
}
