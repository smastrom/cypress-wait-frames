import { App } from './App';

it('Single Property', () => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: () => cy.window(),
		property: 'scrollY',
		frames: 30,
	}).then((data) => {
		cy.document().then((doc) => {
			const scrollHeight =
				doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
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

it('Multiple Properties', () => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: () => cy.window(),
		property: ['scrollY', 'pageYOffset'],
		frames: 30,
	}).then((data) => {
		expect(data.length).to.equal(2);

		cy.document().then((doc) => {
			const scrollHeight =
				doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
			expect(data[0].value).to.equal(scrollHeight);
			expect(data[1].value).to.equal(scrollHeight);
		});
	});
});

it('Should throw error if unknown prop', (end) => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.expectError(end, '[cypress-wait-frames] - Invalid window property: background-color');

	cy.waitFrames({
		subject: () => cy.window(),
		// @ts-expect-error - CSS properties not supported on window
		property: 'background-color',
	});
});
