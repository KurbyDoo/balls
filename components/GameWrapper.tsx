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
        // Dynamic import to prevent SSR matching issues with window/canvas
        const initPhaser = async () => {
            if (!gameInstanceRef.current && gameContainerRef.current) {

                gameInstanceRef.current = new Game({
                    ...gameConfig,
                    parent: gameContainerRef.current, // Mount canvas to this div
                });

                // 2. Listen for events from Phaser
                EventBus.on(GameEvents.LEVEL_WON, async () => {
                    // Trigger React State / Supabase save
                    await incrementLevel();
                    // Future: Trigger React UI Modal via state or another event
                });
            }
        };

        initPhaser();

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
    }, [incrementLevel]);

    return (
        // The wrapper div must take up the full mobile screen
        // touch-none prevents native browser scrolling/zooming gestures
        <div
            ref={gameContainerRef}
            id="phaser-container"
            className="w-full h-screen overflow-hidden touch-none bg-slate-900 absolute top-0 left-0 z-0"
        />
    );
}
