import { App } from './App';

describe('Window', () => {
	it('Should wait for scrollY', () => {
		cy.mount(<App />);
		cy.scrollTo('bottom');

		cy.waitFrames({
			subject: () => cy.window(),
			property: 'scrollY',
			frames: 30,
		}).then((data) => {
			cy.document().then((doc) => {
				const scrollHeight = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
				expect(data[0].value).to.equal(scrollHeight);
			});
		});

		cy.scrollTo('top');

		cy.waitFrames({
			subject: () => cy.window(),
			property: 'scrollY',
			frames: 30,
		}).then((data) => {
			expect(data[0].value).to.equal(0);
		});
	});
});
