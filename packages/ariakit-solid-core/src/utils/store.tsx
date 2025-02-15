import { hasOwnProperty, identity } from "@ariakit/core/utils/misc";
import { batch, init, subscribe, sync } from "@ariakit/core/utils/store";
import type {
  Store as CoreStore,
  State,
  StoreState,
} from "@ariakit/core/utils/store";
import type {
  AnyObject,
  PickByValue,
  SetState,
} from "@ariakit/core/utils/types";
import { type MaybeAccessor, access } from "@solid-primitives/utils";
import * as Solid from "solid-js";
import type { Accessor } from "solid-js";

export interface UseState<S> {
  /**
   * Re-renders the component when state changes and returns the current state.
   * @deprecated Use
   * [`useStoreState`](https://ariakit.org/reference/use-store-state) instead.
   * @example
   * const state = store.useState();
   */
  (): S;
  /**
   * Re-renders the component when the state changes and returns the current
   * state given the passed key. Changes on other keys will not trigger a
   * re-render.
   * @param key The state key.
   * @deprecated Use
   * [`useStoreState`](https://ariakit.org/reference/use-store-state) instead.
   * @example
   * const foo = store.useState("foo");
   */
  <K extends keyof S>(key: K): S[K];
  /**
   * Re-renders the component when the state changes given the return value of
   * the selector function. The selector should return a stable value that will
   * be compared to the previous value. Returns the value returned by the
   * selector function.
   * @param selector The selector function.
   * @deprecated Use
   * [`useStoreState`](https://ariakit.org/reference/use-store-state) instead.
   * @example
   * const foo = store.useState((state) => state.foo);
   */
  <V>(selector: (state: S) => V): V;
}

type StateStore<T = CoreStore> = T | null | undefined;
type StateKey<T = CoreStore> = keyof StoreState<T>;

const noopSubscribe = () => () => {};

/**
 * Receives an Ariakit store object (which can be `null` or `undefined`) and
 * returns the current state. If a key is provided as the second argument, it
 * returns the value of that key. If a selector function is provided, the state
 * is passed to it, and its return value is used.
 *
 * The component using this hook will re-render when the returned value changes.
 * @example
 * Accessing the whole combobox state:
 * ```js
 * const combobox = Ariakit.useComboboxStore();
 * const state = Ariakit.useStoreState(combobox);
 * ```
 * @example
 * Accessing a specific value from the combobox state:
 * ```js
 * const combobox = Ariakit.useComboboxStore();
 * const value = Ariakit.useStoreState(combobox, "value");
 * ```
 * @example
 * Accessing a value using a selector function:
 * ```js
 * const combobox = Ariakit.useComboboxStore();
 * const value = Ariakit.useStoreState(combobox, (state) => state.value);
 * ```
 * @example
 * Accessing the state of a store that may be `null` or `undefined` (for
 * example, using a context):
 * ```js
 * const combobox = Ariakit.useComboboxContext();
 * const value = Ariakit.useStoreState(combobox, "value");
 * ```
 */

export function useStoreState<T extends CoreStore>(store: T): StoreState<T>;

export function useStoreState<T extends CoreStore>(
  store: MaybeAccessor<StateStore<T>>,
): Accessor<StoreState<T> | undefined>;

export function useStoreState<T extends CoreStore, K extends StateKey<T>>(
  store: MaybeAccessor<T>,
  key: K,
): Accessor<StoreState<T>[K]>;

export function useStoreState<T extends CoreStore, K extends StateKey<T>>(
  store: MaybeAccessor<StateStore<T>>,
  key: K,
): Accessor<StoreState<T>[K] | undefined>;

export function useStoreState<T extends CoreStore, V>(
  store: MaybeAccessor<T>,
  selector: (state: StoreState<T>) => V,
): Accessor<V>;

export function useStoreState<T extends CoreStore, V>(
  store: MaybeAccessor<StateStore<T>>,
  selector: (state?: StoreState<T>) => V,
): Accessor<V>;

export function useStoreState(
  store: MaybeAccessor<StateStore>,
  keyOrSelector: StateKey | ((state?: AnyObject) => any) = identity,
) {
  const storeSubscribe = (callback: () => void) => {
    const $store = access(store);
    if (!$store) return noopSubscribe();
    return subscribe($store, null, callback);
  };

  const getSnapshot = () => {
    const key = typeof keyOrSelector === "string" ? keyOrSelector : null;
    const selector = typeof keyOrSelector === "function" ? keyOrSelector : null;
    const state = access(store)?.getState();
    if (selector) return selector(state);
    if (!state) return;
    if (!key) return;
    if (!hasOwnProperty(state, key)) return;
    return state[key];
  };
  const [state, setState] = Solid.createSignal(getSnapshot());
  Solid.onCleanup(
    storeSubscribe(() => {
      setState(getSnapshot());
    }),
  );

  return state;
}

/**
 * Synchronizes the store with the props, including parent store props.
 * @param store The store to synchronize.
 * @param props The props to synchronize with.
 * @param key The key of the value prop.
 * @param setKey The key of the setValue prop.
 */
export function useStoreProps<
  S extends State,
  P extends Partial<S>,
  K extends keyof S,
  SK extends keyof PickByValue<P, SetState<P[K]>>,
>(store: Accessor<CoreStore<S>>, props: P, key: MaybeAccessor<K>, setKey?: SK) {
  // TODO [port]: is hasOwnProperty necessary?
  const value = () => props[access(key)] ?? undefined;
  const setValue = () => (setKey ? props[setKey!] : undefined);

  // Calls setValue when the state value changes.
  Solid.createEffect(() => {
    const $store = access(store);
    const $key = access(key);
    return sync($store, [$key], (state, prev) => {
      const $value = Solid.untrack(value);
      const $setValue = Solid.untrack(setValue);
      if (!$setValue) return;
      if (state[$key] === prev[$key]) return;
      if (state[$key] === $value) return;
      $setValue(state[$key]);
    });
  });

  // TODO [port]: this might require some extra logic in Solid to listen for state
  // updates and revert them, since the original React effect just ran this on every
  // render and we can't do that in Solid.
  // If the value prop is provided, we'll always reset the store state to it.
  Solid.createEffect(() => {
    const $store = access(store);
    const $value = value();
    const $key = access(key);
    if ($value === undefined) return;
    $store.setState($key, $value);
    return batch($store, [$key], () => {
      if ($value === undefined) return;
      $store.setState($key, $value);
    });
  });
}

/**
 * Creates a React store from a core store object and returns a tuple with the
 * store and a function to update the store.
 * @param createStore A function that receives the props and returns a core
 * store object.
 * @param props The props to pass to the createStore function.
 */
export function useStore<T extends CoreStore, P>(
  createStore: (props: P) => T,
  props: P,
) {
  const [store, setStore] = Solid.createSignal(createStore(props));

  Solid.createEffect(() => Solid.onCleanup(init(store())));

  const useState = ((keyOrSelector: any) =>
    useStoreState(store(), keyOrSelector)) as UseState<StoreState<T>>;

  const memoizedStore = Solid.createMemo(() => ({ ...store(), useState }));

  const updateStore = () =>
    Solid.untrack(() => {
      setStore((store) => createStore({ ...props, ...store.getState() }));
    });

  return [memoizedStore, updateStore] as const;
}

export type Store<T extends CoreStore = CoreStore> = T & {
  /**
   * Re-renders the component when the state changes and returns the current
   * state.
   * @deprecated Use
   * [`useStoreState`](https://ariakit.org/reference/use-store-state) instead.
   */
  useState: UseState<StoreState<T>>;
};
