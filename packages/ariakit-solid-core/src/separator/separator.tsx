import type { ElementType } from "../utils/__port.ts";
import { $, $o } from "../utils/__props.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";

const TagName = "hr" satisfies ElementType;
type TagName = typeof TagName;

/**
 * Returns props to create a `Separator` component.
 * @see https://solid.ariakit.org/components/separator
 * @example
 * ```jsx
 * const props = useSeparator({ orientation: "horizontal" });
 * <Role {...props} />
 * ```
 */
export const useSeparator = createHook<TagName, SeparatorOptions>(
  function useSeparator(__) {
    const [_, props] = $o(__, { orientation: "horizontal" });
    $(props)({
      role: "separator",
      "$aria-orientation": () => _.orientation,
    });
    return props;
  },
);

/**
 * Renders a separator element.
 * @see https://solid.ariakit.org/components/separator
 * @example
 * ```jsx
 * <Separator orientation="horizontal" />
 * ```
 */
export const Separator = forwardRef(function Separator(props: SeparatorProps) {
  const htmlProps = useSeparator(props);
  return createElement(TagName, htmlProps);
});

export interface SeparatorOptions<_T extends ElementType = TagName>
  extends Options {
  /**
   * The orientation of the separator.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

export type SeparatorProps<T extends ElementType = TagName> = Props<
  T,
  SeparatorOptions<T>
>;
