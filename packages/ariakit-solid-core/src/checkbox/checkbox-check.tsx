import { removeUndefinedValues } from "@ariakit/core/utils/misc";
import { useContext } from "solid-js";
import type { ElementType } from "../utils/__port.ts";
import { $, $o } from "../utils/__props.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";
import { CheckboxCheckedContext } from "./checkbox-checked-context.tsx";
import type { CheckboxStore } from "./checkbox-store.ts";

const TagName = "span" satisfies ElementType;
type TagName = typeof TagName;

const checkmark = (
  <svg
    display="block"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width={1.5}
    viewBox="0 0 16 16"
    height="1em"
    width="1em"
  >
    <polyline points="4,8 7,12 12,4" />
  </svg>
);

function getChildren(props: Pick<CheckboxCheckProps, "checked" | "children">) {
  if (props.checked) {
    return props.children || checkmark;
  }
  if (typeof props.children === "function") {
    return props.children;
  }
  return null;
}

/**
 * Returns props to create a `CheckboxCheck` component, that's usually rendered
 * inside a `Checkbox` component.
 * @see https://ariakit.org/components/checkbox
 * @example
 * ```jsx
 * const props = useCheckboxCheck({ checked: true });
 * <Role {...props} />
 * ```
 */
export const useCheckboxCheck = createHook<TagName, CheckboxCheckOptions>(
  function useCheckboxCheck(__) {
    const [_, props] = $o(__, { store: undefined, checked: undefined });
    const context = useContext(CheckboxCheckedContext);
    const resolvedChecked = () => _.checked ?? context();
    const $children = (props: CheckboxCheckProps) =>
      getChildren({ checked: resolvedChecked(), children: props.children });

    $(props, {
      "aria-hidden": true,
    })({
      $children,
      $style: (props) => ({
        width: "1em",
        height: "1em",
        "pointer-events": "none",
        // @ts-expect-error TODO [port]: [style-chain]
        ...props.style,
      }),
    });

    return removeUndefinedValues(props);
  },
);

/**
 * Renders a checkmark icon when the
 * [`checked`](https://ariakit.org/reference/checkbox-check#checked) prop is
 * `true`. The icon can be overridden by providing a different one as children.
 *
 * When rendered inside a [`Checkbox`](https://ariakit.org/reference/checkbox)
 * component, the
 * [`checked`](https://ariakit.org/reference/checkbox-check#checked) prop is
 * automatically derived from the context.
 * @see https://ariakit.org/components/checkbox
 * @example
 * ```jsx
 * <CheckboxCheck checked />
 * ```
 */
export const CheckboxCheck = forwardRef(function CheckboxCheck(
  props: CheckboxCheckProps,
) {
  const htmlProps = useCheckboxCheck(props);
  return createElement(TagName, htmlProps);
});

export interface CheckboxCheckOptions<_T extends ElementType = TagName>
  extends Options {
  /**
   * Object returned by the
   * [`useCheckboxStore`](https://ariakit.org/reference/use-checkbox-store)
   * hook.
   */
  store?: CheckboxStore;
  /**
   * Determines if the checkmark should be rendered. This value is automatically
   * derived from the context when it exists. Manually setting this prop will
   * supersede the derived value.
   *
   * Live examples:
   * - [Submenu with
   *   Combobox](https://ariakit.org/examples/menu-nested-combobox)
   */
  checked?: boolean;
}

export type CheckboxCheckProps<T extends ElementType = TagName> = Props<
  T,
  CheckboxCheckOptions<T>
>;
