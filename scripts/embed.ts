import {PGEssay, PGJSON} from "@/types";
import {loadEnvConfig} from "@next/env";
import {createClient} from "@supabase/supabase-js";
import fs from "fs";
import OpenAI from "openai";

loadEnvConfig("");

const generateEmbeddings = async (essays: PGEssay[]) => {
	const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.SUPABASE_SERVICE_KEY
	);
};

(async () => {
	const json: PGJSON = JSON.parse(
		fs.readFileSync("scripts/pg.json", "utf-8")
	);

	await generateEmbeddings(json.essays);
})();
