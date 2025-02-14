import { useContext } from "solid-js";
import type { ReactNode } from "../utils/__port.ts";
import { HeadingContext } from "./heading-context.tsx";
import type { HeadingLevels } from "./utils.ts";

/**
 * A component that sets the heading level for its children. It doesn't render
 * any HTML element, just sets the
 * [`level`](https://solid.ariakit.org/reference/heading-level#level) prop on the
 * context.
 * @see https://solid.ariakit.org/components/heading
 * @example
 * ```jsx
 * <HeadingLevel>
 *   <Heading>Heading 1</Heading>
 *   <HeadingLevel>
 *     <Heading>Heading 2</Heading>
 *   </HeadingLevel>
 * </HeadingLevel>
 * ```
 */
export function HeadingLevel(props: HeadingLevelProps) {
  const contextLevel = useContext(HeadingContext);
  // biome-ignore format: [port]
  const nextLevel = () => Math.max(
    Math.min(props.level || contextLevel() + 1, 6),
    1,
  ) as HeadingLevels;
  return (
    <HeadingContext.Provider value={nextLevel}>
      {props.children}
    </HeadingContext.Provider>
  );
}

export interface HeadingLevelProps {
  /**
   * The heading level. By default, it'll increase the level by 1 based on the
   * context.
   */
  level?: HeadingLevels;
  children?: ReactNode;
}
