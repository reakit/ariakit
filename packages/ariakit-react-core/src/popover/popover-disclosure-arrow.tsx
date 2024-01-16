import { useMemo } from "react";
import { invariant } from "@ariakit/core/utils/misc";
import { createElement, createHook2 } from "../utils/system.js";
import type { As, Options, Props } from "../utils/types.js";
import { usePopoverContext } from "./popover-context.js";
import type { PopoverStore, PopoverStoreState } from "./popover-store.js";

type BasePlacement = "top" | "bottom" | "left" | "right";

const pointsMap = {
  top: "4,10 8,6 12,10",
  right: "6,4 10,8 6,12",
  bottom: "4,6 8,10 12,6",
  left: "10,4 6,8 10,12",
};

/**
 * Returns props to create a `PopoverDisclosureArrow` component.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx
 * const store = usePopoverStore();
 * const props = usePopoverDisclosureArrow({ store });
 * <PopoverDisclosure store={store}>
 *   Disclosure
 *   <Role {...props} />
 * </PopoverDisclosure>
 * ```
 */
export const usePopoverDisclosureArrow =
  createHook<PopoverDisclosureArrowOptions>(
    ({ store, placement, ...props }) => {
      const context = usePopoverContext();
      store = store || context;

      invariant(
        store,
        process.env.NODE_ENV !== "production" &&
          "PopoverDisclosureArrow must be wrapped in a PopoverDisclosure component.",
      );

      const position = store.useState((state) => placement || state.placement);
      const dir = position.split("-")[0] as BasePlacement;
      const points = pointsMap[dir];

      const children = useMemo(
        () => (
          <svg
            display="block"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5pt"
            viewBox="0 0 16 16"
            height="1em"
            width="1em"
          >
            <polyline points={points} />
          </svg>
        ),
        [points],
      );

      props = {
        children,
        "aria-hidden": true,
        ...props,
        style: {
          width: "1em",
          height: "1em",
          pointerEvents: "none",
          ...props.style,
        },
      };

      return props;
    },
  );

/**
 * Renders an arrow pointing to the popover position. It's usually rendered
 * inside the
 * [`PopoverDisclosure`](https://ariakit.org/reference/popover-disclosure)
 * component.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx {4}
 * <PopoverProvider>
 *   <PopoverDisclosure>
 *     Disclosure
 *     <PopoverDisclosureArrow />
 *   </PopoverDisclosure>
 *   <Popover>Popover</Popover>
 * </PopoverProvider>
 * ```
 */
export const PopoverDisclosureArrow =
  createComponent<PopoverDisclosureArrowOptions>((props) => {
    const htmlProps = usePopoverDisclosureArrow(props);
    return createElement("span", htmlProps);
  });

export interface PopoverDisclosureArrowOptions<T extends As = "span">
  extends Options<T> {
  /**
   * Object returned by the
   * [`usePopoverStore`](https://ariakit.org/reference/use-popover-store) hook.
   * If not provided, the closest
   * [`PopoverDisclosure`](https://ariakit.org/reference/popover-disclosure) or
   * [`PopoverProvider`](https://ariakit.org/reference/popover-provider)
   * components' context will be used.
   */
  store?: PopoverStore;
  /**
   * Arrow's placement direction. If not provided, it will be inferred from the
   * context.
   *
   * Live examples:
   * - [Sliding Menu](https://ariakit.org/examples/menu-slide)
   */
  placement?: PopoverStoreState["placement"];
}

export type PopoverDisclosureArrowProps<T extends As = "span"> = Props<
  PopoverDisclosureArrowOptions<T>
>;
