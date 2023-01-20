const dummyData = Array.from({ length: 30 }, (_, i) => ({
	title: `${i + 1}`.repeat(10),
	text: 'Ciao '.repeat(100),
}));

export function App() {
	return (
		<div style={{ maxWidth: 600 }}>
			{dummyData.map(({ title, text }) => (
				<div key={title}>
					<h1>{title}</h1>
					<p>{text}</p>
				</div>
			))}
		</div>
	);
}
