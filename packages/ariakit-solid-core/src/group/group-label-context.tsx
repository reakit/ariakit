import { createContext } from "solid-js";
import type { SetState } from "../utils/__port.ts";

export const GroupLabelContext = createContext<
  SetState<string | undefined> | undefined
>(undefined);
