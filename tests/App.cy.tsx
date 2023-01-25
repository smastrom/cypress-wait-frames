import { App } from './App';

it('Should get single property on Window', () => {
	cy.mount(<App />);

	cy.waitFrames({
		subject: cy.window,
		property: 'outerHeight',
	}).then(([{ value }]) => {
		cy.wrap(value).should('exist');
	});
});

it('Should get single property on DocumentElement', () => {
	cy.mount(<App />);

	cy.waitFrames({
		subject: cy.document,
		property: 'scrollHeight',
	}).then(([{ value }]) => {
		cy.wrap(value).should('exist');
	});
});

it('Should get single property on HTMLElement', () => {
	cy.mount(<App />);

	cy.get('h1').eq(15).scrollIntoView();

	cy.waitFrames({
		subject: () => cy.get('h1').eq(15),
		property: 'getBoundingClientRect.top',
	}).then(([{ value }]) => {
		cy.wrap(value).should('be.approximately', 0, 2);
	});
});

it('Should get single property on SVGGraphicsElement', () => {
	cy.mount(<App />);

	cy.waitFrames({
		subject: () => cy.get('circle'),
		property: 'getBBox.y',
	}).then(([{ value }]) => {
		cy.wrap(value).should('exist');
	});
});

it.only('Should get multiple properties on Window', () => {
	cy.mount(<App />);

	cy.waitFrames({
		subject: cy.window,
		property: ['outerHeight', 'scrollY'],
	}).then(([{ value: outerHeight }, { value: scrollY }]) => {
		expect(outerHeight).to.exist;
		expect(scrollY).to.exist;
	});
});

it('Should get multiple properties on DocumentElement/HTMLElement', () => {
	cy.mount(<App />);

	cy.document().then((doc) => {
		expect(doc.documentElement.style.color).to.equal('rgb(0, 0, 255)');
		expect(doc.documentElement.style.backgroundColor).to.equal('rgb(255, 255, 255)');
	});

	cy.get('button').click();
	cy.scrollTo('bottom');

	cy.waitFrames({
		subject: cy.document,
		property: ['color', 'background-color', 'scrollTop', '--Var'],
	}).then(
		([
			{ value: color },
			{ value: backgroundColor },
			{ value: scrollTop },
			{ value: CSSVar },
		]) => {
			expect(color).to.equal('rgb(0, 128, 0)');
			expect(backgroundColor).to.equal('rgb(255, 0, 0)');
			expect(scrollTop).to.exist;
			expect(CSSVar).to.equal('red');
		}
	);
});

it('Should throw error if querying CSS on Window', (end) => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.expectError(end, '[cypress-wait-frames] - Invalid window property: background-color');

	cy.waitFrames({
		subject: cy.window,
		// @ts-expect-error - Not supported on Window
		property: 'background-color',
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
		subject: () => cy.get('h1'), // Needs eq(n)
		property: 'background-color',
	});
});

it('Should throw error if invalid prop', (end) => {
	cy.mount(<App />);
	cy.scrollTo('bottom');

	cy.expectError(end, '[cypress-wait-frames] - Invalid DOM/CSS property: XXX');

	cy.waitFrames({
		subject: cy.document,
		// @ts-expect-error - XXX is not a valid property
		property: ['background-color', 'XXX'],
	});
});
