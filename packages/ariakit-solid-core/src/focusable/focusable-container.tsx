import type { ElementType } from "../utils/__port.ts";
import { $o } from "../utils/__props.ts";
import { useWrapElement } from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";
import { FocusableContext } from "./focusable-context.tsx";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;

/**
 * Returns props to create a `FocusableContainer` component.
 * @see https://ariakit.org/components/focusable
 * @example
 * ```jsx
 * const props = useFocusableContainer();
 * <Role {...props} />
 * ```
 */
export const useFocusableContainer = createHook<
  TagName,
  FocusableContainerOptions
>(function useFocusableContainer(__) {
  let [_, props] = $o(__, { autoFocusOnShow: true });
  props = useWrapElement(
    props,
    (element) => (
      // TODO [port]: does it need to be an accessor?
      <FocusableContext.Provider value={() => _.autoFocusOnShow}>
        {element.children}
      </FocusableContext.Provider>
    ),
    [],
  );

  return props;
});

/**
 * Renders a div that wraps
 * [`Focusable`](https://ariakit.org/reference/focusable) components and
 * controls whether they can be auto-focused.
 * @see https://ariakit.org/components/focusable
 * @example
 * ```jsx
 * <FocusableContainer autoFocusOnShow={false}>
 *   <Focusable autoFocus />
 * </FocusableContainer>
 * ```
 */
export const FocusableContainer = forwardRef(function FocusableContainer(
  props: FocusableContainerProps,
) {
  const htmlProps = useFocusableContainer(props);
  return createElement(TagName, htmlProps);
});

export interface FocusableContainerOptions<_T extends ElementType = TagName>
  extends Options {
  /**
   * Determines whether [`Focusable`](https://ariakit.org/reference/focusable)
   * elements inside the container should be automatically focused when the
   * container is shown and they have the
   * [`autoFocus`](https://ariakit.org/reference/focusable#autofocus) prop.
   * @default true
   */
  autoFocusOnShow?: boolean;
}

export type FocusableContainerProps<T extends ElementType = TagName> = Props<
  T,
  FocusableContainerOptions<T>
>;
