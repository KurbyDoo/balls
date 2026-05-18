import { BoxData, TargetBoxData, BallData, LevelData } from '@/types/game';

export interface LevelConfig {
    gridWidth: number;   // Max X of Island Grid
    gridHeight: number;  // Max Y of Island Grid
    boxCount: number;    // Number of 9-ball boxes to spawn
    colorCount: number;  // Number of unique colors available
}

// Determines the difficulty scaling parameters based on the current level
// Grid width/height is universally 7x7 logic space now
export function getConfigForLevel(level: number): LevelConfig {
    if (level === 1) return { gridWidth: 7, gridHeight: 7, boxCount: 3, colorCount: 4 }; // 441 balls, 147 lower boxes
    if (level <= 10) return { gridWidth: 7, gridHeight: 7, boxCount: 6, colorCount: 4 }; // 54 balls, 18 lower boxes
    if (level <= 30) return { gridWidth: 7, gridHeight: 7, boxCount: 8, colorCount: 6 }; // 72 balls, 24 lower boxes
    return { gridWidth: 7, gridHeight: 7, boxCount: 12, colorCount: 8 }; // 108 balls, 36 lower boxes
}

export class LevelGenerator {
    /**
     * Generates a fully solvable board state utilizing the new Island Grid and Lower Grid constraints.
     */
    public static generate(level: number): LevelData {
        const config = getConfigForLevel(level);
        const upperGrid: BoxData[] = [];
        const lowerGrid: TargetBoxData[] = [];

        let ballIdCounter = 0;
        let lowerBoxIdCounter = 0;

        // 1. Generate colors for the sets of 3. Total sets of 3 balls = boxCount * 3
        const totalSets = config.boxCount * 3;
        const generatedSets: number[] = [];
        for (let i = 0; i < totalSets; i++) {
            generatedSets.push(Math.floor(Math.random() * config.colorCount) + 1);
        }

        // 2. Mix those sets of 3 into boxes of 9 balls.
        for (let i = 0; i < config.boxCount; i++) {
            const boxBalls: BallData[] = [];
            // Grab 3 sets for this box
            for (let j = 0; j < 3; j++) {
                const color = generatedSets[i * 3 + j];
                for (let k = 0; k < 3; k++) {
                    boxBalls.push({ id: `ball_${ballIdCounter++}`, colorId: color });
                }
            }
            // Shuffle balls inside the box (optional)

            // Layout to ensure a mix of Open and Closed (Grey/Green) boxes.
            // Spread across the full 7x7 grid.
            const x = (i % config.gridWidth);
            const y = Math.floor(i / config.gridWidth);

            // Bottom-most row logic of this cluster is 'open'
            const maxY = Math.floor((config.boxCount - 1) / config.gridWidth);
            const isOpen = y === maxY;

            upperGrid.push({
                id: `box_${i}`,
                x,
                y,
                isOpen,
                balls: boxBalls
            });
        }

        // 3. Map colors 1-to-1 into Lower Target Boxes
        // Every set of 3 needs exactly one lower grid target box
        generatedSets.forEach((color, index) => {
            lowerGrid.push({
                id: `target_${lowerBoxIdCounter++}`,
                columnId: index % 4, // 4 columns horizontally arranged
                reqColorId: color,
                currentCount: 0
            });
        });

        return { upperGrid, lowerGrid };
    }
}
