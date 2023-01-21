import { App } from './App';

it('Single Property', () => {
	cy.mount(<App />);

	cy.get('h1')
		.its(15)
		.then((el) => {
			el.scrollIntoView();
		});

	cy.waitFrames({
		subject: () => cy.get('h1').its(15),
		property: 'getBoundingClientRect.top',
	}).then((data) => {
		expect(data[0].value).to.satisfy((value: number) => value >= -2 && value <= 2);
	});
});

it.only('Multiple Properties', () => {
	cy.mount(<App />);

	cy.get('#Container').then((el) => {
		expect(el[0].style.backgroundColor).to.equal('rgb(255, 255, 255)');
		expect(el[0].getBoundingClientRect().top).to.equal(0);
	});

	cy.get('button').click();
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: () => cy.get('#Container'),
		property: ['getBoundingClientRect.top', 'background-color'],
	}).then((data) => {
		expect(data.length).to.equal(2);

		const { scrollTop } = document.documentElement;
		expect(data[0].value).to.approximately(-scrollTop, 2);
		expect(data[1].value).to.equal('rgb(255, 0, 0)');
	});
});

it('Should throw error if invalid subject', (end) => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.expectError(
		end,
		"[cypress-wait-frames] - Invalid subject. It must be either 'cy.window', 'cy.document' or '() => cy.get()'."
	);

	cy.waitFrames({
		subject: () => cy.get('h1'), // Needs its()
		property: 'background-color',
		frames: 30,
	});
});
