import { hasOwnProperty } from "@ariakit/core/utils/misc";
import type { AnyObject } from "@ariakit/core/utils/types";
import { $PROXY, type JSX } from "solid-js";

const SKIP_KEYS = [
  // See `useMetadataProps`
  "_metadataProps",
  // See `createElement`
  "render",
  "wrapInstance",
];

export function isPropsProxy(props: unknown) {
  return Boolean(props && $PROXY in (props as object));
}

// prop traps
// ----------

// Copied from solid repo - src/render/component.ts

function trueFn() {
  return true;
}

const propTraps: ProxyHandler<{
  get: (k: string | number | symbol) => any;
  has: (k: string | number | symbol) => boolean;
  keys: () => string[];
}> = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn,
    };
  },
  ownKeys(_) {
    return _.keys();
  },
};

// props sink
// ----------

type PropsObject = Record<string | number | symbol, unknown>;
type Sources = Array<PropsObject>;
type SinkState = {
  isProxy: boolean;
  sources: Sources;
  optionSources: Sources;
  skipKeys: Set<string>;
  sink: unknown;
  offset: number;
};

let state: SinkState | undefined;
const stateMap = new WeakMap<any, SinkState>();

function getSinkState(sinkFallback?: unknown) {
  const sinkState = state ?? stateMap.get(sinkFallback);
  if (!sinkState) throw new Error("Missing props sink state");
  return sinkState;
}

function ensureSource(source?: PropsObject) {
  if (!source) throw new Error("Missing props source");
  return source;
}

function resolveSource(
  { sources, optionSources }: Pick<SinkState, "sources" | "optionSources">,
  i: number,
) {
  return i < sources.length ? sources[i] : optionSources[i - sources.length];
}

function resolvePropValue(
  { sources, optionSources }: Pick<SinkState, "sources" | "optionSources">,
  property: string | number | symbol,
  {
    from = 0,
    to = sources.length + optionSources.length,
  }: { from?: number; to?: number } = {},
) {
  for (let i = from; i < to; i++) {
    const source = resolveSource({ sources, optionSources }, i);
    const v = ensureSource(source)[property];
    const isProxy = isPropsProxy(source);
    const hasProperty = !isProxy && source && hasOwnProperty(source, property);
    // TODO [port]: is `removeUndefinedValues` something to account for?
    if (hasProperty || v !== undefined) return v;
  }
  return undefined;
}

function createAccessor<V = unknown>(property: string) {
  const frozenState = getSinkState();
  const frozenN = frozenState.sources.length;
  const frozenOffset = frozenState.offset;
  return () =>
    resolvePropValue(frozenState, property, {
      from: frozenState.offset - frozenOffset,
      to: frozenN + frozenState.offset - frozenOffset,
    }) as V;
}

function createPropsSink<T>(props: T) {
  // TODO: do something different (more optimal) if props is not a proxy
  // biome-ignore lint/style/useConst: <explanation>
  let localState: SinkState;
  const isProxy = isPropsProxy(props);
  const sources: Array<PropsObject> = [props as PropsObject];
  const optionSources: Array<PropsObject> = [];
  const skipKeys = new Set<string>(SKIP_KEYS);
  const sink = new Proxy(
    {
      get(property: string | number | symbol) {
        if (typeof property === "string" && property.startsWith("$"))
          return createAccessor(property.substring(1));
        return resolvePropValue({ sources, optionSources }, property);
      },
      has(property: string | number | symbol) {
        for (let i = 0; i < sources.length; i++) {
          if (property in ensureSource(sources[i])) return true;
        }
        return false;
      },
      keys() {
        const keys = new Set<string>();
        for (let i = 0; i < sources.length; i++)
          for (const key of Object.keys(ensureSource(sources[i])))
            if (!skipKeys.has(key)) keys.add(key);
        return [...new Set(keys)];
      },
    },
    propTraps,
  ) as T;
  localState = {
    isProxy,
    sources,
    optionSources,
    skipKeys,
    sink,
    offset: 0,
  };
  state = localState;
  stateMap.set(sink, localState);
  return sink;
}

function cleanPropsSink() {
  state = undefined;
}

export function withPropsSink<T>(props: unknown, fn: (sink: any) => T) {
  if (state) return fn(state.sink);
  const sink = createPropsSink(props);
  try {
    return fn(sink);
  } finally {
    cleanPropsSink();
    // TODO: re-throw error?
  }
}

// props chain
// -----------

function expandGetterShorthands<T extends JSX.HTMLAttributes<any>>(
  props: T,
  withPropPassthrough = false,
) {
  for (const key in props) {
    if (key.startsWith("$")) {
      let get: () => unknown;
      const property = key.substring(1);
      if (withPropPassthrough) {
        const inputGetter = props[key] as (props: unknown) => unknown;
        const frozenAccessor = createAccessor(key.substring(1));
        const stubProps = {};
        Object.defineProperty(stubProps, property, {
          get: frozenAccessor,
          enumerable: true,
          configurable: true,
        });
        get = () => inputGetter(stubProps);
      } else {
        get = props[key] as () => unknown;
      }
      delete props[key];
      Object.defineProperty(props, property, {
        get,
        enumerable: true,
        configurable: true,
      });
    }
  }
}

export type PropsSink<T> = T & {
  [K in keyof T as K extends string ? `$${K}` : never]-?: () => T[K];
};
export type UnwrapPropSinkProps<T> = {
  [K in keyof T as K extends `$${infer _}` ? never : K]: T[K];
};

type WithGetterShorthands<T, P = UnwrapPropSinkProps<T>> = P & {
  [K in keyof P as K extends string ? `$${K}` : never]?: () => P[K];
};
type WithGetterShorthandsWithPassthrough<T, P = UnwrapPropSinkProps<T>> = P & {
  [K in keyof P as K extends string ? `$${K}` : never]?: (
    props: Record<K, P[K]>,
  ) => P[K];
};

// TODO: idea - overload the sink itself with this function so we can do `$props()`
/**
 * TODO: document
 */
export function $<P extends JSX.HTMLAttributes<any>>(
  _originalProps: P,
  props?: NoInfer<WithGetterShorthands<P>>,
) {
  const sinkState = getSinkState(_originalProps);
  if (props) {
    expandGetterShorthands(props);
    sinkState.sources.push(props as PropsObject);
  }
  return (overrides: WithGetterShorthandsWithPassthrough<P>) => {
    expandGetterShorthands(overrides, true);
    sinkState.sources.unshift(overrides as PropsObject);
    sinkState.offset++;
  };
}

type NullablyRequired<T> = { [P in keyof T & keyof any]: T[P] };
export type ExtractOptionsOptions<
  P,
  O extends Partial<R>,
  R = NullablyRequired<UnwrapPropSinkProps<P>>,
> = {
  -readonly [K in keyof R as Extract<K, keyof O>]: O[K] extends undefined
    ? R[K]
    : Exclude<R[K], undefined>;
};
export type ExtractOptionsProps<
  P,
  O extends Partial<UnwrapPropSinkProps<P>>,
> = Omit<P, keyof O>;
export type ExtractOptionsReturn<
  P,
  O extends Partial<UnwrapPropSinkProps<P>>,
> = [options: ExtractOptionsOptions<P, O>, props: ExtractOptionsProps<P, O>];

/**
 * Extracts options from a props object and applies defaults to them. The
 * return value is a tuple with the extracted options and the rest of the props.
 *
 * To extract an option without setting a default, set it to `undefined`.
 * @example
 * function useMyComponent(__) {
 *   const [_, props] = $o(__, { orientation: "horizontal" });
 *   createEffect(() => {
 *     console.log(_.orientation);
 *   });
 *   // ...
 * }
 */
export function $o<
  P extends AnyObject,
  const O extends Partial<UnwrapPropSinkProps<P>>,
>(_props: P, options: O): ExtractOptionsReturn<P, O> {
  const { optionSources, skipKeys, sink } = getSinkState(_props);
  optionSources.push(options as PropsObject);
  for (const key of Object.keys(options)) skipKeys.add(key);
  return [sink, sink] as unknown as ExtractOptionsReturn<P, O>;
}
