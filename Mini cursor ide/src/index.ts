import OpenAI from "openai";
import dotenv from 'dotenv';
import readlineSync from 'readline-sync';
dotenv.config()

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
})

function fetachWeather(city: string): string {
    return `weather for ${city} is 69 degree `
}

const AvailableTools = {
    "fetachWeather": fetachWeather
}

const systemPrompt = `
You are a helpful assistant that always follows a structured reasoning loop: PROCESS → THINK → ACTION → OBSERVE → OUTPUT.

## Core Instructions
1. Always analyze the user's query carefully in the PROCESS and THINK steps (at least 4 to 5 times of refinement).
2. If the query requires a tool, call an ACTION with the correct tool and input.
3. After calling an ACTION, always wait for OBSERVE (the tool result) before proceeding.
4. Based on the OBSERVE result, either return the final OUTPUT or continue the loop.
5. Always produce output in strict JSON format (one step at a time).
6. Never skip steps. Always wait for the next step before moving on.
7. Only call tools that are explicitly listed in **Available Tools**.

## Available Tools
- \`fetachWeather(city: string): string\`

## Output Format
Each step must strictly follow this schema:
{
  "step": "string",   // one of: process | think | action | observe | output
  "content": "string",
  "tool": "string (optional, required only for action)",
  "input": "string (optional, required only for action)"
}

## Example Walkthrough
**User Input:** "what is weather in nagpur?"

Steps:
{ "step": "process", "content": "User is asking for weather in nagpur." }
{ "step": "think", "content": "To answer, I need to find today's weather for nagpur." }
{ "step": "think", "content": "The correct tool to use is fetachWeather." }
{ "step": "action", "tool": "fetachWeather", "input": "nagpur", "content": "Calling fetachWeather with city = nagpur" }
{ "step": "observe", "content": "Weather for nagpur is 69 degree." }
{ "step": "think", "content": "Now I can prepare the final response using the observed data." }
{ "step": "output", "content": "Hey bro, today's weather in Nagpur is 69 degrees — pretty hot, take care!" }
`;


async function main() {

    let messageHistory: any[] = [
        { role: "system", content: systemPrompt }
    ];

    while (true) {

        const userPrompt = readlineSync.question("\nYou: ");

        if (userPrompt.toLocaleLowerCase() === "exit") {
            break
        }

        messageHistory.push({ role: "user", content: userPrompt });

        while (true) {

            let response = await client.chat.completions.create({
                model: "gemini-2.0-flash",
                messages: messageHistory,
                response_format: { type: "json_object" }
            })

            let parsedData;

            try {
                parsedData = JSON.parse(response.choices[0]?.message?.content || "{}");
            } catch (error) {
                console.error("Failed to parse AI response as JSON:", error);
                console.log("AI response:", response.choices[0]?.message?.content);
                continue;
            }

            if (parsedData.step && parsedData.step === "process") {
                messageHistory.push({
                    role: "assistant",
                    content: JSON.stringify(parsedData)
                })

                continue
            }

            if (parsedData.step && parsedData.step === "think") {
                messageHistory.push({
                    role: "assistant",
                    content: JSON.stringify(parsedData)
                })

                continue
            }

            if (parsedData.step && parsedData.step === "observe") {
                messageHistory.push({
                    role: "assistant",
                    content: JSON.stringify(parsedData)
                })

                continue
            }

            if (parsedData.step && parsedData.step === "action") {
                let res
                const tool = parsedData.tool
                const inputData = parsedData.input

                if (tool && tool in AvailableTools) {
                    res = AvailableTools[tool as keyof typeof AvailableTools](inputData);
                } else {
                    res = "Tool not found";
                }

                messageHistory.push({
                    role: "user",
                    content: res
                })

                continue
            }

            if (parsedData.step && parsedData.step === "output") {
                console.log(parsedData.content)
                break
            }
        }

    }

}

main().catch((err) => {
    console.log(err)
}) 