import { useHovercard } from "../hovercard/hovercard.js";
import type { HovercardOptions } from "../hovercard/hovercard.js";
import { useWrapElement } from "../utils/hooks.js";
import { createComponent, createElement, createHook } from "../utils/system.js";
import type { As, Props } from "../utils/types.js";
import { TooltipContext } from "./tooltip-context.js";
import type { TooltipStore } from "./tooltip-store.js";

/**
 * Returns props to create a `Tooltip` component.
 * @see https://ariakit.org/components/tooltip
 * @example
 * ```jsx
 * const store = useToolTipStore();
 * const props = useTooltip({ store });
 * <TooltipAnchor store={store}>Anchor</TooltipAnchor>
 * <Role {...props}>Tooltip</Role>
 * ```
 */
export const useTooltip = createHook<TooltipOptions>(
  ({ store, portal = true, gutter = 8, ...props }) => {
    props = useWrapElement(
      props,
      (element) => (
        <TooltipContext.Provider value={store}>
          {element}
        </TooltipContext.Provider>
      ),
      [store]
    );

    const role = store.useState((state) =>
      state.type === "description" ? "tooltip" : "none"
    );

    props = {
      role,
      ...props,
    };

    props = useHovercard({
      store,
      portal,
      gutter,
      // TODO: Do something about this. See tooltip-instant tests
      // preserveTabOrder: false,
      ...props,
    });

    return props;
  }
);

/**
 * Renders a tooltip element.
 * @see https://ariakit.org/components/tooltip
 * @example
 * ```jsx
 * const tooltip = useTooltipStore();
 * <TooltipAnchor store={tooltip}>Anchor</TooltipAnchor>
 * <Tooltip store={tooltip}>Tooltip</Tooltip>
 * ```
 */
export const Tooltip = createComponent<TooltipOptions>((props) => {
  const htmlProps = useTooltip(props);
  return createElement("div", htmlProps);
});

if (process.env.NODE_ENV !== "production") {
  Tooltip.displayName = "Tooltip";
}

export interface TooltipOptions<T extends As = "div">
  extends HovercardOptions<T> {
  /**
   * Object returned by the `useTooltipStore` hook.
   */
  store: TooltipStore;
  /** @default true */
  portal?: HovercardOptions<T>["portal"];
  /** @default 8 */
  gutter?: HovercardOptions<T>["gutter"];
}

export type TooltipProps<T extends As = "div"> = Props<TooltipOptions<T>>;
