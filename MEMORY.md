# 🧠 Project Memory: Jam/Sort Mobile Web Game

## 🎯 Project Context
Building a mobile-first web game similar to "Marble Sort" or "Ball Jam". Players tap balls to move them to a limited-capacity conveyor belt (7 slots) to match 3 of the same color. Features 100% solvable procedurally generated levels, account creation, and monetization boosters.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Game Engine:** Phaser 3
- **Backend/Auth:** Supabase (PostgreSQL) - *USING NEW API KEY PARADIGM (`sb_publishable_` for client, `sb_secret_` for server)*
- **State:** Zustand

## 📂 Documentation Reference
The blueprint for this game is divided into 6 Technical Reports located in the `_docs/` folder:
- `report1-architecture.md` (Stack & Flow)
- `report2-database.md` (Supabase Schema & Zustand)
- `report3-engine-bridge.md` (React-Phaser Event Bus)
- `report4-level-generator.md` (Reverse-generation algorithm)
- `report5-game-loop.md` (Phaser matching & queues)
- `report6-monetization.md` (Boosters & Deployment)

## 🟢 Active Context
- **Current Phase:** Phase 4 - Level Progression, Data Loading, & Monetization.
- **Current Task:** Setup dynamic level loading via Supabase, implement booster usage mechanics (Report 6).

## ✅ Progress & Learnings
- [x] Initialized Next.js application.
- [x] Installed Phaser, Zustand, and Supabase dependencies.
- [x] Configured Unit Testing environment with Vitest and E2E with Playwright.
- [x] Migrated project context to use the new Supabase Publishable (`sb_publishable_`) and Secret (`sb_secret_`) key architectures instead of legacy JWT keys.
- [x] Database schema created in Supabase (`supabase/schema.sql`).
- [x] TypeScript interfaces mapping Supabase data generated (`types/game.ts`).
- [x] Zustand state management created with Supabase bindings and full test coverage (`store/useGameStore.ts` & `store/useGameStore.test.ts`).
- [x] Authentication UI and Guest Login (Middleware/SSR/Routes) built using `@supabase/ssr`.
- [x] Engine Event Bus communication paradigm built (`utils/EventBus.ts`).
- [x] Phaser configured for mobile (FIT scaling) (`game/config.ts`).
- [x] React Game Wrapper component built with strict cleanup implementation to prevent instance memory leaks (`components/GameWrapper.tsx`).
- [x] Created `/game` App Route with `next/dynamic` ensuring Phaser avoids SSR errors.
- [x] **Learning:** Next.js 18 Strict Mode + HMR causes double-mounting `AudioContext` errors in Phaser (`Cannot suspend/resume closed AudioContext`). Temporarily disabled audio in `game/config.ts` (`noAudio: true`). Will need to re-enable and safely handle context when adding audio later.
- [x] Handled Supabase Email Confirmation Auth flows properly (PKCE callback) by creating `app/auth/callback/route.ts` and covering it with Vitest tests.
- [x] **Learning:** Fixed React hydration mismatch errors caused by third-party browser extensions (like Keeper/LastPass) injecting elements. Used `suppressHydrationWarning` on `layout.tsx` and affected form elements.
- [x] **Major Architecture Pivot:** Changed from overlapping 3D Z-index mechanics to a 2D Topological Island/Conveyor/Funnel logic.
- [x] Audited and updated Architecture (`_docs/report1-architecture.md`), DB Types (`types/game.ts`), and Level Generation (`utils/LevelGenerator.ts`) to align with the new Conveyor Belt rules.
- [x] E2E Playwright tests and Unit Tests are fully passing under the new structure.
- [x] Implemented Level generation layout (Report 4) with the 7x7 empty grid background, pseudo-3D styling, and 3:1 lower conveyor boxes.
- [x] Implemented Game Loop (Report 5) with box click validation, full capacity conveyor constraints, funnel animation, conveyor rotation, lower grid matching/absorption scaling, and orthogonal adjacent bounding box dynamically unlocking visuals.
- [x] **Learning:** When managing Phaser physics and Tweens dynamically computed values (such as UI `targetHeight`), be careful about variable scope leakage inside nested `onComplete` blocks to avoid runtime ReferenceErrors.
- [x] **Active Branch:** Started 3D Graphic Revamp (`report5.5`). Configured `BabylonGameWrapper.tsx`, generated the 3D Island Grid meshes based on `LevelGenerator`, established testing mocks, and added geometry for Pit Walls, Funnel, and Conveyor/Targets. Updated geometry layout by creating an exact proportional mapped scaling algorithm directly from the 2D original to preserve gameplay spacing natively. Converted Funnel slopes into exact flat-shaded geometric triangle prisms mathematically mapping to the drop boundaries, and resolved back-face culling/winding order lighting illusions. The 3D scaffolding is now a perfect 1:1 structural replica of the Phaser layout.

- [ ] Next 3D Phase: Inject 3D Ball meshes into the containers, apply distinct base color materials matching `colorId`, and begin configuring ActionManager pointer events for interactive clicking. Following that: ball physics simulation, conveyor path lerping algorithms, target box sorting logic, and adjacent box reveal animations.
- [ ] Implement Level loading logic via Database (Sync UI with User State).
- [ ] Implement Monetization features and Booster actions (Report 6).