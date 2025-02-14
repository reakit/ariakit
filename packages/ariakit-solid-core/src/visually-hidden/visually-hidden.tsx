import type { ElementType } from "../utils/__port.ts";
import { $ } from "../utils/__props.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";

const TagName = "span" satisfies ElementType;
type TagName = typeof TagName;

/**
 * Returns props to create a `VisuallyHidden` component. When applying the props
 * returned by this hook to a component, the component will be visually hidden,
 * but still accessible to screen readers.
 * @see https://solid.ariakit.org/components/visually-hidden
 * @example
 * ```jsx
 * const props = useVisuallyHidden();
 * <a href="#">
 *   Learn more<Role {...props}> about the Solar System</Role>.
 * </a>
 * ```
 */
export const useVisuallyHidden = createHook<TagName, VisuallyHiddenOptions>(
  function useVisuallyHidden(props) {
    $(props)({
      $style: (props) => ({
        border: 0,
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        "white-space": "nowrap",
        width: "1px",
        // @ts-expect-error TODO [port]: [style-chain]
        ...props.style,
      }),
    });
    return props;
  },
);

/**
 * Renders an element that's visually hidden, but still accessible to screen
 * readers.
 * @see https://solid.ariakit.org/components/visually-hidden
 * @example
 * ```jsx
 * <a href="#">
 *   Learn more<VisuallyHidden> about the Solar System</VisuallyHidden>.
 * </a>
 * ```
 */
export const VisuallyHidden = forwardRef(function VisuallyHidden(
  props: VisuallyHiddenProps,
) {
  const htmlProps = useVisuallyHidden(props);
  return createElement(TagName, htmlProps);
});

export interface VisuallyHiddenOptions<_T extends ElementType = TagName>
  extends Options {}

export type VisuallyHiddenProps<T extends ElementType = TagName> = Props<
  T,
  VisuallyHiddenOptions<T>
>;
