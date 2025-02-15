import { flatten2DArray, reverseArray } from "@ariakit/core/utils/array";
import { getActiveElement, isTextField } from "@ariakit/core/utils/dom";
import {
  fireBlurEvent,
  fireKeyboardEvent,
  isSelfTarget,
} from "@ariakit/core/utils/events";
import { focusIntoView, hasFocus } from "@ariakit/core/utils/focus";
import { invariant } from "@ariakit/core/utils/misc";
import type { BooleanOrCallback } from "@ariakit/core/utils/types";
import type {
  ElementType,
  FocusEvent,
  KeyboardEventHandler,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusableOptions } from "../focusable/focusable.tsx";
import { useFocusable } from "../focusable/focusable.tsx";
import {
  useBooleanEvent,
  useEvent,
  useMergeRefs,
  useSafeLayoutEffect,
  useTransactionState,
  useWrapElement,
} from "../utils/hooks.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import {
  CompositeScopedContextProvider,
  useCompositeProviderContext,
} from "./composite-context.tsx";
import type { CompositeStore, CompositeStoreItem } from "./composite-store.ts";
import {
  findFirstEnabledItem,
  getEnabledItem,
  groupItemsByRows,
  isItem,
  silentlyFocused,
} from "./utils.ts";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

function isGrid(items: CompositeStoreItem[]) {
  return items.some((item) => !!item.rowId);
}

function isPrintableKey(event: KeyboardEvent | ReactKeyboardEvent): boolean {
  const target = event.target as Element | null;
  if (target && !isTextField(target)) return false;
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
}

function isModifierKey(event: KeyboardEvent | ReactKeyboardEvent) {
  return (
    event.key === "Shift" ||
    event.key === "Control" ||
    event.key === "Alt" ||
    event.key === "Meta"
  );
}

function useKeyboardEventProxy(
  store: CompositeStore,
  onKeyboardEvent?: KeyboardEventHandler,
  previousElementRef?: RefObject<HTMLElement | null>,
) {
  return useEvent((event: ReactKeyboardEvent) => {
    onKeyboardEvent?.(event);
    if (event.defaultPrevented) return;
    if (event.isPropagationStopped()) return;
    if (!isSelfTarget(event)) return;
    if (isModifierKey(event)) return;
    if (isPrintableKey(event)) return;
    const state = store.getState();
    const activeElement = getEnabledItem(store, state.activeId)?.element;
    if (!activeElement) return;
    const { view, ...eventInit } = event;
    const previousElement = previousElementRef?.current;
    // If the active item element is not the previous element, this means that
    // it hasn't been focused (for example, when using composite hover). So we
    // focus on it before firing the keyboard event.
    if (activeElement !== previousElement) {
      activeElement.focus();
    }
    if (!fireKeyboardEvent(activeElement, event.type, eventInit)) {
      event.preventDefault();
    }
    // The event will be triggered on the composite item and then propagated up
    // to this composite element again, so we can pretend that it wasn't called
    // on this component in the first place.
    if (event.currentTarget.contains(activeElement)) {
      event.stopPropagation();
    }
  });
}

function findFirstEnabledItemInTheLastRow(items: CompositeStoreItem[]) {
  return findFirstEnabledItem(
    flatten2DArray(reverseArray(groupItemsByRows(items))),
  );
}

function useScheduleFocus(store: CompositeStore) {
  const [scheduled, setScheduled] = useState(false);
  const schedule = useCallback(() => setScheduled(true), []);
  const activeItem = store.useState((state) =>
    getEnabledItem(store, state.activeId),
  );
  useEffect(() => {
    const activeElement = activeItem?.element;
    if (!scheduled) return;
    if (!activeElement) return;
    setScheduled(false);
    activeElement.focus({ preventScroll: true });
  }, [activeItem, scheduled]);
  return schedule;
}

/**
 * Returns props to create a `Composite` component.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const store = useCompositeStore();
 * const props = useComposite({ store });
 * <Role {...props}>
 *   <CompositeItem>Item 1</CompositeItem>
 *   <CompositeItem>Item 2</CompositeItem>
 * </Role>
 * ```
 */
export const useComposite = createHook<TagName, CompositeOptions>(
  function useComposite({
    store,
    composite = true,
    focusOnMove = composite,
    moveOnKeyPress = true,
    ...props
  }) {
    const context = useCompositeProviderContext();
    store = store || context;

    invariant(
      store,
      process.env.NODE_ENV !== "production" &&
        "Composite must receive a `store` prop or be wrapped in a CompositeProvider component.",
    );

    const ref = useRef<HTMLType>(null);
    const previousElementRef = useRef<HTMLElement | null>(null);
    const scheduleFocus = useScheduleFocus(store);
    const moves = store.useState("moves");

    const [, setBaseElement] = useTransactionState(
      composite ? store.setBaseElement : null,
    );

    // Focus on the active item element.
    useEffect(() => {
      if (!store) return;
      if (!moves) return;
      if (!composite) return;
      if (!focusOnMove) return;
      const { activeId } = store.getState();
      const itemElement = getEnabledItem(store, activeId)?.element;
      if (!itemElement) return;
      focusIntoView(itemElement);
    }, [store, moves, composite, focusOnMove]);

    // If composite.move(null) has been called, the composite container (this
    // element) should receive focus.
    useSafeLayoutEffect(() => {
      if (!store) return;
      if (!moves) return;
      if (!composite) return;
      const { baseElement, activeId } = store.getState();
      const isSelfAcive = activeId === null;
      if (!isSelfAcive) return;
      if (!baseElement) return;
      const previousElement = previousElementRef.current;
      // We have to clean up the previous element ref so an additional blur
      // event is not fired on it, for example, when looping through items while
      // includesBaseElement is true.
      previousElementRef.current = null;
      if (previousElement) {
        // We fire a blur event on the previous active item before moving focus
        // to the composite element so the events are dispatched in the right
        // order (blur, then focus).
        fireBlurEvent(previousElement, { relatedTarget: baseElement });
      }
      if (!hasFocus(baseElement)) {
        baseElement.focus();
      }
    }, [store, moves, composite]);

    const activeId = store.useState("activeId");
    const virtualFocus = store.useState("virtualFocus");

    // At this point, if the activeId has changed and we still have a
    // previousElement, this means that the previousElement hasn't been blurred,
    // so we do it here. This will be the scenario when moving through items, in
    // which case the onFocusCapture below event will stop propagation.
    useSafeLayoutEffect(() => {
      if (!store) return;
      if (!composite) return;
      if (!virtualFocus) return;
      const previousElement = previousElementRef.current;
      previousElementRef.current = null;
      if (!previousElement) return;
      const activeElement = getEnabledItem(store, activeId)?.element;
      const relatedTarget = activeElement || getActiveElement(previousElement);
      if (relatedTarget === previousElement) return;
      fireBlurEvent(previousElement, { relatedTarget });
    }, [store, activeId, virtualFocus, composite]);

    const onKeyDownCapture = useKeyboardEventProxy(
      store,
      props.onKeyDownCapture,
      previousElementRef,
    );

    const onKeyUpCapture = useKeyboardEventProxy(
      store,
      props.onKeyUpCapture,
      previousElementRef,
    );

    const onFocusCaptureProp = props.onFocusCapture;

    const onFocusCapture = useEvent((event: FocusEvent<HTMLType>) => {
      onFocusCaptureProp?.(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      const { virtualFocus } = store.getState();
      if (!virtualFocus) return;
      const previousActiveElement = event.relatedTarget as HTMLElement | null;
      const isSilentlyFocused = silentlyFocused(event.currentTarget);
      if (isSelfTarget(event) && isSilentlyFocused) {
        // Composite has been focused as a result of an item receiving focus.
        // The composite item will move focus back to the composite container.
        // In this case, we don't want to propagate this additional event nor
        // call the onFocus handler passed to <Composite onFocus={...} />.
        event.stopPropagation();
        // We keep track of the previous active item element so we can manually
        // fire a blur event on it later when the focus is moved to another item
        // on the onBlurCapture event below.
        previousElementRef.current = previousActiveElement;
      }
    });

    const onFocusProp = props.onFocus;

    const onFocus = useEvent((event: FocusEvent<HTMLType>) => {
      onFocusProp?.(event);
      if (event.defaultPrevented) return;
      if (!composite) return;
      if (!store) return;
      const { relatedTarget } = event;
      const { virtualFocus } = store.getState();
      if (virtualFocus) {
        // This means that the composite element has been focused while the
        // composite item has not. For example, by clicking on the composite
        // element without touching any item, or by tabbing into the composite
        // element. In this case, we want to trigger focus on the item, just
        // like it would happen with roving tabindex. When it receives focus,
        // the composite item will move focus back to the composite element.
        if (isSelfTarget(event) && !isItem(store, relatedTarget)) {
          // By queueing a microtask, we ensure the scheduleFocus effect will be
          // triggered after all the other effects that might have changed the
          // active item. This also accounts for when the composite container is
          // focused right after it gets mounted (for example, in a dialog), in
          // which case state.items will not be populated yet.
          queueMicrotask(scheduleFocus);
        }
      } else if (isSelfTarget(event)) {
        // When the roving tabindex composite gets intentionally focused (for
        // example, by clicking directly on it, and not on an item), we make
        // sure to set the activeId to null (which means the composite element
        // itself has focus).
        store.setActiveId(null);
      }
    });

    const onBlurCaptureProp = props.onBlurCapture;

    const onBlurCapture = useEvent((event: FocusEvent<HTMLType>) => {
      onBlurCaptureProp?.(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      const { virtualFocus, activeId } = store.getState();
      if (!virtualFocus) return;
      // When virtualFocus is set to true, we move focus from the composite
      // container (this element) to the composite item that is being selected.
      // Then we move focus back to the composite container. This is so we can
      // provide the same API as the roving tabindex method, which means people
      // can attach onFocus/onBlur handlers on the CompositeItem component
      // regardless of whether virtualFocus is set to true or false. This
      // sequence of blurring and focusing on items and on the composite element
      // may be confusing, so we ignore intermediate focus and blur events by
      // stopping their propagation.
      const activeElement = getEnabledItem(store, activeId)?.element;
      const nextActiveElement = event.relatedTarget;
      const nextActiveElementIsItem = isItem(store, nextActiveElement);
      const previousElement = previousElementRef.current;
      previousElementRef.current = null;
      // This is an intermediate blur event: blurring the composite container
      // to focus on an item (nextActiveElement).
      if (isSelfTarget(event) && nextActiveElementIsItem) {
        // The next active element will be the same as the active item in the
        // store in these two scenarios:
        // - Moving focus with keyboard: the state is updated before the blur
        //   event is triggered, so here the active item is already pointing to
        //   the next active element.
        // - Clicking on the active item with a pointer: this will trigger blur
        //   on the composite element and then the next active element will be
        //   the same as the active item. Clicking on an item other than the
        //   active one doesn't end up here as the activeItem state will be
        //   updated only after that.
        if (nextActiveElement === activeElement) {
          // If there's a previous active item and it's not a click action, then
          // we fire a blur event on it so it will work just like if it had DOM
          // focus before (like when using roving tabindex).
          if (previousElement && previousElement !== nextActiveElement) {
            fireBlurEvent(previousElement, event);
          }
        }

        // This will be true when the next active element is not the active
        // element, but there's an active item. This will only happen when
        // clicking with a pointer on a different item, when there's already an
        // item selected, in which case activeElement is the item that is
        // getting blurred, and nextActiveElement is the item that is being
        // clicked.
        else if (activeElement) {
          fireBlurEvent(activeElement, event);
        }

        // Finally, if we still have a previousElement, this means that the
        // store is being composed with another composite store and we're moving
        // with keyboard. In this case, the state won't be updated before the
        // blur event. TODO: Test this.
        else if (previousElement) {
          fireBlurEvent(previousElement, event);
        }
        // We want to ignore intermediate blur events, so we stop the
        // propagation of this event.
        event.stopPropagation();
      } else {
        const targetIsItem = isItem(store, event.target);
        // If target is not a composite item, it may be the composite element
        // itself (isSelfTarget) or a tabbable element inside the composite
        // element. This may be triggered by clicking outside of the composite
        // element or by tabbing out of it. In either cases, we want to fire a
        // blur event on the active item.
        if (!targetIsItem && activeElement) {
          fireBlurEvent(activeElement, event);
        }
      }
    });

    const onKeyDownProp = props.onKeyDown;
    const moveOnKeyPressProp = useBooleanEvent(moveOnKeyPress);

    const onKeyDown = useEvent((event: ReactKeyboardEvent<HTMLType>) => {
      onKeyDownProp?.(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      if (!isSelfTarget(event)) return;
      const { orientation, renderedItems, activeId } = store.getState();
      const activeItem = getEnabledItem(store, activeId);
      if (activeItem?.element?.isConnected) return;
      const isVertical = orientation !== "horizontal";
      const isHorizontal = orientation !== "vertical";
      const grid = isGrid(renderedItems);
      // If the event is coming from a text field and no item is selected,
      // horizontal keys should perform their default action on the text field
      // instead of moving focus to an item.
      const isHorizontalKey =
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Home" ||
        event.key === "End";
      if (isHorizontalKey && isTextField(event.currentTarget)) return;
      const up = () => {
        if (grid) {
          const item = findFirstEnabledItemInTheLastRow(renderedItems);
          return item?.id;
        }
        return store?.last();
      };
      const keyMap = {
        ArrowUp: (grid || isVertical) && up,
        ArrowRight: (grid || isHorizontal) && store.first,
        ArrowDown: (grid || isVertical) && store.first,
        ArrowLeft: (grid || isHorizontal) && store.last,
        Home: store.first,
        End: store.last,
        PageUp: store.first,
        PageDown: store.last,
      };
      const action = keyMap[event.key as keyof typeof keyMap];
      if (action) {
        const id = action();
        if (id !== undefined) {
          if (!moveOnKeyPressProp(event)) return;
          event.preventDefault();
          store.move(id);
        }
      }
    });

    props = useWrapElement(
      props,
      (element) => (
        <CompositeScopedContextProvider value={store}>
          {element}
        </CompositeScopedContextProvider>
      ),
      [store],
    );

    const activeDescendant = store.useState((state) => {
      if (!store) return;
      if (!composite) return;
      if (!state.virtualFocus) return;
      return getEnabledItem(store, state.activeId)?.id;
    });

    props = {
      "aria-activedescendant": activeDescendant,
      ...props,
      ref: useMergeRefs(ref, setBaseElement, props.ref),
      onKeyDownCapture,
      onKeyUpCapture,
      onFocusCapture,
      onFocus,
      onBlurCapture,
      onKeyDown,
    };

    const focusable = store.useState(
      (state) => composite && (state.virtualFocus || state.activeId === null),
    );

    props = useFocusable({ focusable, ...props });

    return props;
  },
);

/**
 * Renders a composite widget.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const composite = useCompositeStore();
 * <Composite store={composite}>
 *   <CompositeItem>Item 1</CompositeItem>
 *   <CompositeItem>Item 2</CompositeItem>
 * </Composite>
 * ```
 */
export const Composite = forwardRef(function Composite(props: CompositeProps) {
  const htmlProps = useComposite(props);
  return createElement(TagName, htmlProps);
});

export interface CompositeOptions<T extends ElementType = TagName>
  extends FocusableOptions<T> {
  /**
   * Object returned by the
   * [`useCompositeStore`](https://ariakit.org/reference/use-composite-store)
   * hook. If not provided, the closest
   * [`CompositeProvider`](https://ariakit.org/reference/composite-provider)
   * component's context will be used.
   */
  store?: CompositeStore;
  /**
   * Determines if the component should act as a composite widget. This prop
   * needs to be set to `false` when merging various composite widgets where
   * only one should function in that manner.
   *
   * If disabled, this component will stop managing focus and keyboard
   * navigation for its items and itself. Additionally, composite ARIA
   * attributes won't be applied. These responsibilities should be taken over by
   * another composite component.
   *
   * **Note**: In most cases, this prop doesn't need to be set manually. For
   * example, when composing [Menu with
   * Combobox](https://ariakit.org/examples/menu-combobox) or [Select with
   * Combobox](https://ariakit.org/examples/select-combobox), this prop will be
   * set to `false` automatically on the
   * [`Menu`](https://ariakit.org/reference/menu) and
   * [`SelectPopover`](https://ariakit.org/reference/select-popover) components
   * so the [`Combobox`](https://ariakit.org/reference/combobox) component can
   * take over the composite widget responsibilities.
   *
   * Live examples:
   * - [Menu with Combobox](https://ariakit.org/examples/menu-combobox)
   * - [Select with Combobox](https://ariakit.org/examples/select-combobox)
   * @default true
   */
  composite?: boolean;
  /**
   * Determines whether the composite widget should move focus to an item when
   * arrow keys are pressed, given that the composite element is focused and
   * there's no active item.
   *
   * **Note**: To entirely disable focus moving within a composite widget, you
   * can use the
   * [`focusOnMove`](https://ariakit.org/reference/composite#focusonmove) prop
   * instead. If you want to control the behavior _only when arrow keys are
   * pressed_, where
   * [`focusOnMove`](https://ariakit.org/reference/composite#focusonmove) may
   * not be applicable, this prop must be set on composite items as well.
   * @default true
   * @example
   * ```jsx
   * <Composite moveOnKeyPress={false}>
   *   <CompositeItem moveOnKeyPress={false} />
   *   <CompositeItem moveOnKeyPress={false} />
   * </Composite>
   * ```
   */
  moveOnKeyPress?: BooleanOrCallback<ReactKeyboardEvent<HTMLElement>>;
  /**
   * Determines if the active composite item should receive focus (or virtual
   * focus if the
   * [`virtualFocus`](https://ariakit.org/reference/composite-provider#virtualfocus)
   * option is enabled) when moving through items. This typically happens when
   * navigating through items with arrow keys, but it can also happen when
   * calling the
   * [`move`](https://ariakit.org/reference/use-composite-store#move) method
   * directly.
   *
   * Unlike the
   * [`composite`](https://ariakit.org/reference/composite#composite-1) prop,
   * this option doesn't disable the entire composite widget behavior. It only
   * stops this component from managing focus when navigating through items.
   *
   * **Note**: If you want to control the behavior only _when arrow keys are
   * pressed_, use the
   * [`moveOnKeyPress`](https://ariakit.org/reference/composite#moveonkeypress)
   * prop instead.
   * @default true
   */
  focusOnMove?: boolean;
  /**
   * @see https://ariakit.org/reference/focusable
   */
  focusable?: FocusableOptions<T>["focusable"];
}

export type CompositeProps<T extends ElementType = TagName> = Props<
  T,
  CompositeOptions<T>
>;
