import OpenAI from "openai";
import dotenv from 'dotenv';
import { exec } from "node:child_process";
import readlineSync from 'readline-sync';
import { systemPrompt } from "./systemPrompt.js";
dotenv.config()

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
})

function fetachWeather(city: string): string {
    return `weather for ${city} is 69 degree `
}

function handleCommandExecution(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
    });
  });
}

const AvailableTools = {
    "fetachWeather": fetachWeather,
    "handleCommandExecution": handleCommandExecution
}

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

            messageHistory.push({
                role: "assistant",
                content: response.choices[0]?.message?.content
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
                console.log(`🧠Processing : ${parsedData.content}`)
                continue
            }

            if (parsedData.step && parsedData.step === "think") {
                console.log(`thinking : ${parsedData.content}`)
                continue
            }

            if (parsedData.step && parsedData.step === "observe") {
                console.log(`observing : ${parsedData.content}`)
                continue
            }

            if (parsedData.step && parsedData.step === "action") {
                let res
                const tool = parsedData.tool
                const inputData = parsedData.input

                if (tool && tool in AvailableTools) {
                    res = await AvailableTools[tool as keyof typeof AvailableTools](inputData);
                } else {
                    res = "Tool not found";
                }

                messageHistory.push({
                    role: "assistant",
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