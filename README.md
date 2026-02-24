# LLM API Key Checker

<div align="center">

![LLM API Key Checker](./public/og-image.png)

**Batch validate API keys for multiple LLM providers with real-time streaming progress**

[Live Demo](https://llm-api-key-checker-next.vercel.app/zh-cn) | [中文文档](./README_CN.md)

</div>

---

## ✨ Features

- 🚀 **Batch Validation** - Validate multiple API keys simultaneously with configurable concurrency
- 📊 **Real-time Progress** - Streaming updates with live progress tracking
- 💰 **Balance Checking** - Automatic balance detection for supported providers
- 🌍 **Multi-language Support** - Available in 20+ languages including English, Chinese, Japanese, Spanish, and more
- 🎨 **Modern UI** - Beautiful glassmorphism design with dark/light mode support
- 🔒 **Privacy First** - All validations run in your browser/server, keys are never stored or logged
- ⚡ **Multiple Providers** - Support for 10+ LLM providers and OpenAI-compatible APIs

## 🎯 Supported Providers

| Provider | Balance Check | Kind |
|----------|---------------|------|
| OpenAI | ❌ | OpenAI |
| Anthropic (Claude) | ❌ | Anthropic |
| DeepSeek | ✅ | OpenAI |
| Moonshot | ✅ | OpenAI |
| Zhipu AI (GLM) | ❌ | OpenAI |
| Tongyi Qwen (DashScope) | ❌ | OpenAI |
| Groq | ❌ | OpenAI |
| Google Gemini | ❌ | OpenAI |
| NewAPI | ✅ | OpenAI |
| OpenAI-compatible (custom) | Configurable | OpenAI |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ or pnpm
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/EmptyEmeraldTablet/llm-api-key-checker-next.git
cd llm-api-key-checker-next
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Usage

1. **Select Provider**: Choose from the dropdown list of supported LLM providers
2. **Configure Settings**:
   - Base URL (customize for compatible endpoints)
   - Model name
   - Concurrency level (1-50)
   - Validation prompt
   - Low balance threshold
3. **Add API Keys**: Paste your keys (separated by space, newline, comma, or semicolon)
4. **Start Validation**: Click "Start" to begin batch validation
5. **View Results**: Real-time results with status, balance (if supported), and error messages

## 📦 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual/latest)
- **React**: React 19

## 🌐 Internationalization

The app supports the following languages:
- 🇺🇸 English
- 🇨🇳 简体中文 (Simplified Chinese)
- 🇹🇼 繁體中文 (Traditional Chinese)
- 🇯🇵 日本語 (Japanese)
- 🇰🇷 한국어 (Korean)
- 🇪🇸 Español (Spanish)
- 🇫🇷 Français (French)
- 🇩🇪 Deutsch (German)
- 🇮🇹 Italiano (Italian)
- 🇷🇺 Русский (Russian)
- 🇵🇱 Polski (Polish)
- 🇳🇱 Nederlands (Dutch)
- 🇵🇹 Português (Portuguese)
- 🇹🇷 Türkçe (Turkish)
- 🇸🇦 العربية (Arabic)
- 🇮🇳 हिन्दी (Hindi)
- 🇮🇩 Bahasa Indonesia (Indonesian)
- 🇲🇾 Bahasa Melayu (Malay)
- 🇹🇭 ไทย (Thai)
- 🇻🇳 Tiếng Việt (Vietnamese)

## 🔐 Privacy & Security

- ✅ No API keys are stored in databases
- ✅ No logging of sensitive information
- ✅ Validation happens client-side and server-side (streaming)
- ✅ Open-source and auditable

## 📝 API Routes

### POST `/api/check`
Validates API keys with streaming responses.

**Request Body:**
```json
{
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4o-mini",
  "keys": ["sk-..."],
  "concurrency": 10,
  "validationPrompt": "Hi",
  "lowThreshold": 1
}
```

### POST `/api/models`
Fetches available models for a given provider and API key.

**Request Body:**
```json
{
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "keys": ["sk-..."]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Thanks to all contributors
- Built with modern web technologies
- Inspired by the need for efficient API key management

## 📧 Contact

- GitHub: [@EmptyEmeraldTablet](https://github.com/EmptyEmeraldTablet)
- Project Link: [https://github.com/EmptyEmeraldTablet/llm-api-key-checker-next](https://github.com/EmptyEmeraldTablet/llm-api-key-checker-next)
- Live Demo: [https://llm-api-key-checker-next.vercel.app/zh-cn](https://llm-api-key-checker-next.vercel.app/zh-cn)

---

<div align="center">

Made with ❤️ by the open-source community

**[⬆ back to top](#llm-api-key-checker)**

</div>
