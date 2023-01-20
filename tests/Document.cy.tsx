import { App } from './App';

it('Single Property', () => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: () => cy.document(),
		property: 'scrollTop',
		frames: 20,
	}).then((data) => {
		expect(data[0].value).to.equal(data[0].subject.documentElement.scrollTop);
	});

	cy.scrollTo('top');

	cy.waitFrames({
		subject: () => cy.document(),
		property: 'scrollTop',
		frames: 20,
	}).then((data) => {
		expect(data[0].value).to.equal(0);
	});
});

it.only('Multiple Properties', () => {
	cy.mount(<App />);

	cy.document().then((doc) => {
		expect(doc.documentElement.style.color).to.equal('rgb(0, 0, 255)');
		expect(doc.documentElement.style.backgroundColor).to.equal('rgb(255, 255, 255)');
	});

	cy.get('button').click();
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: () => cy.document(),
		property: ['color', 'background-color', 'scrollTop'],
		frames: 20,
	}).then((data) => {
		expect(data.length).to.equal(3);

		expect(data[0].value).to.equal('rgb(0, 128, 0)');
		expect(data[1].value).to.equal('rgb(255, 0, 0)');
		expect(data[2].value).to.equal(data[2].subject.documentElement.scrollTop);
	});
});

it('Should throw error if unknown prop', (end) => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.expectError(end, '[cypress-wait-frames] - Invalid DOM/CSS property: CiaoCiao');

	cy.waitFrames({
		subject: () => cy.document(),
		property: ['background-color', 'CiaoCiao'],
		frames: 30,
	});
});
