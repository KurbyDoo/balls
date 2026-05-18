# Jam/Sort Mobile Web Game

A mobile-first web game built with Next.js, Phaser 3, and Supabase.

## Prerequisites
- Node.js 18+
- npm or pnpm
- A Supabase Project

## Environment Setup
Create a `.env.local` file in the root of your project and populate it with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_anon_key
# Server operations
SUPABASE_SECRET_KEY=sb_secret_your_service_role_key
```

## Build & Run Instructions

**1. Install dependencies:**
```bash
npm install
```

**2. Run the Development Server:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**3. Production Build:**
```bash
npm run build
npm start
```

## Testing Strategy

To ensure game logic, UI, and backend integration work seamlessly, we use the following testing stack:

### 1. Unit & Component Testing (Vitest & React Testing Library)
Used to test Zustand state slices (`useGameStore`), hooks, and isolated Next.js components.
- **Run tests:** `npx vitest run`
- **Watch mode:** `npx vitest`

### 2. UI & End-to-End (E2E) Testing (Playwright)
To test the actual UI rendering (Next.js layout) and simulate full player runs (login, loading the Phaser canvas, interacting with the game), we use **Playwright**. Playwright spawns a real headless browser (Chromium) to validate the end-to-end user experience, including Canvas interactions!

- **To set up Playwright (First time):**
  ```bash
  npm init playwright@latest
  ```
- **To run E2E tests:**
  ```bash
  npx playwright test
  ```
