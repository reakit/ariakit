import {
  getScrollingElement,
  getTextboxSelection,
  getTextboxValue,
  isButton,
  isTextField,
  isTextbox,
} from "@ariakit/core/utils/dom";
import { isPortalEvent, isSelfTarget } from "@ariakit/core/utils/events";
import {
  disabledFromProps,
  removeUndefinedValues,
} from "@ariakit/core/utils/misc";
import { isSafari } from "@ariakit/core/utils/platform";
import type { BooleanOrCallback } from "@ariakit/core/utils/types";
import type {
  ElementType,
  FocusEvent,
  KeyboardEvent,
  SyntheticEvent,
} from "react";
import { useCallback, useContext, useMemo, useRef } from "react";
import type { CollectionItemOptions } from "../collection/collection-item.tsx";
import { useCollectionItem } from "../collection/collection-item.tsx";
import type { CommandOptions } from "../command/command.tsx";
import { useCommand } from "../command/command.tsx";
import {
  useBooleanEvent,
  useEvent,
  useId,
  useMergeRefs,
  useWrapElement,
} from "../utils/hooks.ts";
import { useStoreStateObject } from "../utils/store.tsx";
import {
  createElement,
  createHook,
  forwardRef,
  memo,
} from "../utils/system.tsx";
import type { Props } from "../utils/types.ts";
import {
  CompositeItemContext,
  CompositeRowContext,
  useCompositeScopedContext,
} from "./composite-context.tsx";
import type { CompositeStore } from "./composite-store.ts";
import {
  focusSilently,
  getEnabledItem,
  isItem,
  selectTextField,
} from "./utils.ts";

const TagName = "button" satisfies ElementType;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

function isEditableElement(element: HTMLElement) {
  if (isTextbox(element)) return true;
  return element.tagName === "INPUT" && !isButton(element);
}

function getNextPageOffset(scrollingElement: Element, pageUp = false) {
  const height = scrollingElement.clientHeight;
  const { top } = scrollingElement.getBoundingClientRect();
  // Calculates the size of the page based on the scrolling element's height.
  // This is similar to how browsers calculate the scroll position when pressing
  // spacebar, page up, or page down.
  const pageSize = Math.max(height * 0.875, height - 40) * 1.5;
  const pageOffset = pageUp ? height - pageSize + top : pageSize + top;
  if (scrollingElement.tagName === "HTML") {
    return pageOffset + scrollingElement.scrollTop;
  }
  return pageOffset;
}

function getItemOffset(itemElement: Element, pageUp = false) {
  const { top } = itemElement.getBoundingClientRect();
  if (pageUp) {
    // PageUp is always the inverse of PageDown. On PageDown, we consider only
    // the top offset of the element. On PageUp we need to add the height of the
    // element as well so we consider the bottom of it.
    return top + itemElement.clientHeight;
  }
  return top;
}

function findNextPageItemId(
  element: Element,
  store?: CompositeStore,
  next?: CompositeStore["next"],
  pageUp = false,
) {
  if (!store) return;
  if (!next) return;
  const { renderedItems } = store.getState();
  const scrollingElement = getScrollingElement(element);
  if (!scrollingElement) return;
  const nextPageOffset = getNextPageOffset(scrollingElement, pageUp);
  let id: string | null | undefined;
  let prevDifference: number | undefined;
  // We need to loop through the next items to find the one that is closest to
  // the next page offset.
  for (let i = 0; i < renderedItems.length; i += 1) {
    const previousId = id;
    id = next(i);
    if (!id) break;
    if (id === previousId) continue;
    const itemElement = getEnabledItem(store, id)?.element;
    if (!itemElement) continue;
    const itemOffset = getItemOffset(itemElement, pageUp);
    const difference = itemOffset - nextPageOffset;
    const absDifference = Math.abs(difference);
    // On PageUp, the element is at the next page if the difference between its
    // top offset (plus its height) and the next page offset is less than or
    // equal zero. On PageDown, the difference should be greater than or equal
    // zero.
    if ((pageUp && difference <= 0) || (!pageUp && difference >= 0)) {
      // There may be cases when there's a lot of space between the pages, for
      // example, when there's a lot of disabled items. In this case, the first
      // item in the next page might not be the closest one. So we return the
      // previous item id if its difference is less than the current one.
      if (prevDifference !== undefined && prevDifference < absDifference) {
        id = previousId;
      }
      break;
    }
    prevDifference = absDifference;
  }
  return id;
}

function targetIsAnotherItem(event: SyntheticEvent, store: CompositeStore) {
  if (isSelfTarget(event)) return false;
  return isItem(store, event.target as HTMLElement);
}

/**
 * Returns props to create a `CompositeItem` component.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const store = useCompositeStore();
 * const props = useCompositeItem({ store });
 * <Role {...props}>Item 1</Role>
 * ```
 */
export const useCompositeItem = createHook<TagName, CompositeItemOptions>(
  function useCompositeItem({
    store,
    rowId: rowIdProp,
    preventScrollOnKeyDown = false,
    moveOnKeyPress = true,
    tabbable = false,
    getItem: getItemProp,
    "aria-setsize": ariaSetSizeProp,
    "aria-posinset": ariaPosInSetProp,
    ...props
  }) {
    const context = useCompositeScopedContext();
    store = store || context;

    const id = useId(props.id);
    const ref = useRef<HTMLType>(null);
    const row = useContext(CompositeRowContext);
    const disabled = disabledFromProps(props);
    const trulyDisabled = disabled && !props.accessibleWhenDisabled;

    const {
      rowId,
      baseElement,
      isActiveItem,
      ariaSetSize,
      ariaPosInSet,
      isTabbable,
    } = useStoreStateObject(store, {
      rowId(state) {
        if (rowIdProp) return rowIdProp;
        if (!state) return;
        if (!row?.baseElement) return;
        if (row.baseElement !== state.baseElement) return;
        return row.id;
      },
      baseElement(state) {
        return state?.baseElement || undefined;
      },
      isActiveItem(state) {
        return !!state && state.activeId === id;
      },
      ariaSetSize(state) {
        if (ariaSetSizeProp != null) return ariaSetSizeProp;
        if (!state) return;
        if (!row?.ariaSetSize) return;
        if (row.baseElement !== state.baseElement) return;
        return row.ariaSetSize;
      },
      ariaPosInSet(state) {
        if (ariaPosInSetProp != null) return ariaPosInSetProp;
        if (!state) return;
        if (!row?.ariaPosInSet) return;
        if (row.baseElement !== state.baseElement) return;
        const itemsInRow = state.renderedItems.filter(
          (item) => item.rowId === rowId,
        );
        return (
          row.ariaPosInSet + itemsInRow.findIndex((item) => item.id === id)
        );
      },
      isTabbable(state) {
        if (!state?.renderedItems.length) return true;
        if (state.virtualFocus) return false;
        if (tabbable) return true;
        if (state.activeId === null) return false;
        // If activeId refers to an item that's disabled or not connected to the
        // DOM, we make all items tabbable so users can tab into the composite
        // widget. Once the activeId is valid, we restore the roving tabindex. See
        // https://github.com/ariakit/ariakit/issues/3232
        // https://github.com/ariakit/ariakit/issues/4129
        const item = store?.item(state.activeId);
        if (item?.disabled) return true;
        if (!item?.element) return true;
        return state.activeId === id;
      },
    });

    const getItem = useCallback<NonNullable<CollectionItemOptions["getItem"]>>(
      (item) => {
        const nextItem = {
          ...item,
          id: id || item.id,
          rowId,
          disabled: !!trulyDisabled,
          children: item.element?.textContent,
        };
        if (getItemProp) {
          return getItemProp(nextItem);
        }
        return nextItem;
      },
      [id, rowId, trulyDisabled, getItemProp],
    );

    const onFocusProp = props.onFocus;
    const hasFocusedComposite = useRef(false);

    const onFocus = useEvent((event: FocusEvent<HTMLType>) => {
      onFocusProp?.(event);
      if (event.defaultPrevented) return;
      if (isPortalEvent(event)) return;
      if (!id) return;
      if (!store) return;
      // If the target is another item, this probably means that composite items
      // are nested. This is okay when building, for example, tree or treegrid
      // elements. In this case, we just ignore the focus event on this parent
      // item.
      if (targetIsAnotherItem(event, store)) return;
      const { virtualFocus, baseElement } = store.getState();
      store.setActiveId(id);
      // If the composite item is a text field, we'll select its content when
      // focused. This guarantees that pressing arrow keys will move to the
      // previous/next composite items instead of moving the cursor inside the
      // text field.
      if (isTextbox(event.currentTarget)) {
        selectTextField(event.currentTarget);
      }
      // When using aria-activedescendant, we want to make sure that the
      // composite container receives focus, not the composite item.
      if (!virtualFocus) return;
      // But we'll only do this if the focused element is the composite item
      // itself
      if (!isSelfTarget(event)) return;
      // and the composite item is not a text field or contenteditable element.
      if (isEditableElement(event.currentTarget)) return;
      // We need to verify if the base element is connected to the DOM to avoid
      // a scroll jump on Safari. This is necessary when the base element is
      // removed from the DOM just before triggering this focus event.
      if (!baseElement?.isConnected) return;
      // Safari doesn't scroll the element into view when another element is
      // immediately focused. So we have to do it manually here.
      if (isSafari() && event.currentTarget.hasAttribute("data-autofocus")) {
        event.currentTarget.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      }
      hasFocusedComposite.current = true;
      // If the previously focused element is a composite or composite item
      // component, we'll transfer focus silently to the composite element.
      // That's because this is just a transition event, the composite element
      // was likely already focused, so we're just immediately returning focus
      // to it when navigating through the items.
      const fromComposite =
        event.relatedTarget === baseElement ||
        isItem(store, event.relatedTarget);
      if (fromComposite) {
        focusSilently(baseElement);
      }

      // Otherwise, the composite element is likely not focused, so we need this
      // focus event to propagate so consumers can use the onFocus prop on
      // <Composite>.
      else {
        baseElement.focus();
      }
    });

    const onBlurCaptureProp = props.onBlurCapture;

    const onBlurCapture = useEvent((event: FocusEvent<HTMLType>) => {
      onBlurCaptureProp?.(event);
      if (event.defaultPrevented) return;
      const state = store?.getState();
      if (state?.virtualFocus && hasFocusedComposite.current) {
        // When hasFocusedComposite is true, composite has been focused right
        // after focusing on this item. This is an intermediate blur event, so
        // we ignore it.
        hasFocusedComposite.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    });

    const onKeyDownProp = props.onKeyDown;
    const preventScrollOnKeyDownProp = useBooleanEvent(preventScrollOnKeyDown);
    const moveOnKeyPressProp = useBooleanEvent(moveOnKeyPress);

    const onKeyDown = useEvent((event: KeyboardEvent<HTMLType>) => {
      onKeyDownProp?.(event);
      if (event.defaultPrevented) return;
      if (!isSelfTarget(event)) return;
      if (!store) return;
      const { currentTarget } = event;
      const state = store.getState();
      const item = store.item(id);
      const isGrid = !!item?.rowId;
      const isVertical = state.orientation !== "horizontal";
      const isHorizontal = state.orientation !== "vertical";
      // If the base element is a text field, the Home and End keys should be
      // performed on the text field, not the composite item, unless the
      // composite is a grid or has a horizontal orientation.
      const canHomeEnd = () => {
        if (isGrid) return true;
        if (isHorizontal) return true;
        if (!state.baseElement) return true;
        if (!isTextField(state.baseElement)) return true;
        return false;
      };
      const keyMap = {
        ArrowUp: (isGrid || isVertical) && store.up,
        ArrowRight: (isGrid || isHorizontal) && store.next,
        ArrowDown: (isGrid || isVertical) && store.down,
        ArrowLeft: (isGrid || isHorizontal) && store.previous,
        Home: () => {
          if (!canHomeEnd()) return;
          if (!isGrid || event.ctrlKey) {
            return store?.first();
          }
          return store?.previous(-1);
        },
        End: () => {
          if (!canHomeEnd()) return;
          if (!isGrid || event.ctrlKey) {
            return store?.last();
          }
          return store?.next(-1);
        },
        PageUp: () => {
          return findNextPageItemId(currentTarget, store, store?.up, true);
        },
        PageDown: () => {
          return findNextPageItemId(currentTarget, store, store?.down);
        },
      };
      const action = keyMap[event.key as keyof typeof keyMap];
      if (action) {
        // If the composite item is a textbox, we'll only move focus to the
        // previous/next composite items when the cursor is at the beginning or
        // end of the text. This is to avoid moving focus when the user is
        // navigating through the text.
        if (isTextbox(currentTarget)) {
          const selection = getTextboxSelection(currentTarget);
          const isLeft = isHorizontal && event.key === "ArrowLeft";
          const isRight = isHorizontal && event.key === "ArrowRight";
          const isUp = isVertical && event.key === "ArrowUp";
          const isDown = isVertical && event.key === "ArrowDown";
          if (isRight || isDown) {
            const { length: valueLength } = getTextboxValue(currentTarget);
            if (selection.end !== valueLength) return;
          } else if ((isLeft || isUp) && selection.start !== 0) return;
        }
        const nextId = action();
        if (preventScrollOnKeyDownProp(event) || nextId !== undefined) {
          if (!moveOnKeyPressProp(event)) return;
          event.preventDefault();
          store.move(nextId);
        }
      }
    });

    const providerValue = useMemo(
      () => ({ id, baseElement }),
      [id, baseElement],
    );

    props = useWrapElement(
      props,
      (element) => (
        <CompositeItemContext.Provider value={providerValue}>
          {element}
        </CompositeItemContext.Provider>
      ),
      [providerValue],
    );

    props = {
      id,
      "data-active-item": isActiveItem || undefined,
      ...props,
      ref: useMergeRefs(ref, props.ref),
      tabIndex: isTabbable ? props.tabIndex : -1,
      onFocus,
      onBlurCapture,
      onKeyDown,
    };

    props = useCommand(props);
    props = useCollectionItem<TagName>({
      store,
      ...props,
      getItem,
      shouldRegisterItem: id ? props.shouldRegisterItem : false,
    });

    return removeUndefinedValues({
      ...props,
      "aria-setsize": ariaSetSize,
      "aria-posinset": ariaPosInSet,
    });
  },
);

/**
 * Renders a focusable item as part of a composite widget. The `tabindex`
 * attribute is automatically managed by this component based on the
 * [`virtualFocus`](https://ariakit.org/reference/composite-provider#virtualfocus)
 * option.
 *
 * When this component receives DOM focus or is virtually focused (when the
 * [`virtualFocus`](https://ariakit.org/reference/composite-provider#virtualfocus)
 * option is set to `true`), the element will automatically receive the
 * [`data-active-item`](https://ariakit.org/guide/styling#data-active-item)
 * attribute. This can be used to style the focused item, no matter the focus
 * approach employed.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx {3-5}
 * <CompositeProvider>
 *   <Composite>
 *     <CompositeItem>Item 1</CompositeItem>
 *     <CompositeItem>Item 2</CompositeItem>
 *     <CompositeItem>Item 3</CompositeItem>
 *   </Composite>
 * </CompositeProvider>
 * ```
 */
export const CompositeItem = memo(
  forwardRef(function CompositeItem(props: CompositeItemProps) {
    const htmlProps = useCompositeItem(props);
    return createElement(TagName, htmlProps);
  }),
);

export interface CompositeItemOptions<T extends ElementType = TagName>
  extends CommandOptions<T>,
    CollectionItemOptions<T> {
  /**
   * Object returned by the
   * [`useCompositeStore`](https://ariakit.org/reference/use-composite-store)
   * hook. If not provided, the closest
   * [`Composite`](https://ariakit.org/reference/composite) or
   * [`CompositeProvider`](https://ariakit.org/reference/composite-provider)
   * components' context will be used.
   */
  store?: CompositeStore;
  /**
   * Determines if the item should be registered as part of the collection. If
   * this is set to `false`, the item won't be accessible via arrow keys.
   */
  shouldRegisterItem?: CollectionItemOptions<T>["shouldRegisterItem"];
  /**
   * The id that will be used to group items in the same row. This is usually
   * retrieved by the
   * [`CompositeRow`](https://ariakit.org/reference/composite-row) component
   * through context so in most cases you don't need to set it manually.
   *
   * Live examples:
   * - [Command Menu with
   *   Tabs](https://ariakit.org/examples/dialog-combobox-tab-command-menu)
   */
  rowId?: string;
  /**
   * Whether the scroll behavior should be prevented when pressing arrow keys on
   * the first or the last items.
   * @deprecated Use CSS
   * [`scroll-margin`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin)
   * instead.
   * @default false
   */
  preventScrollOnKeyDown?: BooleanOrCallback<KeyboardEvent<HTMLElement>>;
  /**
   * Determines if pressing arrow keys while this item is in focus should move
   * focus to a different item.
   *
   * **Note**: To entirely disable focus moving within a composite widget, you
   * can use the
   * [`focusOnMove`](https://ariakit.org/reference/composite#focusonmove) prop
   * on the composite component instead. If you want to control the behavior
   * _only when arrow keys are pressed_, where
   * [`focusOnMove`](https://ariakit.org/reference/composite#focusonmove) may
   * not be applicable, this prop must be set on all composite items because
   * they each manage their own key presses, as well as on the composite
   * component itself.
   * @default true
   * @example
   * ```jsx
   * <Composite moveOnKeyPress={false}>
   *   <CompositeItem moveOnKeyPress={false} />
   *   <CompositeItem moveOnKeyPress={false} />
   * </Composite>
   * ```
   */
  moveOnKeyPress?: BooleanOrCallback<KeyboardEvent<HTMLElement>>;
  /**
   * When the `tabbable` prop is set to `true`, the [roving
   * tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex)
   * method is partially disabled for this element. This means that the
   * `tabIndex` prop won't be assigned `-1` when the item is inactive. In
   * addition to using arrow keys, users will be able to tab to this element,
   * leading to the composite widget no longer existing as a single tab stop.
   *
   * As per the [ARIA spec](https://w3c.github.io/aria/#composite):
   *
   * > Authors **SHOULD** ensure that a composite widget exists as a single
   * > navigation stop within the larger navigation system of the web page.
   *
   * Additionally, as stated in
   * [RFC-2119](https://www.rfc-editor.org/rfc/rfc2119.txt):
   *
   * > **SHOULD** This word, or the adjective "RECOMMENDED", mean that there may
   * > exist valid reasons in particular circumstances to ignore a particular
   * > item, but the full implications must be understood and carefully weighed
   * > before choosing a different course.
   *
   * Therefore, while this may be allowed, you should think carefully about the
   * implications of using this prop.
   *
   * **Note**: This prop has no effect when the
   * [`virtualFocus`](https://ariakit.org/reference/composite-provider#virtualfocus)
   * option is enabled.
   *
   * Live examples:
   * - [Navigation Menubar](https://ariakit.org/examples/menubar-navigation)
   */
  tabbable?: boolean;
}

export type CompositeItemProps<T extends ElementType = TagName> = Props<
  T,
  CompositeItemOptions<T>
>;
