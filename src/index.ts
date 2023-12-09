/// <reference types="cypress" />

import type { WaitCmdOpts, WaitCmdReturn, GetValueOptions, RafOptions, Primitive } from './types'

const ERR = '[cypress-wait-frames] - '

const targetErr = `${ERR} Invalid subject. It must be either 'cy.window' or '() => cy.get('*')'.`
const propsErr = `${ERR} Invalid properties. It must be a string or an array of strings.`

function waitFrames<T>({
   subject: cyGet,
   property,
   frames = 20,
   timeout = 30 * 1000,
}: WaitCmdOpts<T>) {
   cyGet().then((subject) => {
      cy.window().then({ timeout }, async (cyWin) => {
         let target = cyWin as Cypress.AUTWindow | HTMLElement | SVGElement

         const isWin = Cypress.dom.isWindow(subject)

         if (!isWin) {
            const isJquery = Cypress.dom.isJquery(subject)
            if (!isJquery) {throw new Error(targetErr)}

            target = (subject as JQuery<HTMLElement | SVGElement>)['0']
         }

         if (!target) {throw new Error(targetErr)}
         if (!Array.isArray(property) && typeof property !== 'string') {throw new Error(propsErr)}

         if (typeof property === 'string') {property = [property]}

         return await Cypress.Promise.all(
            property.map((prop) =>
               _waitFrames<T>({
                  isWin,
                  cyWin,
                  target,
                  prop,
                  frames,
               })
            )
         )
      })
   })
}

const isPrimitive = (value: unknown) => value === null || typeof value !== 'object'

function getValue<T>({ isWin, cyWin, target, prop }: GetValueOptions<T>): Primitive {
   const getCSS = () =>
      cyWin.getComputedStyle(target as HTMLElement).getPropertyValue(prop as string)

   const emptyValue = Symbol('')

   if (typeof prop === 'string' && prop.includes('.')) {
      let objValue: symbol | Primitive = emptyValue

      const [objOrMethod, _prop] = prop.split('.')

      if (typeof target[objOrMethod as keyof typeof target] === 'function') {
         objValue = (
            (target as HTMLElement)[objOrMethod as keyof HTMLElement] as CallableFunction
         )?.()?.[_prop]
      }

      if (typeof target[objOrMethod as keyof typeof target] === 'object') {
         objValue = (
            (target as HTMLElement)[objOrMethod as keyof HTMLElement] as Record<string, Primitive>
         )?.[_prop]
      }

      if (objValue !== emptyValue) {return objValue as Primitive}

      throw new Error(
         `${ERR} Invalid or unsupported ${isWin ? 'window' : ''} property: ${prop as string}`
      )
   }

   if (prop in target && isPrimitive(target[prop as keyof typeof target])) {
      return target[prop as keyof typeof target] as Primitive
   }

   if (isWin) {throw new Error(`${ERR} Invalid window property: ${prop as string}`)}

   if (typeof prop === 'string' && prop.startsWith('--')) {return getCSS()}

   if (!(prop in cyWin.getComputedStyle(target as HTMLElement))) {
      throw new Error(`${ERR} Invalid element DOM/CSS property: ${prop as string}`)
   }

   return getCSS()
}

function _waitFrames<T>({ isWin, cyWin, target, prop, frames }: RafOptions<T>) {
   return new Cypress.Promise<WaitCmdReturn<T>>((resolve, reject) => {
      const start = cyWin.performance.now()

      let rafId: DOMHighResTimeStamp = 0
      let prevValue: number | string | undefined | null = getValue<T>({
         isWin,
         cyWin,
         target,
         prop,
      })

      let framesCount = 0

      function getNextValue() {
         try {
            framesCount++

            const nextValue = getValue<T>({ isWin, cyWin, target, prop })

            if (prevValue !== nextValue) {
               framesCount = 0
               prevValue = nextValue
               return cyWin.requestAnimationFrame(getNextValue)
            }

            if (framesCount === frames) {
               cyWin.cancelAnimationFrame(rafId as DOMHighResTimeStamp)
               resolve({
                  subject: target as WaitCmdReturn<T>['subject'],
                  property: prop,
                  value: nextValue,
                  time: cyWin.performance.now() - start,
               })
            } else {
               cyWin.requestAnimationFrame(getNextValue)
            }
         } catch (error) {
            reject(error)
         }
      }

      rafId = cyWin.requestAnimationFrame(getNextValue)
   })
}

Cypress.Commands.add('waitFrames', waitFrames)
