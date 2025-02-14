import type { ElementType, FC } from "../utils/__port.ts";
import { createElement, createHook, forwardRef } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";

const TagName = "div" satisfies ElementType;
type TagName = typeof TagName;

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

type RoleElements = {
  [K in (typeof elements)[number]]: FC<RoleProps<K>>;
};

/**
 * Returns props to create a `Role` component.
 * @see https://solid.ariakit.org/components/role
 * @example
 * ```jsx
 * const props = useRole();
 * <Role {...props} />
 * ```
 */
export const useRole = createHook<TagName, RoleOptions>(
  function useRole(props) {
    return props;
  },
);

// TODO [port]: adapt docs wording to be more accurate for Solid
/**
 * Renders an abstract element that supports the `render` prop and a
 * `wrapInstance` prop that can be used to wrap the underlying component
 * instance with Solid Portal, Context or other component types.
 * @see https://solid.ariakit.org/components/role
 * @example
 * ```jsx
 * <Role render={<As.div />} />
 * ```
 */
export const Role = forwardRef(
  // @ts-expect-error
  function Role(props: RoleProps) {
    const htmlProps = useRole(props);
    return createElement(TagName, htmlProps);
  },
) as FC<RoleProps> & RoleElements;

Object.assign(
  Role,
  elements.reduce((acc, element) => {
    acc[element] = forwardRef(function Role(props: RoleProps<typeof element>) {
      return createElement(element, props);
    });
    return acc;
  }, {} as RoleElements),
);

export interface RoleOptions<_T extends ElementType = TagName>
  extends Options {}

export type RoleProps<T extends ElementType = TagName> = Props<
  T,
  RoleOptions<T>
>;
