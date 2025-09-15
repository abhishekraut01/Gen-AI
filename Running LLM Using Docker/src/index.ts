import OpenAI from "openai";

const client = new OpenAI({
    apiKey:"1",
    baseURL:"http://localhost:12434/engines/llama.cpp/v1"
})


const response = await client.chat.completions.create({
    model:"ai/gemma3:270M-F16",
    messages:[{
        role:"user",
        content:"Hey i am abhishek"
    }]
})

console.log(response.choices[0]?.message.content)