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