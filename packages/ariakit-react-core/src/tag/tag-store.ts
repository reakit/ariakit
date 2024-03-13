import * as Core from "@ariakit/core/tag/tag-store";
import type {
  CompositeStoreFunctions,
  CompositeStoreOptions,
  CompositeStoreState,
} from "../composite/composite-store.js";
import { useCompositeStoreProps } from "../composite/composite-store.js";
import type { Store } from "../utils/store.js";
import { useStore, useStoreProps } from "../utils/store.js";

export function useTagStoreProps<T extends Core.TagStore>(
  store: T,
  update: () => void,
  props: TagStoreProps,
) {
  useStoreProps(store, props, "value", "setValue");
  useStoreProps(store, props, "values", "setValues");
  return useCompositeStoreProps(store, update, props);
}

/**
 * Creates a tag store to control the state of
 * [Tag](https://ariakit.org/components/tag) components.
 * @see https://ariakit.org/components/tag
 * @example
 * ```jsx
 * const tag = useTagStore({ placement: "top" });
 *
 * <TagButton store={tag}>Edit</TagButton>
 * <Tag store={tag}>
 *   <TagItem>Undo</TagItem>
 *   <TagItem>Redo</TagItem>
 * </Tag>
 * ```
 */
export function useTagStore(props: TagStoreProps = {}): TagStore {
  const [store, update] = useStore(Core.createTagStore, props);
  return useTagStoreProps(store, update, props);
}

export interface TagStoreItem extends Core.TagStoreItem {}

export interface TagStoreState
  extends Core.TagStoreState,
    CompositeStoreState<TagStoreItem> {}

export interface TagStoreFunctions
  extends Core.TagStoreFunctions,
    CompositeStoreFunctions<TagStoreItem> {}

export interface TagStoreOptions
  extends Core.TagStoreOptions,
    CompositeStoreOptions<TagStoreItem> {
  /**
   * A callback that gets called when the
   * [`value`](https://ariakit.org/reference/tag-provider#value) state
   * changes.
   */
  setValue?: (value: TagStoreState["value"]) => void;
  /**
   * A callback that gets called when the
   * [`values`](https://ariakit.org/reference/tag-provider#values) state
   * changes.
   */
  setValues?: (values: TagStoreState["values"]) => void;
}

export interface TagStoreProps extends TagStoreOptions, Core.TagStoreProps {}

export interface TagStore extends TagStoreFunctions, Store<Core.TagStore> {}
