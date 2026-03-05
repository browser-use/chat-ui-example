# Browser Use Chat UI

A chat interface for [Browser Use](https://browser-use.com) that lets you give tasks to an AI agent that can browse the web in real time. Built with Next.js 15, React 19, and the Browser Use SDK.

![Chat UI](public/chat-ui-preview.png)

![Session View](public/chat-ui-session.png)

## Quick Start

### 1. Get a Browser Use API Key

Sign up at [browser-use.com](https://browser-use.com) and grab your API key from the dashboard.

### 2. Clone & Install

```bash
git clone https://github.com/browser-use/chat-ui-example.git
cd chat-ui-example
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:

```
NEXT_PUBLIC_BROWSER_USE_API_KEY=your-api-key-here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Type a task like "Find the top 3 articles on Hacker News"
2. The agent browses the web and reports back in real time
3. Watch the agent work in the live browser panel (desktop only)
4. Send follow-up messages to refine or continue the task

### Settings

Use the icon buttons below the chat input to configure:

| Icon | Setting | Options |
|------|---------|---------|
| CPU | Model | BU Mini (fast) / BU Max (powerful) |
| User | Profile | Browser profiles with saved cookies/sessions |
| HardDrive | Workspace | Workspace context for file operations |
| Globe | Proxy | Route traffic through 190+ country proxies |

Settings are persisted in localStorage across sessions.

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home — create new session
│   └── session/[id]/page.tsx   # Session — chat + browser view
├── components/
│   ├── browser-panel.tsx       # Live browser iframe
│   ├── chat-input.tsx          # Auto-expanding textarea + send
│   ├── chat-messages.tsx       # Conversation turn rendering
│   ├── markdown.tsx            # GFM markdown renderer
│   ├── model-selector.tsx      # Settings icon dropdowns
│   ├── step-section.tsx        # Collapsible task steps
│   ├── thinking-indicator.tsx  # Animated thinking dots
│   └── tool-call-pill.tsx      # Tool call display pills
├── context/
│   ├── session-context.tsx     # Session polling & message state
│   └── settings-context.tsx    # User preferences (localStorage)
└── lib/
    ├── api.ts                  # Browser Use SDK wrapper
    ├── countries.ts            # Country codes for proxy selector
    ├── message-converter.ts    # API → UI message transformation
    ├── tool-labels.ts          # Tool name/icon mapping
    └── types.ts                # TypeScript type definitions
```

### Data Flow

1. User sends a task from the home page
2. App creates a session via the Browser Use API and redirects to `/session/[id]`
3. Session context polls for status and messages every second
4. Messages are converted from the API format into conversation turns (user message + agent steps + final answer)
5. The browser panel displays a live iframe of the agent's browser
6. When the session completes, polling stops and the chat input is disabled

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** with Turbopack
- **[React 19](https://react.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)** for styling
- **[TanStack Query](https://tanstack.com/query)** for data fetching & polling
- **[Browser Use SDK](https://docs.browser-use.com/)** for agent API
- **[react-markdown](https://github.com/remarkjs/react-markdown)** with GFM for message rendering
- **[lucide-react](https://lucide.dev/)** for icons

## License

MIT
