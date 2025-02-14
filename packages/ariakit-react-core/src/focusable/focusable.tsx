import { isButton } from "@ariakit/core/utils/dom";
import {
  addGlobalEventListener,
  isFocusEventOutside,
  isPortalEvent,
  isSelfTarget,
  queueBeforeEvent,
} from "@ariakit/core/utils/events";
import {
  focusIfNeeded,
  getClosestFocusable,
  hasFocus,
  isFocusable,
} from "@ariakit/core/utils/focus";
import {
  disabledFromProps,
  removeUndefinedValues,
} from "@ariakit/core/utils/misc";
import { isSafari } from "@ariakit/core/utils/platform";
import type { BivariantCallback } from "@ariakit/core/utils/types";
import type {
  ElementType,
  EventHandler,
  FocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  SyntheticEvent,
} from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useEvent, useMergeRefs, useTagName } from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";
import { FocusableContext } from "./focusable-context.tsx";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

const isSafariBrowser = isSafari();

const alwaysFocusVisibleInputTypes = [
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
  "date",
  "month",
  "week",
  "time",
  "datetime",
  "datetime-local",
];

const safariFocusAncestorSymbol = Symbol("safariFocusAncestor");
type SafariFocusAncestor = Element & { [safariFocusAncestorSymbol]?: boolean };

export function isSafariFocusAncestor(element: SafariFocusAncestor | null) {
  if (!element) return false;
  return !!element[safariFocusAncestorSymbol];
}

function markSafariFocusAncestor(
  element: SafariFocusAncestor | null,
  value: boolean,
) {
  if (!element) return;
  element[safariFocusAncestorSymbol] = value;
}

function isAlwaysFocusVisible(element: HTMLElement) {
  const { tagName, readOnly, type } = element as HTMLInputElement;
  if (tagName === "TEXTAREA" && !readOnly) return true;
  if (tagName === "SELECT" && !readOnly) return true;
  if (tagName === "INPUT" && !readOnly) {
    return alwaysFocusVisibleInputTypes.includes(type);
  }
  if (element.isContentEditable) return true;
  // Take into account custom Ariakit Select within a form.
  const role = element.getAttribute("role");
  if (role === "combobox" && element.dataset.name) {
    return true;
  }
  return false;
}

function getLabels(element: HTMLElement | HTMLInputElement) {
  if ("labels" in element) {
    return element.labels;
  }
  return null;
}

function isNativeCheckboxOrRadio(element: { tagName: string; type?: string }) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "input" && element.type) {
    return element.type === "radio" || element.type === "checkbox";
  }
  return false;
}

function isNativeTabbable(tagName?: string) {
  if (!tagName) return true;
  return (
    tagName === "button" ||
    tagName === "summary" ||
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    tagName === "a"
  );
}

function supportsDisabledAttribute(tagName?: string) {
  if (!tagName) return true;
  return (
    tagName === "button" ||
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea"
  );
}

function getTabIndex(
  focusable: boolean,
  trulyDisabled: boolean,
  nativeTabbable: boolean,
  supportsDisabled: boolean,
  tabIndexProp?: number,
) {
  if (!focusable) {
    return tabIndexProp;
  }
  if (trulyDisabled) {
    if (nativeTabbable && !supportsDisabled) {
      // Anchor, audio and video tags don't support the `disabled` attribute. We
      // must pass tabIndex={-1} so they don't receive focus on tab.
      return -1;
    }
    // Elements that support the `disabled` attribute don't need tabIndex.
    return;
  }
  if (nativeTabbable) {
    // If the element is enabled and it's natively tabbable, we don't need to
    // specify a tabIndex attribute unless it's explicitly set by the user.
    return tabIndexProp;
  }
  // If the element is enabled and is not natively tabbable, we have to fallback
  // tabIndex={0}.
  return tabIndexProp || 0;
}

function useDisableEvent(
  onEvent?: EventHandler<SyntheticEvent>,
  disabled?: boolean,
) {
  return useEvent((event: SyntheticEvent) => {
    onEvent?.(event);
    if (event.defaultPrevented) return;
    if (disabled) {
      event.stopPropagation();
      event.preventDefault();
    }
  });
}

// isKeyboardModality should be true by default.
let isKeyboardModality = true;

function onGlobalMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | EventTarget | null;
  if (target && "hasAttribute" in target) {
    // If the target element is already focus-visible, we keep the keyboard
    // modality.
    if (!target.hasAttribute("data-focus-visible")) {
      isKeyboardModality = false;
    }
  }
}

function onGlobalKeyDown(event: KeyboardEvent) {
  if (event.metaKey) return;
  if (event.ctrlKey) return;
  if (event.altKey) return;
  isKeyboardModality = true;
}

/**
 * Returns props to create a `Focusable` component.
 * @see https://ariakit.org/components/focusable
 * @example
 * ```jsx
 * const props = useFocusable();
 * <Role {...props}>Focusable</Role>
 * ```
 */
export const useFocusable = createHook<TagName, FocusableOptions>(
  function useFocusable({
    focusable = true,
    accessibleWhenDisabled,
    autoFocus,
    onFocusVisible,
    ...props
  }) {
    const ref = useRef<HTMLType>(null);

    // Add global event listeners to determine whether the user is using a
    // keyboard to navigate the site or not.
    useEffect(() => {
      if (!focusable) return;
      addGlobalEventListener("mousedown", onGlobalMouseDown, true);
      addGlobalEventListener("keydown", onGlobalKeyDown, true);
    }, [focusable]);

    // Safari and Firefox on Apple devices don't focus on checkboxes or radio
    // buttons when their labels are clicked. This effect will make sure the
    // focusable element is focused on label click.
    if (isSafariBrowser) {
      useEffect(() => {
        if (!focusable) return;
        const element = ref.current;
        if (!element) return;
        if (!isNativeCheckboxOrRadio(element)) return;
        const labels = getLabels(element);
        if (!labels) return;
        const onMouseUp = () => queueMicrotask(() => element.focus());
        for (const label of labels) {
          label.addEventListener("mouseup", onMouseUp);
        }
        return () => {
          for (const label of labels) {
            label.removeEventListener("mouseup", onMouseUp);
          }
        };
      }, [focusable]);
    }

    const disabled = focusable && disabledFromProps(props);
    const trulyDisabled = !!disabled && !accessibleWhenDisabled;
    const [focusVisible, setFocusVisible] = useState(false);

    // When the focusable element is disabled, it doesn't trigger a blur event
    // so we can't set focusVisible to false there. Instead, we have to do it
    // here by checking the element's disabled attribute.
    useEffect(() => {
      if (!focusable) return;
      if (trulyDisabled && focusVisible) {
        setFocusVisible(false);
      }
    }, [focusable, trulyDisabled, focusVisible]);

    // When an element that has focus becomes hidden, it doesn't trigger a blur
    // event so we can't set focusVisible to false there. We observe the element
    // and check if it's still focusable. Otherwise, we set focusVisible to
    // false.
    useEffect(() => {
      if (!focusable) return;
      if (!focusVisible) return;
      const element = ref.current;
      if (!element) return;
      if (typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(() => {
        if (!isFocusable(element)) {
          setFocusVisible(false);
        }
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, [focusable, focusVisible]);

    // Disable events when the element is disabled.
    const onKeyPressCapture = useDisableEvent(
      props.onKeyPressCapture,
      disabled,
    );
    const onMouseDownCapture = useDisableEvent(
      props.onMouseDownCapture,
      disabled,
    );
    const onClickCapture = useDisableEvent(props.onClickCapture, disabled);

    const onMouseDownProp = props.onMouseDown;

    const onMouseDown = useEvent((event: ReactMouseEvent<HTMLType>) => {
      onMouseDownProp?.(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      const element = event.currentTarget;
      // Safari doesn't focus on buttons on mouse down like other
      // browsers/platforms. Instead, it focuses on the closest focusable ancestor
      // element, which is ultimately the body element. So we make sure to give
      // focus to this Focusable element on mouse down so it works consistently
      // across browsers.
      if (!isSafariBrowser) return;
      if (isPortalEvent(event)) return;
      if (!isButton(element) && !isNativeCheckboxOrRadio(element)) return;
      // In future versions of Safari, it may change this behavior and start
      // focusing on buttons on mouse down. To account for that, we must check if
      // the element has received focus before.
      let receivedFocus = false;
      const onFocus = () => {
        receivedFocus = true;
      };
      const options = { capture: true, once: true };
      element.addEventListener("focusin", onFocus, options);

      const focusableContainer = getClosestFocusable(element.parentElement);
      // Since Safari focuses on the nearest focusable ancestor and we're not
      // preventing it (see below), popups may close on mousedown on their
      // disclosure buttons. Therefore, we mark the focusable container here to
      // check for that in use-hide-on-interact-outside.ts. See the dialog-menu
      // "open/close menu by clicking on menu button" test.
      markSafariFocusAncestor(focusableContainer, true);
      // We can't focus right away after on mouse down, otherwise it would prevent
      // drag events from happening. So we queue the focus to the next animation
      // frame, but always before the next mouseup event. The mouseup event might
      // happen before the next animation frame on touch devices or by tapping on
      // a MacBook's trackpad, for example. We can't use pointerup otherwise it
      // breaks on mobile Safari. See dialog-menu/test-mobile test.
      queueBeforeEvent(element, "mouseup", () => {
        element.removeEventListener("focusin", onFocus, true);
        markSafariFocusAncestor(focusableContainer, false);
        if (receivedFocus) return;
        focusIfNeeded(element);
      });
    });

    const handleFocusVisible = (
      event: SyntheticEvent<HTMLType>,
      currentTarget?: HTMLType,
    ) => {
      if (currentTarget) {
        event.currentTarget = currentTarget;
      }
      if (!focusable) return;
      const element = event.currentTarget;
      if (!element) return;
      // Some extensions like 1password dispatches some keydown events on
      // autofill and immediately moves focus to the next field. That's why we
      // need to check if the current element is still focused.
      if (!hasFocus(element)) return;
      onFocusVisible?.(event);
      if (event.defaultPrevented) return;
      // Make sure data-focus-visible is applied visually at the same time as
      // other data attributes like data-active-item. See
      // https://github.com/ariakit/ariakit/issues/4083
      element.dataset.focusVisible = "true";
      setFocusVisible(true);
    };

    const onKeyDownCaptureProp = props.onKeyDownCapture;

    const onKeyDownCapture = useEvent((event: ReactKeyboardEvent<HTMLType>) => {
      onKeyDownCaptureProp?.(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      if (focusVisible) return;
      if (event.metaKey) return;
      if (event.altKey) return;
      if (event.ctrlKey) return;
      if (!isSelfTarget(event)) return;
      const element = event.currentTarget;
      const applyFocusVisible = () => handleFocusVisible(event, element);
      queueBeforeEvent(element, "focusout", applyFocusVisible);
    });

    const onFocusCaptureProp = props.onFocusCapture;

    const onFocusCapture = useEvent((event: FocusEvent<HTMLType>) => {
      onFocusCaptureProp?.(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      if (!isSelfTarget(event)) {
        setFocusVisible(false);
        return;
      }
      const element = event.currentTarget;
      const applyFocusVisible = () => handleFocusVisible(event, element);
      if (isKeyboardModality || isAlwaysFocusVisible(event.target)) {
        queueBeforeEvent(event.target, "focusout", applyFocusVisible);
      } else {
        setFocusVisible(false);
      }
    });

    const onBlurProp = props.onBlur;

    // Note: Can't use onBlurCapture here otherwise it will not work with
    // CompositeItem's with the virtualFocus state set to true.
    const onBlur = useEvent((event: FocusEvent<HTMLType>) => {
      onBlurProp?.(event);
      if (!focusable) return;
      if (!isFocusEventOutside(event)) return;
      setFocusVisible(false);
    });

    const autoFocusOnShow = useContext(FocusableContext);

    // The native autoFocus prop is problematic in many ways. For example, when
    // an element has the native autofocus attribute, the focus event will be
    // triggered before React effects (even layout effects) and before refs are
    // assigned. This means we won't have access to the element's ref or
    // anything else that's set up by React effects on the onFocus event. So we
    // don't pass the autoFocus prop to the element and instead manually focus
    // the element when it's mounted. The order in which this effect runs also
    // matters. See
    // https://x.com/diegohaz/status/1408180632933388289
    const autoFocusRef = useEvent((element: HTMLElement | null) => {
      if (!focusable) return;
      if (!autoFocus) return;
      if (!element) return;
      if (!autoFocusOnShow) return;
      // We have to queue focus so other effects and refs can be applied first.
      // See select-animated example.
      queueMicrotask(() => {
        if (hasFocus(element)) return;
        if (!isFocusable(element)) return;
        element.focus();
      });
    });

    const tagName = useTagName(ref);
    const nativeTabbable = focusable && isNativeTabbable(tagName);
    const supportsDisabled = focusable && supportsDisabledAttribute(tagName);

    const styleProp = props.style;
    const style = useMemo(() => {
      if (trulyDisabled) {
        return { pointerEvents: "none" as const, ...styleProp };
      }
      return styleProp;
    }, [trulyDisabled, styleProp]);

    props = {
      "data-focus-visible": (focusable && focusVisible) || undefined,
      "data-autofocus": autoFocus || undefined,
      "aria-disabled": disabled || undefined,
      ...props,
      ref: useMergeRefs(ref, autoFocusRef, props.ref),
      style,
      tabIndex: getTabIndex(
        focusable,
        trulyDisabled,
        nativeTabbable,
        supportsDisabled,
        props.tabIndex,
      ),
      disabled: supportsDisabled && trulyDisabled ? true : undefined,
      // TODO: Test Focusable contentEditable.
      contentEditable: disabled ? undefined : props.contentEditable,
      onKeyPressCapture,
      onClickCapture,
      onMouseDownCapture,
      onMouseDown,
      onKeyDownCapture,
      onFocusCapture,
      onBlur,
    };

    return removeUndefinedValues(props);
  },
);

/**
 * Renders a focusable element. When this element gains keyboard focus, it gets
 * a
 * [`data-focus-visible`](https://ariakit.org/guide/styling#data-focus-visible)
 * attribute and triggers the
 * [`onFocusVisible`](https://ariakit.org/reference/focusable#onfocusvisible)
 * prop.
 *
 * The `Focusable` component supports the
 * [`disabled`](https://ariakit.org/reference/focusable#disabled) prop for all
 * elements, even those not supporting the native `disabled` attribute. Disabled
 * elements using the `Focusable` component may be still accessible via keyboard
 * by using the the
 * [`accessibleWhenDisabled`](https://ariakit.org/reference/focusable#accessiblewhendisabled)
 * prop.
 * @see https://ariakit.org/components/focusable
 * @example
 * ```jsx
 * <Focusable>Focusable</Focusable>
 * ```
 */
export const Focusable = forwardRef(function Focusable(props: FocusableProps) {
  const htmlProps = useFocusable(props);
  return createElement(TagName, htmlProps);
});

export interface FocusableOptions<_T extends ElementType = TagName>
  extends Options {
  /**
   * Determines if the element is disabled. This sets the `aria-disabled`
   * attribute accordingly, enabling support for all elements, including those
   * that don't support the native `disabled` attribute.
   *
   * This feature can be combined with the
   * [`accessibleWhenDisabled`](https://ariakit.org/reference/focusable#accessiblewhendisabled)
   * prop to make disabled elements still accessible via keyboard.
   *
   * **Note**: For this prop to work, the
   * [`focusable`](https://ariakit.org/reference/command#focusable) prop must be
   * set to `true`, if it's not set by default.
   *
   * Live examples:
   * - [Submenu](https://ariakit.org/examples/menu-nested)
   * - [Combobox with Tabs](https://ariakit.org/examples/combobox-tabs)
   * - [Context Menu](https://ariakit.org/examples/menu-context-menu)
   * @default false
   */
  disabled?: boolean;
  /**
   * Automatically focuses the element upon mounting, similar to the native
   * `autoFocus` prop. This addresses an issue where the element with the native
   * `autoFocus` attribute might receive focus before React effects are
   * executed.
   *
   * The `autoFocus` prop can also be used with
   * [Focusable](https://ariakit.org/components/focusable) elements within a
   * [Dialog](https://ariakit.org/components/dialog) component, establishing the
   * initial focus as the dialog opens.
   *
   * **Note**: For this prop to work, the
   * [`focusable`](https://ariakit.org/reference/command#focusable) prop must be
   * set to `true`, if it's not set by default.
   *
   * Live examples:
   * - [Warning on Dialog
   *   hide](https://ariakit.org/examples/dialog-hide-warning)
   * - [Dialog with React
   *   Router](https://ariakit.org/examples/dialog-react-router)
   * - [Nested Dialog](https://ariakit.org/examples/dialog-nested)
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Determines if [Focusable](https://ariakit.org/components/focusable)
   * features should be active on non-native focusable elements.
   *
   * **Note**: This prop only turns off the additional features provided by the
   * [`Focusable`](https://ariakit.org/reference/focusable) component.
   * Non-native focusable elements will lose their focusability entirely.
   * However, native focusable elements will retain their inherent focusability,
   * but without added features such as improved
   * [`autoFocus`](https://ariakit.org/reference/focusable#autofocus),
   * [`accessibleWhenDisabled`](https://ariakit.org/reference/focusable#accessiblewhendisabled),
   * [`onFocusVisible`](https://ariakit.org/reference/focusable#onfocusvisible),
   * etc.
   * @default true
   */
  focusable?: boolean;
  /**
   * Indicates whether the element should be focusable even when it is
   * [`disabled`](https://ariakit.org/reference/focusable#disabled).
   *
   * This is important when discoverability is a concern. For example:
   *
   * > A toolbar in an editor contains a set of special smart paste functions
   * that are disabled when the clipboard is empty or when the function is not
   * applicable to the current content of the clipboard. It could be helpful to
   * keep the disabled buttons focusable if the ability to discover their
   * functionality is primarily via their presence on the toolbar.
   *
   * Learn more on [Focusability of disabled
   * controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).
   *
   * Live examples:
   * - [Combobox with Tabs](https://ariakit.org/examples/combobox-tabs)
   * - [Command Menu with
   *   Tabs](https://ariakit.org/examples/dialog-combobox-tab-command-menu)
   */
  accessibleWhenDisabled?: boolean;
  /**
   * Custom event handler invoked when the element gains focus through keyboard
   * interaction or a key press occurs while the element is in focus. This is
   * the programmatic equivalent of the
   * [`data-focus-visible`](https://ariakit.org/guide/styling#data-focus-visible)
   * attribute.
   *
   * **Note**: For this prop to work, the
   * [`focusable`](https://ariakit.org/reference/command#focusable) prop must be
   * set to `true`, if it's not set by default.
   *
   * Live examples:
   * - [Navigation Menubar](https://ariakit.org/examples/menubar-navigation)
   * - [Custom Checkbox](https://ariakit.org/examples/checkbox-custom)
   */
  onFocusVisible?: BivariantCallback<
    (event: SyntheticEvent<HTMLElement>) => void
  >;
}

export type FocusableProps<T extends ElementType = TagName> = Props<
  T,
  FocusableOptions<T>
>;
