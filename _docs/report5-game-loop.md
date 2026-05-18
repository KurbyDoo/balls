
**Project**: Web-based "Jam/Sort" Game
**Target Execution**: AI Code Generation Guide

## 1. Visualizing the 3D Tilted Perspective & Screen Layout
The underlying level data relies on a 2D grid logic plane, but the game itself must be rendered in a **3D tilted perspective** (an angled top-down / pseudo-isometric view). 

**Screen Hierarchy (Visual Layout from Top to Bottom):**
1. **Upper Island Grid**: Near the top of the screen; contains the interactable boxes (with 9 balls each).
2. **The Funnel**: Directly below the main grid; spans the width of the board to catch falling balls.
3. **The Conveyor Belt**: Below the funnel; a continuously rotating oval track.
4. **The Lower Grid (Conveyor Boxes)**: At the very bottom; columns of 1x3 matching boxes waiting to receive balls from the conveyor above.

**AI Directive:** Inside `MainGameScene.ts`, create a `renderBoard()` method that translates the raw 2D grid logic (X, Y) into tilted/pseudo-3D screen coordinates to give the board depth.

```typescript
// Inside MainGameScene.ts

renderBoard(levelData: LevelData) {
  // Render Upper Island Boxes
  levelData.upperGrid.forEach(box => {
    // Determine positioning mapping
    // If box.isOpen -> Render 3x3 internal grid of 9 balls
    // If !box.isOpen -> Render solid color block showing dominant color
    // Add sprite.on('pointerdown') for clicking Open Boxes
  });

  // Render Lower Grid Columns
  levelData.lowerGrid.forEach(column => {
    // Render 1x3 requirement boxes
    // Highlighting only the top row (directly under the conveyor)
  });
}
```

## 2. Click Validation (Is the Box Open?)
When a player taps a box in the Upper Island, the game must verify it is in an `Open` state and isn't blocked by advanced components directly on top of it.

```typescript
// Inside MainGameScene.ts

handleBoxClick(clickedBox: BoxSprite) {
  if (this.isAnimating || clickedBox.getData('isClosed')) return;

  // 1. Remove box graphics
  this.clearBoxFromGrid(clickedBox);
  
  // 2. Animate 9 balls falling into the funnel & conveyor
  this.animateToFunnelAndConveyor(clickedBox.getData('balls'));

  // 3. Reveal and unlock adjacent closed boxes
  this.updateAdjacentBoxStates(clickedBox);
}
```

## 3. Funnel & Conveyor Belt Logic
Once a box is clicked, its 9 balls fall into the funnel and populate the first available empty slots on the continuously rotating 30-slot oval conveyor.

```typescript
// Inside MainGameScene.ts

private conveyorSlots: BallSprite[] = new Array(30).fill(null);

animateToFunnelAndConveyor(balls: BallSprite[]) {
  balls.forEach((ball, index) => {
    // 1. Tween ball dropping to funnel coordinate
    // 2. Assign to first available conveyor slot (index modulo 30 handling)
    // 3. Parent the ball to the rotating conveyor container/animation tick
  });
}
```

## 4. The Match Evaluator (Lower Grid Gravity)
As the conveyor continuously ticks forward, the game checks if balls passing over the top-row 1x3 boxes map to their required colors.

```typescript
// Inside MainGameScene.ts

update() {
  // Fired every frame
  // 1. Rotate the conveyor oval
  this.tickConveyor();
  
  // 2. Check for matches over the Top Row of the Lower Grid
  this.evaluateConveyorMatches();
}

evaluateConveyorMatches() {
  this.conveyorSlots.forEach((ball, slotIndex) => {
    if (!ball) return;

    const matchingLowerBox = this.getLowerBoxDirectlyBelow(slotIndex);
    
    // If color matches and box isn't full
    if (matchingLowerBox && matchingLowerBox.reqColor === ball.getData('colorId') && !matchingLowerBox.isFull) {
      
      // Suck ball into the lower box
      this.absorbBallToBox(ball, matchingLowerBox);
      
      // Free the slot
      this.conveyorSlots[slotIndex] = null;
    }
  });
}

absorbBallToBox(ball: BallSprite, box: TargetBox) {
  box.currentCount++;
  // Tween ball falling into the box hole
  // CAUTION: Ensure scoping inside onComplete handles external variables successfully without throwing ReferenceError
  
  if (box.currentCount === 3) {
    // Fire event to clear the TargetBox from the lower grid and shift gravity down
  }
}
```

## 5. Adjacent Box State Updates
Upon a box successfully clearing out all balls and being sent to the conveyor, it triggers its directly orthogonal adjacent neighboring boxes to "Open".

```typescript
// Inside MainGameScene.ts

updateAdjacentBoxes(clearedBox: BoxData) {
  // Find adjacent boxes conceptually
  const adjacentPositions = [
      { x: clearedBox.x + 1, y: clearedBox.y },
      { x: clearedBox.x - 1, y: clearedBox.y },
      { x: clearedBox.x, y: clearedBox.y + 1 },
      { x: clearedBox.x, y: clearedBox.y - 1 }
  ];

  // Map state and change styles to open and display their internal 9 balls conceptually
}
```

