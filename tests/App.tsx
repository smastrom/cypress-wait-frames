import { useEffect, useState } from 'react';

const dummyData = Array.from({ length: 30 }, (_, i) => ({
	title: `${i + 1}`.repeat(10),
	text: 'Ciao '.repeat(200),
}));

export function App() {
	const [toggleColor, setToggleColor] = useState(false);

	function switchColor() {
		setToggleColor((prev) => !prev);
	}

	useEffect(() => {
		document.documentElement.style.color = toggleColor ? 'rgb(0, 128, 0)' : 'rgb(0, 0, 255)';
		document.documentElement.style.backgroundColor = toggleColor
			? 'rgb(255, 0, 0)'
			: 'rgb(255, 255, 255)';
	}, [toggleColor]);

	return (
		<div id="Container">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="300"
				height="300"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<polyline points="8 12 12 16 16 12"></polyline>
				<line x1="12" y1="8" x2="12" y2="16"></line>
			</svg>

			<button onClick={switchColor}>Red</button>

			{dummyData.map(({ title, text }) => (
				<div key={title}>
					<h1>{title}</h1>
					<p>{text}</p>
				</div>
			))}
		</div>
	);
}
