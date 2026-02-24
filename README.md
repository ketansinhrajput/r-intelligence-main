# Resume Intelligence

An AI-powered resume analysis and optimization system built with Next.js 15. Analyze your resume against job descriptions, get detailed ATS scores, identify skill gaps, and generate tailored resumes and cover letters.

## Features

- **Deep JD Analysis** - Upload job descriptions via URL or PDF. AI extracts requirements, detects fake postings, and identifies multi-role JDs.
- **Multi-Model ATS Scoring** - Get both conservative and aggressive ATS scores optimized for Workday, Greenhouse, Lever, or generic systems.
- **Intelligent Matching** - Deep skill matching with transferable skill recognition, experience alignment, and role seniority analysis.
- **ATS-Optimized Generation** - Generate tailored resumes in chronological, hybrid, or functional formats with zero fabrication guarantee.
- **Personalized Cover Letters** - Company-specific, role-aligned cover letters with adjustable length and conversational tone.
- **Region Compliance** - Automatic compliance with EU, UK, US, India, Germany, and UAE resume standards.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **AI Pipeline**: LangGraph
- **LLM**: OpenAI-compatible API (configurable at runtime)
- **PDF**: pdf-parse (parsing), pdf-lib (generation)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd r-intelligence-main

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### LLM Configuration

This application uses an OpenAI-compatible API endpoint. Configure your provider directly in the UI on the upload page:

- **Base URL**: Your LLM provider's API endpoint (e.g., `https://api.openai.com/v1`)
- **API Key**: Your provider's API key
- **Model Name**: The model to use (e.g., `gpt-4`, `gpt-3.5-turbo`)

Supports any OpenAI-compatible endpoint including OpenAI, Anthropic, Google Gemini, Ollama, and others.

## Usage

1. **Upload Documents** - Upload your resume (PDF), optionally a cover letter, and provide a job description via URL or PDF
2. **Configure Options** - Select resume format, target ATS system, region, and cover letter length
3. **Run Analysis** - The AI pipeline analyzes, matches, and scores your documents
4. **Review Results** - Explore detailed matching analysis, ATS scores, skill gaps, and risk assessment
5. **Edit & Export** - Review changes in diff view, accept/reject modifications, and export optimized PDFs

## Architecture

### LangGraph Pipeline

The core analysis runs through a multi-stage pipeline:

```
Parsing → Detection → Matching → Scoring → Risk Analysis → Generation → Validation
```

| Stage | Description |
|-------|-------------|
| Parsing | Parse resume, cover letter, and job description |
| Detection | Detect fake JDs and multi-role postings |
| Matching | Skill and experience alignment analysis |
| Scoring | Conservative and aggressive ATS scoring |
| Risks | Gap analysis and red flag detection |
| Generation | Resume rewriting and cover letter generation |
| Validation | Output validation with retry loop |

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (analyze, parse, export, scrape)
│   ├── analyze/           # Analysis results dashboard
│   ├── editor/            # Resume/cover letter editor
│   └── upload/            # Document upload page
├── components/            # React components
│   ├── ui/               # Radix UI primitives
│   └── upload/           # Upload-specific components
├── lib/
│   ├── langgraph/        # AI pipeline
│   │   ├── graph.ts      # Pipeline definition
│   │   ├── nodes/        # Individual processing nodes
│   │   ├── edges.ts      # Conditional routing
│   │   └── state.ts      # GraphState interface
│   ├── llm/              # LLM client and prompts
│   ├── ats/              # ATS scoring models
│   └── parsers/          # PDF and URL parsers
├── stores/               # Zustand state stores
└── types/                # TypeScript type definitions
```

### State Management

Four Zustand stores manage application state:

- **documentStore** - Input files and user options
- **analysisStore** - Pipeline progress and results
- **versionStore** - Resume version history
- **llmConfigStore** - Runtime LLM provider configuration

### ATS Scoring Models

| Model | Keyword Weight | Threshold | Use Case |
|-------|---------------|-----------|----------|
| Conservative | 0.35 | 75% | Strict ATS systems |
| Aggressive | 0.25 | 60% | Semantic-aware systems |

## Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## Environment Variables

Create a `.env.local` file (optional):

```env
# Enable mock mode for development (bypasses LLM calls)
USE_MOCK_LLM=true
```

LLM provider configuration is collected at runtime via the UI - no environment variables required.

## Privacy

- No data is stored permanently
- All processing happens in real-time
- Documents are processed in memory only

## License

MIT
