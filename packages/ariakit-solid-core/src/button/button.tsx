import { isButton } from "@ariakit/core/utils/dom";
import type { CommandOptions } from "../command/command.tsx";
import { useCommand } from "../command/command.tsx";
import { type ElementType, useRef } from "../utils/__port.ts";
import { $ } from "../utils/__props.ts";
import { useMergeRefs, useTagName } from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";

const TagName = "button" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

/**
 * Returns props to create a `Button` component. If the element is not a native
 * button, the hook will return additional props to make sure it's accessible.
 * @see https://ariakit.org/components/button
 * @example
 * ```jsx
 * const props = useButton({ render: <div /> });
 * <Role {...props}>Accessible button</Role>
 * ```
 */
export const useButton = createHook<TagName, ButtonOptions>(
  function useButton(props) {
    const ref = useRef<HTMLType>(null);
    const tagName = () => useTagName(ref, TagName);
    /* const [isNativeButton, setIsNativeButton] = useState(
      () => !!tagName && isButton({ tagName, type: props.type }),
    );

    useEffect(() => {
      if (!ref.current) return;
      setIsNativeButton(isButton(ref.current));
    }, []); */

    // [port]: the React logic above can be simplified to this
    const isNativeButton = () => ref.current && isButton(ref.current);

    $(props, {
      $role: () =>
        !isNativeButton() && tagName() !== "a" ? "button" : undefined,
    })({
      $ref: (props) => useMergeRefs(ref.bind, props.ref),
    });

    useCommand(props);

    return props;
  },
);

/**
 * Renders an accessible button element. If the underlying element is not a
 * native button, this component will pass additional attributes to make sure
 * it's accessible.
 * @see https://ariakit.org/components/button
 * @example
 * ```jsx
 * <Button>Button</Button>
 * ```
 */
export const Button = forwardRef(function Button(props: ButtonProps) {
  const htmlProps = useButton(props);
  return createElement(TagName, htmlProps);
});

export interface ButtonOptions<T extends ElementType = TagName>
  extends CommandOptions<T> {}

export type ButtonProps<T extends ElementType = TagName> = Props<
  T,
  ButtonOptions<T>
>;
