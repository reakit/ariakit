import type { PickRequired } from "@ariakit/core/utils/types";
import type { JSX } from "solid-js";
import { CheckboxContextProvider } from "./checkbox-context.tsx";
import { useCheckboxStore } from "./checkbox-store.ts";
import type {
  CheckboxStoreProps,
  CheckboxStoreValue,
} from "./checkbox-store.ts";

type Value = CheckboxStoreValue;

/**
 * Provides a checkbox store for its descendants. This comes in handy when
 * creating a group of checkboxes that share the same state. `CheckboxProvider`
 * can efficiently manage the value of a checkbox, whether it's a single string,
 * number, or boolean value, or an array of such values.
 * @see https://ariakit.org/components/checkbox
 * @example
 * ```jsx
 * <CheckboxProvider defaultValue={["orange"]}>
 *   <label>
 *     <Checkbox value="apple" /> Apple
 *   </label>
 *   <label>
 *     <Checkbox value="orange" /> Orange
 *   </label>
 *   <label>
 *     <Checkbox value="mango" /> Mango
 *   </label>
 * </CheckboxProvider>
 * ```
 */

export function CheckboxProvider<T extends Value = Value>(
  props: PickRequired<CheckboxProviderProps<T>, "value" | "defaultValue">,
): JSX.Element;

export function CheckboxProvider(props?: CheckboxProviderProps): JSX.Element;

export function CheckboxProvider(props: CheckboxProviderProps = {}) {
  const store = useCheckboxStore(props);
  return (
    <CheckboxContextProvider value={store}>
      {props.children}
    </CheckboxContextProvider>
  );
}

export interface CheckboxProviderProps<T extends Value = Value>
  extends CheckboxStoreProps<T> {
  children?: JSX.Element;
}
