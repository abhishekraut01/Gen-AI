import OpenAI, { NotFoundError } from "openai";
import dotenv from 'dotenv'
import readlineSync from "readline-sync"
dotenv.config()

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY
})


async function fetchWeather(city: string) {
    let res = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`)
    let data = await res.json()
    return data?.current?.temp_c;
}

let system_prompt = `
You are the helpfull assistent and answer the question of user whatever they want and if they want current weather information
then call the tool fetchWeather with input city for which user asking 

suppose user ask for what is weather in delhi 
so you will respond with {
needFuntionCall : "true",
city : "delhi"
}

after you use tool

needFuntionCall : "false",
city : "delhi"
output : ""
}

`

var UserPrompt = readlineSync.question("<<");



let messageHistory = [
    {
        role: "user",
        content: UserPrompt
    }
]


const response = await client.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
        {
            role: "user",
            content: UserPrompt
        },
        {
            role: "system",
            content: system_prompt
        }
    ]
})

messageHistory.push({
    role: "developer",
    content: JSON.stringify(response.choices[0]?.message.content as string)
})

let call = JSON.parse(response.choices[0]?.message.content as string)

async function processAI() {
    while (true) {

        if (call.needFuntionCall) {
            let responseInFN = await fetchWeather(call.city)
            messageHistory.push({
                role: "developer",
                content: JSON.stringify(responseInFN.choices[0]?.message.content as string)
            })
        } else {
            return call.output
        }

        call = client.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: messageHistory,
            response_format: { type: "json_object" }
        })

    }
}


processAI()