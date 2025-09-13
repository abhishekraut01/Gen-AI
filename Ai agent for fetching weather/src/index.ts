import OpenAI from "openai";
import dotenv from 'dotenv'

dotenv.config()

const client  = new OpenAI({
    apiKey:process.env.GEMINI_API_KEY
})

