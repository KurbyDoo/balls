import { create } from 'zustand';
import { createBrowserClient } from '@supabase/ssr';
import { UserProfile, BoosterInventory } from '../types/game';

interface GameStore {
    profile: UserProfile | null;
    setProfile: (profile: UserProfile) => void;
    incrementLevel: () => Promise<void>;
    useBooster: (boosterType: keyof BoosterInventory) => Promise<boolean>;
}

// Ensure the client-side keys are used properly as per guidelines
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const useGameStore = create<GameStore>((set, get) => ({
    profile: null,
    setProfile: (profile) => set({ profile }),

    incrementLevel: async () => {
        // 1. Optimistic UI update (update local state immediately)
        const current = get().profile;
        if (!current) return;

        const nextLevel = current.current_level + 1;

        set({ profile: { ...current, current_level: nextLevel } });

        // 2. Background sync to Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ current_level: nextLevel })
            .eq('id', current.id);

        if (error) {
            console.error('Failed to sync level increment to Supabase:', error);
            // Optional: Rollback state here if required
        }
    },

    useBooster: async (boosterType) => {
        const current = get().profile;
        if (!current) return false;

        const currentBoosterCount = current.boosters[boosterType];

        if (currentBoosterCount > 0) {
            const newBoosters = {
                ...current.boosters,
                [boosterType]: currentBoosterCount - 1
            };

            // Optimistic update
            set({ profile: { ...current, boosters: newBoosters } });

            // Supabase sync
            const { error } = await supabase
                .from('profiles')
                .update({ boosters: newBoosters })
                .eq('id', current.id);

            if (error) {
                console.error(`Failed to use booster ${boosterType}:`, error);
                // Rollback optimistic update
                set({ profile: current });
                return false;
            }
            return true;
        }

        return false;
    }
}));
