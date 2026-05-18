# Technical Report 5.5: 3D Graphics Revamp (Babylon.js Migration)

## 1. Overview
The current graphics architecture uses Phaser 3 to render a faux-3D (pseudo-isometric) environment. It relies heavily on 2D primitives (`Rectangles`, `Arcs/Circles`, and polygon `paths`) carefully positioned and layered to simulate depth. To elevate the visual fidelity with proper shaders, realistic shadows, and true 3D geometry without the overhead of manual coordinate layering, we will transition the `GameWrapper` core rendering loop from Phaser 3 to Babylon.js.

Crucially, the React UI, Zustand state manager, and Supabase backend will remain untouched. Communication will continue to utilize the decoupled `EventBus` architecture.

## 2. Analysis of the Current Renderer (Phaser 3)

The current `MainGameScene.ts` handles visuals through manual X/Y vector mapping:

### 2.1 Environmental Pit & Funnel
- **Implementation**: The scene uses raw `Phaser.GameObjects.Graphics` paths (`moveTo`, `lineTo`, `fillPath`) to draw polygons that represent the pit floor, side walls, and isometric depth rims. 
- **Light & Shadow**: Approximated manually via hardcoded hex colors (`pitDepthColor`, `pitFloorColor`, `wallColor`) mapped to different 2D faces of the polygons.

### 2.2 Upper Grid (The Island) & Lower Grid (Targets)
- **Upper Grid**: Placed inside a mathematically centered 7x7 grid array. A single box consists of an overlap of two 2D `Phaser.GameObjects.Rectangle` instances.
- **Lower Grid Targets**: Function identically. Target holes are simply `Phaser.GameObjects.Arc` colored black placed inside the containers.

### 2.3 Ball Drop Physics & Conveyor 
- **Physics Transfer**: Upon a valid box click, balls are released from their container and injected into `Phaser.Physics.Arcade.Group`. 
- **The Funnel**: Faux-gravity is applied, and 2D math `if/else` checks manually constrain the balls to slide down invisible X/Y slope zones into the funnel trap.
- **The Conveyor Path**: Represented by a `Phaser.Curves.Path`. Rendered 2D ball sprites physically map their `(x,y)` to fractional parametric slots along the curve over time.

## 3. Babylon.js Implementation Strategy

Migrating to Babylon.js will dramatically simplify coordinate math and collision logic while instantly providing high-fidelity visual scaling.

### 3.1 Core Architecture & Scene Initialization
1. **Engine Setup**: Replace the Phaser `<canvas>` generation inside `components/GameWrapper.tsx` with a Babylon `BabylonScene` generic React wrapper.
2. **Camera**: Implement a fixed `FreeCamera` or `UniversalCamera` aimed downwards at a steep isometric-style angle. This provides real 3D depth automatically.

### 3.2 3D Geometry Mapping & Dimensions (The 0.01x Scale Rule)
To perfectly preserve the original gameplay physics and spacing, ALL 3D geometry coordinates are converted directly from the 2D `1080x1920` Phaser layout using a strictly enforced `(value) * 0.01` scale against a centered origin `(540, 960)`.
*   **Coordinate Translator**: 
    *   `babylonX = (phaserX - 540) * 0.01`
    *   `babylonZ = (960 - phaserY) * 0.01`
    *   Dimensions (`width`, `height`, etc) `= length * 0.01`
*   **Upper Grid Variables**: `boxSize = 1.30`, `spacing = 1.45`, Top-Left Box Origin = `(-4.35, 7.60)`
*   **Pit Bounds**: Top Y: `102.5`, Funnel Starts Y: `1200`, Funnel Ends Y: `1350`, Conveyor Center Y: `1460`.
*   **Conveyor**: Central divider is completely hollow (`width: 7.96`), surrounded by inner tracks (`thickness: 0.54`).
*   **Target Boxes**: Exactly `3:1` ratio (`2.20` wide, `0.733` high), placed incrementally in 4 columns along the bottom bottom quadrant from Y=1600.
*   **Funnel**: Rather than mapping a diagonal box covering the slope, the funnel slopes are constructed natively as Custom Prism Meshes using `VertexData`. This mathematically guarantees they fill the space forming a solid triangular wedge above the conveyor, perfectly aligning their top-left and top-right origins to their respective outer Pit Walls (`X=7.5` and `X=1072.5`) down to the inner conveyor tracks (`X=40`, `X=1040`, etc).
*   **Winding Order & Shading Insight**: Creating custom polygon meshes (like mirrored right triangles) requires careful attention to the Vertex index building order. Mirrored objects must have reversed point associations to ensure `VertexData.ComputeNormals()` builds convex (outward-facing) shadows instead of inverted concave illusions. Additionally, `convertToFlatShadedMesh()` guarantees hard architectural edges on the prisms.

### 3.3 The Conveyor System
- Constructed via 3D Path `Path3D`. The slots act as logical anchor nodes tracking positional data.
- When balls exit the funnel, Havok Physics are suspended and transformations follow mathematical lerping.

## 4. Phase Migration Steps
1. Create a parallel `components/BabylonGameWrapper.tsx`. **(Completed)**
2. Map `LevelGenerator.ts` array structures to Babylon Vector3 coordinates (X, Y, Z). **(Completed)**
3. Build environmental geometry (Walls, Funnel, Conveyor Placeholder) matching Phaser bounds. **(Completed)**
4. **Implement Ball Meshes & Render Materials**: Spawn 3x3 spheres inside each generated box on the grid using `colorId` mapping.
5. **Implement Interactivity & State**: Connect the native Babylon ActionManager (`OnPickTrigger`) to detect box clicks, hooking up with the existing `utils/EventBus.ts`.
6. **Implement Animation & Physics Hook**:
    - Build the box click "pop" and collapse animation (along with revealing adjacent boxes when one is removed).
    - Transfer the 3x3 ball group to Havok Physics to spray and fall freely through the funnel pit.
7. **Implement Belt Alignment**: Once balls exit the physics funnel, suspend physics and mathematically clamp/lerp them to the empty 30-slot conveyor tracking path `Path3D`.
8. **Implement Target Insertion**: Construct the conveyor movement logic, identifying matching targets in the lower grid and scaling the balls into their respective sorting slots.
9. Decommission `<PhaserWrapper>` and remove Phaser dependencies entirely.

## 5. Critical Amendments & Risks (Self-Critique)

### 5.1 Physics Engine Overhead on Mobile
We will use a mix of physics and animation logic. When boxes are clicked, balls will be launched downwards towards the funnel (landing in the zone below the grid but above the funnel), at which point they will obey strict true HD 3D Havok gravity and collision physics through the funnel.

### 5.2 Camera Control Restrictions
The camera view will be strictly fixed in an isometric viewpoint from above the conveyor boxes angled towards the gameboard and funnel. Player pan/orbit interactions will be locked to preserve puzzle clarity.

### 5.3 Art Direction & Shaders
Our aesthetic target is a clean, minimalist pastel palette with NO metallic surfaces. While we target an iPhone 15 minimum hardware capability allowing post-processing overhead, we will rely heavily on clean `StandardMaterial` diffuse lighting without complex PBR or Bloom implementations to maintain stable high frame rates and prevent z-fighting issues.

## 6. Testing Requirements
A strict test-driven approach must be followed during the migration to Babylon.js to ensure no regressions in gameplay logic or UI interactions.
* **Unit Testing**: Every standalone module must have corresponding unit tests using Vitest.
* **End-to-End (E2E) Testing**: Every visual feature, state transition, and user interaction must be fully validated via Playwright E2E tests before being merged.