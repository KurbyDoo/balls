import { describe, it, expect } from 'vitest';
import { LevelGenerator, getConfigForLevel } from '@/utils/LevelGenerator';

describe('LevelGenerator', () => {
    it('returns correct configuration scaling based on levels', () => {
        expect(getConfigForLevel(1)).toEqual({ gridWidth: 7, gridHeight: 7, boxCount: 49, colorCount: 4 });
        expect(getConfigForLevel(10)).toEqual({ gridWidth: 7, gridHeight: 7, boxCount: 6, colorCount: 4 });

        expect(getConfigForLevel(11)).toEqual({ gridWidth: 7, gridHeight: 7, boxCount: 8, colorCount: 6 });
        expect(getConfigForLevel(30)).toEqual({ gridWidth: 7, gridHeight: 7, boxCount: 8, colorCount: 6 });

        expect(getConfigForLevel(31)).toEqual({ gridWidth: 7, gridHeight: 7, boxCount: 12, colorCount: 8 });
    });

    it('generates the correct upper and lower grids requested by the config', () => {
        const data1 = LevelGenerator.generate(1);
        expect(data1.upperGrid).toHaveLength(49);
        expect(data1.lowerGrid).toHaveLength(147);

        const data20 = LevelGenerator.generate(20);
        expect(data20.upperGrid).toHaveLength(8);
        expect(data20.lowerGrid).toHaveLength(24);
    });

    it('guarantees balls are grouped perfectly in sets of three inside boxes', () => {
        const data = LevelGenerator.generate(15);
        const { upperGrid, lowerGrid } = data;

        const colorCounts: Record<number, number> = {};

        upperGrid.forEach(box => {
            expect(box.balls).toHaveLength(9);
            box.balls.forEach(ball => {
                if (!colorCounts[ball.colorId]) {
                    colorCounts[ball.colorId] = 0;
                }
                colorCounts[ball.colorId]++;
            });
        });

        // Every color generated must have a count perfectly divisible by 3 across all balls
        Object.values(colorCounts).forEach(count => {
            expect(count % 3).toBe(0);
        });

        // Also every target box must match a set of 3
        expect(lowerGrid.length).toBe(Object.values(colorCounts).reduce((a, b) => a + b, 0) / 3);
    });

    it('generates unique ball and box/target IDs', () => {
        const { upperGrid, lowerGrid } = LevelGenerator.generate(10);

        const boxIds = new Set(upperGrid.map(b => b.id));
        expect(boxIds.size).toBe(upperGrid.length);

        const targetIds = new Set(lowerGrid.map(t => t.id));
        expect(targetIds.size).toBe(lowerGrid.length);

        const ballIds = new Set();
        upperGrid.forEach(b => b.balls.forEach(ball => ballIds.add(ball.id)));
        expect(ballIds.size).toBe(upperGrid.reduce((sum, box) => sum + box.balls.length, 0));
    });
});
