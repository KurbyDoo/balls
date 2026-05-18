export interface BoosterInventory {
    undo: number;
    shuffle: number;
    extra_slot: number; // Will be renamed/repurposed to temporary hold slot later
}

export interface UserProfile {
    id: string;
    username: string | null;
    current_level: number;
    coins: number;
    boosters: BoosterInventory;
    saved_board_state: GameStateDump | null;
}

// Data dumped when saving a game mid-level
export interface GameStateDump {
    level_id: number;
    upper_grid: BoxData[]; // The Island grid boxes
    lower_grid: TargetBoxData[]; // The 1x3 matching boxes
    conveyor_slots: (BallData | null)[]; // 30 slot array
}

export interface LevelData {
    upperGrid: BoxData[];
    lowerGrid: TargetBoxData[];
    // Other things like walls if needed
}

export interface BoxData {
    id: string;
    x: number; // Grid X position
    y: number; // Grid Y position
    isOpen: boolean; // True if interactive, false if locked
    cleared?: boolean; // True if completely removed from the board
    balls: BallData[]; // The 9 balls contained within
    // Note: special components might be listed here later
}

export interface TargetBoxData {
    id: string;
    columnId: number; // 0 to 3
    reqColorId: number; // The color needed to fill this box
    currentCount: number; // 0 to 3
}

export interface BallData {
    id: string; // Unique identifier for the instance
    colorId: number; // Used for matching
}
