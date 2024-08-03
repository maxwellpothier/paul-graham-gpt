import {createClient} from "@supabase/supabase-js";
import {ParsedEvent, createParser} from "eventsource-parser";
import {ReconnectInterval} from "eventsource-parser";

export const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const OpenAIStream = async (prompt: string) => {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a helpful assistant that 
					answers queries about Paul Graham's essays.
					Respond in 3-5 sentences.`,
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 150,
			temperature: 0.0,
			stream: true,
		}),
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const stream = new ReadableStream({
		async start(controller) {
			const onParse = (event: ParsedEvent | ReconnectInterval) => {
				if (event.type === "event") {
					const data = event.data;

					if (data === "[DONE]") {
						controller.close();
						return;
					}

					try {
						const json = JSON.parse(data);
						console.log(json);
						const text = json.choices[0].delta.content;
						const queue = encoder.encode(text);
						controller.enqueue(queue);
					} catch (error) {
						controller.error(error);
					}
				}
			};
			const parser = createParser(onParse);
			for await (const chunk of response.body as any) {
				parser.feed(decoder.decode(chunk));
			}
		},
	});

	return stream;
};
