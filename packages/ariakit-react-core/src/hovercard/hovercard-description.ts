import type { ElementType } from "react";
import type { PopoverDescriptionOptions } from "../popover/popover-description.js";
import { usePopoverDescription } from "../popover/popover-description.js";
import { createElement, createHook2, forwardRef } from "../utils/system.js";
import type { Props2 } from "../utils/types.js";
import type { HovercardStore } from "./hovercard-store.js";

const TagName = "p" satisfies ElementType;
type TagName = typeof TagName;

/**
 * Returns props to create a `HovercardDescription` component. This hook must be
 * used in a component that's wrapped with `Hovercard` so the `aria-describedby`
 * prop is properly set on the hovercard element.
 * @see https://ariakit.org/components/hovercard
 * @example
 * ```jsx
 * // This component must be wrapped with Hovercard
 * const props = useHovercardDescription();
 * <Role {...props}>Description</Role>
 * ```
 */
export const useHovercardDescription = createHook2<
  TagName,
  HovercardDescriptionOptions
>(function useHovercardDescription(props) {
  props = usePopoverDescription(props);
  return props;
});

/**
 * Renders a description in a hovercard. This component must be wrapped within
 * [`Hovercard`](https://ariakit.org/reference/hovercard) so the
 * `aria-describedby` prop is properly set on the content element.
 * @see https://ariakit.org/components/hovercard
 * @example
 * ```jsx {3}
 * <HovercardProvider>
 *   <Hovercard>
 *     <HovercardDescription>Description</HovercardDescription>
 *   </Hovercard>
 * </HovercardProvider>
 * ```
 */
export const HovercardDescription = forwardRef(function HovercardDescription(
  props: HovercardDescriptionProps,
) {
  const htmlProps = useHovercardDescription(props);
  return createElement(TagName, htmlProps);
});

export interface HovercardDescriptionOptions<T extends ElementType = TagName>
  extends PopoverDescriptionOptions<T> {
  /**
   * Object returned by the
   * [`useHovercardStore`](https://ariakit.org/reference/use-hovercard-store)
   * hook. If not provided, the closest
   * [`Hovercard`](https://ariakit.org/reference/hovercard) or
   * [`HovercardProvider`](https://ariakit.org/reference/hovercard-provider)
   * components' context will be used.
   */
  store?: HovercardStore;
}

export type HovercardDescriptionProps<T extends ElementType = TagName> = Props2<
  T,
  HovercardDescriptionOptions<T>
>;
