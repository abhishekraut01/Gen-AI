import { openai } from "@ai-sdk/openai";
import * as ai from "ai";
import { stepCountIs, tool } from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { z } from "zod";
import dotenv from 'dotenv'
dotenv.config()

const { generateText } = wrapAISDK(ai);

async function main() {
    await generateText({
        model: openai("gpt-5-mini"),
        system: "You are a helpful assistant.",
        messages: [
            { role: "user", content: "What is the weather in San Francisco?" },
        ],
        tools: {
            getWeather: tool({
                description: "Get weather for a given city.",
                inputSchema: z.object({
                    city: z.string().describe("The city to get the weather for"),
                }),
                execute: async ({ city }) => `It's always sunny in ${city}!`,
            }),
        },
        stopWhen: stepCountIs(5),
    });
}

main()