# 🔍 Smart Product Filter POC

AI-powered natural language product filtering for e-commerce washers.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Transform natural language queries into precise product filters. Type **"3 people family under $800"** and get instant, accurate results.

**Status:** Proof of Concept (POC) - Demo Ready  
**Purpose:** Validate AI-powered filtering before production

---

## Quick Start

Install dependencies:

```bash
pnpm install
```

Setup environment:

```bash
cp .env.example .env.local
# Add HUGGINGFACE_API_KEY=hf_your_token to .env.local
```

Run development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Key Features

- 🤖 **AI-Powered** - Natural language understanding (85%+ confidence)
- 🎨 **Modern UI** - Responsive Bosch-inspired design
- 🛡️ **Robust** - Triple fallback (AI → Retry → Rules)
- 📊 **Realistic** - 50 products with exact distribution

---

## Try It Out

Example queries:

- `"3 people family under $800"`
- `"energy efficient with WiFi"`
- `"quiet premium washer"`
- `"big family budget friendly"`

See all [test scenarios](docs/TESTING.md).

---

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS  
**AI:** HuggingFace Inference API (Mistral-7B)  
**Deployment:** Vercel

---

## Documentation

- [🏗️ Architecture Guide](docs/ARCHITECTURE.md)
- [🚀 Deployment Guide](docs/DEPLOYMENT.md)
- [🔌 API Reference](docs/API.md)
- [🧪 Testing Queries](docs/TESTING.md)

---

## Project Structure

```
src/
├── app/            # Pages & API routes
├── components/     # UI components
└── lib/            # Services, types, utils
```

---

## Environment Setup

Required environment variables:

```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

Get your token: [HuggingFace Settings](https://huggingface.co/settings/tokens)

---

## Roadmap

- ✅ POC with HuggingFace
- ⬜ Upgrade to OpenAI/Claude (if approved)
- ⬜ Production deployment
- ⬜ Multi-language support

## License

MIT © 2025 - See [LICENSE](LICENSE)
