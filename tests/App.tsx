import { CSSProperties, useEffect, useState } from 'react';

const dummyData = Array.from({ length: 30 }, (_, i) => ({
	title: `${i + 1}`.repeat(10),
	text: 'Ciao '.repeat(100),
}));

const styles: CSSProperties = {
	maxWidth: 600,
	transition: 'background-color 500ms ease-in-out',
};

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
		<div
			style={{ ...styles, backgroundColor: toggleColor ? 'rgb(255, 0, 0)' : 'rgb(255, 255, 255)' }}
			id="Container"
		>
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
