import type { ElementType } from "../utils/__port.ts";
import { $ } from "../utils/__props.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import type { VisuallyHiddenOptions } from "../visually-hidden/visually-hidden.tsx";
import { useVisuallyHidden } from "../visually-hidden/visually-hidden.tsx";

const TagName = "span" satisfies ElementType;
type TagName = typeof TagName;

/**
 * Returns props to create a `FocusTrap` component.
 * @see https://solid.ariakit.org/components/focus-trap
 * @example
 * ```jsx
 * const props = useFocusTrap();
 * <Role {...props} />
 * ```
 */
export const useFocusTrap = createHook<TagName, FocusTrapOptions>(
  function useFocusTrap(props) {
    $(props, {
      "data-focus-trap": "",
      tabIndex: 0,
      "aria-hidden": true,
    })({
      $style: (props) => ({
        // Prevents unintended scroll jumps.
        position: "fixed",
        top: 0,
        left: 0,
        // TODO [port]: [style-chain]
        // @ts-expect-error
        ...props.style,
      }),
    });

    // TODO: possible to add `props =` to reduce diff noise?
    useVisuallyHidden(props);

    return props;
  },
);

/**
 * Renders a focus trap element.
 * @see https://solid.ariakit.org/components/focus-trap
 * @example
 * ```jsx
 * <FocusTrap onFocus={focusSomethingElse} />
 * ```
 */
export const FocusTrap = forwardRef(function FocusTrap(props: FocusTrapProps) {
  const htmlProps = useFocusTrap(props);
  return createElement(TagName, htmlProps);
});

export type FocusTrapOptions<T extends ElementType = TagName> =
  VisuallyHiddenOptions<T>;

export type FocusTrapProps<T extends ElementType = TagName> = Props<
  T,
  FocusTrapOptions<T>
>;
