'use client';
import dynamic from 'next/dynamic';

const BabylonGame = dynamic(() => import('../../components/BabylonGameWrapper'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-[#F5F2EB] text-gray-400 font-bold">
            Loading 3D Engine...
        </div>
    ),
});

export default function Game3DPage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#F5F2EB]">
            {/* Babylon Canvas Layer */}
            <BabylonGame />

            {/* React HUD Overlay Layer */}
            <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between">
                <div className="pointer-events-auto bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg font-bold">
                    3D HUD Overlay
                </div>
            </div>
        </main>
    );
}