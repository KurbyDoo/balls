
**Project**: Web-based "Jam/Sort" Game
**Target Execution**: AI Code Generation Guide

## 1. The Event Bus (Communication Standard)
Phaser handles the game loop (Canvas), and React handles the UI overlays like the Settings Menu, Win/Loss Modals, and Top HUD (DOM). They must communicate via an isolated **Event Bus**.

**AI Directive:** Create a dedicated `EventBus.ts` file. Do not pass React state directly into Phaser scenes; it will cause performance-killing re-renders.

```typescript
// utils/EventBus.ts
import { Events } from 'phaser';

// Singleton instance used by both React and Phaser
export const EventBus = new Events.EventEmitter();

// Define strict event names to prevent typos
export const GameEvents = {
  PHASER_READY: 'phaser-ready',
  LEVEL_WON: 'level-won',
  LEVEL_LOST: 'level-lost',
  UPDATE_SCORE: 'update-score',
  USE_BOOSTER: 'use-booster', // React tells Phaser to trigger a booster
};
```

## 2. The Game Wrapper Component (Preventing Memory Leaks)
The AI must implement the React component that holds the Phaser canvas. It must use `useRef` to ensure only **one** instance of the Phaser game is ever created, and strictly handle teardown on unmount.

```tsx
// components/GameWrapper.tsx
'use client'; // Required for Next.js App Router

import { useEffect, useRef } from 'react';
import { Game } from 'phaser';
import { gameConfig } from '../game/config';
import { EventBus, GameEvents } from '../utils/EventBus';
import { useGameStore } from '../store/useGameStore';

export default function GameWrapper() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const { incrementLevel } = useGameStore();

  useEffect(() => {
    // 1. Prevent duplicate instances (React Strict Mode safeguard)
    if (!gameInstanceRef.current && gameContainerRef.current) {
      gameInstanceRef.current = new Game({
        ...gameConfig,
        parent: gameContainerRef.current, // Mount canvas to this div
      });

      // 2. Listen for events from Phaser
      EventBus.on(GameEvents.LEVEL_WON, async () => {
        // Trigger React State / Supabase save
        await incrementLevel(); 
        // Trigger React UI Modal via state or another event
      });
    }

    // 3. Cleanup function on unmount
    return () => {
      if (gameInstanceRef.current) {
        // Remove listeners to prevent memory leaks
        EventBus.off(GameEvents.LEVEL_WON); 
        
        // Destroy Phaser instance completely
        gameInstanceRef.current.destroy(true); 
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    // The wrapper div must take up the full mobile screen
    // touch-none prevents native browser scrolling/zooming gestures
    <div 
      ref={gameContainerRef} 
      id="phaser-container" 
      className="w-full h-screen overflow-hidden touch-none bg-slate-900" 
    />
  );
}
```

## 3. Phaser Scene Structure & Configuration
The AI must configure the Phaser game to optimize for mobile browsers.

**AI Directive:** Create a `game/config.ts` file with these exact settings.

```typescript
// game/config.ts
import { Types, Scale } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainGameScene } from './scenes/MainGameScene';

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO, // Uses WebGL if available, falls back to Canvas
  width: 1080, // Internal resolution width
  height: 1920, // Internal resolution height (Vertical orientation)
  parent: 'phaser-container',
  backgroundColor: '#000000',
  transparent: true, // Allows CSS backgrounds to show through if desired
  scale: {
    // Crucial for mobile scaling: Fits to screen, maintains aspect ratio
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: [BootScene, MainGameScene],
};
```

## 4. UI to Game Communication (The Reverse Direction)
Sometimes the DOM needs to talk to the Canvas. For example, the user clicks an "Undo" booster button in the React HUD.

**React Side:**
```tsx
// HUD component button `onClick` handler
const handleUndoClick = () => {
  const success = useGameStore.getState().useBooster('undo');
  if (success) {
    // Send event to Phaser to animate and execute the Undo
    EventBus.emit(GameEvents.USE_BOOSTER, 'undo'); 
  }
};
```

**Phaser Side (Inside `MainGameScene.ts`):**
```typescript
// Inside create() method
EventBus.on(GameEvents.USE_BOOSTER, (boosterType: string) => {
    if (boosterType === 'undo') {
        this.executeUndoLogic();
    }
});
```

## 5. Architectural Rule for AI Agents
**Rule of Separation:**
*   **React** handles the Meta-game: Main Menu, Level Select Map, Store, Settings, Daily Rewards, Game Over Screens, and Auth.
*   **Phaser** handles the Core-game: The Board, the Balls, the Conveyor Belt, the Match Logic, and the Animations.
*   The Canvas (`#phaser-container`) sits absolutely positioned at `z-index: 0`. The React HUD overlays sit at `z-index: 10+`. Pointer events should pass through the React UI (using `pointer-events-none` in Tailwind, except for clickable buttons) so the user can tap the game board underneath.
