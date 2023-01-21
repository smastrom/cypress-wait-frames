import { PropertiesHyphen } from 'csstype';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			waitFrames<T>(options: WaitCmdOpts<T>): Cypress.Chainable<WaitCmdReturn<T>[]>;
		}
	}
}

type Properties<T> = T extends Cypress.AUTWindow
	? keyof T | `${keyof Cypress.AUTWindow}.${string}`
	: keyof HTMLElement | keyof PropertiesHyphen | `${keyof HTMLElement}.${string}`;

export type WaitCmdOpts<T> = {
	subject: () => Cypress.Chainable<T>;
	property: Properties<T> | Properties<T>[];
	frames?: number;
	timeout?: number;
	failOnTimeout?: boolean;
};

export type WaitCmdReturn<T> = {
	subject: T extends Cypress.AUTWindow
		? T
		: T extends Document
		? T
		: T extends HTMLElement
		? T
		: T extends JQuery<HTMLElement>
		? T
		: never;
	property: Properties<T>;
	value: string | number | undefined;
	timestamp: DOMHighResTimeStamp;
	attempts: number;
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
