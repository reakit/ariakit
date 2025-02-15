import { createStoreContext } from "../utils/system.tsx";
import type { CheckboxStore } from "./checkbox-store.ts";

const ctx = createStoreContext<CheckboxStore>();

/**
 * Returns the checkbox store from the nearest checkbox container.
 * @example
 * function Checkbox() {
 *   const store = useCheckboxContext();
 *
 *   if (!store) {
 *     throw new Error("Checkbox must be wrapped in CheckboxProvider");
 *   }
 *
 *   // Use the store...
 * }
 */
export const useCheckboxContext = ctx.useContext;

export const useCheckboxScopedContext = ctx.useScopedContext;

export const useCheckboxProviderContext = ctx.useProviderContext;

export const CheckboxContextProvider = ctx.ContextProvider;

export const CheckboxScopedContextProvider = ctx.ScopedContextProvider;
