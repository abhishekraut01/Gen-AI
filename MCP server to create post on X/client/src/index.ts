// client.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import readline from "readline/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Initialize MCP Client
const client = new Client({
    name: "twitter-bot-client",
    version: "1.0.0"
}, {
    capabilities: {}
});

// Chat history interface
interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

let chatHistory: ChatMessage[] = [];

// System prompt for the AI
const SYSTEM_PROMPT = `You are a Twitter post creation assistant. When users ask you to create Twitter posts, you should:
1. Create engaging, concise content (max 280 characters)
2. Add relevant hashtags
3. Optimize for the target audience
4. Use the available MCP tools to create and manage posts

Available tools:
- create_twitter_post: Create a new Twitter post
- list_twitter_posts: List all created posts
- optimize_twitter_post: Optimize a post for better engagement

When creating posts, always consider:
- Character limit (280)
- Engagement tactics (questions, emojis, statistics)
- Relevant hashtags
- Clear call-to-action when appropriate`;

// Connect to MCP server
async function connectToServer() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["./dist/server.js"], // Adjust path as needed
    });

    await client.connect(transport);
    console.log("✅ Connected to Twitter MCP Server");

    // List available tools
    const tools = await client.listTools();
    console.log("📦 Available tools:", tools.tools.map(t => t.name).join(", "));
    
    return tools.tools;
}

// Parse AI response to extract tool calls
function parseToolCallFromResponse(response: string): {
    shouldCallTool: boolean;
    toolName?: string;
    toolArgs?: any;
} {
    // Check if response suggests creating a Twitter post
    if (response.toLowerCase().includes("creating") || 
        response.toLowerCase().includes("i'll create") ||
        response.toLowerCase().includes("let me create")) {
        
        // Extract content between quotes or after colon
        const contentMatch = response.match(/"([^"]+)"|: (.+)/);
        const content = contentMatch ? (contentMatch[1] || contentMatch[2]) : "";
        
        // Extract hashtags
        const hashtagMatches = response.match(/#\w+/g);
        const hashtags = hashtagMatches ? hashtagMatches.map(h => h.slice(1)) : [];
        
        if (content) {
            return {
                shouldCallTool: true,
                toolName: "create_twitter_post",
                toolArgs: {
                    content: content.trim(),
                    hashtags: hashtags.length > 0 ? hashtags : ["motivation", "success", "mindset"]
                }
            };
        }
    }

    // Check for list command
    if (response.toLowerCase().includes("list") && response.toLowerCase().includes("posts")) {
        return {
            shouldCallTool: true,
            toolName: "list_twitter_posts",
            toolArgs: {}
        };
    }

    // Check for optimize command
    if (response.toLowerCase().includes("optimize")) {
        const contentMatch = response.match(/"([^"]+)"/);
        if (contentMatch) {
            return {
                shouldCallTool: true,
                toolName: "optimize_twitter_post",
                toolArgs: {
                    content: contentMatch[1],
                    style: "motivational"
                }
            };
        }
    }

    return { shouldCallTool: false };
}

// Create a Twitter post using MCP tool
async function createTwitterPost(content: string, hashtags: string[] = []) {
    try {
        const result = await client.callTool({
            name: "create_twitter_post",
            arguments: {
                content,
                hashtags
            }
        });
        
        if (Array.isArray(result.content) && result.content[0] && typeof result.content[0].text === "string") {
            return result.content[0].text;
        }
        return "Unexpected response format from MCP tool";
    } catch (error) {
        console.error("Error creating Twitter post:", error);
        return "Failed to create Twitter post";
    }
}

// Main conversation loop
async function main() {
    console.log("🐦 Twitter Post Creation Bot");
    console.log("Type 'quit' to exit\n");

    // Connect to MCP server
    const tools = await connectToServer();

    // Add system prompt to history
    chatHistory.push({
        role: "system",
        content: SYSTEM_PROMPT
    });

    while (true) {
        const userInput = await rl.question("\n👤 You: ");

        if (userInput.toLowerCase() === 'quit') {
            console.log("Goodbye! 👋");
            break;
        }

        // Add user message to history
        chatHistory.push({
            role: "user",
            content: userInput
        });

        try {
            // Check if this is a direct request for Twitter post creation
            const isTwitterRequest = userInput.toLowerCase().includes("twitter") || 
                                    userInput.toLowerCase().includes("tweet") ||
                                    userInput.toLowerCase().includes("post");

            let enhancedPrompt = userInput;
            
            if (isTwitterRequest) {
                // Extract the topic from the user input
                const topicMatch = userInput.match(/about|on topic|regarding|:\s*"?([^"]+)"?/i);
                const topic = topicMatch ? topicMatch[1] : userInput;
                
                enhancedPrompt = `Create a Twitter post about: "${topic}". 
                Make it engaging, add relevant emojis, and include 3-5 hashtags. 
                Keep it under 280 characters. Optimize for maximum engagement.`;
            }

            // Generate content with Gemini
            const result = await model.generateContent(enhancedPrompt);
            const response = await result.response;
            const aiResponse = response.text();

            console.log("\n🤖 AI:", aiResponse);

            // Check if we should call MCP tools based on the response
            const toolCall = parseToolCallFromResponse(aiResponse);
            
            if (toolCall.shouldCallTool && toolCall.toolName) {
                console.log(`\n🔧 Calling tool: ${toolCall.toolName}`);
                const toolResult = await client.callTool({
                    name: toolCall.toolName,
                    arguments: toolCall.toolArgs || {}
                });
                if (Array.isArray(toolResult.content) && toolResult.content[0] && typeof toolResult.content[0].text === "string") {
                    console.log("\n📌 Result:", toolResult.content[0].text);
                } else {
                    console.log("\n📌 Result: (unexpected format)", toolResult.content);
                }
            } else if (isTwitterRequest) {
                // If it's a Twitter request but no tool was called, extract and create the post
                const lines = aiResponse.split('\n').filter(line => line.trim());
                const postContent = lines.find(line => 
                    !line.startsWith('#') && 
                    line.length > 20 && 
                    line.length <= 280
                ) || lines[0];
                
                const hashtags = aiResponse.match(/#\w+/g)?.map(h => h.slice(1)) || 
                                ["motivation", "success", "mindset"];
                
                if (postContent) {
                    console.log("\n🔧 Creating Twitter post...");
                    const result = await createTwitterPost(
                        postContent.replace(/#\w+/g, '').trim(),
                        hashtags
                    );
                    console.log("\n📌", result);
                }
            }

            // Add AI response to history
            chatHistory.push({
                role: "assistant",
                content: aiResponse
            });

        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Cleanup
    await client.close();
    rl.close();
}

// Run the client
main().catch(console.error);