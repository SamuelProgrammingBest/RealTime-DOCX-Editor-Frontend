# Real TIme DOCX Editor
Collaborative Document Editor - FrontendA lightweight, Next.js-based frontend for a real-time collaborative rich-text document editor. Powered by BlockNote and Yjs, it delivers character-level CRDT text merging, real-time remote colored cursors, and live active-user presence indicators without depending on heavy third-party cloud collaboration providers.FeaturesRich-Text Block Editing: Full-featured block-based document editing built on top of BlockNote (@blocknote/react & @blocknote/mantine).Conflict-Free Real-Time Sync: Direct integration between BlockNote and Yjs (ydoc.getXmlFragment("document-store")) for seamless multi-user typing.Live Awareness & Cursors: Real-time remote caret overlays, selection highlights, and hovering user flags rendered using y-protocols/awareness.Zero Selection Jitter: Character-level CRDT binding prevents cursor resets and focus loss during remote edits (no editor.replaceBlocks() hacks required).Custom Socket Provider Bridge: Minimal CustomSocketProvider wrapper connecting Yjs awareness and document updates directly to BlockNote's collaboration engine over Socket.io.Base64URL Hydration: Converts server-stored Base64URL binary updates into raw Uint8Array buffers to hydrate initial document state on load.Tech StackComponentTechnologyFrameworkNext.js 14 / 15 (App Router), TypeScriptStylingTailwind CSS, Mantine (@blocknote/mantine)Editor SuiteBlockNote (@blocknote/react, @blocknote/core)CRDT EngineYjs (yjs), y-protocols (Awareness)Real-Time Clientsocket.io-clientGetting StartedPrerequisitesNode.js v18.x or higherRunning instance of the Socket.io backend serverEnvironment SetupCreate a .env.local file in the root of your frontend project:Code snippetNEXT_PUBLIC_SOCKET_URL=http://localhost:5000
Installation & DevelopmentInstall dependencies:Bashnpm install
Run the development server:Bashnpm run dev
Open http://localhost:3000 in your browser.File ArchitecturePlaintextsrc/
├── app/
│   ├── dashboard/
│   │   └── utils.ts                # Base64URL string <-> Uint8Array conversion
│   └── docs/
│       └── [id]/
│           ├── CustomSocketProvider.ts # Bridge class matching BlockNote's collaboration spec
│           ├── DocsEditor.tsx          # Main collaborative editor component & socket hooks
│           └── page.tsx                # Document route & server data fetcher

