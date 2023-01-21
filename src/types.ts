/// <reference types="cypress" />

import type { PropertiesHyphen } from 'csstype';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			waitFrames<T>(options: WaitCmdOpts<T>): Chainable<WaitCmdReturn<T>[]>;
		}
	}
}

export type WaitCmdOpts<T> = {
	/** Cypress Chainable.  */
	subject: () => Cypress.Chainable<T>;
	/** DOM/CSS properties to watch for. */
	property: Properties<T> | Properties<T>[];
	/** Number of frames at which function should resolve. */
	frames?: number;
	/** Timeout in ms at which the function should throw an error. */
	timeout?: number;
};

type Properties<T> = T extends Cypress.AUTWindow
	? keyof T | `${keyof Cypress.AUTWindow}.${string}`
	: keyof HTMLElement | keyof PropertiesHyphen | `${keyof HTMLElement}.${string}`;

export type WaitCmdReturn<T> = {
	/** Subject yielded from `subject` option. */
	subject: T extends Cypress.AUTWindow
		? T
		: T extends Document
		? T
		: T extends HTMLElement
		? T
		: T extends JQuery<HTMLElement>
		? T
		: never;
	/** Awaited property name. */
	property: Properties<T>;
	/** Value at which the function resolved. */
	value: string | number | undefined;
	/** Time in ms that took to resolve since invoking. */
	time: DOMHighResTimeStamp;
};

export type GetValueOptions<T> = {
	isWin: boolean;
	cyWin: Cypress.AUTWindow;
	target: Cypress.AUTWindow | HTMLElement;
	prop: Properties<T>;
};

export type RafOptions<T> = GetValueOptions<T> & {
	frames: number;
	isDoc: boolean;
};
