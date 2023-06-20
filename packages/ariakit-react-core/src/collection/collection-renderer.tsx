import type {
  CSSProperties,
  ComponentPropsWithRef,
  ForwardedRef,
  ReactElement,
  ReactNode,
  RefCallback,
} from "react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getScrollingElement, getWindow } from "@ariakit/core/utils/dom";
import { chain, invariant, shallowEqual } from "@ariakit/core/utils/misc";
import type { AnyObject, EmptyObject } from "@ariakit/core/utils/types";
import { flushSync } from "react-dom";
import { useForceUpdate, useId, useMergeRefs } from "../utils/hooks.js";
import { useStoreState } from "../utils/store.jsx";
import { createElement } from "../utils/system.jsx";
import type { RenderProp } from "../utils/types.js";
import { CollectionContext } from "./collection-context.js";
import type {
  CollectionStore,
  CollectionStoreItem,
} from "./collection-store.js";

interface ItemObject
  extends AnyObject,
    Pick<CollectionRendererOptions, "gap" | "orientation"> {
  id?: string;
  element?: HTMLElement | null;
  style?: CSSProperties;
  items?: Item[];
  // TODO: Should be in the composite item.
  disabled?: boolean;
}

type Item =
  | ItemObject
  | Omit<string, string>
  | Omit<number, string>
  | Omit<boolean, string>
  | null
  | undefined;

type Items<T extends Item = any> = number | readonly T[];

type Store<T extends Item = any> = CollectionStore<
  T extends CollectionStoreItem ? T : CollectionStoreItem
>;

interface BaseItemProps {
  id: string;
  ref: RefCallback<HTMLElement>;
  style: CSSProperties;
}

type ItemProps<T extends Item = any> = unknown extends T
  ? BaseItemProps
  : BaseItemProps & (T extends AnyObject ? T : { value: T });

type RawItemProps<T extends Item = any> = unknown extends T
  ? EmptyObject
  : T extends AnyObject
  ? T
  : { value: T };

interface DataItem {
  index: number;
  rendered: boolean;
  start: number;
  end: number;
}

type Data = Map<string, DataItem>;

interface CollectionRendererContextProps {
  store: CollectionRendererOptions["store"];
  orientation: CollectionRendererOptions["orientation"];
  overscan: CollectionRendererOptions["overscan"];
  childrenData: Map<string, Data>;
}

const CollectionRendererContext =
  createContext<CollectionRendererContextProps | null>(null);

function findNearestIndex<T extends Item = any>(
  items: Items<T>,
  target: number,
  getValue: (index: number) => number
) {
  let left = 0;
  let right = getItemsLength(items) - 1;
  while (left <= right) {
    const index = ((left + right) / 2) | 0;
    const value = getValue(index);
    if (value === target) return index;
    else if (value < target) left = index + 1;
    else right = index - 1;
  }
  if (left > 0) return left - 1;
  return 0;
}

function getItemsLength<T extends Item>(items: Items<T>) {
  return typeof items === "number" ? items : items.length;
}

function getItemObject(item: Item): ItemObject {
  if (!item || typeof item !== "object") {
    return { value: item };
  }
  return item;
}

function getItemId(item: Item, index: number, baseId?: string) {
  invariant(baseId, "CollectionRenderer must be given an `id` prop.");
  const defaultId = `${baseId}/${index}`;
  return getItemObject(item).id ?? defaultId;
}

function getItem<T extends Item = any>(
  items: Items<T>,
  index: number
): RawItemProps<T> | null {
  if (typeof items === "number") {
    if (index >= items) return null;
    return {} as RawItemProps<T>;
  }
  const item = items[index];
  if (!item) return null;
  if (typeof item === "object") return item as RawItemProps<T>;
  return { value: item } as unknown as RawItemProps<T>;
}

function getItemSize(
  item: Item,
  horizontal: boolean,
  fallbackElement?: HTMLElement | null | false
): number {
  const itemObject = getItemObject(item);
  horizontal = itemObject.orientation === "horizontal" ?? horizontal;
  const prop = horizontal ? "width" : "height";
  const style = itemObject.style;
  if (style) {
    const size = style[prop];
    if (typeof size === "number") return size;
  }
  const element =
    fallbackElement !== false
      ? itemObject.element || fallbackElement
      : undefined;
  if (element && element.isConnected) {
    return element.getBoundingClientRect()[prop];
  }
  const items = itemObject.items;
  if (items?.length) {
    const initialSize = (itemObject.gap ?? 0) * (items.length - 1);
    return items.reduce<number>(
      (sum, item) => sum + getItemSize(item, horizontal),
      initialSize
    );
  }
  return 0;
}

function getAverageSize<T extends Item>(props: {
  baseId: string;
  data: Data;
  items: Items<T>;
  elements: Map<string, HTMLElement>;
  estimatedItemSize: number;
  horizontal: boolean;
}) {
  const length = getItemsLength(props.items);
  let currentIndex = 0;
  let averageSize = props.estimatedItemSize;

  const setAverageSize = (size: number) => {
    const prevIndex = currentIndex;
    currentIndex = currentIndex + 1;
    averageSize = (averageSize * prevIndex + size) / currentIndex;
  };

  for (let index = 0; index < length; index += 1) {
    const item = getItem(props.items, index);
    const itemId = getItemId(item, index, props.baseId);
    const itemData = props.data.get(itemId);
    const fallbackElement = props.elements.get(itemId);
    const size = getItemSize(item, props.horizontal, fallbackElement);
    if (size) {
      setAverageSize(size);
    } else if (itemData?.rendered) {
      setAverageSize(itemData.end - itemData.start);
    }
  }

  return averageSize;
}

function getOffset(
  element: HTMLElement,
  scrollingElement: Element,
  horizontal: boolean
): number {
  const win = getWindow(element);
  const htmlElement = win?.document.documentElement;
  if (scrollingElement === htmlElement) {
    const { left, top } = element.getBoundingClientRect();
    const { scrollX, scrollY } = win;
    if (horizontal) return scrollX + left;
    return scrollY + top;
  }
  const elementRect = element.getBoundingClientRect();
  const scrollingElmentRect = scrollingElement.getBoundingClientRect();
  const positionProp = horizontal ? "left" : "top";
  const scrollProp = horizontal ? "scrollLeft" : "scrollTop";
  return (
    elementRect[positionProp] -
    scrollingElmentRect[positionProp] +
    scrollingElement[scrollProp]
  );
}

function getScrollOffset(scrollingElement: Element, horizontal: boolean) {
  const prop = horizontal ? "scrollLeft" : "scrollTop";
  return scrollingElement[prop];
}

function getViewport(scrollingElement: Element) {
  const { defaultView, documentElement } = scrollingElement.ownerDocument;
  if (scrollingElement === documentElement) {
    return defaultView;
  }
  return scrollingElement;
}

function getItemsEnd<T extends Item>(props: {
  baseId?: string;
  items: Items<T>;
  data: Data;
  gap: number;
  horizontal: boolean;
  itemSize?: number;
  estimatedItemSize: number;
  padding: number;
}) {
  const length = getItemsLength(props.items);
  if (!length) return props.padding;
  const lastIndex = length - 1;
  const totalGap = lastIndex * props.gap + props.padding;
  if (props.itemSize != null) {
    return length * props.itemSize + totalGap;
  }
  const defaultEnd = length * props.estimatedItemSize + totalGap;
  if (!props.baseId) return defaultEnd;
  const lastItem = getItem(props.items, lastIndex);
  const lastItemId = getItemId(lastItem, lastIndex, props.baseId);
  const lastItemData = props.data.get(lastItemId);
  if (lastItemData?.end) return lastItemData.end + props.padding;
  if (!Array.isArray(props.items)) return defaultEnd;
  const end = props.items.reduce<number>(
    (sum, item) => sum + getItemSize(item, props.horizontal, false),
    0
  );
  if (!end) return defaultEnd;
  return end + totalGap;
}

function CollectionRendererImpl<T extends Item = any>(
  {
    store: storeProp,
    items: itemsProp,
    initialItems = 0,
    orientation: orientationProp,
    itemSize,
    estimatedItemSize = 40,
    gap = 0,
    overscan: overscanProp,
    persistentIndices,
    children: renderItem,
    padding = 0,
    paddingStart = padding,
    paddingEnd = padding,
    ...props
  }: CollectionRendererProps<T>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const context = useContext(CollectionContext);
  const store = storeProp || (context as Store<T>);

  const items =
    useStoreState(store, (state) => itemsProp ?? (state.items as Items<T>)) ||
    itemsProp;

  invariant(
    items != null,
    process.env.NODE_ENV !== "production" &&
      "CollectionRenderer must be either wrapped in a Collection component or be given an `items` prop."
  );

  let parent = useContext(CollectionRendererContext);
  if (store && parent?.store !== store) {
    parent = null;
  }

  const parentData = parent?.childrenData;
  const orientation = orientationProp ?? parent?.orientation ?? "vertical";
  const overscan = overscanProp ?? parent?.overscan ?? 1;

  const ref = useRef<HTMLDivElement>(null);
  const baseId = useId(props.id);
  const horizontal = orientation === "horizontal";
  const elements = useMemo(() => new Map<string, HTMLElement>(), []);
  const [elementsUpdated, updateElements] = useForceUpdate();

  const [data, setData] = useState<Data>(() => {
    if (!baseId) return new Map();
    return parentData?.get(baseId) || new Map();
  });

  const [visibleIndices, setVisibleIndices] = useState<number[]>(() => {
    if (!initialItems) return [];
    const length = getItemsLength(items);
    const initialLength = Math.min(length, Math.abs(initialItems));
    return Array.from({ length: initialLength }, (_, index) => {
      if (initialItems < 0) return length - index - 1;
      return index;
    });
  });

  const missingPersistentIndices = useMemo(() => {
    if (!persistentIndices?.length) return false;
    return persistentIndices.some(
      (index) => index >= 0 && !visibleIndices.includes(index)
    );
  }, [persistentIndices, visibleIndices]);

  if (missingPersistentIndices) {
    setVisibleIndices((indices) => {
      const nextIndices = [...indices];
      persistentIndices?.forEach((index) => {
        if (index < 0) return;
        if (nextIndices.includes(index)) return;
        nextIndices.push(index);
      });
      return nextIndices.sort((a, b) => a - b);
    });
  }

  const totalSize = useMemo(() => {
    return getItemsEnd({
      baseId,
      items,
      data,
      gap,
      horizontal,
      itemSize,
      estimatedItemSize,
      padding: paddingStart + paddingEnd,
    });
  }, [
    baseId,
    items,
    data,
    gap,
    horizontal,
    itemSize,
    estimatedItemSize,
    paddingStart,
    paddingEnd,
  ]);

  useEffect(() => {
    if (!baseId) return;
    parentData?.set(baseId, data);
  }, [baseId, parentData, data]);

  useEffect(() => {
    if (itemSize != null) return;
    if (!baseId) return;
    if (!items) return;
    const length = getItemsLength(items);
    let nextData: Data | undefined;
    let start = paddingStart;

    const avgSize = getAverageSize({
      baseId,
      data,
      horizontal,
      items,
      elements,
      estimatedItemSize,
    });

    for (let index = 0; index < length; index += 1) {
      const item = getItem(items, index);
      const itemId = getItemId(item, index, baseId);
      const itemData = data.get(itemId);
      const prevRendered = itemData?.rendered ?? false;

      const setSize = (size: number, rendered = prevRendered) => {
        start = start ? start + gap : start;
        const end = start + size;
        const nextItemData = { index, rendered, start, end };
        if (!shallowEqual(itemData, nextItemData)) {
          if (!nextData) {
            nextData = new Map(data);
          }
          nextData.set(itemId, { index, rendered, start, end });
        }
        start = end;
      };

      const size = getItemSize(item, horizontal, elements.get(itemId));

      if (size) {
        setSize(size, true);
      } else if (itemData?.rendered) {
        setSize(itemData.end - itemData.start, true);
      } else {
        setSize(avgSize);
      }
    }

    if (nextData) {
      setData(nextData);
    }
  }, [
    elementsUpdated,
    itemSize,
    baseId,
    items,
    paddingStart,
    data,
    horizontal,
    elements,
    estimatedItemSize,
    gap,
  ]);

  const processVisibleItems = useCallback(
    (scrollingElement: Element) => {
      const container = ref.current;
      if (!container) return;
      if (!baseId) return;
      if (!data.size && !itemSize) return;

      const length = getItemsLength(items);
      const offset = getOffset(container, scrollingElement, horizontal);
      const scrollOffset = getScrollOffset(scrollingElement, horizontal);

      const getItemOffset = (index: number) => {
        if (itemSize) return itemSize * index + gap * index;
        const item = getItem(items, index);
        const itemId = getItemId(item, index, baseId);
        const itemData = data.get(itemId);
        return itemData?.start ?? 0;
      };

      const startTarget = scrollOffset - offset;
      const initialStart = findNearestIndex(items, startTarget, getItemOffset);
      let initialEnd = initialStart + 1;

      const scrollingSize = horizontal
        ? scrollingElement.clientWidth
        : scrollingElement.clientHeight;
      const scrollingEnd = scrollOffset - offset + scrollingSize;

      while (initialEnd < length && getItemOffset(initialEnd) < scrollingEnd) {
        initialEnd += 1;
      }

      const start = Math.max(initialStart - overscan, 0);
      const end = Math.min(initialEnd + overscan, length);

      const indices = Array.from(
        { length: end - start },
        (_, index) => index + start
      );

      setVisibleIndices((prevIndices) => {
        if (shallowEqual(prevIndices, indices)) return prevIndices;
        return indices;
      });
    },
    [
      elementsUpdated,
      baseId,
      data,
      itemSize,
      horizontal,
      items,
      gap,
      overscan,
      // TODO: Test press "B". Optimize
      persistentIndices,
    ]
  );

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const scrollingElement = getScrollingElement(container);
    if (!scrollingElement) return;
    const viewport = getViewport(scrollingElement);
    if (!viewport) return;

    const scroll = () => {
      const onScroll = () => {
        flushSync(() => processVisibleItems(scrollingElement));
      };
      viewport.addEventListener("scroll", onScroll, { passive: true });
      return () => viewport.removeEventListener("scroll", onScroll);
    };

    const observeScrollingElement = () => {
      if (scrollingElement.tagName === "HTML") return;
      if (typeof ResizeObserver !== "function") return;
      let firstRun = true;
      const observer = new ResizeObserver(() => {
        if (firstRun) {
          firstRun = false;
          return;
        }
        processVisibleItems(scrollingElement);
      });
      observer.observe(scrollingElement);
      return () => observer.disconnect();
    };

    const observeWindow = () => {
      if (scrollingElement.tagName !== "HTML") return;
      const onResize = () => {
        processVisibleItems(scrollingElement);
      };
      viewport.addEventListener("resize", onResize, { passive: true });
      return () => viewport.removeEventListener("resize", onResize);
    };

    processVisibleItems(scrollingElement);

    return chain(scroll(), observeScrollingElement(), observeWindow());
  }, [processVisibleItems]);

  const elementObserver = useMemo(() => {
    if (typeof ResizeObserver !== "function") return;
    return new ResizeObserver(() => {
      flushSync(updateElements);
    });
  }, [updateElements]);

  const itemRef = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      if (!element) return;
      // TODO:
      updateElements();
      if (itemSize) return;
      elements.set(element.id, element);
      elementObserver?.observe(element);
    },
    [itemSize, elements, updateElements, elementObserver]
  );

  const getItemProps = useCallback(
    <Item extends T = T>(item: RawItemProps<Item>, index: number) => {
      const itemId = getItemId(item, index, baseId);
      const offset = itemSize
        ? itemSize * index + gap * index
        : data.get(itemId)?.start ?? 0;
      const baseItemProps: BaseItemProps = {
        id: itemId,
        ref: itemRef,
        style: {
          position: "absolute",
          left: horizontal ? offset : 0,
          top: horizontal ? 0 : offset,
        },
      };
      if (itemSize) {
        baseItemProps.style[horizontal ? "width" : "height"] = itemSize;
      }
      if (item == null) return baseItemProps as ItemProps<T>;
      const itemProps = getItemObject(item);
      return {
        ...itemProps,
        ...baseItemProps,
        style: {
          ...itemProps.style,
          ...baseItemProps.style,
        },
      } as ItemProps<T>;
    },
    [baseId, data, itemSize, gap, horizontal, itemRef]
  );

  const itemsProps = useMemo(() => {
    return visibleIndices
      .map((index) => {
        if (index < 0) return;
        const item = getItem(items, index);
        if (!item) return;
        const itemProps = getItemProps(item, index);
        return { itemProps, index };
      })
      .filter((value): value is NonNullable<typeof value> => value != null);
  }, [items, visibleIndices, getItemProps]);

  const children = itemsProps?.map(({ itemProps, index }) => {
    return renderItem?.(itemProps, index);
  });

  const styleProp = props.style;
  const sizeProperty = horizontal ? "width" : "height";

  const style = useMemo(
    () => ({
      flex: "none",
      position: "relative" as const,
      [sizeProperty]: totalSize,
      ...styleProp,
    }),
    [styleProp, sizeProperty, totalSize]
  );

  props = {
    id: baseId,
    ...props,
    style,
    ref: useMergeRefs(ref, forwardedRef),
  };

  const element = createElement("div", { ...props, children });

  const childrenData = useMemo(() => new Map<string, Data>(), []);
  const providerValue: CollectionRendererContextProps = useMemo(
    () => ({ store, orientation, overscan, childrenData }),
    [store, orientation, overscan, childrenData]
  );

  return (
    <CollectionRendererContext.Provider value={providerValue}>
      {element}
    </CollectionRendererContext.Provider>
  );
}

export const CollectionRenderer = forwardRef(
  CollectionRendererImpl
) as typeof CollectionRendererImpl;

export const getCollectionItemObject = getItemObject;
export const getCollectionItemId = getItemId;

export type CollectionRendererItem = Item;

export interface CollectionRendererOptions<T extends Item = any> {
  /**
   * Object returned by the
   * [`useCollectionStore`](https://ariakit.org/reference/use-collection-store)
   * hook. If not provided, the parent
   * [Collection](https://ariakit.org/components/collection) component's
   * context will be used.
   *
   * The store
   * [`items`](https://ariakit.org/reference/use-collection-store#items) state
   * will be used to render the items if the
   * [`items`](https://ariakit.org/reference/collection-items#items) prop is not
   * provided.
   */
  store?: Store<T>;
  /**
   * All items to be rendered. This prop can be either a memoized array of items
   * or a number representing the total number of items to be rendered.
   *
   * When passing an array, each item can be either a primitive value or an
   * object. If it's a primitive value, an object with the `value` property will
   * be automatically created for each item and passed as an argument to the
   * function that renders the item. If it's an object, the entire object will
   * be passed.
   *
   * The item object can have any shape, but some **optional** properties are
   * special:
   * - `id`: The same as the HTML attribute. If not provided, one will be
   *   generated automatically.
   * - `style`: The same as the HTML attribute. This will be merged with the
   *   styles generated by the component for each item. If the `width` or
   *   `height` properties are explicitly provided here, they will be used to
   *   calculate the item's size.
   * - `items`: An array of items to be rendered as children of this item. This
   *   is useful when rendering nested items, though it's not required.
   *
   * @example
   * ```jsx
   * <CollectionRenderer items={1000}>
   *   {(item, index) => (
   *     <CollectionItem key={item.id} {...item}>
   *       Item {index}
   *     </CollectionItem>
   *   )}
   * </CollectionRenderer>
   * ```
   */
  items?: Items<T>;
  /**
   * TODO: Description.
   *
   * @example
   * ```jsx
   * <CollectionRenderer items={items} initialItems={8}>
   *   {(item) => <CollectionItem key={item.id} {...item} />}
   * </CollectionRenderer>
   * ```
   */
  initialItems?: number;
  /**
   * Whether the items should be rendered vertically or horizontally.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";
  /**
   * The fixed size of each item in pixels. If not provided, the size will be
   * automatically calculated.
   */
  itemSize?: number;
  /**
   * The estimated size of each item in pixels. This is used to calculate the
   * initial size of the items before they are rendered.
   * @default 40
   */
  estimatedItemSize?: number;
  /**
   * The gap between each item in pixels.
   * @default 0
   */
  gap?: number;
  /**
   * The number of items to render before and after the visible items.
   * @default 1
   */
  overscan?: number;
  /**
   * TODO: Comment
   */
  persistentIndices?: number[];
  /**
   * The `children` should be a function that receives an item and its index and
   * returns a React element.
   * @param item The item object to be spread on the item component.
   * @param index The index of the item.
   */
  children?: (item: ItemProps<T>, index: number) => ReactNode;
  render?: RenderProp | ReactElement;
  padding?: number;
  paddingStart?: number;
  paddingEnd?: number;
}

export interface CollectionRendererProps<T extends Item = any>
  extends Omit<ComponentPropsWithRef<"div">, "children">,
    CollectionRendererOptions<T> {}
