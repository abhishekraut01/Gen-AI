import OpenAI, { NotFoundError } from "openai";
import dotenv from 'dotenv'

dotenv.config()

const client  = new OpenAI({
    apiKey:process.env.GEMINI_API_KEY
})


async function fetchWeather(city:string){
    let res = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`)
    let data = await res.json()
    return data?.current?.temp_c;
}

