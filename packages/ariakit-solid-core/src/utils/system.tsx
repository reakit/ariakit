import type { AnyObject, EmptyObject } from "@ariakit/core/utils/types";
import { combineProps } from "@solid-primitives/props";
import * as Solid from "solid-js";
import { SVGElements, getNextElement, spread } from "solid-js/web";
import { extractAs } from "./__as.tsx";
import { type PropsSink, isPropsProxy, withPropsSink } from "./__props.ts";
import type { Store } from "./store.tsx";
import type { HTMLProps, Hook, Options, Props } from "./types.ts";

/**
 * **This is an Ariakit Solid stub.** Original docs below.
 *
 * The same as `React.forwardRef` but passes the `ref` as a prop and returns a
 * component with the same generic type.
 */
export function forwardRef<T extends Solid.Component<any>>(component: T) {
  return component;
}

/**
 * Creates a Solid component instance that supports the `render` and
 * `wrapInstance` props.
 */
export function createElement(
  Component: Solid.ValidComponent,
  props: Props<Solid.ValidComponent, Options>,
) {
  let tree = () => {
    const resolvedComponent = () =>
      (extractAs(props.render)?.component ??
        props.render ??
        Component) as Solid.ValidComponent;

    const resolvedProps = () => {
      const asProps = extractAs(props.render)?.props;
      const propsEmpty =
        !isPropsProxy(props) && Object.keys(props).length === 0;
      // This is necessary in nested renders, e.g.
      // <Component
      //   render={<As
      //     component={Role.div}
      //     render={...}
      //   />}
      // />
      const propsWithoutRender =
        "render" in props ? Solid.splitProps(props, ["render"])[1] : props;
      return (
        !propsEmpty && asProps
          ? // TODO: look into potential combineProps optimizations when none are proxies, etc
            combineProps([propsWithoutRender, asProps], {
              reverseEventHandlers: true,
            })
          : (asProps ?? props)
      ) as any;
    };

    return createDynamic(resolvedComponent, resolvedProps);
  };
  // TODO: should this be reactive?
  if (props.wrapInstance) {
    for (const wrapper of props.wrapInstance) {
      const children = tree;
      tree = () =>
        Solid.createComponent(wrapper as Solid.Component, {
          get children() {
            return children();
          },
        });
    }
  }
  return tree();
}

/**
 * **This is an Ariakit Solid stub.** Original docs below.
 *
 * Creates a component hook that accepts props and returns props so they can be
 * passed to a React element.
 */
export function createHook<
  T extends Solid.ValidComponent,
  P extends AnyObject = EmptyObject,
>(useProps: (props: PropsSink<Props<T, P>>) => HTMLProps<T, P>) {
  const useRole = (props: Props<T, P>) => withPropsSink(props, useProps);
  return useRole as Hook<T, P>;
}

type StoreProvider<T extends Store> = Solid.Component<{
  value: Solid.Accessor<T | undefined>;
  children?: Solid.JSX.Element;
}>;

type RenderFn = () => Solid.JSX.Element;

/**
 * Creates an Ariakit store context with hooks and provider components.
 */
export function createStoreContext<T extends Store>(
  providers: StoreProvider<T>[] = [],
  scopedProviders: StoreProvider<T>[] = [],
) {
  const context = Solid.createContext<Solid.Accessor<T | undefined>>(
    () => undefined,
  );
  const scopedContext = Solid.createContext<Solid.Accessor<T | undefined>>(
    () => undefined,
  );

  const useContext = () => Solid.useContext(context);

  const useScopedContext = (onlyScoped = false) => {
    const scoped = Solid.useContext(scopedContext);
    const store = useContext();
    if (onlyScoped) return scoped;
    return scoped || store;
  };

  const useProviderContext = () => {
    const scoped = Solid.useContext(scopedContext);
    const store = useContext();
    if (scoped && scoped === store) return;
    return store;
  };

  const ContextProvider = (
    props: Solid.ComponentProps<typeof context.Provider>,
  ) => {
    return providers.reduceRight<RenderFn>(
      (children, Provider) => () => (
        <Provider {...props}>{children()}</Provider>
      ),
      () => <context.Provider {...props} />,
    )();
  };

  const ScopedContextProvider = (
    props: Solid.ComponentProps<typeof scopedContext.Provider>,
  ) => {
    return (
      <ContextProvider {...props}>
        {scopedProviders.reduceRight<RenderFn>(
          (children, Provider) => () => (
            <Provider {...props}>{children()}</Provider>
          ),
          () => <scopedContext.Provider {...props} />,
        )()}
      </ContextProvider>
    );
  };

  return {
    context,
    scopedContext,
    useContext,
    useScopedContext,
    useProviderContext,
    ContextProvider,
    ScopedContextProvider,
  };
}

// create dynamic
// --------------

// Temporary hack until this lands: https://github.com/solidjs/solid/pull/2422

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function _createElement(
  tagName: string,
  isSVG = false,
): HTMLElement | SVGElement {
  return isSVG
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName);
}
export function createDynamic<T extends Solid.ValidComponent>(
  component: () => T,
  props: Solid.ComponentProps<T> | Solid.Accessor<Solid.ComponentProps<T>>,
): Solid.JSX.Element {
  // biome-ignore lint/complexity/noBannedTypes: hack
  const cached = Solid.createMemo<Function | string>(component);
  const resolvedProps =
    typeof props === "function" ? Solid.mergeProps(props) : props;
  return Solid.createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case "function":
        return Solid.untrack(() => component(resolvedProps));

      case "string": {
        const isSvg = SVGElements.has(component);
        const el = Solid.sharedConfig.context
          ? getNextElement()
          : _createElement(component, isSvg);
        spread(el, resolvedProps, isSvg);
        return el;
      }

      default:
        break;
    }
  }) as unknown as Solid.JSX.Element;
}
