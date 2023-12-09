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

If using TypeScript, optionally install the latest version of [csstype](https://www.npmjs.com/package/csstype) for CSS properties autocompletion:

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

## When I find it useful

There are cases where it's very hard to retain retry-ability and you might find yourself guessing timings using `cy.wait` or increasing the retry-ability timeout.

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

But scenarios can be disparate and more complex. Bottom line is that if you find yourself using `cy.wait()` as last resort to obtain values or wait for DOM/CSS properties to be idle, this package might be for you.

<br />

## Usage

### Window

```js
cy.waitFrames({
  subject: cy.window,
  property: 'outerWidth'
})

cy.log('Resized!') // Executed once 'outerWidth' isn't changed for 20 frames (default).
```

### DocumentElement

```js
cy.waitFrames({
  subject: () => cy.get('html'),
  property: 'clientWidth',
  frames: 10
})

cy.log('Resized!') // Executed once 'clientWidth' isn't changed for 10 frames.
```

### HTMLElement / SVGElement

```js
cy.waitFrames({
  subject: () => cy.get('a').eq(0),
  property: 'getBoundingClientRect.top'
}).then(([{ value }]) => {
  cy.wrap(value).should('be.approximately', 0, 2) // Asserts that top is 0 after 20 frames (default).
})
```

### Options

| Property   | Default    | Type                                                                              | Description                                             | Required           |
| ---------- | ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------ |
| `subject`  | undefined  | `() => Cypress.Chainable<Cypress.AutWindow \| JQuery<HTMLElement \| SVGElement>>` | Subject to watch.                                       | :white_check_mark: |
| `property` | undefined  | `string \| string[]`                                                              | One or more properties to watch.                        | :white_check_mark: |
| `frames`   | 20         | `number`                                                                          | Number of frames to wait.                               | :x:                |
| `timeout`  | 30 \* 1000 | `number`                                                                          | Timeout in milliseconds before the command should fail. | :x:                |

<br />

## Yields

A [Cypress Promise](https://docs.cypress.io/api/utilities/promise) which resolves to an array of objects (one for each property) or throws an error if `timeout` is reached:

| Property   | Type                         | Description                                     |
| ---------- | ---------------------------- | ----------------------------------------------- |
| `subject`  | `AUTWindow` \| `HTMLElement` | Subject yielded from `subject` option chainer.  |
| `value`    | `Primitive`                  | Property value at which the function resolved.  |
| `property` | `string`                     | Awaited property name.                          |
| `time`     | `DOMHighResTimestamp`        | Time in ms that took to resolve since invoking. |

<br />

## Properties

### DOM properties

```js
cy.waitFrames({
  subject: () => cy.get('html'),
  property: 'clientWidth'
})
```

### CSS properties

```js
cy.waitFrames({
  subject: () => cy.get('#my-element'),
  property: 'background-color'
})
```

:bulb: Use _kebab-case_ for CSS properties. [getComputedStyle](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle) is used internally to get the values.

### Nested properties / methods

You can watch for methods or objects **maximum 1 nested property** which returns a primitive.

```js
cy.waitFrames({
  subject: cy.window,
  property: 'visualViewport.offsetTop'
})
```

```js
cy.waitFrames({
  subject: () => cy.get('a').eq(0),
  property: 'getBoundingClientRect.top'
})
```

:warning: Methods with arity greater than 0 are not supported, (e.g. `getAttribute('href')`).

### Mixed properties / methods

You can watch for multiple properties as well, `waitFrames` will resolve once all properties are idle:

```js
cy.waitFrames({
  subject: () => cy.get('a').eq(0),
  property: ['background-color', 'scrollTop', 'getBoundingClientRect.top']
})
```

<br />

## License

MIT
