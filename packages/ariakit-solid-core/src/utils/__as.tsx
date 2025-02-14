import {
  type Component,
  type ComponentProps,
  type JSX,
  type ValidComponent,
  splitProps,
} from "solid-js";

const $AS = Symbol("ariakit-as");
// TODO [port]: why does using this change behavior? black magic wtffff
// try role-unit with and without using it below O.o
function as(fn: any) {
  fn[$AS] = true;
  return fn;
}
type AsSpec = {
  component: ValidComponent;
  props: unknown;
};
export function extractAs(maybeAs?: any): AsSpec | undefined {
  if (maybeAs && !maybeAs[$AS]) return;
  return typeof maybeAs === "function" ? maybeAs() : maybeAs;
}

// TODO: DRY with role
const elements = [
  "a",
  "button",
  "details",
  "dialog",
  "div",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "section",
  "select",
  "span",
  "summary",
  "textarea",
  "ul",
  "svg",
] as const;

type AsComponent = <T extends ValidComponent, P = ComponentProps<T>>(
  props: AsProps<T, P>,
) => JSX.Element;

type AsElements = {
  [K in (typeof elements)[number]]: Component<ComponentProps<K>>;
};

/**
 * Allows a component to be rendered as a different HTML element or Solid
 * component. Must be passed to the `render` prop of a component that
 * supports it.
 *
 * To render as an HTML element, use `<As.element />` (e.g. `<As.button />`).
 *
 * To render as a component, use `<As component={Component} />` (e.g. `<As
 * component={MyButton} />`).
 *
 * Check out the [Composition](https://solid.ariakit.org/guide/composition)
 * guide for more details.
 * @example
 * ```jsx
 * <Role render={<As component={MyButton} variant="primary" />} />
 * <Role render={<As.button type="button" />} />
 * ```
 */
export const As = as(function As(props: any) {
  // TODO [port]: potentially more efficient with "omit" (Solid 2.0?)
  const [, rest] = splitProps(props, ["component"]);
  return {
    [$AS]: true,
    get component() {
      return props.component;
    },
    props: rest,
  } as unknown as JSX.Element;
}) as AsComponent & AsElements;

Object.assign(
  As,
  elements.reduce((acc, element) => {
    acc[element] = as(function As(props: ComponentProps<typeof element>) {
      return {
        [$AS]: true,
        component: element,
        props,
      } as unknown as JSX.Element;
    });
    return acc;
  }, {} as AsElements),
);

export type AsProps<T extends ValidComponent, P = ComponentProps<T>> = {
  [K in keyof P]: P[K];
} & { component: T };
