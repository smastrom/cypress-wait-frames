import '../../src/index';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			expectError(done: () => void, message: string): boolean;
		}
	}
}

function normalize(str: string): string {
	return str.replace(/\s+/g, ' ');
}

Cypress.Commands.add('expectError', (end: Mocha.Done, message) => {
	cy.on('fail', (err) => {
		expect(normalize(err.message)).to.eq(normalize(message));
		end(); // Complete
		return false; // Prevent failure
	});
});
