'use client';

import { useEffect, useRef } from 'react';
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color4, Mesh, VertexData } from '@babylonjs/core';

export default function BabylonGameWrapper() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const sceneRef = useRef<Scene | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (engineRef.current) return; // Prevent double initialization

        // 1. Initialize Engine
        const engine = new Engine(canvasRef.current, true);
        engineRef.current = engine;

        // 2. Initialize Scene
        const scene = new Scene(engine);
        // Soft pastel background
        scene.clearColor = new Color4(0.96, 0.95, 0.92, 1); // equivalent to #F5F2EB
        sceneRef.current = scene;

        // 3. Initialize Camera (Looking at origin from an isometric angle)
        const camera = new FreeCamera("mainCamera", new Vector3(0, 20, -20), scene);
        camera.setTarget(Vector3.Zero());

        // 4. Initialize Lights
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // Coordinate scaling to map 1080x1920 Phaser exactly to Babylon
        const scale = 0.01;
        const pX = (x: number) => (x - 540) * scale;
        const pZ = (y: number) => (960 - y) * scale;
        const pDim = (dim: number) => dim * scale;

        const wallHeight = 1.5;

        // 5. Build Simple Geometry (Environment)
        const ground = MeshBuilder.CreateGround("ground", { width: pDim(1080), height: pDim(1920) }, scene);
        import('@babylonjs/core/Materials/standardMaterial').then(({ StandardMaterial }) => {
            import('@babylonjs/core/Maths/math.color').then(({ Color3 }) => {
                const groundMat = new StandardMaterial("groundMat", scene);
                groundMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
                groundMat.wireframe = true;
                ground.material = groundMat;

                const wallMat = new StandardMaterial("wallMat", scene);
                wallMat.diffuseColor = new Color3(0.96, 0.95, 0.92); // Pastel base
                wallMat.backFaceCulling = false; // Ensures inverted faces remain visible just in case
            });
        }).catch(err => {
            if (typeof window !== 'undefined') console.error(err);
        });

        // 5.1 Pit Walls (Upper Section)
        // Original 2D: Grid Width = 1000. Gap = 32.5. 130/2 = 65.
        // Pit Top Y = 200 - 65 - 32.5 = 102.5. Top boundary ends at Y=1200.
        // Left Pit width = 7.5 (extends from X:0 to X:7.5)
        const leftWallTop = MeshBuilder.CreateBox("leftTopWall", { width: pDim(7.5), height: wallHeight, depth: pDim(1200 - 102.5) }, scene);
        leftWallTop.position = new Vector3(pX(7.5 / 2), wallHeight / 2, pZ(102.5 + (1200 - 102.5) / 2));

        const rightWallTop = MeshBuilder.CreateBox("rightTopWall", { width: pDim(7.5), height: wallHeight, depth: pDim(1200 - 102.5) }, scene);
        rightWallTop.position = new Vector3(pX(1080 - 7.5 / 2), wallHeight / 2, pZ(102.5 + (1200 - 102.5) / 2));

        const topWall = MeshBuilder.CreateBox("topWall", { width: pDim(1080), height: wallHeight, depth: pDim(102.5) }, scene);
        topWall.position = new Vector3(pX(540), wallHeight / 2, pZ(102.5 / 2));

        // 5.2 Funnel (Slopes inwards from Y 1200 to 1350)
        const createTriPrism = (name: string, p0: { x: number, z: number }, p1: { x: number, z: number }, p2: { x: number, z: number }) => {
            const positions: number[] = [
                p0.x, 0, p0.z,
                p1.x, 0, p1.z,
                p2.x, 0, p2.z,
                p0.x, wallHeight, p0.z,
                p1.x, wallHeight, p1.z,
                p2.x, wallHeight, p2.z,
            ];
            const indices = [
                0, 2, 1,  // bottom
                3, 4, 5,  // top
                0, 1, 4, 0, 4, 3, // side 0-1
                1, 2, 5, 1, 5, 4, // side 1-2
                2, 0, 3, 2, 3, 5  // side 2-0
            ];
            const mesh = new Mesh(name, scene);
            const vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;

            const normals: number[] = [];
            VertexData.ComputeNormals(positions, indices, normals);
            vertexData.normals = normals;

            vertexData.applyToMesh(mesh);
            mesh.convertToFlatShadedMesh(); // Fixes lighting so it doesn't look smooth/cylindrical
            return mesh;
        };

        // Left Funnel Solid Wedge (Right Triangle)
        const leftFunnel = createTriPrism("leftFunnel",
            { x: pX(7.5), z: pZ(1200) }, // Top Left
            { x: pX(7.5), z: pZ(1350) }, // Bottom Left (Right angle)
            { x: pX(500), z: pZ(1350) }  // Bottom Right (Points to center)
        );

        // Right Funnel Solid Wedge (Right Triangle)
        // Note: Winding order must match left funnel (p0 -> p1 -> p2) to ensure normals compute outwards correctly.
        const rightFunnel = createTriPrism("rightFunnel",
            { x: pX(1080 - 7.5), z: pZ(1200) }, // p0: Top Right
            { x: pX(580), z: pZ(1350) },         // p1: Bottom Left (Points to center)
            { x: pX(1080 - 7.5), z: pZ(1350) }   // p2: Bottom Right (Right angle)
        );

        import('@babylonjs/core/Materials/standardMaterial').then(({ StandardMaterial }) => {
            const mat = scene.getMaterialByName("wallMat");
            if (mat) {
                leftFunnel.material = mat;
                rightFunnel.material = mat;
            }
        });

        // 5.3 Pit Walls (Lower Conveyor Section)
        // Left drops at X=65 from Y=1350 to 1920
        const lowerWallDepth = 1920 - 1350;
        const leftWallBottom = MeshBuilder.CreateBox("leftBottomWall", { width: pDim(65), height: wallHeight, depth: pDim(lowerWallDepth) }, scene);
        leftWallBottom.position = new Vector3(pX(65 / 2), wallHeight / 2, pZ(1350 + lowerWallDepth / 2));

        const rightWallBottom = MeshBuilder.CreateBox("rightBottomWall", { width: pDim(65), height: wallHeight, depth: pDim(lowerWallDepth) }, scene);
        rightWallBottom.position = new Vector3(pX(1080 - 65 / 2), wallHeight / 2, pZ(1350 + lowerWallDepth / 2));

        // 5.4 Conveyor Belt (Track & Divider)
        const cx = 540;
        const cy = 1460;
        const trackWidth = 54;
        const dividerWidth = 18;
        const convWidth = 850 + trackWidth; // 904
        const convHeight = trackWidth + dividerWidth + trackWidth; // 126

        // Visual representation as a single flat plane for now (track color with a hole in the middle modeled as two tracks)
        const conveyorPlane = MeshBuilder.CreateBox("conveyorBeltPlane", { width: pDim(convWidth), height: 0.1, depth: pDim(convHeight) }, scene);
        conveyorPlane.position = new Vector3(pX(cx), +0.05, pZ(cy));

        // 6. Generate Level 1 Grid Boxes
        import('@/utils/LevelGenerator').then(({ LevelGenerator }) => {
            const levelData = LevelGenerator.generate(1);

            const phaserBoxSize = 130;
            const phaserSpacing = 145;
            const gridOffsetX = 105;
            const gridOffsetY = 200;

            // Upper Grid (Island) boxes
            levelData.upperGrid.forEach((boxData) => {
                const posX = gridOffsetX + (boxData.x * phaserSpacing);
                const posY = gridOffsetY + (boxData.y * phaserSpacing);

                const boxMesh = MeshBuilder.CreateBox(`box_${boxData.id}`, { size: pDim(phaserBoxSize) }, scene);
                boxMesh.position = new Vector3(pX(posX), pDim(phaserBoxSize) / 2 + 0.05, pZ(posY));
            });

            // Lower Grid (Targets along the Conveyor belt)
            const targetWidth = 220;
            const targetHeight = targetWidth / 3;
            const targetOffsetX = 189;
            const targetOffsetY = 1600;

            const columnCounts = [0, 0, 0, 0];
            const lowerBoxes = [...levelData.lowerGrid].reverse(); // Draw bottom-up

            lowerBoxes.forEach((targetData) => {
                const colIdx = targetData.columnId;
                const rowIdx = columnCounts[colIdx]++;

                const posX = targetOffsetX + (colIdx * (targetWidth + 14));
                const posY = targetOffsetY + (rowIdx * (targetHeight + 10));

                const targetMesh = MeshBuilder.CreateBox(`target_${targetData.id}`, { width: pDim(targetWidth), height: 0.2, depth: pDim(targetHeight) }, scene);
                targetMesh.position = new Vector3(pX(posX), 0.1, pZ(posY));
            });

        }).catch(err => {
            if (typeof window !== 'undefined') console.error("Failed to generate level:", err);
        });

        // Start Render Loop
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Handle Resize
        const resize = () => engine.resize();
        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            scene.dispose();
            engine.dispose();
            engineRef.current = null;
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="babylon-canvas"
            style={{ width: '100vw', height: '100vh', display: 'block' }}
            className="absolute top-0 left-0 z-0 outline-none touch-none"
        />
    );
}