
# Twitter MCP Bot

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file and add your Google API key:
```
GOOGLE_API_KEY=your_api_key_here
```

3. Build the project:
```bash
npm run build
```

## Running the Application

### Option 1: Run separately (for debugging)
```bash
# Terminal 1 - Start server
npm run start:server

# Terminal 2 - Start client
npm run start:client
```

### Option 2: Run integrated (recommended)
```bash
npm run start:client
```

## Usage Examples

1. **Create a Twitter post:**
   - Type: "Create a Twitter post about working hard to become top 1%"
   - The bot will generate an engaging post with hashtags

2. **List all posts:**
   - Type: "List all my Twitter posts"

3. **Optimize a post:**
   - Type: "Optimize this post: 'Success requires dedication'"

## Features

- 🤖 AI-powered content generation using Google Gemini
- 📝 Automatic hashtag generation
- 🎯 Character limit validation (280 chars)
- 💡 Post optimization suggestions
- 📊 Post management and listing