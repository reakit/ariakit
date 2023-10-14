"use client";
import type { CompositeGroupOptions } from "../composite/composite-group.js";
import { useCompositeGroup } from "../composite/composite-group.js";
import { createComponent, createElement, createHook } from "../utils/system.js";
import type { As, Props } from "../utils/types.js";
import type { ComboboxStore } from "./combobox-store.js";

/**
 * Returns props to create a `ComboboxGroup` component.
 * @see https://ariakit.org/components/combobox
 * @example
 * ```jsx
 * const store = useComboboxStore();
 * const props = useComboboxGroup({ store });
 * <Combobox store={store} />
 * <ComboboxPopover store={store}>
 *   <Role {...props}>
 *     <ComboboxGroupLabel>Label</ComboboxGroupLabel>
 *     <ComboboxItem value="Item 1" />
 *     <ComboboxItem value="Item 2" />
 *   </Role>
 * </ComboboxPopover>
 * ```
 */
export const useComboboxGroup = createHook<ComboboxGroupOptions>((props) => {
  props = useCompositeGroup(props);
  return props;
});

/**
 * Renders a combobox group.
 * @see https://ariakit.org/components/combobox
 * @example
 * ```jsx
 * <ComboboxProvider>
 *   <Combobox />
 *   <ComboboxPopover>
 *     <ComboboxGroup>
 *       <ComboboxGroupLabel>Fruits</ComboboxGroupLabel>
 *       <ComboboxItem value="Apple" />
 *       <ComboboxItem value="Banana" />
 *     </ComboboxGroup>
 *   </ComboboxPopover>
 * </ComboboxProvider>
 * ```
 */
export const ComboboxGroup = createComponent<ComboboxGroupOptions>((props) => {
  const htmlProps = useComboboxGroup(props);
  return createElement("div", htmlProps);
});

if (process.env.NODE_ENV !== "production") {
  ComboboxGroup.displayName = "ComboboxGroup";
}

export interface ComboboxGroupOptions<T extends As = "div">
  extends CompositeGroupOptions<T> {
  /**
   * Object returned by the
   * [`useComboboxStore`](https://ariakit.org/reference/use-combobox-store)
   * hook. If not provided, the parent
   * [`ComboboxList`](https://ariakit.org/reference/combobox-list) or
   * [`ComboboxPopover`](https://ariakit.org/reference/combobox-popover)
   * components' context will be used.
   */
  store?: ComboboxStore;
}

export type ComboboxGroupProps<T extends As = "div"> = Props<
  ComboboxGroupOptions<T>
>;
