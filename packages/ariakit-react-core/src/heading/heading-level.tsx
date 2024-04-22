import type { ReactNode } from "react";
import { useContext } from "react";
import { HeadingContext } from "./heading-context.tsx";
import type { HeadingLevels } from "./utils.ts";

/**
 * A component that sets the heading level for its children. It doesn't render
 * any HTML element, just sets the
 * [`level`](https://ariakit.org/reference/heading-level#level) prop on the
 * context.
 * @see https://ariakit.org/components/heading
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
export function HeadingLevel({ level, children }: HeadingLevelProps) {
  const contextLevel = useContext(HeadingContext);
  const nextLevel = Math.max(
    Math.min(level || contextLevel + 1, 6),
    1,
  ) as HeadingLevels;
  return (
    <HeadingContext.Provider value={nextLevel}>
      {children}
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
