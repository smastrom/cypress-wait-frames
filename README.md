# Cypress waitFrames

Cypress command to correctly wait for any CSS/DOM property to be idle.

<br />

## Installation

```bash
pnpm add cypress-wait-frames
```

In your **commands.js** file, import the package:

```js
import 'cypress-wait-frames'
```

<br />

If using TypeScript:

1. Install the latest version of [csstype](https://www.npmjs.com/package/csstype) to get autocomplete for CSS properties:

```bash
pnpm add -D csstype
```

2. Add `cypress-wait-frames` types to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-wait-frames"]
  }
}
```

<br />

## Usage

Instead of guessing timings with `cy.wait` which might fail your tests on different envs/browsers, you can use this command to correctly wait for any DOM/CSS properties to be idle.

Specify a `subject` to watch, one or more DOM/CSS `property` and a number of `frames`. Command will resolve once queried properties aren't changed for the specified number of frames.

```js
cy.scrollTo(0, 1200)

cy.waitFrames({
  subject: cy.window,
  property: 'scrollY',
  frames: 10
}).then((data) => {
  // Assert the expected scroll position or do something once scroll is idle
})
```

### Options

| Property   | Default    | Type                | Description                        | Required |
| ---------- | ---------- | ------------------- | ---------------------------------- | -------- |
| `subject`  | undefined  | () => Chainable\<T> | Chainable to watch for properties. | Yes      |
| `property` | undefined  | string \| string[]  | One or more property to watch.     | Yes      |
| `frames`   | 20         | number              | Number of frames to wait.          | No       |
| `timeout`  | 30 \* 1000 | number              | Timeout in milliseconds.           | No       |

### Returns

The command returns a Cypress promise which resolves with the following array of objects (one for each property) or throws an error if `timeout` is reached:

| Property   | Type                                                                | Description                                     |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `value`    | `string \| number`                                                  | Value at which the function resolved.           |
| `subject`  | `AUTWindow` \| `Document` \| `HTMLElement` \| `JQuery<HTMLElement>` | Subject yielded from `subject` option.          |
| `property` | `string`                                                            | Awaited property name.                          |
| `time`     | `DOMHighResTimestamp`                                               | Time in ms that took to resolve since invoking. |

### How many frames to wait?

It really depends on your use case. For smooth scrolling 15-20 frames are enough. For a simple CSS transition even 5-10 frames might be ok.

<br />

## Subjects

### Window

```js
cy.waitFrames({
  subject: cy.window
})
```

:bulb: Use `cy.window` to watch for _window-only_ DOM properties like `scrollY`.

### Document / HTML

```js
cy.waitFrames({
  subject: cy.document
})
```

:bulb: Use `cy.document` to watch for DOM/CSS properties on the `documentElement` such as `clientWidth`, `pointer-events`, `overflow` etc.

### Element

```js
cy.waitFrames({
  subject: () => cy.get('a').its(0) // or () => cy.get('.my-selector')
})
```

:bulb: Use `() => cy.get` to watch for DOM/CSS properties on any other HTMLElement.

:warning: When using `cy.get`, make sure to pass a function which returns the chainable.

<br />

## Properties

It can either be a DOM property (scrollTop, clientHeight, etc.) or a CSS property (background-color etc.).

```js
cy.waitFrames({
  subject: cy.window,
  property: 'scrollY', // DOM prop
  frames: 10
})
```

```js
cy.waitFrames({
  subject: () => cy.get('.my-element'),
  property: 'background-color', // CSS prop
  frames: 10
})
```

:bulb: Do not use _camelCase_ for CSS properties. Use _kebab-case_ instead. `getComputedStyle` is used internally to get the values so feel free to query any CSS property even if not direcly added via classes or styles.

:bulb: If using TypeScript, it will warn you if you type a wrong property name (e.g. _scrollY_ on an HTMLElement, _background-color_ on Window or _flexWrap_ instead of _flex-wrap_).

### Methods

To watch for properties on methods such as `getBoundingClientRect`, pass the method name followed by `.` plus the property name:

```js
cy.waitFrames({
  subject: () => cy.get('.my-element'),
  property: 'getBoundingClientRect.top',
  frames: 10
})
```

:warning: Bear in mind that this kind of usage is intended for those methods which return coordinates such as `getBBox` on a SVGElement. You can't call methods with arity greater than 0 or with more than 1 nested property that doesn't return a primitive.

### Multiple properties

You can watch for multiple properties as well:

```js
cy.waitFrames({
  subject: () => cy.get('.my-element'),
  property: ['background-color', 'scrollTop', 'getBoundingClientRect.top'],
  frames: 10
})
```

:bulb: `waitFrames` will resolve once all properties are idle.

<br />

## Contributing

Contributions are very welcome. If you think that the code can be improved without touching the current API, feel free to open a PR.

PNPM is used as a package manager. Use any code style you prefer, git hooks are already set up to format the code.

Cypress Component Testing GUI with React is used for development. Create and export any new component from `tests/App.tsx` and add a new file with related tests in `tests/*.cy.tsx`.

<br />

## License

MIT
