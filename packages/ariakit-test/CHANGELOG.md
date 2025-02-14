# @ariakit/test

## 0.4.9

- Fixed a build issue that resulted in JavaScript files not being part of the released package.

## 0.4.8

- Fixed the package for running in an SSR environment.

## 0.4.7

- Updated dependencies: `@ariakit/core@0.4.14`

## 0.4.6

- Updated dependencies: `@ariakit/core@0.4.13`

## 0.4.5

- Updated dependencies: `@ariakit/core@0.4.12`

## 0.4.4

- Fixed CJS build on Next.js.
- Updated pointer events to initialize with a default `pointerType` value of `mouse`.
- Updated dependencies: `@ariakit/core@0.4.11`

## 0.4.3

- Updated dependencies: `@ariakit/core@0.4.10`

## 0.4.2

- Updated dependencies: `@ariakit/core@0.4.9`

## 0.4.1

- Added a README file to the package.
- Updated dependencies: `@ariakit/core@0.4.8`

## 0.4.0

- The `render` method now returns a promise of `{ unmount, rerender }` instead of just the `unmount` function.

## 0.3.16

- Added React 19 to peer dependencies.
- Updated dependencies: `@ariakit/core@0.4.7`

## 0.3.15

- Updated dependencies: `@ariakit/core@0.4.6`

## 0.3.14

- Added `within` function to queries.
- Updated dependencies: `@ariakit/core@0.4.5`

## 0.3.13

- Updated dependencies: `@ariakit/core@0.4.4`

## 0.3.12

- Updated dependencies: `@ariakit/core@0.4.3`

## 0.3.11

- Added `@ariakit/test/playwright` path with Playwright-specific query utilities.
- Updated dependencies: `@ariakit/core@0.4.2`

## 0.3.10

- Updated dependencies: `@ariakit/core@0.4.1`

## 0.3.9

- Queries no longer match `inert` elements.
- Updated dependencies: `@ariakit/core@0.4.0`

## 0.3.8

- Updated dependencies: `@ariakit/core@0.3.11`

## 0.3.7

- Added missing properties to dispatched events.
- Updated dependencies: `@ariakit/core@0.3.10`

## 0.3.6

### <kbd>Home</kbd> and <kbd>End</kbd> keys on text fields

Pressing the <kbd>Home</kbd> or <kbd>End</kbd> keys on text fields will now move the cursor (`selectionStart`/`selectionEnd` properties) to the start or finish of the text when using the `press` function.

### Other updates

- Updated dependencies: `@ariakit/core@0.3.9`

## 0.3.5

- Updated dependencies: `@ariakit/core@0.3.8`

## 0.3.4

- Updated dependencies: `@ariakit/core@0.3.7`

## 0.3.3

- Updated dependencies: `@ariakit/core@0.3.6`

## 0.3.2

- Updated dependencies: `@ariakit/core@0.3.5`

## 0.3.1

### Patch Changes

- [`#2935`](https://github.com/ariakit/ariakit/pull/2935) Fixed TypeScript declaration files in CommonJS projects using `NodeNext` for `moduleResolution`.

- [`#2948`](https://github.com/ariakit/ariakit/pull/2948) Added `"use client"` directive to all modules.

- Updated dependencies: `@ariakit/core@0.3.4`.

## 0.3.0

### Minor Changes

- [`#2894`](https://github.com/ariakit/ariakit/pull/2894) All `@ariakit/test` functions now disable `global.IS_REACT_ACT_ENVIRONMENT` before running and restore its value at the end.

- [`#2894`](https://github.com/ariakit/ariakit/pull/2894) Replaced the synchronous `fireEvent` functions by asynchronous `dispatch` functions.

- [`#2894`](https://github.com/ariakit/ariakit/pull/2894) The `act` export has been removed.

- [`#2894`](https://github.com/ariakit/ariakit/pull/2894) Exported user event functions that were previously synchronous are now asyncrhonous.

- [`#2899`](https://github.com/ariakit/ariakit/pull/2899) The `screen` module and its queries (`getBy*`, `queryBy*`, etc.) have been removed in favor of the `query` module.

- [`#2899`](https://github.com/ariakit/ariakit/pull/2899) The `within` module has been removed.

- [`#2900`](https://github.com/ariakit/ariakit/pull/2900) The `render` function has been moved to the `@ariakit/test/react` path. It's now asynchronous. The root `@ariakit/test` package does not depend on React or React Testing Library anymore.

### Patch Changes

- [`#2892`](https://github.com/ariakit/ariakit/pull/2892) Updated function argument types to support `null` instead of `Element`, but added a runtime error in case `null` is passed.

- [`#2892`](https://github.com/ariakit/ariakit/pull/2892) Added a new `query` module that exports a `query`/`q` object with functions to query the DOM.

- Updated dependencies: `@ariakit/core@0.3.3`.

## 0.2.5

### Patch Changes

- Updated dependencies: `@ariakit/core@0.3.2`.

## 0.2.4

### Patch Changes

- Updated dependencies: `@ariakit/core@0.3.1`.

## 0.2.3

### Patch Changes

- Updated dependencies: `@ariakit/core@0.3.0`.

## 0.2.2

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.9`.

## 0.2.1

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.8`.

## 0.2.0

### Minor Changes

- Replaced `mock-get-client-rects` module by `polyfills`. ([#2587](https://github.com/ariakit/ariakit/pull/2587))

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.7`.

## 0.1.14

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.6`.

## 0.1.13

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.5`.

## 0.1.12

### Patch Changes

- Added missing `types` field to proxy package.json files. ([#2489](https://github.com/ariakit/ariakit/pull/2489))

- Updated dependencies: `@ariakit/core@0.2.4`.

## 0.1.11

### Patch Changes

- Added `.cjs` and `.js` extensions to paths in proxy package.json files to support bundlers that can't automaically resolve them. ([#2487](https://github.com/ariakit/ariakit/pull/2487))

- Updated dependencies: `@ariakit/core@0.2.3`.

## 0.1.10

### Patch Changes

- Fixed several actions not considering hidden elements before dispatching events, which was causing a freeze in JSDOM. ([#2462](https://github.com/ariakit/ariakit/pull/2462))

## 0.1.9

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.2`.

## 0.1.8

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.1`.

## 0.1.7

### Patch Changes

- Updated dependencies: `@ariakit/core@0.2.0`.

## 0.1.6

### Patch Changes

- Fixed build target. ([#2355](https://github.com/ariakit/ariakit/pull/2355))

- Fixed `mock-get-client-rects` module marking elements not connected to the DOM as visible. ([#2339](https://github.com/ariakit/ariakit/pull/2339))

- Updated dependencies: `@ariakit/core@0.1.5`.

## 0.1.5

### Patch Changes

- Updated dependencies: `@ariakit/core@0.1.4`.

## 0.1.4

### Patch Changes

- Updated dependencies: `@ariakit/core@0.1.3`.

## 0.1.3

### Patch Changes

- Added support for elements becoming inaccessible between `mousedown` and `mouseup` events on the `click` function. ([#2300](https://github.com/ariakit/ariakit/pull/2300))

- Added support for composition text on `type`. ([#2308](https://github.com/ariakit/ariakit/pull/2308))

## 0.1.2

### Patch Changes

- Updated dependencies: `@ariakit/core@0.1.2`.

## 0.1.1

### Patch Changes

- Updated dependencies: `@ariakit/core@0.1.1`.

## 0.1.0

### Minor Changes

- Updated package names to include the `@ariakit` scope, providing a more distinct and specific namespace for our packages.

  Additionally, we've made a change to the versioning system, moving from `v2.0.0-beta.x` to `v0.x.x`. This alteration means that although the library is still in beta, we can release breaking changes in minor versions without disrupting projects that don't set exact versions in their `package.json`.

  ```diff
  - npm i ariakit
  + npm i @ariakit/react
  ```

### Patch Changes

- Packages are now ESM by default (commonjs modules are still available with the `.cjs` extension).

- Updated dependencies: `@ariakit/core@0.1.0`.
