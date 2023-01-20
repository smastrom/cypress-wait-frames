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
	subject: T extends Cypress.AUTWindow ? T : T extends Document ? T : JQuery<HTMLElement>;
	property: string;
	value: string | number | undefined;
	timestamp: DOMHighResTimeStamp;
	attempts: number;
};

export type GetPropOptions = {
	isWin: boolean;
	cyWin: Cypress.AUTWindow;
	target: Cypress.AUTWindow | HTMLElement | JQuery<HTMLElement>;
	prop: string;
};

export type WaitFramesOptions = GetPropOptions & {
	frames: number;
	isDoc: boolean;
};

const ERR = '[cypress-wait-frames] - ';

Cypress.Commands.add('waitFrames', waitFrames);

function waitFrames<T>({
	subject: getSubject,
	property,
	frames = 5,
	timeout = 30 * 1000,
}: WaitCmdOpts<T>) {
	getSubject().then((_subject) => {
		cy.window().then({ timeout }, (cyWin) => {
			const isWin = 'Cypress' in (_subject as Cypress.AUTWindow);
			const isDoc = 'documentElement' in (_subject as Document);
			const isEl = !isDoc && 'tagName' in (_subject as JQuery<HTMLElement>);

			if (!isWin && !isDoc && !isEl) {
				throw new Error(
					`${ERR} Invalid target. It must be a function returning 'cy.window', 'cy.document' or 'cy.get'.`
				);
			}

			if (!Array.isArray(property) && typeof property !== 'string') {
				throw new Error(`${ERR} Invalid properties. It must be an array of string or a string.`);
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
							: (_subject as JQuery<HTMLElement>),
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

function getProp({ isWin, cyWin, target, prop }: GetPropOptions): string | number | undefined {
	if (prop in target) {
		return (target as Record<string, any>)[prop];
	}

	if (isWin) {
		throw new Error(`${ERR} Invalid window property: ${prop}`);
	}

	if (prop.includes('.')) {
		const [method, _prop] = prop.split('.');
		const value = (target as Record<string, any>)[method]?.()?.[_prop];
		if (typeof value === 'undefined' || value === null) {
			throw new Error(`${ERR} Invalid DOM property / method: ${prop}`);
		}
		return value;
	}

	const computedStyle = cyWin
		.getComputedStyle(target as unknown as HTMLElement)
		.getPropertyValue(prop);

	if (computedStyle === '') {
		throw new Error(`${ERR} Invalid DOM/CSS property: ${prop}`);
	}

	return computedStyle;
}

function _waitFrames<T>({ isWin, isDoc, cyWin, target, prop, frames }: WaitFramesOptions) {
	return new Cypress.Promise<WaitCmdReturn<T>>((resolve, reject) => {
		let rafId: DOMHighResTimeStamp | undefined = 0;
		let prevValue: number | string | undefined | null = null;
		let frameCount = 0;
		let attempts = 0;

		function scrollEnd() {
			try {
				const nextValue = getProp({ isWin, cyWin, target, prop });

				if (prevValue === null || prevValue !== nextValue) {
					if (frameCount > 0) {
						attempts++;
					}

					frameCount = 0;
					prevValue = nextValue;

					return cyWin.requestAnimationFrame(scrollEnd);
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
					cyWin.requestAnimationFrame(scrollEnd);
				}
			} catch (error) {
				reject(error);
			}
		}

		rafId = cyWin.requestAnimationFrame(scrollEnd);
	});
}
