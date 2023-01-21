/// <reference types="cypress" />

import type { WaitCmdOpts, WaitCmdReturn, GetValueOptions, RafOptions } from './types';

const ERR = '[cypress-wait-frames] - ';

export function waitFrames<T>({
	subject: getSubject,
	property,
	frames = 20,
	timeout = 30 * 1000,
}: WaitCmdOpts<T>) {
	getSubject().then((subject) => {
		cy.window().then({ timeout }, async (cyWin) => {
			const isWin = 'Cypress' in (subject as Cypress.AUTWindow);
			const isDoc = 'documentElement' in (subject as Document);
			const isEl = !isDoc && 'tagName' in (subject as HTMLElement);
			const isWrappedEl =
				!isEl &&
				isPlainObject(subject) &&
				(subject as JQuery<HTMLElement>).length === 1 &&
				'tagName' in (subject as JQuery<HTMLElement>)['0'];

			if (!isWin && !isDoc && !isEl && !isWrappedEl) {
				throw new Error(
					`${ERR} Invalid subject. It must be either 'cy.window', 'cy.document' or '() => cy.get()'.`
				);
			}

			if (!Array.isArray(property) && typeof property !== 'string') {
				throw new Error(
					`${ERR} Invalid properties. It must be a string or an array of strings.`
				);
			}

			if (typeof property === 'string') {
				property = [property];
			}

			return Cypress.Promise.all(
				property.map((prop) =>
					_waitFrames<T>({
						isWin,
						isDoc,
						cyWin,
						target: isWin
							? cyWin
							: isDoc
							? cyWin.document.documentElement
							: isEl
							? (subject as HTMLElement)
							: (subject as JQuery<HTMLElement>)['0'],
						prop,
						frames,
					})
				)
			)
				.then((results) => results)
				.catch((error) => {
					throw error;
				});
		});
	});
}

function isPlainObject(obj: unknown) {
	return !Array.isArray(obj) && typeof obj === 'object' && obj !== null;
}

function isPrimitive(value: unknown) {
	return value !== Object(value);
}

function getValue<T>({ isWin, cyWin, target, prop }: GetValueOptions<T>) {
	if ((prop as string).includes('.')) {
		const [method, _prop] = (prop as string).split('.');
		const rectValue = (
			(target as HTMLElement)[method as keyof HTMLElement] as CallableFunction
		)?.()?.[_prop];

		if (rectValue === undefined || rectValue === null) {
			throw new Error(`${ERR} Invalid or unsupported method: ${prop as string}`);
		}
		return rectValue;
	}

	if (prop in target && isPrimitive(target[prop as keyof typeof target])) {
		return target[prop as keyof typeof target];
	}

	if (isWin) {
		throw new Error(`${ERR} Invalid window property: ${prop as string}`);
	}

	if (!(prop in cyWin.getComputedStyle(target as HTMLElement))) {
		throw new Error(`${ERR} Invalid DOM/CSS property: ${prop as string}`);
	}

	return cyWin.getComputedStyle(target as HTMLElement).getPropertyValue(prop as string);
}

function _waitFrames<T>({ isWin, isDoc, cyWin, target, prop, frames }: RafOptions<T>) {
	return new Cypress.Promise<WaitCmdReturn<T>>((resolve, reject) => {
		let rafId: DOMHighResTimeStamp = 0;
		let prevValue: number | string | undefined | null = getValue<T>({
			isWin,
			cyWin,
			target,
			prop,
		});

		let framesCount = 0;

		function getNextValue() {
			try {
				framesCount++;

				const nextValue = getValue<T>({ isWin, cyWin, target, prop });

				if (prevValue !== nextValue) {
					framesCount = 0;
					prevValue = nextValue;
					return cyWin.requestAnimationFrame(getNextValue);
				}

				if (framesCount === frames) {
					cyWin.cancelAnimationFrame(rafId as DOMHighResTimeStamp);
					resolve({
						subject: (isWin
							? cyWin
							: isDoc
							? cyWin.document
							: target) as WaitCmdReturn<T>['subject'],
						property: prop,
						value: nextValue,
						timestamp: performance.now(),
					});
				} else {
					cyWin.requestAnimationFrame(getNextValue);
				}
			} catch (error) {
				reject(error);
			}
		}

		rafId = cyWin.requestAnimationFrame(getNextValue);
	});
}

Cypress.Commands.add('waitFrames', waitFrames);
