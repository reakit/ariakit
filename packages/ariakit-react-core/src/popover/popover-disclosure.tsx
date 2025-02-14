import { invariant } from "@ariakit/core/utils/misc";
import type { ElementType, MouseEvent } from "react";
import type { DialogDisclosureOptions } from "../dialog/dialog-disclosure.tsx";
import { useDialogDisclosure } from "../dialog/dialog-disclosure.tsx";
import { useEvent, useWrapElement } from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import type { PopoverAnchorOptions } from "./popover-anchor.tsx";
import {
  PopoverScopedContextProvider,
  usePopoverProviderContext,
} from "./popover-context.tsx";

const TagName = "button" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

/**
 * Returns props to create a `PopoverDisclosure` component.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx
 * const store = usePopoverStore();
 * const props = usePopoverDisclosure({ store });
 * <Role {...props}>Disclosure</Role>
 * <Popover store={store}>Popover</Popover>
 * ```
 */
export const usePopoverDisclosure = createHook<
  TagName,
  PopoverDisclosureOptions
>(function usePopoverDisclosure({ store, ...props }) {
  const context = usePopoverProviderContext();
  store = store || context;

  invariant(
    store,
    process.env.NODE_ENV !== "production" &&
      "PopoverDisclosure must receive a `store` prop or be wrapped in a PopoverProvider component.",
  );

  const onClickProp = props.onClick;

  const onClick = useEvent((event: MouseEvent<HTMLType>) => {
    onClickProp?.(event);
  });

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
    ...props,
    onClick,
  };

  props = useDialogDisclosure({ store, ...props });

  return props;
});

/**
 * Renders a button that controls the visibility of the
 * [`Popover`](https://ariakit.org/reference/popover) component when clicked.
 * @see https://ariakit.org/components/popover
 * @example
 * ```jsx {2}
 * <PopoverProvider>
 *   <PopoverDisclosure>Disclosure</PopoverDisclosure>
 *   <Popover>Popover</Popover>
 * </PopoverProvider>
 * ```
 */
export const PopoverDisclosure = forwardRef(function PopoverDisclosure(
  props: PopoverDisclosureProps,
) {
  const htmlProps = usePopoverDisclosure(props);
  return createElement(TagName, htmlProps);
});

export interface PopoverDisclosureOptions<T extends ElementType = TagName>
  extends PopoverAnchorOptions<T>,
    Omit<DialogDisclosureOptions<T>, "store"> {}

export type PopoverDisclosureProps<T extends ElementType = TagName> = Props<
  T,
  PopoverDisclosureOptions<T>
>;
