import Image from "next/image";
import Head from "next/head";
import {useState} from "react";
import {Inter} from "next/font/google";
import {PGChunk} from "@/types";
import endent from "endent";

const inter = Inter({subsets: ["latin"]});

export default function Home() {
	const [query, setQuery] = useState("");
	const [answer, setAnswer] = useState("");
	const [chunks, setChunks] = useState<PGChunk[]>([]);
	const [loading, setLoading] = useState(false);

	const handleAnswer = async () => {
		setLoading(true);
		setAnswer("");

		const searchResponse = await fetch("/api/search", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({query}),
		});

		if (!searchResponse.ok) {
			setLoading(false);
			return;
		}

		const results: PGChunk[] = await searchResponse.json();
		setChunks(results);

		const prompt = endent`
		Use the following passages to answer the question: ${query}
		${results.map(chunk => chunk.content).join("\n")}
		`;

		const answerResponse = await fetch("/api/answer", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({prompt: query}),
		});

		if (!answerResponse.ok) {
			setLoading(false);
			return;
		}

		const data = answerResponse.body;

		if (!data) {
			setLoading(false);
			return;
		}

		const reader = data.getReader();
		const decoder = new TextDecoder();
		let done = false;

		while (!done) {
			const {value, done: doneReading} = await reader.read();
			done = doneReading;
			const chunkValue = decoder.decode(value);
			setAnswer(prev => prev + chunkValue);
		}
		setLoading(false);
	};

	return (
		<>
			<Head>
				<title>Paul Graham GPT</title>
			</Head>

			<div>
				<input
					className="border text-black"
					type="text"
					placeholder="Ask a question..."
					value={query}
					onChange={e => setQuery(e.target.value)}
				/>
				<button onClick={handleAnswer}>Ask</button>
			</div>
			<div className="text-white">
				{loading ? <div>Loading...</div> : <div>{answer}</div>}
			</div>
		</>
	);
}
