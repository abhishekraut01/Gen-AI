import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import cors from 'cors';
const app = express();

app.use(cors({
    origin: '*', 
    // origin: ['https://your-remote-domain.com', 'https://your-other-remote-domain.com'],
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));


app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport | undefined;

    // Case 1: Reuse existing transport
    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
        return await transport.handleRequest(req, res, req.body);
    }

    // Case 2: New initialization request
    if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                transports[sessionId] = transport!;
            },
        });

        // Cleanup transport on close
        transport.onclose = () => {
            if (transport?.sessionId) {
                delete transports[transport.sessionId];
            }
        };

        const server = new McpServer({
            name: "example-server",
            version: "1.0.0"
        });

        // ... set up server resources, tools, and prompts ...

        await server.connect(transport);
        return await transport.handleRequest(req, res, req.body);
    }

    // Case 3: Invalid request
    return res.status(400).json({
        jsonrpc: '2.0',
        error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
        },
        id: null,
    });
});


// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3001, () => {
    console.log('server is running on port 3000')
});