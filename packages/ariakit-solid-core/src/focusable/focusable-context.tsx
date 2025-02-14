import { createContext } from "solid-js";

// TODO [port]: does it need to be an accessor?
export const FocusableContext = createContext<() => boolean>(() => true);
