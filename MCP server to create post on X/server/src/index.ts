// server.ts
import express from "express";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// For HTTP-based server (optional, if you want both stdio and HTTP)
const app = express();
app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
app.use(express.json());

// Twitter post storage (in production, this would be a database)
const twitterPosts: Array<{
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
}> = [];

// Create MCP Server
const server = new Server(
  {
    name: "twitter-post-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the create_twitter_post tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_twitter_post",
        description: "Create a Twitter post with content and hashtags",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The main content of the Twitter post (max 280 characters)",
            },
            hashtags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of hashtags for the post (without # symbol)",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "list_twitter_posts",
        description: "List all created Twitter posts",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "optimize_twitter_post",
        description: "Optimize a Twitter post for engagement",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content to optimize",
            },
            style: {
              type: "string",
              enum: ["professional", "casual", "motivational", "educational"],
              description: "The style of the post",
            },
          },
          required: ["content"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "create_twitter_post": {
      const content = args.content as string;
      const hashtags = (args.hashtags as string[]) || [];

      // Validate Twitter post length
      if (content.length > 280) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Post exceeds 280 characters (current: ${content.length}). Please shorten the content.`,
            },
          ],
        };
      }

      // Create the post
      const post = {
        id: randomUUID(),
        content,
        hashtags,
        createdAt: new Date().toISOString(),
      };

      twitterPosts.push(post);

      // Format the post with hashtags
      const formattedPost = `${content}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      return {
        content: [
          {
            type: "text",
            text: `✅ Twitter post created successfully!\n\n📝 Post ID: ${post.id}\n\n${formattedPost}\n\nCharacter count: ${formattedPost.length}/280`,
          },
        ],
      };
    }

    case "list_twitter_posts": {
      if (twitterPosts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No Twitter posts have been created yet.",
            },
          ],
        };
      }

      const postsList = twitterPosts.map((post, index) => {
        const formattedPost = `${post.content}\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`;
        return `${index + 1}. [${post.createdAt}]\n${formattedPost}\n`;
      }).join('\n---\n');

      return {
        content: [
          {
            type: "text",
            text: `📋 All Twitter Posts (${twitterPosts.length}):\n\n${postsList}`,
          },
        ],
      };
    }

    case "optimize_twitter_post": {
      const content = args.content as string;
      const style = (args.style as string) || "professional";

      let optimizedContent = content;
      let suggestions: string[] = [];

      // Style-based optimizations
      switch (style) {
        case "motivational":
          if (!content.includes("💪") && !content.includes("🚀") && !content.includes("✨")) {
            suggestions.push("Add emojis for emotional impact");
            optimizedContent = `💪 ${content} 🚀`;
          }
          if (!content.match(/[!?]/)) {
            suggestions.push("Add exclamation for energy");
            optimizedContent = optimizedContent.replace(/\.$/, "!");
          }
          break;
        
        case "professional":
          suggestions.push("Keep tone formal and data-driven");
          break;
        
        case "casual":
          suggestions.push("Use conversational tone");
          break;
        
        case "educational":
          if (!content.includes("🧵")) {
            suggestions.push("Consider thread format for complex topics");
            optimizedContent = `🧵 ${content}`;
          }
          break;
      }

      // General optimizations
      if (content.length < 100) {
        suggestions.push("Consider expanding content for better engagement");
      }

      if (!content.match(/\d/)) {
        suggestions.push("Consider adding specific numbers/statistics");
      }

      return {
        content: [
          {
            type: "text",
            text: `📊 Optimized Twitter Post:\n\n${optimizedContent}\n\n💡 Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nCharacter count: ${optimizedContent.length}/280`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
      };
  }
});

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Twitter Post MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});