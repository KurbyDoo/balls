
**Project**: Web-based "Jam/Sort" Game
**Target Execution**: AI Code Generation Guide

## 1. Supabase Database Schema (PostgreSQL)
The AI must configure the Supabase database with the following tables. We will use Supabase's native Auth system, linking a custom `profiles` table to the `auth.users` table via triggers.

### Table: `profiles`
Stores the player's meta-game progress and currency.
*   `id` (uuid, Primary Key, Foreign Key to `auth.users.id`, cascade delete)
*   `username` (text, unique, nullable)
*   `current_level` (integer, default: 1) - *Tracks the highest level reached.*
*   `coins` (integer, default: 0) - *Premium/Earned currency.*
*   `boosters` (jsonb, default: `{"undo": 3, "shuffle": 3, "extra_slot": 1}`) - *Inventory of power-ups.*
*   `saved_board_state` (jsonb, nullable) - *Used to resume a level if the user closes the app mid-game. Contains array of remaining balls and conveyor queue.*
*   `updated_at` (timestamp with time zone, default: now())

**AI SQL Directive (Trigger):**
The AI must write a SQL trigger that automatically inserts a row into the `profiles` table whenever a new user signs up in Supabase Auth.

## 2. TypeScript Interfaces (Data Contracts)
To maintain strict type safety across the App Route and Game Engine, the AI must create a `types/game.ts` file with the following interfaces:

```typescript
// types/game.ts

export interface BoosterInventory {
  undo: number;
  shuffle: number;
  extra_slot: number; // Will be renamed/repurposed to temporary hold slot later
}

export interface UserProfile {
  id: string;
  username: string | null;
  current_level: number;
  coins: number;
  boosters: BoosterInventory;
  saved_board_state: GameStateDump | null;
}

// Data dumped when saving a game mid-level
export interface GameStateDump {
  level_id: number;
  upper_grid: BoxData[]; // The Island grid boxes
  lower_grid: TargetBoxData[]; // The 1x3 matching boxes
  conveyor_slots: (BallData | null)[]; // 30 slot array
}

export interface BoxData {
  id: string;
  x: number; // Grid X position
  y: number; // Grid Y position
  isOpen: boolean; // True if interactive, false if locked
  balls: BallData[]; // The 9 balls contained within
}

export interface TargetBoxData {
  id: string;
  columnId: number; // 0 to 3
  reqColorId: number; // The color needed to fill this box
  currentCount: number; // 0 to 3
}

export interface BallData {
  id: string; // Unique identifier for the instance
  colorId: number; // Used for matching
}
```

## 3. Authentication Flow (Next.js App Router + Supabase SSR)
The AI should implement authentication using the latest `@supabase/ssr` package.

**Required Routes/Components:**
1.  **`app/login/page.tsx`**: A standard login form (Email/Password) + "Play as Guest" anonymous login option. 
2.  **`middleware.ts`**: Checks for the Supabase Auth session token. If a user tries to access `/game` without a session, redirect to `/login`.
3.  **Guest Accounts:** The AI should implement Supabase Anonymous Sign-ins. Mobile game players hate forced account creation. Let them play immediately as a guest, and offer a "Link Email to Save Progress" button in the Settings menu later.

## 4. Frontend State Management (Zustand)
Do **not** use React Context for the core game state; it will cause too many re-renders and tank mobile performance. The AI must use **Zustand** to manage the global state bridge between React UI and Supabase.

**Zustand Store (`store/useGameStore.ts`):**
The store will hold the user's profile data in memory.

```typescript
import { create } from 'zustand';

interface GameStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  incrementLevel: () => Promise<void>;
  useBooster: (boosterType: keyof BoosterInventory) => Promise<boolean>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  
  incrementLevel: async () => {
    // 1. Optimistic UI update (update local state immediately)
    const current = get().profile;
    if (!current) return;
    
    set({ profile: { ...current, current_level: current.current_level + 1 } });
    
    // 2. Background sync to Supabase (AI must write the actual Supabase client call here)
    await supabase.from('profiles').update({ current_level: current.current_level + 1 }).eq('id', current.id);
  },

  useBooster: async (boosterType) => {
    // Implement logic to subtract 1 booster, optimistically update UI, and sync to DB
    // Return true if successful, false if not enough boosters
  }
}));
```

## 5. Sync Strategy: "Local First, Lazy Save"
Mobile connections are unreliable. The AI must follow this rule for network calls:
*   **During Gameplay:** Do *not* send API calls to Supabase on every ball tap. The Phaser engine handles game state locally.
*   **On Level End (Win/Loss):** When Phaser emits the `LEVEL_COMPLETE` event, the React layer intercepts it, updates Zustand (optimistic update), and fires a single async `UPDATE` to Supabase to save the new `current_level` and `coins`.
