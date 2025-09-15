import OpenAI, { NotFoundError } from "openai";
import dotenv from 'dotenv'

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
})

async function main() {
    const response =await client.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
            {
                role: "user",
                content: "hey how are you"
            }
        ]
    })

    console.log(response.choices[0]?.message.content)
}

main()