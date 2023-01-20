declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			waitFrames<T>(options: WaitCmdOpts<T>): Cypress.Chainable<WaitCmdReturn<T>[]>;
		}
	}
}

export type WaitCmdOpts<T> = {
	subject: () => Cypress.Chainable<T>;
	property: string | string[];
	frames: number;
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
		: JQuery<HTMLElement>;
	property: string;
	value: string | number | undefined;
	timestamp: DOMHighResTimeStamp;
	attempts: number;
};

export type GetValueOptions = {
	isWin: boolean;
	cyWin: Cypress.AUTWindow;
	target: Cypress.AUTWindow | HTMLElement;
	prop: string;
};

export type WaitFramesOptions = GetValueOptions & {
	frames: number;
	isDoc: boolean;
};

const ERR = '[cypress-wait-frames] - ';

function isPlainObject(obj: unknown) {
	return !Array.isArray(obj) && typeof obj === 'object' && obj !== null;
}

function isPrimitive(value: unknown) {
	return value !== Object(value);
}

function waitFrames<T>({
	subject: getSubject,
	property,
	frames = 5,
	timeout = 30 * 1000,
}: WaitCmdOpts<T>) {
	getSubject().then((subject) => {
		cy.window().then({ timeout }, async (cyWin) => {
			const isWin = 'Cypress' in (subject as Cypress.AUTWindow);
			const isDoc = 'documentElement' in (subject as Document);
			const isEl = !isDoc && 'tagName' in (subject as HTMLElement);
			const isUnwrappedEl =
				!isEl &&
				isPlainObject(subject) &&
				(subject as JQuery<HTMLElement>).length === 1 &&
				'tagName' in (subject as JQuery<HTMLElement>)['0'];

			if (!isWin && !isDoc && !isEl && !isUnwrappedEl) {
				throw new Error(
					`${ERR} Invalid subject. It must be 'cy.window', 'cy.document' or '() => cy.get()'.`
				);
			}

			if (!Array.isArray(property) && typeof property !== 'string') {
				throw new Error(`${ERR} Invalid properties. It must be a string or an array of strings.`);
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

function getValue({ isWin, cyWin, target, prop }: GetValueOptions) {
	if (prop.includes('.')) {
		const [method, _prop] = prop.split('.');
		const rectValue = (
			(target as HTMLElement)[method as keyof HTMLElement] as CallableFunction
		)?.()?.[_prop];
		if (rectValue === undefined || rectValue === null) {
			throw new Error(`${ERR} Invalid or unsupported method: ${prop}`);
		}
		return rectValue;
	}

	if (prop in target && isPrimitive((target as HTMLElement)[prop as keyof HTMLElement])) {
		return (target as HTMLElement)[prop as keyof HTMLElement];
	} // Improve this

	if (isWin) {
		throw new Error(`${ERR} Invalid window property: ${prop}`);
	}

	if (!(prop in cyWin.getComputedStyle(target as HTMLElement))) {
		throw new Error(`${ERR} Invalid DOM/CSS property: ${prop}`);
	}

	return cyWin.getComputedStyle(target as HTMLElement).getPropertyValue(prop);
}

function _waitFrames<T>({ isWin, isDoc, cyWin, target, prop, frames }: WaitFramesOptions) {
	return new Cypress.Promise<WaitCmdReturn<T>>((resolve, reject) => {
		let rafId: DOMHighResTimeStamp = 0;
		let prevValue: number | string | undefined | null = null;
		let frameCount = 0;
		let attempts = 0;

		function getNextValue() {
			try {
				const nextValue = getValue({ isWin, cyWin, target, prop });

				if (prevValue === null || prevValue !== nextValue) {
					if (frameCount > 0) {
						attempts++;
					}

					frameCount = 0;
					prevValue = nextValue;

					return cyWin.requestAnimationFrame(getNextValue);
				}

				frameCount++;

				if (frameCount === frames) {
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
						attempts,
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
