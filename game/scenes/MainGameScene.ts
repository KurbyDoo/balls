import Phaser, { Scene } from 'phaser';
import { EventBus, GameEvents } from '../../utils/EventBus';
import { LevelGenerator } from '../../utils/LevelGenerator';
import { LevelData, BoxData, TargetBoxData, BallData } from '../../types/game';

export class MainGameScene extends Scene {
    private levelData!: LevelData;
    private isAnimating: boolean = false;
    private conveyorSlots: (BallData | null)[] = new Array(30).fill(null);
    private conveyorSprites: (Phaser.GameObjects.Arc | null)[] = new Array(30).fill(null);
    private emptySlotSprites: Phaser.GameObjects.Arc[] = [];
    private funnelQueue: Phaser.GameObjects.Arc[] = [];
    private fallingBallGroup!: Phaser.Physics.Arcade.Group;
    private funnelWalls!: Phaser.Physics.Arcade.StaticGroup;
    private conveyorPath!: Phaser.Curves.Path;
    private conveyorOffset: number = 0;
    private conveyorSpeed: number = 0.0003; // path progress per frame
    private lowerGridBoxes: { data: TargetBoxData, numFilled: number, columnIdx: number, rowIdx: number, graphics: Phaser.GameObjects.Container }[] = [];

    private upperGridBoxes: { data: BoxData, topFace: Phaser.GameObjects.Rectangle, container: Phaser.GameObjects.Container }[] = [];


    // TODO: Move eventually to a style config of some sort
    private colorCodes = [
        0xFF00A4,
        0xF5FD5E,
        0x91F563,
        0x00F5FB,
        0xFFA5FC,
        0x8700F3,
        0xE2A5EA,
        0xE7447D,
        0x0082CD
    ];

    getDarkerColor(colorId: number) {
        const factor = 0.7;
        const hex = this.colorCodes[colorId];

        // 1. Extract channels using Bitwise Shifts and Masks
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;

        // 2. Scale each channel down
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        return (newR << 16) | (newG << 8) | newB;

    }

    constructor() {
        super('MainGameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#F5F2EB');
        // Build the Island/Conveyor Setup
        this.levelData = LevelGenerator.generate(1); // Default to 1 for now

        this.fallingBallGroup = this.physics.add.group({
            bounceX: 0.4,
            bounceY: 0.4,
            collideWorldBounds: false
        });

        // Balls collide with each other
        this.physics.add.collider(this.fallingBallGroup, this.fallingBallGroup);

        this.renderBackgroundVisuals();
        this.setupConveyorPath();

        this.renderBoard(this.levelData);

        // Communicate back to React that we're alive
        EventBus.emit(GameEvents.PHASER_READY);

        // Expose to window for E2E testing
        (window as any).gameScene = this;

        // Listen for React -> Phaser UI events
        EventBus.on(GameEvents.USE_BOOSTER, (boosterType: string) => {
            if (boosterType === 'undo') {
                this.executeUndoLogic();
            }
        });
    }

    renderBackgroundVisuals() {
        const wallColor = 0xF5F2EB; // Pastel beige/white walls
        const pitDepthColor = 0xDCD5C6; // Slightly darker for depth rim
        const pitFloorColor = 0xECE6D5; // Muted pastel floor to let neon pop

        // Base is the pit floor!
        this.add.rectangle(1080 / 2, 1920 / 2, 1080, 1920, pitFloorColor);

        // Calculate geometry bounds
        const boxSize = 130;
        const spacing = 145;
        const totalGridWidth = (6 * spacing) + boxSize;
        const gridOffsetX = (1080 - totalGridWidth) / 2 + (boxSize / 2);
        const gridOffsetY = 200;

        // 1/4 box gap requested around the 7x7 grid
        const gap = boxSize / 4;
        const pitLeft = gridOffsetX - (boxSize / 2) - gap;
        const pitRight = gridOffsetX + (6 * spacing) + (boxSize / 2) + gap;
        const pitTop = gridOffsetY - (boxSize / 2) - gap;

        // 1. Top Wall Background
        this.add.rectangle(1080 / 2, pitTop / 2, 1080, pitTop, wallColor);

        // 2. Left Wall down to Funnel Top (Y: 1200)
        this.add.rectangle(pitLeft / 2, pitTop + (1200 - pitTop) / 2, pitLeft, 1200 - pitTop, wallColor);

        // 3. Right Wall down to Funnel Top
        this.add.rectangle(1080 - (1080 - pitRight) / 2, pitTop + (1200 - pitTop) / 2, 1080 - pitRight, 1200 - pitTop, wallColor);

        const g = this.add.graphics();
        g.fillStyle(wallColor, 1);

        // 4. Elevated Funnel Slope Walls forming into the pit!
        // Left sloped wall polygon
        g.beginPath();
        g.moveTo(0, 1200);
        g.lineTo(40, 1200);   // Matches physics
        g.lineTo(500, 1350);  // Matches physics
        g.lineTo(0, 1350);
        g.fillPath();

        // Right sloped wall polygon
        g.beginPath();
        g.moveTo(1080, 1200);
        g.lineTo(1040, 1200); // Matches physics
        g.lineTo(580, 1350);  // Matches physics
        g.lineTo(1080, 1350);
        g.fillPath();

        // 5. Lower Conveyor Room Walls (Walls surrounding the conveyor)
        const pitLeftB = boxSize / 2; // ~65
        const pitRightB = 1080 - (boxSize / 2); // ~1015
        const bottomY = 1920;

        // Left Wall of bottom section
        this.add.rectangle(pitLeftB / 2, 1350 + (bottomY - 1350) / 2, pitLeftB, bottomY - 1350, wallColor);
        // Right Wall of bottom section
        this.add.rectangle(1080 - (1080 - pitRightB) / 2, 1350 + (bottomY - 1350) / 2, 1080 - pitRightB, bottomY - 1350, wallColor);
        // Bottom-most Wall 
        this.add.rectangle(1080 / 2, 1910, 1080, 20, wallColor);

        // Inner Depth Walls making it distinctly isometric
        const wallDepth = 25; // How far down/in the wall projects

        // Draw left isometric face
        g.fillStyle(pitDepthColor, 1);
        g.beginPath();
        g.moveTo(pitLeft, pitTop);
        g.lineTo(pitLeft + wallDepth, pitTop + wallDepth);
        g.lineTo(pitLeft + wallDepth, 1200 + wallDepth); // extended to depth
        g.lineTo(pitLeft, 1200);
        g.fillPath();

        // Draw right isometric face
        g.fillStyle(pitDepthColor, 1);
        g.beginPath();
        g.moveTo(pitRight, pitTop);
        g.lineTo(pitRight - wallDepth, pitTop + wallDepth);
        g.lineTo(pitRight - wallDepth, 1200 + wallDepth); // extended to depth
        g.lineTo(pitRight, 1200);
        g.fillPath();

        // Draw top isometric face
        g.fillStyle(0xE5DDCB, 1); // lighter shade for top-down light
        g.beginPath();
        g.moveTo(pitLeft, pitTop);
        g.lineTo(pitLeft + wallDepth, pitTop + wallDepth);
        g.lineTo(pitRight - wallDepth, pitTop + wallDepth);
        g.lineTo(pitRight, pitTop);
        g.fillPath();

        // Mid-Level flat Ledges (Top of funnel)
        g.fillStyle(0xE5DDCB, 1); // flat ledge facing up
        g.beginPath();
        g.moveTo(pitLeft, 1200);
        g.lineTo(pitLeft + wallDepth, 1200 + wallDepth);
        g.lineTo(40 + wallDepth, 1200 + wallDepth);
        g.lineTo(40, 1200);
        g.fillPath();

        g.beginPath();
        g.moveTo(pitRight, 1200);
        g.lineTo(pitRight - wallDepth, 1200 + wallDepth);
        g.lineTo(1040 - wallDepth, 1200 + wallDepth);
        g.lineTo(1040, 1200);
        g.fillPath();

        // Funnel Slopes - True isometric projection maintaining parallel slope
        g.fillStyle(pitDepthColor, 1);
        g.beginPath();
        g.moveTo(40, 1200);
        g.lineTo(40 + wallDepth, 1200 + wallDepth);
        g.lineTo(500 + wallDepth, 1350 + wallDepth);
        g.lineTo(500, 1350);
        g.fillPath();

        g.beginPath();
        g.moveTo(1040, 1200);
        g.lineTo(1040 - wallDepth, 1200 + wallDepth);
        g.lineTo(580 - wallDepth, 1350 + wallDepth);
        g.lineTo(580, 1350);
        g.fillPath();

        // Lower Conveyor Ledges (Horizontal)
        g.fillStyle(0xE5DDCB, 1); // facing up
        g.beginPath();
        g.moveTo(pitLeftB, 1350);
        g.lineTo(pitLeftB + wallDepth, 1350 + wallDepth);
        g.lineTo(500 + wallDepth, 1350 + wallDepth);
        g.lineTo(500, 1350);
        g.fillPath();

        g.beginPath();
        g.moveTo(pitRightB, 1350);
        g.lineTo(pitRightB - wallDepth, 1350 + wallDepth);
        g.lineTo(580 - wallDepth, 1350 + wallDepth);
        g.lineTo(580, 1350);
        g.fillPath();

        // Lower Vertical Walls (Dropping into the pit)
        g.fillStyle(pitDepthColor, 1);
        g.beginPath();
        g.moveTo(pitLeftB, 1350);
        g.lineTo(pitLeftB + wallDepth, 1350 + wallDepth);
        g.lineTo(pitLeftB + wallDepth, 1900 + wallDepth);
        g.lineTo(pitLeftB, 1900);
        g.fillPath();

        g.beginPath();
        g.moveTo(pitRightB, 1350);
        g.lineTo(pitRightB - wallDepth, 1350 + wallDepth);
        g.lineTo(pitRightB - wallDepth, 1900 + wallDepth);
        g.lineTo(pitRightB, 1900);
        g.fillPath();

        // Stroke border along the main inner floor rim 
        g.lineStyle(2, 0xCac1A9, 1);
        g.beginPath();
        g.moveTo(pitLeftB + wallDepth, 1900 + wallDepth);
        g.lineTo(pitLeftB + wallDepth, 1350 + wallDepth);
        g.lineTo(500 + wallDepth, 1350 + wallDepth);
        g.lineTo(40 + wallDepth, 1200 + wallDepth);
        g.lineTo(pitLeft + wallDepth, 1200 + wallDepth);
        g.lineTo(pitLeft + wallDepth, pitTop + wallDepth);
        g.lineTo(pitRight - wallDepth, pitTop + wallDepth);
        g.lineTo(pitRight - wallDepth, 1200 + wallDepth);
        g.lineTo(1040 - wallDepth, 1200 + wallDepth);
        g.lineTo(580 - wallDepth, 1350 + wallDepth);
        g.lineTo(pitRightB - wallDepth, 1350 + wallDepth);
        g.lineTo(pitRightB - wallDepth, 1900 + wallDepth);
        g.strokePath();
    }

    setupConveyorPath() {
        const cx = 1080 / 2;
        const cy = 1460; // Leaves a nice visual gap above the conveyor boxes (which spawn at 1600)

        const ballSize = 36;
        const trackWidth = ballSize * 1.5; // ~54
        const dividerWidth = ballSize * 0.5; // ~18

        // Match the width to safely fit inside the new pitLeftB and pitRightB (65 to 1015)
        const width = 850;
        const height = trackWidth + dividerWidth; // Path height offset center to center

        const halfW = width / 2;
        const halfH = height / 2;

        this.conveyorPath = new Phaser.Curves.Path(cx - halfW, cy - halfH);
        // Top edge
        this.conveyorPath.lineTo(cx + halfW, cy - halfH);
        // Right edge
        this.conveyorPath.lineTo(cx + halfW, cy + halfH);
        // Bottom edge
        this.conveyorPath.lineTo(cx - halfW, cy + halfH);
        // Left edge
        this.conveyorPath.lineTo(cx - halfW, cy - halfH);

        const graphics = this.add.graphics();

        // Remove Depth block! Keep the conveyor surface flat to the pit floor 

        // --- Outer Conveyor Surface ---
        graphics.fillStyle(0xDFD6C2, 1); // Track color (muted)
        graphics.fillRoundedRect(
            cx - halfW - (trackWidth / 2),
            cy - halfH - (trackWidth / 2),
            width + trackWidth,
            height + trackWidth,
            20
        );

        // --- Center Divider (Hole / Cutout) ---
        // Expose the pit floor below!
        graphics.fillStyle(0xECE6D5, 1); // Matches pit floor
        graphics.fillRoundedRect(
            cx - halfW + (trackWidth / 2),
            cy - halfH + (trackWidth / 2),
            width - trackWidth,
            height - trackWidth,
            10
        );

        // Outer border
        graphics.lineStyle(4, 0xCac1A9, 1);
        graphics.strokeRoundedRect(
            cx - halfW - (trackWidth / 2),
            cy - halfH - (trackWidth / 2),
            width + trackWidth,
            height + trackWidth,
            20
        );

        // Inner border (around the divider)
        graphics.strokeRoundedRect(
            cx - halfW + (trackWidth / 2),
            cy - halfH + (trackWidth / 2),
            width - trackWidth,
            height - trackWidth,
            10
        );

        // Create animated ball slots (smaller than actual balls)
        for (let i = 0; i < 30; i++) {
            const point = this.conveyorPath.getPoint(i / 30);
            const slot = this.add.circle(point.x, point.y, 16, 0xD1C7B4); // larger size, slightly darker than conveyor
            slot.setStrokeStyle(2, 0xCac1A9);
            this.emptySlotSprites.push(slot);
        }
    }

    renderBoard(levelData: LevelData) {
        this.lowerGridBoxes = []; // Reset before rendering
        this.upperGridBoxes = [];

        // Upper Island render (Pseudo-3D boxes centered on a 7x7 grid logic)
        // 7 columns width max. We center them horizontally.
        const boxSize = 130;
        const spacing = 145;
        // Total physical width of the 7 bounds: 6 gaps + 1 final box size
        const totalGridWidth = (6 * spacing) + boxSize;
        const gridOffsetX = (1080 - totalGridWidth) / 2 + (boxSize / 2); // Perfectly centered at 105
        const gridOffsetY = 200;
        const depth = 20;

        // Ensure the empty targets inside the pit draw accurately
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const x = gridOffsetX + (col * spacing);
                const y = gridOffsetY + (row * spacing);
                this.add.rectangle(x, y, boxSize, boxSize, 0xDFD6C2).setStrokeStyle(2, 0xCac1A9);
            }
        }

        levelData.upperGrid.forEach(box => {
            const x = gridOffsetX + (box.x * spacing);
            const y = gridOffsetY + (box.y * spacing);

            const color = box.isOpen ? 0x999999 : 0x555555;
            const darkColor = box.isOpen ? 0x777777 : 0x333333; // Darker shade for depth

            const boxContainer = this.add.container(x, y);

            // Draw Pseudo-3D box: Side face (bottom)
            const sideFace = this.add.rectangle(0, depth, boxSize, boxSize, darkColor);

            // Draw Pseudo-3D box: Top face
            const topFace = this.add.rectangle(0, 0, boxSize, boxSize, color);

            boxContainer.add([sideFace, topFace]);

            const renderedBalls: Phaser.GameObjects.Arc[] = [];

            // Render 3x3 internal balls if open
            if (box.isOpen) {
                const ballSpacing = boxSize / 3;
                box.balls.forEach((ball, idx) => {
                    const bx = -(boxSize / 2) + (ballSpacing / 2) + ((idx % 3) * ballSpacing);
                    const by = -(boxSize / 2) + (ballSpacing / 2) + (Math.floor(idx / 3) * ballSpacing);
                    const ballSprite = this.add.circle(bx, by, ballSpacing * 0.4, this.colorCodes[ball.colorId]); // temporary coloring
                    ballSprite.setData('ballData', ball);
                    boxContainer.add(ballSprite);
                    renderedBalls.push(ballSprite);
                });
            }

            topFace.setInteractive();
            topFace.setData('box', box);
            topFace.setData('container', boxContainer);
            topFace.setData('renderedBalls', renderedBalls);

            this.upperGridBoxes.push({
                data: box,
                topFace: topFace,
                container: boxContainer
            });

            topFace.on('pointerdown', () => {
                this.handleBoxClick(topFace);
            });
        });

        // Lower Grid render (4 Columns, 3:1 width to height ratio)
        // Usable width roughly between 65 and 1015 = 950
        const usableWidth = 950;
        const targetWidth = 220; // 4 * 220 = 880
        const targetHeight = targetWidth / 3; // 3:1 ratio
        const columnGap = (usableWidth - (4 * targetWidth)) / 5; // (950 - 880) / 5 = 14
        const targetOffsetX = 65 + columnGap + (targetWidth / 2); // 65 + 14 + 110 = 189
        const targetOffsetY = 1600;

        levelData.lowerGrid.forEach((target, index) => {
            // Visualize properly by stacking
        });

        // Compute offsets by column
        const columnCounts = [0, 0, 0, 0];
        levelData.lowerGrid.reverse().forEach((target) => {
            const col = target.columnId;
            const rowIdx = columnCounts[col]++;

            const x = targetOffsetX + (col * (targetWidth + columnGap));
            // Stacking up (since list is reversed), earliest goes at the bottom
            const y = targetOffsetY + (rowIdx * (targetHeight + 10));

            const c = this.colorCodes[target.reqColorId];
            const darkC = this.getDarkerColor(target.reqColorId);

            const container = this.add.container(x, y);

            const sideFace = this.add.rectangle(0, depth, targetWidth, targetHeight, darkC);
            const tgt = this.add.rectangle(0, 0, targetWidth, targetHeight, c);
            tgt.setStrokeStyle(4, 0xffffff);
            sideFace.setStrokeStyle(4, 0xaaaaaa);

            // Draw three empty holes for the tray
            const hole1 = this.add.circle(-targetWidth / 3, 0, targetHeight * 0.3, 0x000000);
            const hole2 = this.add.circle(0, 0, targetHeight * 0.3, 0x000000);
            const hole3 = this.add.circle(targetWidth / 3, 0, targetHeight * 0.3, 0x000000);

            container.add([sideFace, tgt, hole1, hole2, hole3]);

            this.lowerGridBoxes.push({
                data: target,
                numFilled: 0,
                columnIdx: col,
                rowIdx: rowIdx,
                graphics: container,
            });
        });
    }

    handleBoxClick(clickedBoxGraphics: Phaser.GameObjects.Rectangle) {
        if (this.isAnimating) return;
        const boxData = clickedBoxGraphics.getData('box') as BoxData;
        const container = clickedBoxGraphics.getData('container') as Phaser.GameObjects.Container;
        const renderedBalls = clickedBoxGraphics.getData('renderedBalls') as Phaser.GameObjects.Arc[];

        if (!boxData.isOpen) return;

        // Check if there are enough empty slots in the conveyor belt before opening!
        // Factor in balls that are already waiting in the funnel queue!
        const emptySlots = this.conveyorSlots.filter(s => s === null).length - this.funnelQueue.length;
        if (emptySlots < boxData.balls.length) {
            // Conveyor full! Reject click by wiggling the box
            this.tweens.add({
                targets: container,
                x: '+=10',
                yoyo: true,
                repeat: 3,
                duration: 50
            });
            return;
        }

        // 1. Remove box graphics (extract balls first so they don't get destroyed)
        renderedBalls.forEach(ball => {
            // Convert local coordinates to world coordinates
            const worldPos = container.getWorldTransformMatrix().transformPoint(ball.x, ball.y);
            container.remove(ball);
            ball.setPosition(worldPos.x, worldPos.y);
            this.add.existing(ball); // Add back to scene
        });

        // container.destroy(); // Destroys top face and side face

        // Mark box as removed in data
        boxData.isOpen = false;
        boxData.cleared = true;

        // 2. Animate to funnel & conveyor
        this.animateToFunnelAndConveyor(renderedBalls, container);

        // 3. Update Adjacent Box States
        this.updateAdjacentBoxes(boxData);
    }

    updateAdjacentBoxes(clearedBox: BoxData) {
        // Find adjacent boxes conceptually
        const adjacentPositions = [
            { x: clearedBox.x + 1, y: clearedBox.y },
            { x: clearedBox.x - 1, y: clearedBox.y },
            { x: clearedBox.x, y: clearedBox.y + 1 },
            { x: clearedBox.x, y: clearedBox.y - 1 }
        ];

        adjacentPositions.forEach(pos => {
            const adjacentBox = this.upperGridBoxes.find(b => b.data.x === pos.x && b.data.y === pos.y && !b.data.isOpen && !b.data.cleared);
            if (adjacentBox) {
                // Open it
                adjacentBox.data.isOpen = true;

                // Update visuals to green
                adjacentBox.topFace.setFillStyle(0x00ff00);

                // Look for the side face in the container to color it accordingly
                // We appended it first: [sideFace, topFace]
                const sideFace = adjacentBox.container.list[0] as Phaser.GameObjects.Rectangle;
                if (sideFace && sideFace.type === 'Rectangle') {
                    sideFace.setFillStyle(0x00cc00);
                }

                const boxSize = 130;
                const ballSpacing = boxSize / 3;
                const renderedBalls: Phaser.GameObjects.Arc[] = [];

                // Render its balls
                adjacentBox.data.balls.forEach((ball, idx) => {
                    const bx = -(boxSize / 2) + (ballSpacing / 2) + ((idx % 3) * ballSpacing);
                    const by = -(boxSize / 2) + (ballSpacing / 2) + (Math.floor(idx / 3) * ballSpacing);
                    const ballSprite = this.add.circle(bx, by, ballSpacing * 0.4, this.colorCodes[ball.colorId]);
                    ballSprite.setData('ballData', ball);
                    adjacentBox.container.add(ballSprite);
                    renderedBalls.push(ballSprite);
                });

                adjacentBox.topFace.setData('renderedBalls', renderedBalls);
            }
        });
    }

    animateToFunnelAndConveyor(balls: Phaser.GameObjects.Arc[], container: Phaser.GameObjects.Container) {
        const funnelX = 1080 / 2;
        const funnelY = 1380; // Pile them up right above the top track (which is at Y:1424)

        // Give the box a pop animation before destroying
        this.tweens.add({
            targets: container,
            scaleX: 0,
            scaleY: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                container.destroy();
            }
        });

        // Simulate physics by handing them off to the Arcade Physics engine!
        balls.forEach((ball, index) => {
            this.fallingBallGroup.add(ball);
            const body = ball.body as Phaser.Physics.Arcade.Body;

            // Setting circle collision radius (15px handles nicely without too much overlap snagging)
            body.setCircle(15);
            body.setMass(1 + Math.random()); // Vary mass to break perfectly symmetrical momentum cancellations!

            // Randomize starting velocity so they spray out dramatically before falling into the funnel
            const vx = (Math.random() - 0.5) * 600; // Left or Right burst
            const vy = -300 - (Math.random() * 400); // Upward jump burst
            body.setVelocity(vx, vy);
            body.setGravityY(2000); // Heavy, satisfying gravity gravity 
        });
    }

    update(time: number, delta: number) {
        if (!this.conveyorPath) return;

        const deltaSec = delta / 1000;

        // --- Arcade Physics Funnel Catching & Smooth Slanted Sliding ---
        this.fallingBallGroup.getChildren().forEach((b) => {
            const ball = b as Phaser.Physics.Arcade.Sprite;
            const body = ball.body as Phaser.Physics.Arcade.Body;
            if (!body || !body.enable) return;

            // 0. Hard clamp the X bounds so balls bouncing wildly don't escape the outer pit walls (X: 40 to 1040)
            if (ball.x < 40 + 15) { ball.x = 40 + 15; body.velocity.x = Math.abs(body.velocity.x) * 0.5; }
            if (ball.x > 1040 - 15) { ball.x = 1040 - 15; body.velocity.x = -Math.abs(body.velocity.x) * 0.5; }

            // 0.5 Prevent mid-air hanging (Newtonian momentum transfer can dead-stop Arcade bodies vertically)
            if (ball.y < 1200 && Math.abs(body.velocity.y) < 50) {
                body.velocity.y += 1200 * deltaSec; // Force artificial gravity acceleration if they stall
            }

            // 1. Manually constrain balls to perfectly slide down the V-funnel without collider jitter
            // Funnel walls span: Left side (X: 40 to 500), Right side (X: 1040 to 580). Top Y: 1200, Bottom Y: 1350
            if (ball.y > 1100 && ball.y < 1600) { // Deeper catch zone prevents high-velocity clipping/tunneling
                const m = 150 / 460; // slope = straight vertical drop / horizontal distance

                // Left Funnel Constraint (Stops exactly at hole drop: X = 500)
                if (ball.x >= 40 && ball.x <= 500) {
                    const expectedY = 1200 + m * (ball.x - 40);
                    if (ball.y + 15 > expectedY) {
                        ball.y = expectedY - 15;
                        body.velocity.y = 500; // Fixed glide descent (resets runaway gravity tunneling)
                        body.velocity.x = 1200; // Poweful slippery glide towards center
                    }
                }
                // Right Funnel Constraint (Stops exactly at hole drop: X = 580)
                else if (ball.x <= 1040 && ball.x >= 580) {
                    const expectedY = 1200 + (-m) * (ball.x - 1040);
                    if (ball.y + 15 > expectedY) {
                        ball.y = expectedY - 15;
                        body.velocity.y = 500; // Fixed glide descent 
                        body.velocity.x = -1200; // Powerful slippery glide towards center
                    }
                }
            }

            // Check if the physical ball has slid down the funnel and reached the bottom gap dropzone
            // The funnel physically ends around Y: 1350. The queue pile visually sits around Y: 1380.
            if (ball.y >= 1340 && ball.x > (1080 / 2) - 80 && ball.x < (1080 / 2) + 80) {
                // Trap the ball loosely in the physical hole so they bounce and pile naturally but don't fall forever!
                if (ball.y > 1380 - (this.funnelQueue.length * 8)) {
                    ball.y = 1380 - (this.funnelQueue.length * 8);
                    body.velocity.y *= -0.3; // tiny bounce
                    // Gently pull towards center
                    body.velocity.x += ((1080 / 2) - ball.x) * 10 * deltaSec;
                }

                // Add to visual/logical queue only if it hasn't been added yet
                if (!this.funnelQueue.includes(ball)) {
                    this.funnelQueue.push(ball);
                }
            }
        });

        // 1. Rotate the conveyor oval/rectangle
        this.conveyorOffset = (this.conveyorOffset + this.conveyorSpeed * delta) % 1;

        // Update positions
        for (let i = 0; i < 30; i++) {
            const slotProgress = (this.conveyorOffset + (i / 30)) % 1;
            const point = this.conveyorPath.getPoint(slotProgress);

            // Move the empty visual slot
            const emptySlot = this.emptySlotSprites[i];
            if (emptySlot) {
                emptySlot.setPosition(point.x, point.y);
            }

            // Move the ball if one is occupying this slot
            const sprite = this.conveyorSprites[i];
            if (sprite) {
                sprite.setPosition(point.x, point.y);
            }
        }

        // 1.5 Detect empty slots physically passing under the funnel queue
        if (this.funnelQueue.length > 0) {
            const funnelX = 1080 / 2;
            for (let i = 0; i < 30; i++) {
                // If the data slot is actually empty
                if (!this.conveyorSlots[i]) {
                    const slotProgress = (this.conveyorOffset + (i / 30)) % 1;
                    const point = this.conveyorPath.getPoint(slotProgress);

                    // Top track is at Y: 1424. Check if the slot is on the top track and directly under the funnel inside a tight 8px window.
                    if (point.y < 1440 && Math.abs(point.x - funnelX) < 8) {
                        const ballSprite = this.funnelQueue.shift()!;

                        // Disable physics now that it's on the conveyor
                        const body = ballSprite.body as Phaser.Physics.Arcade.Body;
                        if (body) {
                            body.stop();
                            body.setEnable(false);
                        }
                        this.fallingBallGroup.remove(ballSprite);

                        this.conveyorSlots[i] = ballSprite.getData('ballData') as BallData;
                        this.conveyorSprites[i] = ballSprite; // Instantly adds it to the list causing it to physically drop and snap directly inside the sliding track slot!

                        break; // Drop only one ball per frame to prevent overlap bugs
                    }
                }
            }
        }

        // 2. Check matches
        this.evaluateConveyorMatches();
    }

    evaluateConveyorMatches() {
        this.conveyorSprites.forEach((ballSprite, slotIndex) => {
            if (!ballSprite) return;

            const ballData = this.conveyorSlots[slotIndex];
            if (!ballData) return;

            // Find overlapping active top rows.
            // Simplified match: just check distance from ball to top-row boxes.
            // Top row boxes have rowIdx === 0.
            const topRowBoxes = this.lowerGridBoxes.filter(b => b.rowIdx === 0 && b.data.currentCount < 3);

            for (const boxObj of topRowBoxes) {
                // Determine the next empty hole's target position for this specific box
                const targetWidth = Math.floor(1080 / 4) - 20;
                // 'currentCount' doesn't include this ball yet, so we predict the hole it will occupy (count + 1)
                const nextHoleIndex = boxObj.data.currentCount + 1;
                // Right-to-left filling: 1st ball -> Right (1), 2nd ball -> Center (0), 3rd ball -> Left (-1)
                const holeLocalX = (2 - nextHoleIndex) * targetWidth / 3;
                const targetWorldX = boxObj.graphics.x + holeLocalX;

                // Ensure the ball is currently on the bottom half of the conveyor
                const bounds = this.conveyorPath.getBounds();

                // Drop if the color matches, the ball is on the bottom horizontal rail, and its X aligns closely with the target slot
                if (ballSprite.y > bounds.y + bounds.height * 0.9
                    && Math.abs(ballSprite.x - targetWorldX) < 15
                    && boxObj.data.reqColorId === ballData.colorId
                ) {
                    // Match found! Suck ball into box
                    this.absorbBallToBox(ballSprite, slotIndex, boxObj);
                    break;
                }
            }
        });
    }

    absorbBallToBox(ballSprite: Phaser.GameObjects.Arc, slotIndex: number, boxObj: any) {
        // Free conveyor slot safely so it stops ticking
        this.conveyorSprites[slotIndex] = null;
        this.conveyorSlots[slotIndex] = null;

        boxObj.data.currentCount++;

        const targetWidth = 220;
        const targetHeight = targetWidth / 3;
        // Right-to-left filling: 1st ball -> Right (1), 2nd ball -> Center (0), 3rd ball -> Left (-1)
        const holeLocalX = (2 - boxObj.data.currentCount) * targetWidth / 3;
        const targetWorldX = boxObj.graphics.x + holeLocalX;

        this.tweens.add({
            targets: ballSprite,
            x: targetWorldX,
            y: boxObj.graphics.y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                boxObj.numFilled++;

                // Remove from scene and reparent into the box container so it moves with the 3D box
                this.children.remove(ballSprite);
                boxObj.graphics.add(ballSprite);
                // We set its local position coordinates now that it is inside the container
                ballSprite.setPosition(holeLocalX, 0);


                // Scale the ball so it completely plugs the black hole visually
                const targetScale = (targetHeight * 0.35) / ballSprite.radius;
                this.tweens.add({
                    targets: ballSprite,
                    scaleX: targetScale,
                    scaleY: targetScale,
                    duration: 100
                });

                if (boxObj.numFilled == 3) {
                    // Shrink box and then destroy it before shifting gravity
                    this.tweens.add({
                        targets: boxObj.graphics,
                        scaleX: 0,
                        scaleY: 0,
                        delay: 150, // Let the last ball settle briefly
                        duration: 200,
                        onComplete: () => {
                            boxObj.graphics.destroy();
                            this.shiftLowerColumnUp(boxObj.columnIdx);
                        }
                    });
                }
            }
        });
    }

    shiftLowerColumnUp(colIdx: number) {
        // Find boxes in this column
        const colBoxes = this.lowerGridBoxes.filter(b => b.columnIdx === colIdx);

        // Dynamically compute the exact height to shift up
        const targetWidth = 220;
        const targetHeight = targetWidth / 3;
        const shiftAmount = targetHeight + 10;

        // Shift their row idx up and tween them
        colBoxes.forEach(b => {
            this.tweens.add({
                targets: b.graphics,
                y: `-=${shiftAmount}`,
                duration: 300,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    b.rowIdx--;
                }
            });
        });
    }

    executeUndoLogic() {
        console.log('Undo triggered from React state!');
    }
}