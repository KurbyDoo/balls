import { describe, it, expect, vi } from 'vitest';
import { EventBus, GameEvents } from './EventBus';

describe('EventBus', () => {
    it('should emit and listen to events correctly', () => {
        const mockCallback = vi.fn();

        // Listen to an event
        EventBus.on(GameEvents.LEVEL_WON, mockCallback);

        // Emit the event
        EventBus.emit(GameEvents.LEVEL_WON);

        // Ensure the callback was triggered
        expect(mockCallback).toHaveBeenCalledTimes(1);

        // Cleanup
        EventBus.off(GameEvents.LEVEL_WON, mockCallback);
    });

    it('should correctly pass payload data through the bus', () => {
        const mockCallback = vi.fn();

        EventBus.on(GameEvents.USE_BOOSTER, mockCallback);
        EventBus.emit(GameEvents.USE_BOOSTER, 'undo');

        expect(mockCallback).toHaveBeenCalledWith('undo');

        EventBus.off(GameEvents.USE_BOOSTER, mockCallback);
    });
});
