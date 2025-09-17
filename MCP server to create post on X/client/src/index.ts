import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
import readline from "readline/promises";
dotenv.config()
const ai = new GoogleGenAI({});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

interface chatHistoryI {
    role: "user" | "model",
    parts: [
        {
            text: string,
            type: string
        }
    ]
}

let chatHistory: chatHistoryI[] = []

async function main() {
    while (true) {
        let userInput = await rl.question("You : ")

        chatHistory.push(
            {
                role: "user",
                parts: [{ text: userInput, type: "text" }],
            }
        )

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: chatHistory
        });

        let aiResponseText = response.text
        if (!aiResponseText) {
            return "Unable to generate content "
        }
        console.log("AI : ", aiResponseText)

        chatHistory.push(
            {
                role: "model",
                parts: [{ text: aiResponseText, type: "text" }],
            }
        )
    }
}

await main();