import type { ElementType, FocusEvent, KeyboardEvent } from "react";
import { useRef } from "react";
import { isFocusEventOutside } from "@ariakit/core/utils/events";
import { invariant } from "@ariakit/core/utils/misc";
import { isHidden } from "../disclosure/disclosure-content.js";
import type { DisclosureContentOptions } from "../disclosure/disclosure-content.js";
import { useFocusable } from "../focusable/focusable.js";
import type { FocusableOptions } from "../focusable/focusable.js";
import {
  useAttribute,
  useEvent,
  useId,
  useMergeRefs,
  useWrapElement,
} from "../utils/hooks.js";
import { createElement, createHook2, forwardRef } from "../utils/system.js";
import type { Props2 } from "../utils/types.js";
import {
  ComboboxScopedContextProvider,
  useComboboxProviderContext,
} from "./combobox-context.js";
import type { ComboboxStore } from "./combobox-store.js";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

/**
 * Returns props to create a `ComboboxList` component.
 * @see https://ariakit.org/components/combobox
 * @example
 * ```jsx
 * const store = useComboboxStore();
 * const props = useComboboxList({ store });
 * <Role {...props}>
 *   <ComboboxItem value="Item 1" />
 *   <ComboboxItem value="Item 2" />
 *   <ComboboxItem value="Item 3" />
 * </Role>
 * ```
 */
export const useComboboxList = createHook2<TagName, ComboboxListOptions>(
  function useComboboxList({
    store,
    focusable = true,
    alwaysVisible,
    ...props
  }) {
    const context = useComboboxProviderContext();
    store = store || context;

    invariant(
      store,
      process.env.NODE_ENV !== "production" &&
        "ComboboxList must receive a `store` prop or be wrapped in a ComboboxProvider component.",
    );

    const ref = useRef<HTMLType>(null);
    const id = useId(props.id);

    const onKeyDownProp = props.onKeyDown;

    const onKeyDown = useEvent((event: KeyboardEvent<HTMLType>) => {
      onKeyDownProp?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        store?.move(null);
      }
    });

    // VoiceOver on Safari doesn't work well with combobox widgets using the
    // aria-activedescedant attribute. So, when the list receives keyboard
    // focus, which usually happens when using VO keys to navigate to the
    // listbox, we temporarily disable virtual focus until the listbox loses
    // focus.
    const restoreVirtualFocus = useRef(false);
    const onFocusVisibleProp = props.onFocusVisible;

    const onFocusVisible = useEvent((event: FocusEvent<HTMLType>) => {
      onFocusVisibleProp?.(event);
      if (event.defaultPrevented) return;
      if (event.type !== "focus") return;
      if (!store) return;
      const { virtualFocus } = store.getState();
      if (!virtualFocus) return;
      const { relatedTarget, currentTarget } = event;
      if (relatedTarget && currentTarget.contains(relatedTarget)) return;
      restoreVirtualFocus.current = true;
      store.setState("virtualFocus", false);
    });

    const onBlurProp = props.onBlur;

    const onBlur = useEvent((event: FocusEvent<HTMLType>) => {
      onBlurProp?.(event);
      if (event.defaultPrevented) return;
      if (!restoreVirtualFocus.current) return;
      if (!isFocusEventOutside(event)) return;
      restoreVirtualFocus.current = false;
      store?.setState("virtualFocus", true);
    });

    props = useWrapElement(
      props,
      (element) => (
        <ComboboxScopedContextProvider value={store}>
          {element}
        </ComboboxScopedContextProvider>
      ),
      [store],
    );

    const mounted = store.useState("mounted");
    const hidden = isHidden(mounted, props.hidden, alwaysVisible);
    const style = hidden ? { ...props.style, display: "none" } : props.style;

    const multiSelectable = store.useState((state) =>
      Array.isArray(state.selectedValue),
    );
    const role = useAttribute(ref, "role", props.role);
    const isCompositeRole =
      role === "listbox" || role === "tree" || role === "grid";
    const ariaMultiSelectable = isCompositeRole
      ? multiSelectable || undefined
      : undefined;

    props = {
      id,
      hidden,
      role: "listbox",
      tabIndex: focusable ? -1 : undefined,
      "aria-multiselectable": ariaMultiSelectable,
      ...props,
      ref: useMergeRefs(id ? store.setContentElement : null, ref, props.ref),
      style,
      onKeyDown,
      onFocusVisible,
      onBlur,
    };

    props = useFocusable({ focusable, ...props });

    return props;
  },
);

/**
 * Renders a combobox list. The `role` prop is set to `listbox` by default, but
 * can be overriden by any other valid combobox popup role (`listbox`, `menu`,
 * `tree`, `grid` or `dialog`).
 * @see https://ariakit.org/components/combobox
 * @example
 * ```jsx {3-7}
 * <ComboboxProvider>
 *   <Combobox />
 *   <ComboboxList>
 *     <ComboboxItem value="Apple" />
 *     <ComboboxItem value="Banana" />
 *     <ComboboxItem value="Orange" />
 *   </ComboboxList>
 * </ComboboxProvider>
 * ```
 */
export const ComboboxList = forwardRef(function ComboboxList(
  props: ComboboxListProps,
) {
  const htmlProps = useComboboxList(props);
  return createElement(TagName, htmlProps);
});

export interface ComboboxListOptions<T extends ElementType = TagName>
  extends FocusableOptions<T>,
    Pick<DisclosureContentOptions, "alwaysVisible"> {
  /**
   * Object returned by the
   * [`useComboboxStore`](https://ariakit.org/reference/use-combobox-store)
   * hook. If not provided, the closest
   * [`ComboboxProvider`](https://ariakit.org/reference/combobox-provider)
   * component's context will be used.
   */
  store?: ComboboxStore;
}

export type ComboboxListProps<T extends ElementType = TagName> = Props2<
  T,
  ComboboxListOptions<T>
>;
