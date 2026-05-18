import Phaser, { Types, Scale } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainGameScene } from './scenes/MainGameScene';

export const gameConfig: Types.Core.GameConfig = {
    type: Phaser.AUTO, // Uses WebGL if available, falls back to Canvas
    width: 1080, // Internal resolution width
    height: 1920, // Internal resolution height (Vertical orientation)
    parent: 'phaser-container',
    backgroundColor: '#F5F2EB',
    transparent: false, // Forces the beige background
    audio: {
        noAudio: true, // Prevents AudioContext errors during Next.js Hot Reloading / Strict Mode
    },
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