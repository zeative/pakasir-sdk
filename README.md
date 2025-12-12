<div align="center">
  <img alt="ZaFlow - Lightweight TypeScript library for building efficient AI agent workflows and Langchain/Langgraph alternative." src="https://socialify.git.ci/zeative/zaflow/image?custom_description=Lightweight+TypeScript+library+for+building+efficient+AI+agent+flows.&custom_language=TypeScript&description=1&font=Inter&language=1&owner=1&pattern=Charlie+Brown&theme=Auto">

  <h1 align="center">ZaFlow - Lightweight TypeScript library for building efficient AI agent workflows and Langchain/Langgraph alternative.</h1>

<a href="https://www.npmjs.com/package/zaflow"><img src="https://img.shields.io/npm/v/zaflow.svg" alt="NPM Version"></a>
<a href="https://www.npmjs.com/package/zaflow"><img src="https://img.shields.io/npm/dw/zaflow?label=npm&color=%23CB3837" alt="NPM Downloads"></a>
<a href="https://github.com/zeative/zaflow/releases"><img src="https://img.shields.io/npm/dt/zaflow" alt="NPM Downloads"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/languages/code-size/zeative/zaflow" alt="GitHub Code Size"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/issues/zeative/zaflow" alt="GitHub Issues"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/issues-closed/zeative/zaflow" alt="GitHub Closed Issues"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=flat-square&logo=typescript" alt="TypeScript"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/license/zeative/zaflow" alt="GitHub License"></a>
<a href="https://discord.gg/SfnWWYUe"><img alt="Discord" src="https://img.shields.io/discord/1105833273415962654?logo=discord&label=discord&link=https%3A%2F%2Fgithub.com%2Fzeative%2Fzaflow"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/stars/zeative/zaflow" alt="GitHub Stars"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/forks/zeative/zaflow" alt="GitHub Forks"></a>
<a href="https://github.com/zeative/zaflow"><img src="https://img.shields.io/github/watchers/zeative/zaflow" alt="GitHub Watchers"></a>
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/zeative/zaflow)

</div>

<div align="center">
  <p>
    <b>ZaFlow</b> is a blazing-fast, lightweight alternative to <a href="https://github.com/langchain-ai/langchain">LangChain</a> & <a href="https://github.com/langchain-ai/langgraph">LangGraph</a>. Build powerful AI agents in minutes with multi-agent workflows, tool calling, and flow control — all in pure TypeScript with zero bloat.
  </p>
</div>

<br>

<div align="center">

[🚀 Overview](#-overview) &nbsp;&nbsp;•&nbsp;&nbsp;
[🪶 Features](#-features) &nbsp;&nbsp;•&nbsp;&nbsp;
[📦 Installation](#-installation) &nbsp;&nbsp;•&nbsp;&nbsp;
[⚡ Quick Start](#-quick-start) &nbsp;&nbsp;•&nbsp;&nbsp;
[🔌 Providers](#-providers) &nbsp;&nbsp;•&nbsp;&nbsp;
[🎮 Execution Modes](#-execution-modes) &nbsp;&nbsp;•&nbsp;&nbsp;
[🛠️ Tools](#%EF%B8%8F-tools) &nbsp;&nbsp;•&nbsp;&nbsp;
[🤖 Agents](#-agents) &nbsp;&nbsp;•&nbsp;&nbsp;
[🔄 Flow Control](#-flow-control) &nbsp;&nbsp;•&nbsp;&nbsp;
[📷 Multimodal](#-multimodal-support) &nbsp;&nbsp;•&nbsp;&nbsp;
[🎯 Structured Output](#-structured-output) &nbsp;&nbsp;•&nbsp;&nbsp;
[🤝 Contributing](#-contributing)

<br>
<a href="https://discord.gg/SfnWWYUe"><img alt="Discord" src="https://discord.com/api/guilds/1105833273415962654/widget.png?style=banner2"></a>
</div>

<br>

---

## 🚀 Overview

> **🚧 BETA VERSION** — This library is currently in active development and not yet recommended for production use. APIs may change without notice. Use at your own risk and feel free to report issues or contribute!

ZaFlow solves the complexity of building AI agent systems by providing a high-level, opinionated API. It is built for developers who need to create chatbots, autonomous agents, or AI-powered workflows without getting bogged down in protocol details.

Targeting **Node.js** and **TypeScript** developers, ZaFlow integrates essential features like multi-provider support, tool calling, agent delegation, and flow control out of the box.

## ✨ Features

- 🪶 **Lightweight** - Minimal dependencies, fast startup, no bloat
- 🔌 **Multi-Provider** - OpenAI, Groq, Ollama, or custom provider
- 🤖 **3 Execution Modes** - Single, Agentic, Autonomous
- 🛠️ **Tools & Agents** - Define tools with Zod schema validation
- 🎯 **Flow Control** - Steps, conditions, loops, parallel execution
- 📷 **Multimodal** - Image, audio, file support with smart media reference system
- 📝 **Output Format** - Auto, JSON, WhatsApp formatting
- 🔄 **Agent Delegation** - Autonomous agent-to-agent communication
- 🧩 **Structured Output** - Type-safe responses with Zod schema validation

## 🎨 Concepts & Architecture

**ZaFlow** - Your orchestrator. Manages providers, tools, agents, and execution flows.

**Provider** - AI model connection (OpenAI, Groq, Ollama, or custom).

**Tool** - Functions that AI can call with validated parameters via Zod schemas.

**Agent** - Specialized AI with its own provider, prompt, and tools.

**ExecutionContext** - Rich context object with state, messages, and helpers.

## 📦 Installation

Install `zaflow` using your preferred package manager:

```bash
npm install zaflow
# or
pnpm add zaflow
# or
bun add zaflow
```

> **Note**: Requires Node.js v20+ and TypeScript for best experience.

### Peer Dependencies (optional)

```bash
# For OpenAI provider
npm install openai

# For Groq provider
npm install groq-sdk

# For Ollama provider
npm install ollama
```

## ⚡ Quick Start

Here is a minimal example to get your AI agent running:

```typescript
import { ZaFlow, groq } from 'zaflow';

const zaflow = new ZaFlow({
  provider: groq({ apiKey: 'your-api-key' }),
});

const result = await zaflow.run('Explain quantum computing in one sentence');
console.log(result.output);
```

## 🛠️ Configuration

The `ZaFlow` constructor accepts a configuration object:

| Option     | Type                | Description                    |
| :--------- | :------------------ | :----------------------------- |
| `provider` | `ProviderInterface` | Required. AI provider to use.  |
| `cost`     | `CostConfig`        | Optional. Token/cost tracking. |

## 💡 Advanced Usage

### With Tools

You can define tools with Zod schema validation for type-safe AI function calling.

```typescript
import { ZaFlow, groq, defineTool } from 'zaflow';
import { z } from 'zod';

const zaflow = new ZaFlow({
  provider: groq({ apiKey: 'xxx' }),
});

const calculator = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  schema: z.object({
    expression: z.string().describe('Math expression like "2 + 2"'),
  }),
  handler: ({ expression }) => eval(expression),
});

zaflow.registerTools([calculator]);

const result = await zaflow.run('What is 15 * 7 + 23?', { mode: 'agentic' });
```

## 🔌 Providers

> **Quick Jump:** [OpenAI](#openai) · [Groq](#groq) · [Ollama](#ollama) · [Custom](#custom-provider)

### OpenAI

```typescript
import { openai } from 'zaflow';

const provider = openai({
  apiKey: 'sk-xxx',
  model: 'gpt-4o-mini',
});
```

### Groq

```typescript
import { groq } from 'zaflow';

const provider = groq({
  apiKey: 'gsk_xxx',
  model: 'llama-3.3-70b-versatile',
});
```

### Ollama

```typescript
import { ollama } from 'zaflow';

const provider = ollama({
  host: 'http://localhost:11434',
  model: 'llama3.2',
});
```

### Custom Provider

```typescript
import { createProvider } from 'zaflow';

// with your external AI API
const customAI = createProvider({
  name: 'my-ai',
  handler: async ({ prompt, messages }) => {
    const res = await fetch('https://my-api.com/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    const json = await res.json();
    return json.response;
  },
});

const zaflow = new ZaFlow({ provider: customAI });
```

> ⚠️ **AI Model Quality Affects Tool Calling & Agent Delegation**
>
> The quality of your AI model significantly impacts whether tool calls and agent delegations work correctly. When using **Custom Provider** with external APIs:
>
> - **Low-quality models** may ignore tool instructions and respond directly instead of returning the required JSON format `{"tool": "...", "params": {...}}`
> - **Inconsistent behavior** - The same prompt may sometimes trigger tools and sometimes not
> - **Empty responses** - Some APIs may return empty responses causing execution errors
>
> **Recommendations:**
>
> | Use Case             | Recommended Models                                     |
> | -------------------- | ------------------------------------------------------ |
> | **Tool Calling**     | GPT-4, GPT-4o, Claude 3, Llama 3.1 70B+, Qwen 2.5 72B+ |
> | **Agent Delegation** | GPT-4o, Claude 3 Opus, Llama 3.3 70B                   |
> | **Simple Chat**      | Any model works fine                                   |
>
> For best results with tool calling and agent features, use built-in providers (`openai`, `groq`, `ollama`) with high-quality models that have native function calling support.

## 🎯 Execution Modes

> **Quick Jump:** [Single](#single-mode) · [Agentic](#agentic-mode) · [Autonomous](#autonomous-mode)

### Single Mode

One chat call without tools. Fastest and most token-efficient.

```typescript
const result = await zaflow.run('Hello!', { mode: 'single' });
```

### Agentic Mode

AI can automatically call tools when needed. **(Default)**

```typescript
const result = await zaflow.run('Search weather in Jakarta', {
  mode: 'agentic',
  maxToolCalls: 5,
});
```

### Autonomous Mode

AI can call tools AND delegate to other agents.

```typescript
const result = await zaflow.run('Analyze this image and generate a poem', {
  mode: 'autonomous',
  maxIterations: 10,
});
```

## 🛠️ Tools

> **Quick Jump:** [Define Tool](#defining-a-tool) · [Tool Config](#tool-configuration) · [Media Handling](#tool-with-media-handling)

### Defining Tool

```typescript
import { defineTool } from 'zaflow';
import { z } from 'zod';

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  schema: z.object({
    city: z.string().describe('City name'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  handler: async ({ city, unit = 'celsius' }) => {
    // const data = await fetchWeatherAPI...
    return `Currently in ${city} is 20°`;
  },
});
```

### Tool Configuration

```typescript
const tool = defineTool({
  ...,
  config: {
    timeout: 10000,
    cacheable: true,
    cacheTTL: 300000,
    retryable: true,
    maxRetries: 3,
  },
});
```

### Tool with Media Handling

```typescript
const imageAnalyzer = defineTool({
  name: 'analyze_image',
  description: 'Analyze image content',
  schema: z.object({ media: z.string() }),
  handles: ['image', 'anything...'],
  handler: async ({ media }) => {
    // const data = await fetchAIImageAnalyzer...
    return 'The picture shows the sun rising!';
  },
});
```

## 🤖 Agents

> **Quick Jump:** [Define Agent](#defining-an-agent) · [Media Support](#agent-with-media-support) · [Register](#register-agents)

### Defining an Agent

```typescript
import { defineAgent, groq } from 'zaflow';

const ai = groq({ apiKey: 'xxx' }); // you can use other

const codeReviewer = defineAgent({
  name: 'Code Reviewer',
  provider: ai,
  model: 'llama-3.3-70b-versatile',
  prompt: `You are an expert code reviewer. Review code for bugs, security issues, and best practices.`,
  temperature: 0.3,
  tools: [lintTool, securityScanTool],
});

const contentWriter = defineAgent({
  name: 'Content Writer',
  provider: ai,
  prompt: 'You are a creative content writer.',
  temperature: 0.8,
});
```

### Agent with Media Support

```typescript
const visionAgent = defineAgent({
  name: 'Vision Analyzer',
  provider: ai,
  needsMedia: ['image'],
  prompt: 'You analyze images and describe their content.',
});
```

### Register Agents

```typescript
zaflow.registerAgents([codeReviewer, contentWriter, visionAgent]);
```

## 🔄 Flow Control

> **Quick Jump:** [Steps](#steps) · [Conditional](#conditional-flow) · [Loop](#loop) · [Parallel](#parallel-execution)

### Steps

```typescript
zaflow
  .step('fetch', async (ctx) => {
    return await fetch('https://api.example.com/data').then((r) => r.json());
  })
  .step('process', async (ctx) => {
    const data = ctx.previous;
    return processData(data);
  })
  .step('respond', async (ctx) => {
    return await ctx.ai(`Summarize: ${JSON.stringify(ctx.previous)}`);
  });
```

### Conditional Flow

```typescript
zaflow
  .step('classify', async (ctx) => {
    return await ctx.ai('Classify this as positive or negative: ' + ctx.input);
  })
  .if((ctx) => ctx.previous.includes('positive'))
  .then([ZaFlow.step('celebrate', async () => '🎉 Great feedback!')])
  .else([
    ZaFlow.step('improve', async (ctx) => {
      return await ctx.ai('Suggest improvements for: ' + ctx.input);
    }),
  ])
  .endif();
```

### Loop

```typescript
zaflow.loop({
  condition: (ctx) => ctx.get('retryCount', 0) < 3,
  maxIterations: 5,
  steps: [
    zaflow.step('attempt', async (ctx) => {
      const count = ctx.get('retryCount', 0);
      ctx.set('retryCount', count + 1);

      return await tryOperation();
    }),
  ],
});
```

### Parallel Execution

```typescript
zaflow
  .parallel([
    ZaFlow.step('task1', async () => await fetchFromAPI1()),
    ZaFlow.step('task2', async () => await fetchFromAPI2()),
    ZaFlow.step('task3', async () => await fetchFromAPI3()),
  ])
  .step('combine', async (ctx) => {
    const [result1, result2, result3] = ctx.parallel;
    return combineResults(result1, result2, result3);
  });
```

## 📷 Multimodal Support

> **Quick Jump:** [Image URL](#image-from-url) · [Image Base64](#image-from-base64) · [Media Reference](#smart-media-reference-system)

### Image from URL

```typescript
import { msg, text, image } from 'zaflow';

const messages = [
  ...,
  msg.user([
    text('What is in this image?'),
    image('https://example.com/photo.jpg')
  ])
];

const result = await zaflow.run(messages, { mode: 'autonomous' });
```

### Image from Base64

```typescript
import { msg, text, imageBase64 } from 'zaflow';

const messages = [
  ...,
  msg.user([
    text('Describe this:'),
    imageBase64(base64Data, 'image/png')
  ])
];

const result = await zaflow.run(messages, { mode: 'autonomous' });
```

### Smart Media Reference System

ZaFlow automatically uses a reference system for large media files (token efficient!):

```typescript
// 20MB image is NOT copied to every agent
// Only reference ID is passed around
image(massive20MBBase64);

// Agents that need the image: needsMedia: ['image']
// → Receives full resolved data

// Agents that don't need the image
// → Media is stripped, saving tokens!
```

## 📝 Output Formatting

```typescript
// Auto (default) - raw output
const result = await zaflow.run(input, { format: 'auto' });

// JSON - parse/wrap as JSON
const result = await zaflow.run(input, { format: 'json' });

// WhatsApp - convert markdown to WhatsApp format
const result = await zaflow.run(input, { format: 'whatsapp' });
```

## 🎯 Structured Output

Force AI to respond in a specific JSON structure with **Zod schema validation**:

```typescript
import { ZaFlow, groq } from 'zaflow';
import { z } from 'zod';

const zaflow = new ZaFlow({
  provider: groq({ apiKey: 'xxx' }),
});

// Define your expected response schema
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string(),
  skills: z.array(z.string()),
});

const result = await zaflow.run('Extract info: John Doe is a 28 year old software engineer skilled in TypeScript and React', { schema: personSchema });

// result.output  → raw JSON string
// result.parsed  → typed & validated object!
console.log(result.parsed?.name); // "John Doe" (string)
console.log(result.parsed?.age); // 28 (number)
console.log(result.parsed?.skills); // ["TypeScript", "React"]
```

### Complex Schema Example

```typescript
const articleSchema = z.object({
  title: z.string(),
  summary: z.string().max(200),
  tags: z.array(z.string()).min(1).max(5),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  metadata: z.object({
    wordCount: z.number(),
    readingTime: z.string(),
  }),
});

const result = await zaflow.run('Analyze this article: ...', {
  schema: articleSchema,
});
```

> **Note:** If the AI response doesn't match the schema, `result.parsed` will be `undefined`. Always check before using.

## 🧠 ExecutionContext API

```typescript
zaflow.step('myStep', async (ctx) => {
  // Input & Output
  ctx.input; // Original input
  ctx.previous; // Previous step output
  ctx.parallel; // Array of parallel results

  // State Management
  ctx.set('key', value); // Store value
  ctx.get('key', defaultValue); // Retrieve value
  ctx.has('key'); // Check existence

  // Messages
  ctx.messages; // Full conversation history
  ctx.addMessage('user', 'Hello');

  // AI Helper
  const response = await ctx.ai('Your prompt here');
  const response = await ctx.ai({
    prompt: 'Complex prompt',
    model: 'gpt-4',
    temperature: 0.7,
    tools: [myTool],
  });

  // Stats
  ctx.tokens; // Token count
  ctx.cost; // Estimated cost
});
```

## 🎯 Execution Options

```typescript
const result = await zaflow.run(input, {
  mode: 'autonomous',
  format: 'whatsapp',
  maxIterations: 10,
  maxToolCalls: 3,
  maxTokens: 4096,
  timeout: 30000,
  signal: abortController.signal,
  schema: responseSchema,
  systemPrompt: 'You are a helpful assistant.',

  onAgentEvent: (event) => {
    console.log(`[${event.type}] ${event.agent || event.tool}`);
  },
});
```

### AI Personalization with `systemPrompt`

Customize AI behavior without affecting library's internal prompts:

```typescript
const result = await zaflow.run('Halo!', {
  systemPrompt: `Kamu adalah JawiBot, asisten AI berbahasa Jawa.
Jawab semua pertanyaan dalam bahasa Jawa yang sopan.
Gunakan emoji sesekali untuk membuat percakapan lebih hidup.`,
});

// Output: "Sugeng enjing! Aku JawiBot, asisten AI sing siap mbantu sampeyan! 😊"
```

> **Note:** `systemPrompt` is injected **before** library's internal prompts (tools, agents), ensuring your personalization takes priority.

## 📊 Execution Result

```typescript
const result = await zaflow.run(input);

result.output; // Final response string
result.thinking; // AI's thinking process (if <think> tags used)
result.messages; // Full conversation history
result.steps; // Step-by-step execution results
result.events; // Agent/tool call events
result.duration; // Total execution time (ms)
result.stats; // Usage statistics
result.stats.tokens; // Total tokens used
result.stats.cost; // Estimated cost
result.stats.agentCalls; // Agent call counts
result.stats.toolCalls; // Tool call counts
```

## 📋 TypeScript Types

```typescript
import type {
  ZaFlowConfig,
  ProviderInterface,
  ToolDefinition,
  AgentDefinition,
  ExecutionContext,
  ExecutionOptions,
  ExecutionResult,
  Message,
  StepDefinition,
} from 'zaflow';
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create new branch: `git checkout -b feature/my-feature`.
3.  Commit your changes: `git commit -m 'Add some feature'`.
4.  Push to the branch: `git push origin feature/my-feature`.
5.  Open Pull Request.

## 🎯 Issues & Feedback

**If you encounter any problems or have feature requests, please open an [issue](https://github.com/zeative/zaflow/issues)**

- [Buy me coffee ☕](https://saweria.co/zaadevofc)
- [Ko-Fi](https://ko-fi.com/zaadevofc)
- [Trakteer](https://trakteer.id/zaadevofc)
- ⭐ Star the repo on GitHub

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](https://github.com/zeative/zaflow/blob/main/LICENSE) for details.
