# Contributing

Thanks for your interest in contributing! All work is coordinated through the following channels:

* The `#ariakit` channel in [the Solid Discord server](https://discord.gg/solidjs).
* [The main tracking issue](https://github.com/ariakit/ariakit/issues/4117).
* [Ariakit Solid: how to help and general discussion](https://github.com/ariakit/ariakit/discussions/4322).

**Table of contents**

<!-- vscode-markdown-toc -->
- [Contributing](#contributing)
  - [Basic tutorial](#basic-tutorial)
    - [Setting up the component directory](#setting-up-the-component-directory)
    - [Making the component public](#making-the-component-public)
    - [Diff editing view](#diff-editing-view)
    - [Solid-ifying the code](#solid-ifying-the-code)
    - [Using the playground](#using-the-playground)
    - [Examples and tests](#examples-and-tests)
  - [Port principles](#port-principles)
    - [Keep the diff minimal](#keep-the-diff-minimal)
    - [Document everything](#document-everything)
  - [Port reference](#port-reference)
    - [Terminology](#terminology)
    - [System utilities](#system-utilities)
    - [TypeScript types](#typescript-types)
    - [Prop "destructuring" and default values](#prop-destructuring-and-default-values)
    - [Prop chaining](#prop-chaining)
    - [State/signals](#statesignals)
    - [Effects](#effects)
    - [Refs](#refs)
    - [Context](#context)
    - [JSDoc links](#jsdoc-links)
    - [`useWrapElement`](#usewrapelement)
  - [Special patterns and quirks](#special-patterns-and-quirks)
    - [JSX branches and early returns](#jsx-branches-and-early-returns)
    - [Stable accessors](#stable-accessors)
    - [Reactive hoisting](#reactive-hoisting)
    - [Miscellaneous quirks](#miscellaneous-quirks)
  - [Useful tips](#useful-tips)
    - [`akdiff` - a terminal utility that opens a component port diff](#akdiff---a-terminal-utility-that-opens-a-component-port-diff)
      - [Fish](#fish)
      - [Bash/Zsh/Sh](#bashzshsh)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

> **IMPORTANT NOTE**
>
> We're still figuring out the basics. We highly encourage you to get in touch through one of the channels mentioned above before jumping into any work.
>
> Thanks for your understanding!

## <a name='Basictutorial'></a>Basic tutorial

To get started, go through the [main contributing guide](../../contributing.md). This will ensure that your development environment is set up correctly, and will also walk you through the basics of Ariakit React, which is necessary to understand the Solid port.

Once you're done, continue with the following steps.

### <a name='Settingupthecomponentdirectory'></a>Setting up the component directory

First, take a look at the component's source in the `ariakit-react-core` package. This is the original React code we're going to port.

The same file structure should be created in the `ariakit-solid-core` package. We'll copy the original React code into the Solid port, as a starting point.

For example, if we plan on porting the `Button` component, we'll copy the `packages/ariakit-react-core/src/button` directory into `packages/ariakit-solid-core/src/button`.

This will include the `src/button/button.tsx` file, where `Button` is implemented. In this case, that is the only file in the directory, but other directories may contain more files.

Of course, this code is not ready to be used in Solid. We'll get to that in a bit.

### <a name='Makingthecomponentpublic'></a>Making the component public

The core packages are private and internal, end users do not use them directly. Instead, they import components from the `ariakit-solid` and `ariakit-react` packages, which re-export them from the core packages for public consumption.

Like in the previous step, we can copy the original directory from `ariakit-react` into `ariakit-solid`. In our example, we'll copy the `packages/ariakit-react/src/button` directory into `packages/ariakit-solid/src/button`.

Most of the time, due to the simplicity of the "re-exporting" code, it won't be necessary to tweak it: it will just work in Solid!

### <a name='Diffeditingview'></a>Diff editing view

While optional, it is a very good idea to work on a component port with the help of a diff editing view that simultaneously shows the equivalent React and Solid files, and highlights the differences. Most popular code editors support diffing two arbitrary files in this manner.

It is strongly recommended to use our `akdiff` terminal utility to speed up the process: it opens the diff for a given component in your editor with a simple command. It even supports autocomplete if you're a fish shell user! See the [`akdiff`](#akdiff---a-terminal-utility-that-opens-a-component-port-diff) section to set it up.

One of [the guiding principles](#port-principles) of this port is to keep differences between the React and Solid codebases as minimal as possible. The diff view helps a ton with this.

> **Tip!**
>
> A small annoyance that can come up with this approach is that, because of minor differences between the two codebases, the indentation of some parts (after automatic code formatting) may not be the same, causing a lot of extra noise in the diff view.
>
> The simplest way to remedy this is to temporarily tweak the indentation of the relevant fragments manually in the React code (for example, the body of a hook or component function) to match the Solid code. Just remember not to commit the changes!

### <a name='Solid-ifyingthecode'></a>Solid-ifying the code

> _Pun intended._

Now we're ready to start transforming the React code into Solid code. In general, porting requires a good understanding of both React and Solid.

At first, the task might seem daunting. A good way to get familiarized with the process is to look at other, preferably simpler components in a diff view. Some examples of this are `Separator` and `VisuallyHidden`.

For the most part, the process of porting is highly systematic. The [port reference](#port-reference) section provides a straightforward guide to transform most patterns. There are some trickier situations where deeper changes are required due to more fundamental differences between React and Solid. Some are even be hard to spot, which can lead to incorrect or buggy code. Make sure to consult the [special patterns and quirks](#special-patterns-and-quirks) section for more information.

Lastly, make sure to follow [the guiding principles](#port-principles), they are very important!

### <a name='Usingtheplayground'></a>Using the playground

Unfortunately, we've not yet figured out how to make examples and tests work with the Solid port. For that reason, in the meantime, we've set up a [playground](../ariakit-solid-playground/README.md) where you can import your component and perform some basic, manual testing.

Check [the playground readme](../ariakit-solid-playground/README.md) to learn more.

### <a name='Examplesandtests'></a>Examples and tests

As mentioned above, we're still figuring out how to make examples and tests work with the Solid port.

If you'd like to help in this area, please participate in [this issue](https://github.com/ariakit/ariakit/issues/1854) before going further.

## <a name='Portprinciples'></a>Port principles

This port has a very important goal: to make a Solid version of Ariakit that is **as close as possible** to the original React implementation in terms of API and behavior.

In practice, this means that we only ever want to deviate from the original logic (as in each of the original lines of code) when it is ABSOLUTELY necessary to do so.

While this goal does create some challenges (as opposed to, for example, a looser approach where differences can be introduced more liberally, like re-implementing some parts to better fit the Solid paradigm), there are many upsides to it, including:

* It allows us to leverage Ariakit's full history of research, development, testing, and bug fixing.
* It reduces duplication of logic. Ariakit components can be quite complex. Two different implementations means twice the chance for bugs and twice the effort to implement new features.
* It simplifies the maintenance of the port. Syncing updates and bug fixes from React to Solid is much easier.

To make sure we fulfill this goal, we have established the following principles that contributors to the port must follow:

### <a name='Keepthediffminimal'></a>Keep the diff minimal

The diff view is essential to creating and maintaining the port. Keeping this view useful is a top priority.

This means that, in some cases, we'll sacrifice "better code" (e.g. a better way to implement something in a way that's idiomatic to Solid) in favor of a more minimal diff.

In the big picture, this project is massive. Minimizing diff noise will quickly compound in developer hours, which are a valuable resource since we're all volunteers.

### <a name='Documenteverything'></a>Document everything

This contributing guide is essential to save time (and headaches) as we make progress. It is also a valuable resource when performing maintenance, like syncing with the React packages.

If you spot a new pattern, or an addition to an existing one, make sure to document it here. Similarly, document any "special patterns", quirks, or any context that might be useful to fellow contributors.

Additionally, as a convention, we add code comments that start with `[port]:` wherever anything is not self-evident, like when we are forced to deviate from the original logic or pattern.

For example:

```diff
-role: "group",
+// [port]: Solid type for `role` is more strict, hence the `as const`.
+role: "group" as const,
```

## <a name='Portreference'></a>Port reference

### <a name='Terminology'></a>Terminology

Due to differences between React and Solid, there are some differences in terminology used between both Ariakit flavors.

|              React              |  Solid   |
| :-----------------------------: | :------: |
| Element (as in "React element") | Instance |

<details>
<summary>Explanation</summary>

* Elements/instances

  React has a virtual DOM, which implies the concept of "React elements" (elements in the React tree, **not in the DOM tree**). A React element can be roughly thought of as something that exists "between React components and the DOM". Since Solid has no virtual DOM, "Solid elements" don't exist.

  However, Ariakit's architecture contains some details that reference React elements, and still make sense in the Solid port (`createElement`, `wrapElement`, etc.).

  While Solid doesn't have a concept of "element" in this sense, Ariakit Solid uses the term "instance" in place of "element" when referring to analogous architectural concepts.

</details>

### <a name='Systemutilities'></a>System utilities

"System" utilities are foundational utilities that are used to create components and hooks, among other things. Ariakit Solid has, for the most part, analogous utilities to the React ones.

|       React utility        |            Solid utility             |
| :------------------------: | :----------------------------------: |
| `createHook<T, Options>()` |           **✅ no change**           |
|     `wrapElement` prop     |         `wrapInstance` prop          |
|     `useWrapElement()`     | `wrapInstance()` (see section below) |
|     `createElement()`      |          `createInstance()`          |

### <a name='TypeScripttypes'></a>TypeScript types

These replacements make sense most of the time. There might be cases where a different type is more appropriate.

|     React     |      Solid       |
| :-----------: | :--------------: |
| `ElementType` | `ValidComponent` |
|  `ReactNode`  |  `JSX.Element`   |
|     `FC`      |   `Component`    |

### <a name='Propdestructuringanddefaultvalues'></a>Prop "destructuring" and default values

Solid doesn't support prop destructuring, so the usual React pattern to separate props (for spreading/chaining the rest) and setting defaults doesn't work.

Ariakit React uses this pattern to separate "options" (custom to a specific hook/component) from "props" (HTML attributes). In Ariakit Solid, use the `withOptions` internal utility instead:

```diff
export const useMyComponent = createHook<TagName, MyComponentOptions>(
-  function useMyComponent({ enabled = false, ...props }) {
+  withOptions({ enabled: false }, function useMyComponent(props, options) {
```

Then, use the `options` props object:

```diff
-console.log(enabled);
+console.log(options.enabled);
```

To simply "destructure" without setting a default value, pass `undefined`:

```diff
-function useMyComponent({ enabled, ...props }) {
+withOptions({ enabled: undefined }, function useMyComponent(props, options) {
```

### <a name='Propchaining'></a>Prop chaining

Ariakit makes heavy use of the "prop chaining" pattern. Some examples:

```jsx
function useMyComponent(props) {
  // set props
  props = { type: "button", ...props };
  // set a ref (merged)
  props = { ...props, ref: useMergeRefs(myRef, props.ref) };
  // set some styles (merged)
  props = {
    ...props,
    style: { position: "fixed", ...props.style },
  };
  // inherit props from a different hook
  props = useVisuallyHidden(props);
}
```

In Ariakit Solid, the internal `mergeProps` utility (not to be confused with [the built-in utility](https://docs.solidjs.com/reference/reactive-utilities/merge-props#mergeprops)) must be used.

This utility also has the advantage of automatically handling merging of props (refs, styles, etc.). This utility can be omitted when inheriting props from a different hook, since the chaining is already handled by that hook.

The example above could be ported as:

```jsx
function useMyComponent(props) {
  // set props
  props = mergeProps({ type: "button" }, props);
  // set a ref (merged)
  props = mergeProps({ ref: myRef.bind }, props);
  // set some styles (merged)
  props = mergeProps({ style: { position: "fixed" } }, props);
  // inherit props from a different hook
  props = useVisuallyHidden(props);
}
```

**Very important note**: to preserve reactivity, any props that depend on reactive values must be declared with a getter function. For example, if the original React code looks like this:

```jsx
const [value, setValue] = useState(initialValue);
props = {
  exampleProp1: value,
  exampleProp2: props.differentProp,
  ...props,
};
```

Then the Solid port could look like this:

```jsx
const [value, setValue] = createSignal(initialValue);
props = mergeProps({
  get exampleProp1() {
    return value();
  },
  get exampleProp2() {
    return props.differentProp;
  },
  ...props,
});
```

However, declaring getters can be a bit cumbersome (and mess with the port diff), so there's a special behavior in `mergeProps` that automatically creates these getters for props that follow a specific name pattern (starting with `$`). For example:

```jsx
props = mergeProps({
  $exampleProp1: () => value(),
  // or, when possible:
  $exampleProp1: value,
  $exampleProp2: () => props.differentProp,
});
```

Getters are not necessary for static props.

### <a name='Statesignals'></a>State/signals

|              React               |                  Solid                   |
| :------------------------------: | :--------------------------------------: |
| `const [value, setValue] = ...`  |             **✅ no change**             |
|     `useState(initialValue)`     |       `createSignal(initialValue)`       |
|       `setValue(newValue)`       |             **✅ no change**             |
|       `console.log(value)`       |          `console.log(value())`          |
| `const derivedValue = value + 1` | `const derivedValue = () => value() + 1` |

<details>
<summary>Explanation</summary>

The `createSignal` function from Solid is analogous to the `useState` hook in React: it holds a value that is "stateful" (or "reactive" in Solid terminology).

Updating the value works as in React:

```jsx
const [value, setValue] = createSignal(initialValue);
setValue(newValue);
```

However, accessing the value is a different story in Solid. For starters, `value` is not the value itself (as in React), but a getter function that returns the value. The port must do a good job to preserve similar reactivity properties as in the original React code (e.g. through derived getters).

Porting code that involves signals requires good understanding of Solid's reactivity system. This reference won't go into details about signals or reactivity, but you can learn more in the [Solid docs](https://docs.solidjs.com/).

</details>

### <a name='Effects'></a>Effects

TODO: document effects.

### <a name='Refs'></a>Refs

|            React            |            Solid            |
| :-------------------------: | :-------------------------: |
| `useRef<HTMLElement>(null)` | `createRef<HTMLElement>(null)`  |
|   `useRef(initialValue)`    |  `createRef(initialValue)`  |
| `console.log(ref.current)`  |      **✅ no change**       |
|  `ref.current = newValue`   |      **✅ no change**       |
|   `<button ref={ref} />`    | `<button ref={ref.bind} />` |

<details>
<summary>Explanation</summary>

The `createRef` utility (internal to Ariakit Solid) is analogous to the `useRef` hook in React: it creates a "ref object" that holds a value. Usually (but not always) it is an HTML element bound through the `ref` prop.

Reading and updating the value works as in React:

```jsx
const ref = createRef();
console.log(ref.current); // access the value
ref.current = newValue; // update the value
```

Another similarity is that an initial value can be passed to the `createRef` function:

```jsx
const ref = createRef(initialValue);
```

However, there is an important difference. The ref can't be passed to the `ref` prop of a JSX element directly. Instead, you need to use `ref.bind`.

```tsx
// React - the ref is passed directly:
<button ref={ref} />
// Solid - you must pass `ref.bind` instead:
<button ref={ref.bind} />
```

</details>

### <a name='Context'></a>Context

TODO: document context.

### <a name='JSDoclinks'></a>JSDoc links

For now, add the `solid` subdomain to any links in JSDoc comments (rewrite `ariakit.org` into `solid.ariakit.org`).

The referenced URLs don't actually exist yet, but this will make it easier when the documentation is built.

<details>
<summary>Example</summary>

```ts
// In Ariakit React:

/**
 * Renders an accessible button element.
 * @see https://ariakit.org/components/button
 */
export const Button = /* ... */

// In Ariakit Solid:

/**
 * Renders an accessible button element.
 * @see https://solid.ariakit.org/components/button
 */
export const Button = /* ... */
```

</details>

### <a name='useWrapElement'></a>`useWrapElement`

Use `wrapInstance` instead. The second argument is not a "render function" since Solid doesn't re-render. Instead, it's a function component.

For this reason, instead of receiving the element being wrapped as the first argument, it receives props which _contain_ the element being wrapped as `children`.

```diff
-props = useWrapElement(props, (element) => (
-  <div className="wrapper">
-    {element}
-  </div>
-))
+props = wrapInstance(props, (wrapperProps) => (
+  <div class="wrapper">
+    {wrapperProps.children}
+  </div>
+))
```

## <a name='Specialpatternsandquirks'></a>Special patterns and quirks

### <a name='JSXbranchesandearlyreturns'></a>JSX branches and early returns

Since React re-runs (re-renders) components and hooks, you can short-circuit to create "branches" in JSX, for example:

```jsx
if (condition) return <div>A</div>;
return <div>B</div>;
```

Solid doesn't re-run these functions, so this method cannot be used. Instead, use reactive utilities like `Shows` or `Switch`, for example:

```jsx
return (
  <Show when={condition()} fallback={<div>B</div>}>
    <div>A</div>
  </Show>
);
```

This might require some restructuring of the code to preserve the same behavior while pleasing Solid. A good understanding of Solid's reactivity system is required.

### <a name='Stableaccessors'></a>Stable accessors

TODO: document `stableAccessor`.

### <a name='Reactivehoisting'></a>Reactive hoisting

TODO: document this. TL;DR in effects and computations, always access reactive values at the top to prevent early returns and other code paths from breaking reactivity.

TODO: investigate if worth manually forcing the React linter to detect missing deps in React code, as it would point out values that need to be untracked.

### <a name='Miscellaneousquirks'></a>Miscellaneous quirks

* The types for the `role` prop are more strict in Solid than in React. In React, the `string` type is enough, but that doesn't work in Solid. A quick way to get around this is to use the `as const` syntax if possible. For example: `role="group" as const`.

## <a name='Usefultips'></a>Useful tips

### <a name='akdiff-aterminalutilitythatopensacomponentportdiff'></a>`akdiff` - a terminal utility that opens a component port diff

<!-- TODO: .ts files don't work -->
<!-- TODO: add scripts to repo for ease of use -->

Here's a shell function that can be helpful to quickly show the diff between the original React code and the Solid port. Must be run from inside the project directory.

```sh
akdiff <relative path in src without extension>
```

For example:

```sh
akdiff group/group-label
```

To use it, make sure to run one of following snippets in your shell. To "install" it, put it in your shell's config file (`~/.bashrc` for Bash, `~/.zshrc` for Zsh, etc.). In Fish, you can just add it as a function (e.g. in `~/.config/fish/functions/akdiff.fish`).

This version opens the diff in VS Code. You need to have `code` in your PATH, which requires running the "Install 'code' command in PATH" command from VS Code itself (see [the docs](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)).

You can easily modify the diff command if you wish. For example, to use `git` instead of `code` change the following line:

```diff
-code --diff "$file1" "$file2"
+git diff --no-index "$file1" "$file2"
```

#### <a name='Fish'></a>Fish

This one even has completions! Put it in `~/.config/fish/functions/akdiff.fish`.

```fish
function akdiff
  set repo_root (git rev-parse --show-toplevel 2>/dev/null)
  if test -z "$repo_root"
    echo "not in a git repo"
    return 1
  end

  set filepath $argv[1]
  set file1 "$repo_root/packages/ariakit-react-core/src/$filepath.tsx"
  set file2 "$repo_root/packages/ariakit-solid-core/src/$filepath.tsx"

  if test -f "$file1" -a -f "$file2"
    code --diff "$file1" "$file2"
  else
    echo "file not found: $filepath in one or both packages"
    return 1
  end
end

function __fish_akdiff_complete_files
  set repo_root (git rev-parse --show-toplevel 2>/dev/null)
  if test -z "$repo_root"
    return 1
  end

  find $repo_root/packages/ariakit-solid-core/src -type f -not -path "*/utils/*" | sed -E 's|.*/([^/]+/[^/]+)\.[^/]+$|\1|' | sort -u
end
complete -c akdiff -f -a "(__fish_akdiff_complete_files)"
```

#### <a name='BashZshSh'></a>Bash/Zsh/Sh

No fancy completions, but works in most shells.

```sh
akdiff() {
  local repo_root
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "not in a git repo"; return 1; }

  local filepath="$1"
  local file1="$repo_root/packages/ariakit-react-core/src/$filepath.tsx"
  local file2="$repo_root/packages/ariakit-solid-core/src/$filepath.tsx"

  if [[ -f "$file1" && -f "$file2" ]]; then
    code --diff "$file1" "$file2"
  else
    echo "file not found: $filepath in one or both packages"
    return 1
  fi
}
```
