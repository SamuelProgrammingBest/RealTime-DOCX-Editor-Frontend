# Real-Time DOCX Editor: Collaborative Document Editor - Frontend
A lightweight, Next.js-based frontend for a real-time collaborative rich-text document editor. Powered by BlockNote and Yjs, it delivers character-level CRDT text merging, real-time remote colored cursors, and live active-user presence indicators without depending on heavy third-party cloud collaboration providers.
🚀 Features
• Rich-Text Block Editing: Full-featured block-based document editing built on top of BlockNote (@blocknote/react & @blocknote/mantine).
• Conflict-Free Real-Time Sync: Direct integration between BlockNote and Yjs (ydoc.getXmlFragment("document-store")) for seamless multi-user typing.
• Live Awareness & Cursors: Real-time remote caret overlays, selection highlights, and hovering user flags rendered using y-protocols/awareness.
• Zero Selection Jitter: Character-level CRDT binding prevents cursor resets and focus loss during remote edits (no editor.replaceBlocks() hacks required).
• Custom Socket Provider Bridge: Minimal CustomSocketProvider wrapper connecting Yjs awareness and document updates directly to BlockNote's collaboration engine over Socket.io.
• Base64URL Hydration: Converts server-stored Base64URL binary updates into raw Uint8Array buffers to hydrate initial document state on load.
🛠️ Tech Stack
Component	Technology
Framework	Next.js 14 / 15 (App Router), TypeScript
Styling	Tailwind CSS, Mantine (@blocknote/mantine)
Editor Suite	BlockNote (@blocknote/react, @blocknote/core)
CRDT Engine	Yjs (yjs), y-protocols (Awareness)
Real-Time Client	socket.io-client
🏁 Getting Started
Prerequisites
• Node.js v18.x or higher
• Running instance of the Socket.io backend server
Environment Setup
Create a .env.local file in the root of your frontend project:
env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

Installation & Development
1. Install dependencies:bash
npm install
2. Run the development server:bash
npm run dev
3. Open http://localhost:3000 in your browser.
📂 File Architecture
plaintext
src/
 ├── app/
 │   ├── dashboard/
 │   │   └── utils.ts                # Base64URL string <-> Uint8Array conversion
 │   └── docs/
 │       └── [id]/
 │           ├── CustomSocketProvider.ts  # Bridge class matching BlockNote's collaboration spec
 │           ├── DocsEditor.tsx           # Main collaborative editor component & socket hooks
 │           └── page.tsx                 # Document route & server data fetcher
