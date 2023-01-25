![npm](https://img.shields.io/npm/v/cypress-wait-frames?color=46c119) ![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/smastrom/cypress-wait-frames/tests.yml?branch=main&label=tests) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/cypress-wait-frames?color=success)
![dependency-count](https://img.shields.io/badge/dependency%20count-0-success)

# Cypress Wait Frames

Cypress command to wait for any CSS/DOM property to be idle after a specified number of frames.

<br />

## Installation

```bash
pnpm add cypress-wait-frames
```

Import the package in your **commands.js**:

```js
import 'cypress-wait-frames'
```

<br />

If using TypeScript, install the latest version of [csstype](https://www.npmjs.com/package/csstype) for CSS properties autocompletion:

```bash
pnpm add -D csstype
```

<br />

## Do I need this?

Cypress retry ability on [built-in assertions](https://docs.cypress.io/guides/core-concepts/retry-ability#Built-in-assertions) is very powerful and most likely you don't need this package or to use `cy.wait`. For example:

```js
cy.scrollTo(0, 1200)

// No need for cy.wait(t) to make sure scroll is completed

cy.window().eq('scrollY').should('be.approximately', 1200, 2) // Will retry until it passes
```

Documentation on [retry-ability](https://docs.cypress.io/guides/core-concepts/retry-ability) is very detailed and it might already contain the answer you're looking for.

<br />

## When to use it

There are cases where it's impossible to retain retry-ability and you might find yourself guessing timings using `cy.wait`.

For example when asserting properties not available within Cypress queries:

```js
cy.get('h1').eq(15).scrollIntoView()

// Need to add cy.wait(t) to make sure scroll is completed

cy.get('h1')
  .eq(15)
  .then((el) => {
    cy.wrap(el[0].getBoundingClientRect().top).should('be.approximately', 0, 2)
  })
```

Or when futher assertions must rely on 100% accurate values:

```js
cy.get('#TriggerComplexTransition').click()

// Need to add cy.wait(t) to make sure desktopHeight is accurate

cy.viewport('macbook-15').get('#TransitionedElement').invoke('height').as('desktopHeight')

cy.get('@desktopHeight').then((desktopHeight) => {
  cy.viewport('ipad-2')
    .get('#TransitionedElement')
    .invoke('height')
    .should('be.equal', desktopHeight / 2)
})
```

But scenarios can be disparate and more complex. Bottom line is that if you find yourself using `cy.wait()` as last resort, this package might be for you.

<br />

## Usage

Instead of guessing timings using `cy.wait` you can use `cy.waitFrames` to wait for a one or more properties to be idle after a specified number of frames.

Specify a `subject` to watch, one or more `property` and a number of `frames`. Command will resolve once queried properties haven't changed for that number of frames.

```js
cy.get('h1').eq(15).scrollIntoView()

cy.waitFrames({
  subject: () => cy.get('h1').eq(15),
  property: 'getBoundingClientRect.top',
  frames: 20 // Wait for the property to be idle for 20 frames
}).then(([{ value }]) => {
  cy.wrap(value).should('be.approximately', 0, 2) // Passes in any environment
})
```

You can also use it to just to wait for a property to be idle:

```js
Cypress.Commands.add('waitForResize', () => {
  cy.waitFrames({
    subject: cy.window,
    property: 'outerWidth',
    frames: 20
  })
})
```

```js
cy.waitForResize()

cy.log('Resized!') // This is executed once outerWidth isn't changed for 20 frames.
```

### Options

| Property   | Default    | Type                | Description                        | Required           |
| ---------- | ---------- | ------------------- | ---------------------------------- | ------------------ |
| `subject`  | undefined  | () => Chainable\<T> | Chainable to watch for properties. | :white_check_mark: |
| `property` | undefined  | string \| string[]  | One or more properties to watch.   | :white_check_mark: |
| `frames`   | 20         | number              | Number of frames to wait.          | :x:                |
| `timeout`  | 30 \* 1000 | number              | Timeout in milliseconds.           | :x:                |

<br />

## Yields

A [Cypress Promise](https://docs.cypress.io/api/utilities/promise) which resolves to an array of objects (one for each property) or throws an error if `timeout` is reached:

| Property   | Type                                                                | Description                                     |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `subject`  | `AUTWindow` \| `Document` \| `HTMLElement` \| `JQuery<HTMLElement>` | Subject yielded from `subject` option chainer.  |
| `value`    | `string \| number` \| `null` \| `undefined`                         | Property value at which the function resolved.  |
| `property` | `string`                                                            | Awaited property name.                          |
| `time`     | `DOMHighResTimestamp`                                               | Time in ms that took to resolve since invoking. |

<br />

## Subjects

### Window

```js
cy.waitFrames({
  subject: cy.window
})
```

:bulb: Use `cy.window` to watch for _window-only_ DOM properties like `scrollY` or `outerWidth`.

### DocumentElement / HTML

```js
cy.waitFrames({
  subject: cy.document
})
```

:bulb: Use `cy.document` to watch for DOM/CSS properties on the `documentElement` such as `clientWidth`, `pointer-events`, `overflow` etc.

### HTMLElement / SVGElement

```js
cy.waitFrames({
  subject: () => cy.get('a').eq(0) // or () => cy.get('.my-selector')
})
```

:bulb: Use `() => cy.get` to watch for DOM/CSS properties on any other HTMLElement.

:warning: When using `cy.get`, make sure to pass a function which returns the chainable.

<br />

## Properties

### DOM properties

```js
cy.waitFrames({
  subject: cy.window,
  property: 'scrollY',
  frames: 10
})
```

### CSS properties

```js
cy.waitFrames({
  subject: () => cy.get('.my-element'),
  property: 'background-color', // or '--my-var'
  frames: 10
})
```

:bulb: Use _kebab-case_ for CSS properties. `getComputedStyle` is used internally to get the values.

### Objects / methods properties

```js
cy.waitFrames({
  subject: cy.window,
  property: 'visualViewport.offsetTop'
})
```

```js
cy.waitFrames({
  subject: () => cy.get('.my-element'),
  property: 'getBoundingClientRect.top'
})
```

:warning: Bear in mind that only methods or objects with **maximum 1 property** which returns a primitive are supported.

Methods with arity greater than 0 are not supported, _e.g. `getAttribute('href')`_.

### Multiple properties / methods

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

## License

MIT
