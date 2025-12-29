# Lore - AI-First Knowledge Workspace

Your second brain with AI superpowers. Connect ideas, discover insights, think better.

## Features

- **Bidirectional Links**: Connect ideas with [[wiki-style links]]
- **Graph View**: Visualize connections between your notes
- **AI Chat**: Ask questions about your knowledge base
- **Semantic Search**: Find related content automatically
- **Auto-Tagging**: AI-powered organization

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (Postgres + pgvector)
- **Editor**: BlockNote (block-based rich text)
- **Styling**: Tailwind CSS with Ai.telier V2 design system
- **AI**: OpenAI, Anthropic, Ollama support

## Project Structure

```
lore/
├── apps/
│   └── web/              # Next.js application
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       └── lib/          # Utilities
├── packages/
│   ├── editor/           # BlockNote editor package
│   ├── ai/               # AI/LLM integration
│   └── db/               # Database client
└── package.json          # Workspace root
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd lore

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Design System - Ai.telier V2

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Void Black | `#0A0A0A` | Primary background |
| Warm Ivory | `#F5F2EB` | Primary text |
| Tech Olive | `#8dc75e` | CTAs, links, accents |
| Twilight Violet | `#261833` | Secondary backgrounds |

### Typography

- **Headlines**: Space Grotesk (500-900)
- **Body**: Inter (400-600)
- **Code**: IBM Plex Mono (400-600)

## License

MIT
