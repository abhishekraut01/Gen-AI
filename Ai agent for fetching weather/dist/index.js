import OpenAI from "openai";
import dotenv from 'dotenv';
import readlineSync from "readline-sync";
dotenv.config();
// Configure OpenAI client for Gemini API
const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});
async function fetchWeather(city) {
    const res = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`);
    const data = await res.json();
    return data?.current?.temp_c;
}
const system_prompt = `
You are a helpful assistant and answer the user's questions. 
If the user asks for current weather information, respond with ONLY a JSON object in this exact format:
{
  "needFuntionCall": true,
  "city": "city-name"
}

After receiving weather data, respond with ONLY a JSON object in this format:
{
  "needFuntionCall": false,
  "city": "city-name", 
  "output": "your response including the weather information"
}

otherwise chat normally like chatbot and assistant
and give response in this JSON format

{
  "needFuntionCall": false,
  "output": "your response here"
}
`;
async function main() {
    console.log("Chat started! Type 'quit', 'exit', or 'bye' to end the conversation.");
    // Initialize message history with system prompt
    let messageHistory = [
        { role: "system", content: system_prompt }
    ];
    // Main conversation loop
    while (true) {
        // Get user input
        const userPrompt = readlineSync.question("\nYou: ");
        // Check for exit commands
        if (userPrompt.toLowerCase().trim() === 'quit' ||
            userPrompt.toLowerCase().trim() === 'exit' ||
            userPrompt.toLowerCase().trim() === 'bye') {
            console.log("Assistant: Goodbye! Have a great day!");
            break;
        }
        // Add user message to history
        messageHistory.push({ role: "user", content: userPrompt });
        // Get initial AI response
        let response = await client.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: messageHistory,
            response_format: { type: "json_object" }
        });
        let call;
        try {
            call = JSON.parse(response.choices[0]?.message?.content || "{}");
        }
        catch (err) {
            console.error("Failed to parse AI response as JSON:", err);
            console.log("AI response:", response.choices[0]?.message?.content);
            continue; // Continue the conversation instead of returning
        }
        // Handle function calls (weather in this case)
        while (call.needFuntionCall) {
            console.log("🌤️  Fetching weather data...");
            const weatherTemp = await fetchWeather(call.city);
            // Add the weather result to message history
            messageHistory.push({
                role: "user",
                content: `The current temperature in ${call.city} is ${weatherTemp}°C. Please provide a response to the user.`
            });
            // Get AI's final response with weather data
            response = await client.chat.completions.create({
                model: "gemini-2.5-flash",
                messages: messageHistory,
                response_format: { type: "json_object" }
            });
            try {
                call = JSON.parse(response.choices[0]?.message?.content || "{}");
            }
            catch (err) {
                console.error("Failed to parse AI response as JSON:", err);
                console.log("AI response:", response.choices[0]?.message?.content);
                break;
            }
        }
        // Output the assistant's response
        if (call.output) {
            console.log("Assistant:", call.output);
            // Add assistant's response to message history for context
            messageHistory.push({ role: "assistant", content: call.output });
        }
    }
}
// Run the main function and handle errors
main().catch(console.error);
//# sourceMappingURL=index.js.map