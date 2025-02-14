import { invariant } from "@ariakit/core/utils/misc";
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
  size,
} from "@floating-ui/dom";
import type { ElementType, HTMLAttributes } from "react";
import { useRef, useState } from "react";
import type { DialogOptions } from "../dialog/dialog.tsx";
import { createDialogComponent, useDialog } from "../dialog/dialog.tsx";
import {
  useEvent,
  usePortalRef,
  useSafeLayoutEffect,
  useWrapElement,
} from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import {
  PopoverScopedContextProvider,
  usePopoverProviderContext,
} from "./popover-context.tsx";
import type { PopoverStore } from "./popover-store.ts";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;
type BasePlacement = "top" | "bottom" | "left" | "right";

type Placement =
  | BasePlacement
  | `${BasePlacement}-start`
  | `${BasePlacement}-end`;

interface AnchorRect {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

function createDOMRect(x = 0, y = 0, width = 0, height = 0) {
  if (typeof DOMRect === "function") {
    return new DOMRect(x, y, width, height);
  }
  // JSDOM doesn't support DOMRect constructor.
  const rect = {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
  };
  return { ...rect, toJSON: () => rect };
}

function getDOMRect(anchorRect?: AnchorRect | null) {
  if (!anchorRect) return createDOMRect();
  const { x, y, width, height } = anchorRect;
  return createDOMRect(x, y, width, height);
}

function getAnchorElement(
  anchorElement: HTMLElement | null,
  getAnchorRect?: (anchor: HTMLElement | null) => AnchorRect | null,
) {
  // https://floating-ui.com/docs/virtual-elements
  const contextElement = anchorElement || undefined;
  return {
    contextElement,
    getBoundingClientRect: () => {
      const anchor = anchorElement;
      const anchorRect = getAnchorRect?.(anchor);
      if (anchorRect || !anchor) {
        return getDOMRect(anchorRect);
      }
      return anchor.getBoundingClientRect();
    },
  };
}

function isValidPlacement(flip: string): flip is Placement {
  return /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(flip);
}

// https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
function roundByDPR(value: number) {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

function getOffsetMiddleware(
  arrowElement: HTMLElement | null,
  props: Pick<PopoverOptions, "gutter" | "shift">,
) {
  // https://floating-ui.com/docs/offset
  return offset(({ placement }: { placement: Placement }) => {
    const arrowOffset = (arrowElement?.clientHeight || 0) / 2;
    const finalGutter =
      typeof props.gutter === "number"
        ? props.gutter + arrowOffset
        : (props.gutter ?? arrowOffset);
    // If there's no placement alignment (*-start or *-end),
    // we'll fallback to the crossAxis offset as it also works
    // for center-aligned placements.
    const hasAlignment = !!placement.split("-")[1];
    return {
      crossAxis: !hasAlignment ? props.shift : undefined,
      mainAxis: finalGutter,
      alignmentAxis: props.shift,
    };
  });
}

function getFlipMiddleware(
  props: Pick<PopoverOptions, "flip" | "overflowPadding">,
) {
  if (props.flip === false) return;
  const fallbackPlacements =
    typeof props.flip === "string" ? props.flip.split(" ") : undefined;

  invariant(
    !fallbackPlacements || fallbackPlacements.every(isValidPlacement),
    process.env.NODE_ENV !== "production" &&
      "`flip` expects a spaced-delimited list of placements",
  );

  // https://floating-ui.com/docs/flip
  return flip({
    padding: props.overflowPadding,
    fallbackPlacements,
  });
}

function getShiftMiddleware(
  props: Pick<
    PopoverOptions,
    "slide" | "shift" | "overlap" | "overflowPadding"
  >,
) {
  if (!props.slide && !props.overlap) return;
  // https://floating-ui.com/docs/shift
  return shift({
    mainAxis: props.slide,
    crossAxis: props.overlap,
    padding: props.overflowPadding,
    limiter: limitShift(),
  });
}

function getSizeMiddleware(
  props: Pick<PopoverOptions, "sameWidth" | "fitViewport" | "overflowPadding">,
) {
  // https://floating-ui.com/docs/size
  return size({
    padding: props.overflowPadding,
    apply({ elements, availableWidth, availableHeight, rects }) {
      const wrapper = elements.floating;
      const referenceWidth = Math.round(rects.reference.width);

      availableWidth = Math.floor(availableWidth);
      availableHeight = Math.floor(availableHeight);

      wrapper.style.setProperty(
        "--popover-anchor-width",
        `${referenceWidth}px`,
      );
      wrapper.style.setProperty(
        "--popover-available-width",
        `${availableWidth}px`,
      );
      wrapper.style.setProperty(
        "--popover-available-height",
        `${availableHeight}px`,
      );

      if (props.sameWidth) {
        wrapper.style.width = `${referenceWidth}px`;
      }

      if (props.fitViewport) {
        wrapper.style.maxWidth = `${availableWidth}px`;
        wrapper.style.maxHeight = `${availableHeight}px`;
      }
    },
  });
}

function getArrowMiddleware(
  arrowElement: HTMLElement | null,
  props: Pick<PopoverOptions, "arrowPadding">,
) {
  if (!arrowElement) return;
  // https://floating-ui.com/docs/arrow
  return arrow({
    element: arrowElement,
    padding: props.arrowPadding,
  });
}

/**
 * Returns props to create a `Popover` component.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx
 * const store = usePopoverStore();
 * const props = usePopover({ store });
 * <Role {...props}>Popover</Role>
 * ```
 */
export const usePopover = createHook<TagName, PopoverOptions>(
  function usePopover({
    store,
    modal = false,
    portal = !!modal,
    preserveTabOrder = true,
    autoFocusOnShow = true,
    wrapperProps,
    fixed = false,
    flip = true,
    shift = 0,
    slide = true,
    overlap = false,
    sameWidth = false,
    fitViewport = false,
    gutter,
    arrowPadding = 4,
    overflowPadding = 8,
    getAnchorRect,
    updatePosition,
    ...props
  }) {
    const context = usePopoverProviderContext();
    store = store || context;

    invariant(
      store,
      process.env.NODE_ENV !== "production" &&
        "Popover must receive a `store` prop or be wrapped in a PopoverProvider component.",
    );

    const arrowElement = store.useState("arrowElement");
    const anchorElement = store.useState("anchorElement");
    const disclosureElement = store.useState("disclosureElement");
    const popoverElement = store.useState("popoverElement");
    const contentElement = store.useState("contentElement");
    const placement = store.useState("placement");
    const mounted = store.useState("mounted");
    const rendered = store.useState("rendered");

    const defaultArrowElementRef = useRef<HTMLElement | null>(null);

    // We have to wait for the popover to be positioned for the first time
    // before we can move focus, otherwise there may be scroll jumps. See
    // popover-standalone example test-browser file.
    const [positioned, setPositioned] = useState(false);

    const { portalRef, domReady } = usePortalRef(portal, props.portalRef);

    const getAnchorRectProp = useEvent(getAnchorRect);
    const updatePositionProp = useEvent(updatePosition);
    const hasCustomUpdatePosition = !!updatePosition;

    useSafeLayoutEffect(() => {
      if (!popoverElement?.isConnected) return;

      popoverElement.style.setProperty(
        "--popover-overflow-padding",
        `${overflowPadding}px`,
      );

      const anchor = getAnchorElement(
        anchorElement ?? disclosureElement,
        getAnchorRectProp,
      );

      const updatePosition = async () => {
        if (!mounted) return;

        if (!arrowElement) {
          defaultArrowElementRef.current =
            defaultArrowElementRef.current || document.createElement("div");
        }

        const arrow = arrowElement || defaultArrowElementRef.current;

        const middleware = [
          getOffsetMiddleware(arrow, { gutter, shift }),
          getFlipMiddleware({ flip, overflowPadding }),
          getShiftMiddleware({ slide, shift, overlap, overflowPadding }),
          getArrowMiddleware(arrow, { arrowPadding }),
          getSizeMiddleware({
            sameWidth,
            fitViewport,
            overflowPadding,
          }),
        ];

        // https://floating-ui.com/docs/computePosition
        const pos = await computePosition(anchor, popoverElement, {
          placement,
          strategy: fixed ? "fixed" : "absolute",
          middleware,
        });

        store?.setState("currentPlacement", pos.placement);
        setPositioned(true);

        const x = roundByDPR(pos.x);
        const y = roundByDPR(pos.y);

        // https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
        Object.assign(popoverElement.style, {
          top: "0",
          left: "0",
          transform: `translate3d(${x}px,${y}px,0)`,
        });

        // https://floating-ui.com/docs/arrow#usage
        if (arrow && pos.middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = pos.middlewareData.arrow;

          const side = pos.placement.split("-")[0] as BasePlacement;

          const centerX = arrow.clientWidth / 2;
          const centerY = arrow.clientHeight / 2;

          const originX = arrowX != null ? arrowX + centerX : -centerX;
          const originY = arrowY != null ? arrowY + centerY : -centerY;

          popoverElement.style.setProperty(
            "--popover-transform-origin",
            {
              top: `${originX}px calc(100% + ${centerY}px)`,
              bottom: `${originX}px ${-centerY}px`,
              left: `calc(100% + ${centerX}px) ${originY}px`,
              right: `${-centerX}px ${originY}px`,
            }[side],
          );

          Object.assign(arrow.style, {
            left: arrowX != null ? `${arrowX}px` : "",
            top: arrowY != null ? `${arrowY}px` : "",
            [side]: "100%",
          });
        }
      };

      const update = async () => {
        if (hasCustomUpdatePosition) {
          await updatePositionProp({ updatePosition });
          setPositioned(true);
        } else {
          await updatePosition();
        }
      };

      // https://floating-ui.com/docs/autoUpdate
      const cancelAutoUpdate = autoUpdate(anchor, popoverElement, update, {
        // JSDOM doesn't support ResizeObserver
        elementResize: typeof ResizeObserver === "function",
      });

      return () => {
        setPositioned(false);
        cancelAutoUpdate();
      };
    }, [
      store,
      rendered,
      popoverElement,
      arrowElement,
      anchorElement,
      popoverElement,
      placement,
      mounted,
      domReady,
      fixed,
      flip,
      shift,
      slide,
      overlap,
      sameWidth,
      fitViewport,
      gutter,
      arrowPadding,
      overflowPadding,
      getAnchorRectProp,
      hasCustomUpdatePosition,
      updatePositionProp,
    ]);

    // Makes sure the wrapper element that's passed to floating UI has the same
    // z-index as the popover element so users only need to set the z-index
    // once.
    useSafeLayoutEffect(() => {
      if (!mounted) return;
      if (!domReady) return;
      if (!popoverElement?.isConnected) return;
      if (!contentElement?.isConnected) return;
      const applyZIndex = () => {
        popoverElement.style.zIndex = getComputedStyle(contentElement).zIndex;
      };
      applyZIndex();
      // It's possible that the zIndex value changes after the popover is
      // mounted, so we need to keep checking.
      let raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(applyZIndex);
      });
      return () => cancelAnimationFrame(raf);
    }, [mounted, domReady, popoverElement, contentElement]);

    const position = fixed ? "fixed" : "absolute";

    // Wrap our element in a div that will be used to position the popover.
    // This way the user doesn't need to override the popper's position to
    // create animations.
    props = useWrapElement(
      props,
      (element) => (
        <div
          {...wrapperProps}
          style={{
            // https://floating-ui.com/docs/computeposition#initial-layout
            position,
            top: 0,
            left: 0,
            width: "max-content",
            ...wrapperProps?.style,
          }}
          ref={store?.setPopoverElement}
        >
          {element}
        </div>
      ),
      [store, position, wrapperProps],
    );

    props = useWrapElement(
      props,
      (element) => (
        <PopoverScopedContextProvider value={store}>
          {element}
        </PopoverScopedContextProvider>
      ),
      [store],
    );

    props = {
      // data-placing is not part of the public API. We're setting this here so
      // we can wait for the popover to be positioned before other components
      // move focus into it. For example, this attribute is observed by the
      // Combobox component with the autoSelect behavior.
      "data-placing": !positioned || undefined,
      ...props,
      style: {
        position: "relative",
        ...props.style,
      },
    };

    props = useDialog({
      store,
      modal,
      portal,
      preserveTabOrder,
      preserveTabOrderAnchor: disclosureElement || anchorElement,
      autoFocusOnShow: positioned && autoFocusOnShow,
      ...props,
      portalRef,
    });

    return props;
  },
);

/**
 * Renders a popover element that's automatically positioned relative to an
 * anchor element.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx {3}
 * <PopoverProvider>
 *   <PopoverDisclosure>Disclosure</PopoverDisclosure>
 *   <Popover>Popover</Popover>
 * </PopoverProvider>
 * ```
 */
export const Popover = createDialogComponent(
  forwardRef(function Popover(props: PopoverProps) {
    const htmlProps = usePopover(props);
    return createElement(TagName, htmlProps);
  }),
  usePopoverProviderContext,
);

export interface PopoverOptions<T extends ElementType = TagName>
  extends DialogOptions<T> {
  /**
   * Object returned by the
   * [`usePopoverStore`](https://ariakit.org/reference/use-popover-store) hook.
   * If not provided, the closest
   * [`PopoverProvider`](https://ariakit.org/reference/popover-provider)
   * component's context will be used.
   */
  store?: PopoverStore;
  /**
   * Props that will be passed to the popover wrapper element. This element will
   * be used to position the popover.
   *
   * Live examples:
   * - [Navigation Menubar](https://ariakit.org/examples/menubar-navigation)
   * - [Sliding Menu](https://ariakit.org/examples/menu-slide)
   */
  wrapperProps?: HTMLAttributes<HTMLDivElement>;
  /**
   * Whether the popover has `position: fixed` or not.
   * @default false
   */
  fixed?: boolean;
  /**
   * The distance between the popover and the anchor element.
   *
   * Live examples:
   * - [Combobox filtering](https://ariakit.org/examples/combobox-filtering)
   * - [Form with Select](https://ariakit.org/examples/form-select)
   * - [Hovercard with keyboard support](https://ariakit.org/examples/hovercard-disclosure)
   * - [MenuItemRadio](https://ariakit.org/examples/menu-item-radio)
   * - [Submenu](https://ariakit.org/examples/menu-nested)
   * - [Toolbar with Select](https://ariakit.org/examples/toolbar-select)
   * @default 0
   */
  gutter?: number;
  /**
   * The skidding of the popover along the anchor element. Can be set to
   * negative values to make the popover shift to the opposite side.
   *
   * Live examples:
   * - [Combobox with Tabs](https://ariakit.org/examples/combobox-tabs)
   * - [Navigation Menubar](https://ariakit.org/examples/menubar-navigation)
   * - [Submenu](https://ariakit.org/examples/menu-nested)
   * - [Menubar](https://ariakit.org/components/menubar)
   * - [Select with Combobox and
   *   Tabs](https://ariakit.org/examples/select-combobox-tab)
   * @default 0
   */
  shift?: number;
  /**
   * Controls the behavior of the popover when it overflows the viewport:
   * - If a `boolean`, specifies whether the popover should flip to the opposite
   *   side when it overflows.
   * - If a `string`, indicates the preferred fallback placements when it
   *   overflows. The placements must be spaced-delimited, e.g. "top left".
   *
   * Live examples:
   * - [Sliding Menu](https://ariakit.org/examples/menu-slide)
   * - [Menubar](https://ariakit.org/components/menubar)
   * @default true
   */
  flip?: boolean | string;
  /**
   * Whether the popover should slide when it overflows.
   * @default true
   */
  slide?: boolean;
  /**
   * Whether the popover can overlap the anchor element when it overflows.
   *
   * Live examples:
   * - [Menubar](https://ariakit.org/components/menubar)
   * - [Submenu with
   *   Combobox](https://ariakit.org/examples/menu-nested-combobox)
   * @default false
   */
  overlap?: boolean;
  /**
   * Whether the popover should have the same width as the anchor element. This
   * will be exposed to CSS as
   * [`--popover-anchor-width`](https://ariakit.org/guide/styling#--popover-anchor-width).
   * @default false
   */
  sameWidth?: boolean;
  /**
   * Whether the popover should fit the viewport. If this is set to true, the
   * popover wrapper will have `maxWidth` and `maxHeight` set to the viewport
   * size. This will be exposed to CSS as
   * [`--popover-available-width`](https://ariakit.org/guide/styling#--popover-available-width)
   * and
   * [`--popover-available-height`](https://ariakit.org/guide/styling#--popover-available-height).
   *
   * Live examples:
   * - [Textarea with inline
   *   Combobox](https://ariakit.org/examples/combobox-textarea)
   * - [Menubar](https://ariakit.org/components/menubar)
   * @default false
   */
  fitViewport?: boolean;
  /**
   * The minimum padding between the arrow and the popover corner.
   * @default 4
   */
  arrowPadding?: number;
  /**
   * The minimum padding between the popover and the viewport edge. This will be
   * exposed to CSS as
   * [`--popover-overflow-padding`](https://ariakit.org/guide/styling#--popover-overflow-padding).
   *
   * Live examples:
   * - [Sliding Menu](https://ariakit.org/examples/menu-slide)
   * @default 8
   */
  overflowPadding?: number;
  /**
   * Function that returns the anchor element's DOMRect. If this is explicitly
   * passed, it will override the anchor `getBoundingClientRect` method.
   *
   * Live examples:
   *  - [Textarea with inline combobox](https://ariakit.org/examples/combobox-textarea)
   *  - [Standalone Popover](https://ariakit.org/examples/popover-standalone)
   *  - [Context menu](https://ariakit.org/examples/menu-context-menu)
   *  - [Selection Popover](https://ariakit.org/examples/popover-selection)
   */
  getAnchorRect?: (anchor: HTMLElement | null) => AnchorRect | null;
  /**
   * A callback that will be called when the popover needs to calculate its
   * position. This will override the internal `updatePosition` function. The
   * original `updatePosition` function will be passed as an argument, so it can
   * be called inside the callback to apply the default behavior.
   *
   * Live examples:
   *  - [Responsive Popover](https://ariakit.org/examples/popover-responsive)
   */
  updatePosition?: (props: {
    updatePosition: () => Promise<void>;
  }) => void | Promise<void>;
}

export type PopoverProps<T extends ElementType = TagName> = Props<
  T,
  PopoverOptions<T>
>;
