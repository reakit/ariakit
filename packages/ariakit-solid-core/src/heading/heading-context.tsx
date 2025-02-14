import { type Accessor, createContext } from "solid-js";
import type { HeadingLevels } from "./utils.ts";

export const HeadingContext = createContext<Accessor<HeadingLevels | 0>>(
  () => 0 as const,
);
