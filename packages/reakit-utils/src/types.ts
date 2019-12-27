/** @module Types */
import * as React from "react";

/**
 * @memberof Types
 * @template T Object
 * @template K Union of T keys
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Render prop type
 * @memberof Types
 * @template P Props
 */
export type RenderProp<P = {}> = (props: P) => React.ReactElement<any>;

/**
 * "as" prop
 * @memberof Types
 * @template P Props
 */
export type As<P = any> = React.ReactType<P>;

/**
 * Converts T to its element type
 * ```ts
 * type HTMLDivElement = ElementType<"div">;
 * type FunctionalComponent = ElementType<() => null>;
 * type Never = ElementType<"foo">;
 * ```
 * @memberof Types
 * @template T Component type or string tag
 */
export type ElementType<T> = T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<
      React.HTMLAttributes<infer E>,
      infer E
    >
    ? E
    : never
  : T extends React.ComponentType<any> | React.ExoticComponent<any>
  ? T
  : never;

/**
 * @memberof Types
 * @template T Element type
 */
export type HTMLAttributesWithRef<T = any> = React.HTMLAttributes<T> &
  React.RefAttributes<T>;

/**
 * Returns only the HTML attributes inside P
 * ```ts
 * type OnlyId = ExtractHTMLAttributes<{ id: string; foo: string }>;
 * type HTMLAttributes = ExtractHTMLAttributes<any>;
 * ```
 * @memberof Types
 * @template P Props
 */
export type ExtractHTMLAttributes<P> = Pick<
  HTMLAttributesWithRef,
  Extract<keyof HTMLAttributesWithRef, keyof P>
>;

/**
 * Transforms `"a" | "b"` into `"a" & "b"`
 * @memberof Types
 * @template U Union
 */
export type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

/**
 * Same as Pick, but with value types instead of key
 * @memberof Types
 * @template T Object
 * @template V Value
 */
export type PickByValue<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? K : never }[keyof T]
>;

/**
 * Generic component props with "as" prop
 * @memberof Types
 * @template P Additional props
 * @template T React component or string element
 */
export type PropsWithAs<P, T extends As> = P &
  Omit<React.ComponentProps<T>, "as" | keyof P> & {
    as?: T;
    children?: React.ReactNode | RenderProp<ExtractHTMLAttributes<any>>;
  };

/**
 * Returns the type of the items in an array
 * @memberof Types
 * @template T Array
 */
export type ArrayValue<T> = T extends Array<infer U> ? U : never;

/**
 * Any function
 * @memberof Types
 */
export type AnyFunction = (...args: any[]) => any;
