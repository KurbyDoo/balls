# 🤖 Copilot System Instructions

## Core Directives
- **Always read `MEMORY.md`** at the root of the project before starting any new task to understand the current context and progress.
- **Always refer to the Technical Reports** located in the `_docs/` folder when building new features.
- When you finish a significant task or fix a major bug, remind the human to run the command to update `MEMORY.md`.
- **Always Write Tests:** Alongside any generated code, include tests (e.g. using Vitest) to validate your changes, and confirm them by running the tests.
- **Always use your tools to write and read from files:** Avoid using terminal commands and other workarounds to read and write to files.

## Project Coding Standards
- **Framework:** Next.js with App Router (`app/` directory), React 18, and TypeScript.
- **Game Engine:** Phaser 3 (Client-side only, loaded dynamically to avoid SSR issues).
- **State Management:** Zustand (Do NOT use React Context for the core game loop).
- **Styling:** Tailwind CSS.
- **Database & Auth:** Supabase (PostgreSQL, `@supabase/ssr`).

## Architectural Rules
- **Strict Separation:** React handles Meta-game (UI, Menus, Auth). Phaser handles Core-game (Canvas, physics, sorting).
- **Event Bus:** React and Phaser must ONLY communicate via the custom `EventBus` (`utils/EventBus.ts`).
- **Memory Leaks:** Always ensure the Phaser game instance is properly destroyed on React component unmount.

## Supabase API Key Paradigm (CRITICAL)
- Supabase has deprecated `anon` and `service_role` JWT keys.
- **Frontend / Browser Client:** You MUST use the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (format: `sb_publishable_...`). Pass this into `@supabase/ssr` `createBrowserClient()`.
- **Backend / Server Client:** You MUST use the `SUPABASE_SECRET_KEY` (format: `sb_secret_...`) for elevated backend tasks. Never expose this to the browser. It overrides RLS.
- Do NOT use the word `anon` or `service_role` when naming variables or instantiating clients.