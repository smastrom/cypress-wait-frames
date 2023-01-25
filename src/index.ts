/// <reference types="cypress" />

import type { WaitCmdOpts, WaitCmdReturn, GetValueOptions, RafOptions, Primitive } from './types';

const ERR = '[cypress-wait-frames] - ';

const unique = Symbol('');

function waitFrames<T>({
	subject: getSubject,
	property,
	frames = 20,
	timeout = 30 * 1000,
}: WaitCmdOpts<T>) {
	getSubject().then((subject) => {
		cy.window().then({ timeout }, (cyWin) => {
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
	return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

function getValue<T>({ isWin, cyWin, target, prop }: GetValueOptions<T>): Primitive {
	if ((prop as string).includes('.')) {
		let objValue: symbol | Primitive = unique;

		const [objOrMethod, _prop] = (prop as string).split('.');

		if (typeof target[objOrMethod as keyof typeof target] === 'function') {
			objValue = (
				(target as HTMLElement)[objOrMethod as keyof HTMLElement] as CallableFunction
			)?.()?.[_prop];
		}

		if (typeof target[objOrMethod as keyof typeof target] === 'object') {
			objValue = (
				(target as HTMLElement)[objOrMethod as keyof HTMLElement] as Record<
					string,
					Primitive
				>
			)?.[_prop];
		}

		if (objValue !== unique && isPrimitive(objValue)) {
			return objValue as Primitive;
		}

		throw new Error(
			`${ERR} Invalid or unsupported ${isWin ? 'window' : ''} property: ${prop as string}`
		);
	}

	if (prop in target && isPrimitive(target[prop as keyof typeof target])) {
		return target[prop as keyof typeof target] as Primitive;
	}

	if (isWin) {
		throw new Error(`${ERR} Invalid window property: ${prop as string}`);
	}

	function getCSS() {
		return cyWin.getComputedStyle(target as HTMLElement).getPropertyValue(prop as string);
	}

	if ((prop as string).startsWith('--')) {
		return getCSS();
	}

	if (!(prop in cyWin.getComputedStyle(target as HTMLElement))) {
		throw new Error(`${ERR} Invalid element DOM/CSS property: ${prop as string}`);
	}

	return getCSS();
}

function _waitFrames<T>({ isWin, isDoc, cyWin, target, prop, frames }: RafOptions<T>) {
	return new Cypress.Promise<WaitCmdReturn<T>>((resolve, reject) => {
		const start = cyWin.performance.now();

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
						time: cyWin.performance.now() - start,
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
