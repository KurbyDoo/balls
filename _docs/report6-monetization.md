
**Project**: Web-based "Jam/Sort" Game
**Target Execution**: AI Code Generation Guide

## 1. Monetization: Booster Logic
In free-to-play mobile games, players spend coins (earned via gameplay or bought with real money) to use Boosters when they are stuck. In this version of the game, they are completely free. The AI must implement these three specific mechanics inside `MainGameScene.ts`.

### A. The "Undo" Booster
**Concept:** Reverses the player's last click, converting an opened box back into a closed box and recalling its 9 scattered balls.
**AI Directive:** Maintain a `moveHistory` stack.

```typescript
// Inside MainGameScene.ts

// Track history: store the Box and the exact state of its 9 balls
private moveHistory: HistoryState[] = [];

executeUndo() {
  if (this.moveHistory.length === 0 || this.isAnimating) return;

  this.isAnimating = true;

  // 1. Get the last opened Box
  const lastState = this.moveHistory.pop()!;
  
  // 2. Recall balls from Conveyor / Lower Grid
  this.recallBallsToBox(lastState);

  // 3. Re-lock any adjacent boxes that were opened as a result of this move
  this.revertAdjacentBoxStates(lastState.box);

  // 4. Set previously cleared box back to Closed State
  lastState.box.setData('isClosed', true);
}
```

### B. The "Shuffle" Booster
**Concept:** Scrambles the board. 
*Crucial Math Note for AI:* You cannot just randomly generate new colors, because you might create an unsolvable puzzle. The safest way to implement a shuffle is to **keep the remaining closed boxes where they are physically, but scramble the configuration of balls locked inside them.**

```typescript
// Inside MainGameScene.ts

executeShuffle() {
  if (this.isAnimating) return;
  this.isAnimating = true;

  // 1. Extract all ball definitions from the remaining closed boxes
  const remainingBalls = this.getBallsFromClosedBoxes();
  
  // 2. Shuffle the array of balls (Fisher-Yates algorithm)
  for (let i = remainingBalls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingBalls[i], remainingBalls[j]] = [remainingBalls[j], remainingBalls[i]];
  }

  // 3. Reassign groups of 9 back to the closed boxes and run a "shake/shuffle" visual effect
  this.reassignBallsToClosedBoxes(remainingBalls);

  this.time.delayedCall(300, () => { this.isAnimating = false; });
}
```

### C. The "Temporary Hold Slot" Booster
**Concept:** Prevents game-overs by providing a temporary safe haven to rescue a ball from the rotating conveyor belt if it's getting too full or missing its match.

```typescript
// Inside MainGameScene.ts

executeHoldSlot() {
  // Logic to move a targeted ball off the 30-slot conveyor and into a temporary UI pocket
  // Allows the player a one-time save for a ball preventing lower grid completion
}
```

## 2. Event Hookup (React to Phaser)
To trigger these boosters, the AI must listen for the React HUD buttons.
```typescript
// Inside MainGameScene.create()
EventBus.on(GameEvents.USE_BOOSTER, (type: 'undo' | 'shuffle' | 'extra_slot') => {
  switch(type) {
    case 'undo': this.executeUndo(); break;
    case 'shuffle': this.executeShuffle(); break;
    case 'extra_slot': this.executeExtraSlot(); break;
  }
});
```

## 3. Deployment & Environment Setup
To take this from localhost to the web, the AI must set up the `env` files and deploy to Vercel.

**AI Directives for Deployment:**

**Step 1: Environment Variables**
The AI must ensure a `.env.local` file exists during development, and these exact variables are added to the Vercel Project Settings using the new Supabase key formats:
`NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key` (For public/client access)
`SUPABASE_SECRET_KEY=sb_secret_your_key` (For secure backend bypassing of RLS)

**Step 2: Next.js Configuration for Phaser**
Phaser can sometimes cause build errors in Next.js because Next tries to server-side render (SSR) it, and Phaser relies on the browser `window` and `canvas` objects. 
The AI must ensure `GameWrapper.tsx` (from Report 3) is imported dynamically with SSR disabled.

```tsx
// app/game/page.tsx
import dynamic from 'next/dynamic';

// Disable SSR for the Phaser Game
const GameWrapper = dynamic(() => import('../../components/GameWrapper'), {
  ssr: false,
  loading: () => <div className="text-white flex items-center justify-center h-screen bg-slate-900">Loading Game Engine...</div>
});

export default function GamePage() {
  return (
    <main className="h-screen w-full relative">
      <GameWrapper />
      {/* React HUD goes here (Z-index 10) */}
    </main>
  );
}
```

**Step 3: Build & Deploy Commands**
*   **Framework Preset:** Next.js
*   **Build Command:** `npm run build`
*   **Output Directory:** `.next`
*   *Note to AI:* Ensure all Phaser assets (images, spritesheets, audio) are placed strictly inside the `public/assets/` folder, otherwise they will 404 on Vercel.
