# API Setup Guide

This project uses two AI APIs for generating Mermaid diagrams:

1. **Groq API** - For prompt identification and improvement
2. **DeepSeek API** - For diagram generation

## Setup Instructions

### 1. Get API Keys

#### Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Create a new API key
4. Copy the API key

#### DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory of your project:

```bash
# API Keys for Mermaid Diagram Generation (Server-side)
GROQ_API_KEY=your_groq_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

Replace `your_groq_api_key_here` and `your_deepseek_api_key_here` with your actual API keys.

### 3. Restart Development Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

### 4. Test the Integration

1. Open the application in your browser
2. Enter a diagram description in the prompt field
3. Click "Generate" to test the AI integration

## How It Works

This application uses **Next.js Server Actions** for secure API calls:

1. **Prompt Identification**: The Groq API identifies what type of diagram the user wants to create
2. **Prompt Improvement**: The Groq API improves the user's prompt for better diagram generation
3. **Diagram Generation**: The DeepSeek API generates the actual Mermaid diagram code

### Security Benefits

- API keys are stored server-side and never exposed to the client
- All API calls are made from the server, protecting your API credentials
- Better performance as API calls are optimized server-side

## Supported Diagram Types

- Flowcharts
- Sequence Diagrams
- Class Diagrams
- Entity-Relationship Diagrams
- State Diagrams
- Gantt Charts

## Troubleshooting

- **"API key is not configured"**: Make sure you've added the API keys to your `.env.local` file
- **"No response received"**: Check your internet connection and API key validity
- **"Invalid diagram type"**: Try rephrasing your prompt to be more specific about the diagram type
