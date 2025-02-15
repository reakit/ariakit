import type { AnyFunction, AnyObject } from "@ariakit/core/utils/types";
import {
  type Component,
  type JSX,
  type Setter,
  type ValidComponent,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

// noop
// ----

/**
 * Creates a signal used purely to trigger updates.
 */
export function useForceUpdate() {
  const [value, setValue] = createSignal([]);
  return [value, () => setValue([])] as const;
}

/**
 * **Ariakit Solid stub.**
 *
 * In React, it creates a stable callback function. Unnecessary in Solid.
 */
export function useEvent<T extends AnyFunction>(callback: T) {
  return callback;
}

/**
 * **Ariakit Solid stub.**
 *
 * Originally, it removes undefined values from an object. Unnecessary in Solid.
 */
export function removeUndefinedValues<T extends AnyObject>(obj: T) {
  return obj;
}

// react -> solid stubs
// --------------------

export type ElementType = ValidComponent;
export type SetState<T> = Setter<T>;
export type ReactNode = JSX.Element;
// biome-ignore lint/complexity/noBannedTypes: it's the original default.
export type FC<P extends Record<string, any> = {}> = Component<P>;

export const useEffect = (fn: () => void | (() => void), _deps: any) =>
  createEffect(() => {
    const cleanupFn = fn();
    if (cleanupFn) onCleanup(cleanupFn);
  });
export const useState = createSignal;
export const useMemo = createMemo;

// "react" reimplementations
// -------------------------

/**
 * A readonly ref container where `current` cannot be mutated.
 *
 * Created by `createRef` when passed `null`.
 *
 * To bind to a JSX element, pass `ref.bind` to the `ref` prop.
 *
 * @template T The type of the ref's value.
 *
 * @example
 *
 * ```tsx
 * const ref = createRef<HTMLDivElement>(null);
 *
 * ref.current = document.createElement('div'); // Error
 *
 * <div ref={ref.bind} />;
 * ```
 */
export type RefObject<T> = {
  /**
   * The current value of the ref. Non-reactive.
   */
  readonly current: T | null;
  /**
   * A setter function that can be passed to the `ref` prop of a JSX element.
   *
   * **Do not use this setter directly.**
   *
   * @example
   * ```jsx
   * const ref = createRef(null);
   * <button ref={ref.bind} />
   * ```
   */
  bind: (value: unknown) => void;
};

/**
 * A ref container. Created by `createRef`.
 *
 * Cannot be bound to a JSX element.
 *
 * @template T The type of the ref's value.
 *
 * @example
 *
 * ```tsx
 * const ref = createRef<HTMLDivElement>();
 *
 * ref.current = document.createElement('div');
 * ```
 */
type MutableRefObject<T> = {
  /**
   * The current value of the ref. Non-reactive.
   */
  current: T;
};

/**
 * `createRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
 * (`initialValue`). The returned object will persist for the full lifetime of the component.
 *
 * Note that `createRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
 * value around.
 *
 * To bind to a JSX element, pass `ref.set` to the `ref` prop.
 *
 * @example
 * ```jsx
 * const ref = createRef();
 * createEffect(() => {
 *   console.log(ref.value);
 * });
 * <button ref={ref.set}>Button</button>
 * ```
 */
export function useRef<T>(initialValue: T): MutableRefObject<T>;
/**
 * `createRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
 * (`initialValue`). The returned object will persist for the full lifetime of the component.
 *
 * Note that `createRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
 * value around.
 *
 * To bind to a JSX element, pass `ref.set` to the `ref` prop.
 *
 * Usage note: if you need the result of createRef to be directly mutable, include `| null` in the type
 * of the generic argument.
 *
 * @example
 * ```jsx
 * const ref = createRef();
 * createEffect(() => {
 *   console.log(ref.value);
 * });
 * <button ref={ref.set}>Button</button>
 * ```
 */
export function useRef<T>(initialValue: T | null): RefObject<T>;
/**
 * `createRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
 * (`initialValue`). The returned object will persist for the full lifetime of the component.
 *
 * Note that `createRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
 * value around.
 *
 * To bind to a JSX element, pass `ref.set` to the `ref` prop.
 *
 * @example
 * ```jsx
 * const ref = createRef();
 * createEffect(() => {
 *   console.log(ref.value);
 * });
 * <button ref={ref.set}>Button</button>
 * ```
 */
export function useRef<T = undefined>(
  initialValue?: undefined,
): MutableRefObject<T | undefined>;
export function useRef<T>(
  initialValue?: any,
): RefObject<T> | MutableRefObject<T> {
  let value = initialValue;
  return {
    get current() {
      return value;
    },
    set current(newValue) {
      value = newValue;
    },
    bind(newValue) {
      value = newValue;
    },
  };
}

// to reorganize
// -------------

/**
 * A hook that passes metadata props around without leaking them to the DOM.
 */
export function useMetadataProps<T, K extends keyof any>(
  props: { _metadataProps?: AnyFunction & { [key in K]?: T } },
  key: K,
  value: T,
) {
  const parent = () => props._metadataProps;
  const $_metadataProps = createMemo(() => {
    return Object.assign(() => {}, { ...parent(), [key]: value });
  });

  return [() => parent()?.[key], () => ({ $_metadataProps })] as const;
}
