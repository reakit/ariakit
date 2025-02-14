import { isButton, isTextField } from "@ariakit/core/utils/dom";
import {
  fireClickEvent,
  isSelfTarget,
  queueBeforeEvent,
} from "@ariakit/core/utils/events";
import { disabledFromProps } from "@ariakit/core/utils/misc";
import { isFirefox } from "@ariakit/core/utils/platform";
import type { FocusableOptions } from "../focusable/focusable.tsx";
import { useFocusable } from "../focusable/focusable.tsx";
import {
  type ElementType,
  useEffect,
  useEvent,
  useMetadataProps,
  useRef,
  useState,
} from "../utils/__port.ts";
import { $, $o } from "../utils/__props.ts";
import { useMergeRefs } from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";

// [port]: translation helper
function $m(props: any) {
  const _metadataProps = props.$_metadataProps;
  return {
    get _metadataProps() {
      return _metadataProps();
    },
  };
}

// [port]: translation helper
function $h(target: EventTarget | null) {
  // TODO [port]: verify that these casts are safe.
  return target as HTMLType;
}

// [port]: translation helper
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
function $e<T extends Event>(event: T) {
  const eventInit: Partial<Mutable<T>> = {};
  for (const key in event) {
    eventInit[key as keyof T] = (event as any)[key];
  }
  return eventInit;
}

const TagName = "button" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

function isNativeClick(event: KeyboardEvent) {
  if (!event.isTrusted) return false;
  // istanbul ignore next: can't test trusted events yet
  const element = $h(event.currentTarget);
  if (event.key === "Enter") {
    return (
      isButton(element) ||
      element.tagName === "SUMMARY" ||
      element.tagName === "A"
    );
  }
  if (event.key === " ") {
    return (
      isButton(element) ||
      element.tagName === "SUMMARY" ||
      element.tagName === "INPUT" ||
      element.tagName === "SELECT"
    );
  }
  return false;
}

const symbol = Symbol("command");

/**
 * Returns props to create a `Command` component. If the element is not a native
 * clickable element (like a button), this hook will return additional props to
 * make sure it's accessible.
 * @see https://ariakit.org/components/command
 * @example
 * ```jsx
 * const props = useCommand({ render: <div /> });
 * <Role {...props}>Accessible button</Role>
 * ```
 */
export const useCommand = createHook<TagName, CommandOptions>(
  function useCommand($props) {
    const [_, props] = $o($props, { clickOnEnter: true, clickOnSpace: true });
    const ref = useRef<HTMLType>(null);
    const [isNativeButton, setIsNativeButton] = useState(false);

    useEffect(() => {
      if (!ref.current) return;
      setIsNativeButton(isButton(ref.current));
    }, []);

    const [active, setActive] = useState(false);
    const activeRef = useRef(false);
    const disabled = () => disabledFromProps(props);
    // biome-ignore format: [port]
    const [isDuplicate, metadataProps] = useMetadataProps($m(props), symbol, true);

    const onKeyDownProp = props.$onKeyDown;

    const onKeyDown = useEvent((event: KeyboardEvent) => {
      // @ts-expect-error TODO [port]: [event-chain]
      onKeyDownProp()?.(event);
      const element = $h(event.currentTarget);

      if (event.defaultPrevented) return;
      if (isDuplicate()) return;
      if (disabled()) return;
      if (!isSelfTarget(event)) return;
      if (isTextField(element)) return;
      if (element.isContentEditable) return;

      const isEnter = _.clickOnEnter && event.key === "Enter";
      const isSpace = _.clickOnSpace && event.key === " ";
      const shouldPreventEnter = event.key === "Enter" && !_.clickOnEnter;
      const shouldPreventSpace = event.key === " " && !_.clickOnSpace;

      if (shouldPreventEnter || shouldPreventSpace) {
        event.preventDefault();
        return;
      }

      if (isEnter || isSpace) {
        const nativeClick = isNativeClick(event);
        if (isEnter) {
          if (!nativeClick) {
            event.preventDefault();
            const { view, ...eventInit } = $e(event);
            // Fire a click event instead of calling element.click() directly so
            // we can pass along the modifier state.
            const click = () => fireClickEvent(element, eventInit);
            // If this element is a link with target="_blank", Firefox will
            // block the "popup" if the click event is dispatched synchronously
            // or in a microtask. Queueing the event asynchronously fixes that.
            if (isFirefox()) {
              queueBeforeEvent(element, "keyup", click);
            } else {
              queueMicrotask(click);
            }
          }
        } else if (isSpace) {
          activeRef.current = true;
          if (!nativeClick) {
            event.preventDefault();
            setActive(true);
          }
        }
      }
    });

    const onKeyUpProp = props.$onKeyUp;

    const onKeyUp = useEvent((event: KeyboardEvent) => {
      // @ts-expect-error TODO [port]: [event-chain]
      onKeyUpProp()?.(event);

      if (event.defaultPrevented) return;
      if (isDuplicate()) return;
      if (disabled()) return;
      if (event.metaKey) return;

      const isSpace = _.clickOnSpace && event.key === " ";

      if (activeRef.current && isSpace) {
        activeRef.current = false;
        if (!isNativeClick(event)) {
          event.preventDefault();
          setActive(false);
          const element = $h(event.currentTarget);
          const { view, ...eventInit } = $e(event);
          queueMicrotask(() => fireClickEvent(element, eventInit));
        }
      }
    });

    $(props, {
      "$data-active": () => active() || undefined,
      $type: () => (isNativeButton() ? "button" : undefined),
      ...metadataProps(),
    })({
      $ref: (props) => useMergeRefs(ref.bind, props.ref),
      onKeyDown,
      onKeyUp,
    });

    useFocusable<TagName>(props);

    return props;
  },
);

/**
 * Renders a clickable element, which is a `button` by default, and inherits
 * features from the [`Focusable`](https://ariakit.org/reference/focusable)
 * component.
 *
 * If the base element isn't a native clickable one, this component will provide
 * extra attributes and event handlers to ensure accessibility. It can be
 * activated with the keyboard using the
 * [`clickOnEnter`](https://ariakit.org/reference/command#clickonenter) and
 * [`clickOnSpace`](https://ariakit.org/reference/command#clickonspace)
 * props. Both are set to `true` by default.
 * @see https://ariakit.org/components/command
 * @example
 * ```jsx
 * <Command>Button</Command>
 * ```
 */
export const Command = forwardRef(function Command(props: CommandProps) {
  const htmlProps = useCommand(props);
  return createElement(TagName, htmlProps);
});

export interface CommandOptions<T extends ElementType = TagName>
  extends FocusableOptions<T> {
  /**
   * If set to `true`, pressing the enter key while this element is focused will
   * trigger a click on the element, regardless of whether it's a native button
   * or not. If this prop is set to `false`, pressing enter will not initiate a
   * click.
   * @default true
   */
  clickOnEnter?: boolean;
  /**
   * If set to `true`, pressing and releasing the space key while this element
   * is focused will trigger a click on the element, regardless of whether it's
   * a native button or not. If this prop is set to `false`, space will not
   * initiate a click.
   * @default true
   */
  clickOnSpace?: boolean;
}

export type CommandProps<T extends ElementType = TagName> = Props<
  T,
  CommandOptions<T>
>;
