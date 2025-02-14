import { mergeRefs } from "@solid-primitives/refs";
import { type MaybeAccessor, access } from "@solid-primitives/utils";
import { type JSX, createUniqueId } from "solid-js";
import type { RefObject } from "./__port.ts";
import { $ } from "./__props.ts";
import type { WrapInstance, WrapInstanceValue } from "./types.ts";

export const useMergeRefs = mergeRefs;

/**
 * Generates a unique ID. Uses `createUniqueId`.
 */
export function useId(
  defaultId?: MaybeAccessor<string | undefined>,
): () => string {
  const id = createUniqueId();
  return () => access(defaultId) ?? id;
}

/**
 * Returns the tag name by parsing an element.
 * @example
 * function Component(props) {
 *   const ref = createRef(null);
 *   const tagName = () => extractTagName(ref, "button"); // () => "div"
 *   return <div ref={ref.bind} {...props} />;
 * }
 */
export function useTagName(
  refOrElement?: RefObject<HTMLElement> | HTMLElement | null,
  fallback?: keyof JSX.IntrinsicElements,
) {
  const element =
    refOrElement && "current" in refOrElement
      ? refOrElement.current
      : refOrElement;
  return element?.tagName.toLowerCase() ?? fallback;
}

/**
 * Returns props with an additional `wrapInstance` prop.
 */
export function useWrapElement<P>(
  props: P,
  element: WrapInstanceValue,
  _deps: Array<unknown>, // Only here to minimize the diff noise.
): P {
  $(props as JSX.HTMLAttributes<any> & { wrapInstance?: WrapInstance })({
    $wrapInstance: (props) => [...(props.wrapInstance ?? []), element],
  });
  return props;
}
