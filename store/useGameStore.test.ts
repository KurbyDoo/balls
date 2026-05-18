import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';

// Mock Supabase to avoid network calls
vi.mock('@supabase/ssr', () => {
    return {
        createBrowserClient: vi.fn(() => ({
            from: vi.fn(() => ({
                update: vi.fn(() => ({
                    eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            }))
        }))
    };
});

describe('useGameStore', () => {
    beforeEach(() => {
        // Reset the store state before each test
        const store = useGameStore.getState();
        if (store.profile) {
            useGameStore.setState({ profile: null });
        }
    });

    it('should initialize with null profile', () => {
        const profile = useGameStore.getState().profile;
        expect(profile).toBeNull();
    });

    it('should update profile using setProfile', () => {
        const mockProfile = {
            id: '123',
            username: 'testuser',
            current_level: 1,
            coins: 100,
            boosters: { undo: 3, shuffle: 3, extra_slot: 1 },
            saved_board_state: null
        };

        useGameStore.getState().setProfile(mockProfile);
        
        expect(useGameStore.getState().profile).toEqual(mockProfile);
    });

    it('should incrementally update the level and optimistically apply it', async () => {
        const mockProfile = {
            id: '123',
            username: 'testuser',
            current_level: 1,
            coins: 100,
            boosters: { undo: 3, shuffle: 3, extra_slot: 1 },
            saved_board_state: null
        };

        useGameStore.getState().setProfile(mockProfile);
        
        await useGameStore.getState().incrementLevel();

        expect(useGameStore.getState().profile?.current_level).toBe(2);
    });

    it('should decrement booster if available and return true', async () => {
        const mockProfile = {
            id: '123',
            username: 'testuser',
            current_level: 1,
            coins: 100,
            boosters: { undo: 3, shuffle: 3, extra_slot: 1 },
            saved_board_state: null
        };

        useGameStore.getState().setProfile(mockProfile);
        
        const success = await useGameStore.getState().useBooster('undo');

        expect(success).toBe(true);
        expect(useGameStore.getState().profile?.boosters.undo).toBe(2);
    });

    it('should not decrement booster if 0 and return false', async () => {
        const mockProfile = {
            id: '123',
            username: 'testuser',
            current_level: 1,
            coins: 100,
            boosters: { undo: 0, shuffle: 3, extra_slot: 1 },
            saved_board_state: null
        };

        useGameStore.getState().setProfile(mockProfile);
        
        const success = await useGameStore.getState().useBooster('undo');

        expect(success).toBe(false);
        expect(useGameStore.getState().profile?.boosters.undo).toBe(0); // Should still be 0
    });
});
