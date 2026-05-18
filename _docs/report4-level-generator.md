
**Project**: Web-based "Jam/Sort" Game
**Target Execution**: AI Code Generation Guide

## 1. Concept: The Island Grid System & Conveyor Belt

The game has been fundamentally redesigned away from a raw Z-index stacking mechanic. Instead, we use an **Island of Connected Boxes** combined with a **Funnel**, a **Conveyor Belt**, and a **Lower Matching Grid**.

### The Upper Grid Core Architecture
*   The level grid universally sits on a logical **7x7 grid space**. Empty game boards should be assumed to be 7x7 grid spaces wide.
*   **3D Rendering Style:** Even though it's mathematically 2D, the Game Loop must render these objects in a pseudo-3D or tilted perspective so boxes look like blocks with depth, not flat squares.
*   The grid is composed of three specific tile types:
    1.  **Open Spaces**: Empty playable squares visually rendered on the 7x7 plane.
    2.  **Wall Spaces**: Solid blocks that cannot be interacted with. They shape the level's geography and can serve as anchors (e.g., for chains).
    3.  **Box Spaces**: Large individual squares containing exactly **9 balls** (arranged in a 3x3 internal grid).
*   The balls inside a single box can either be all 1 solid color (9 balls) OR 3 sets of 3 mixed colors.
*   Spaces are placed adjacently, forming contiguous "islands" of cells.

### Box States & Unlocking Logic
*   **Closed State**: Visually, the box is a solid color and its contents are hidden (unless governed by a special component). It cannot be interacted with.
*   **Open State**: Visually, the box reveals its 9 balls. It is interactive.
*   **Starting State**: A box is *always* closed unless it is directly adjacent to an "Open Space" or a cleared box. At the start of a level, the *only* boxes dynamically forced open are those situated directly above the central Funnel at the bottom of the grid.
*   **Progression Flow**: When a player clicks an *Open* box, it "clears" (disappears from the board) and drops its 9 balls down to the funnel. Any orthogonally adjacent *Closed* boxes immediately transition into the *Open* state (unless restricted by Special Components).

### Special Component Infrastructure
*   The grid's underlying data model must easily support layered objects, blocking conditions, and modifying rules for advanced mechanics.
*   *Please refer to `_docs/report7-special-components.md` for full implementation details regarding advanced components introduced in higher levels.*

### The Funnel & Conveyor Belt
*   Below the Island grid is a central **Funnel** that spans the width of the main play area.
*   When a box clears, its 9 balls fall down the funnel.
*   The funnel deposits balls into a continuously rotating **Conveyor Belt** shaped like an oval at the bottom of the screen.
*   **Conveyor Rules**:
    *   It rotates continuously counter-clockwise.
    *   It contains exactly **30 slots**.
    *   Balls falling from the funnel drop directly into open slots on the conveyor at the funnel drop point.

## 2. Lower Grid (The Matching Area)
*   Below the conveyor belt sits a completely separate lower grid.
*   This grid is made up of exactly **4 columns** of `1x3` target boxes.
*   These lower target boxes must have a **3:1 width-to-height ratio** (e.g., width is 3 times the height, mimicking a long tray that catches 3 balls horizontally) and be placed adjacent to one another.
*   Each of these boxes demands a specific color.
*   **State Rules**:
    *   Only the *top row* of boxes directly beneath the conveyor are active/opened (displaying 3 holes).
    *   Boxes below the top row remain closed until the box above them is cleared.
*   **Matching Flow**:
    *   As the conveyor rotates, if a ball passes directly over an open lower box *and* matches the required color of that box, the ball automatically drops from the conveyor into the box.
    *   Once a lower box receives 3 matching balls, it is considered "Completed". It clears/disappears.
    *   **Gravity Shift**: All remaining lower boxes in that column shift upwards to replace it, bringing the next box into the active top row.

## 3. The Rules of Generation & Win Conditions
To guarantee a solvable puzzle without orphan colors:
1.  **Total Count Match**: The total number of `1x3` matching boxes generated in the lower area must be *exactly* `Total Balls / 3`.
    *   *Example*: If the upper island spawns 5 boxes (45 balls total), the lower grid must spawn exactly 15 of these `1x3` matching boxes.
2.  **No Leftovers**: There must be zero leftover colors or partially completeable lower boxes. Every ball spawned in the upper Island maps perfectly to 1/3rd of a lower box.
3.  **Win State**: The level is won when the upper Island is wiped clear AND all lower grid matching boxes are completed and cleared.

## 4. Why this guarantees a solvable game
Because the generator builds sets of 3 perfectly matched to the lower grid boxes, and we enforce a strict 1-to-1 ratio, the puzzle is mathematically sound. The fun/challenge comes from the 30-slot conveyor belt and managing the release of boxes from the Island Grid. If a player frees too many boxes at once, the 30 conveyor slots could fill up with unmatched balls, causing a game over.

## 5. Output to Phaser
When the user clicks "Play Level 25" in the React UI, the React app mounts the Phaser `MainGameScene`. 
In `MainGameScene.create()`, it will call:
`const levelData = LevelGenerator.generate(25);`
It will then iterate through `levelData.upperGrid` and `levelData.lowerGrid` to draw the sprites on the screen.
