'use client';
import dynamic from 'next/dynamic';

// We must dynamically load the GameWrapper with SSR turned off
// Why? Phaser requires access to `window` and the WebGL/Canvas APIs 
// which do not exist when Next.js builds on the server.
const PhaserGame = dynamic(() => import('../../components/GameWrapper'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-[#F5F2EB] text-gray-400 font-bold">
            Loading Engine...
        </div>
    ),
});

export default function GamePage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#F5F2EB]">
            {/* 
        Phase 2 Architecture Map:
        - The Phaser Game sits at z-index: 0
        - React UI overlay logic (HUD, pause menus, pointer-events-none) goes below, above the canvas.
      */}
            <PhaserGame />

            {/* Example React HUD Overlay overlaying the Phaser Canvas */}
            <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between">
                <div className="pointer-events-auto bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg font-bold">
                    HUD Overlay
                </div>
            </div>
        </main>
    );
}