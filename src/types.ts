/// <reference types="cypress" />

import type { PropertiesHyphen } from 'csstype'

declare global {
   namespace Cypress {
      interface Chainable {
         waitFrames<T extends Cypress.AUTWindow | JQuery<HTMLElement | SVGElement>>(
            options: WaitCmdOpts<T>
         ): Chainable<WaitCmdReturn<T>[]>
      }
   }
}

export type WaitCmdOpts<T> = {
   /** Cypress Chainable.  */
   subject: () => Cypress.Chainable<T>
   /** DOM/CSS properties to watch for. */
   property: Properties<T> | Properties<T>[]
   /** Number of frames at which function should resolve. */
   frames?: number
   /** Timeout in ms at which the function should throw an error. */
   timeout?: number
}

type ElementProps = keyof HTMLElement | keyof SVGElement | keyof SVGGraphicsElement

type Properties<T> = T extends Cypress.AUTWindow
   ? keyof T | `${keyof Cypress.AUTWindow}.${string}`
   : ElementProps | keyof PropertiesHyphen | `${ElementProps}.${string}` | `--${string}`

export type WaitCmdReturn<T> = {
   /** Subject yielded from `subject` option. */
   subject: T extends Cypress.AUTWindow
      ? Cypress.AUTWindow
      : T extends HTMLElement
      ? HTMLElement
      : T extends SVGElement
      ? SVGElement
      : never
   /** Awaited property name. */
   property: Properties<T>
   /** Value at which the function resolved. */
   value: Primitive
   /** Time in ms that took to resolve since invoking. */
   time: DOMHighResTimeStamp
}

export type Primitive = string | number | undefined | null

export type GetValueOptions<T> = {
   isWin: boolean
   cyWin: Cypress.AUTWindow
   target: Cypress.AUTWindow | HTMLElement | SVGElement
   prop: Properties<T>
}

export type RafOptions<T> = GetValueOptions<T> & {
   frames: number
}
