**Project**: Web-based "Jam/Sort" Game (Mobile-First)
**Target Execution**: AI Code Generation Guide

## 1. The Tech Stack
To ensure mobile browser compatibility, 60fps animations, secure account creation, and a seamless developer experience for an AI, we will use the following stack:

*   **Core Game Engine:** **Phaser 3** (JavaScript/HTML5 Canvas). *Why:* It handles 2D physics, Z-index overlapping, touch inputs, and tweening (smooth animations) natively. It runs perfectly in mobile browsers (Safari/Chrome).
*   **Frontend UI & Routing:** **Next.js (React) + TypeScript**. *Why:* React will handle the DOM-based UI (Main Menu, Settings, Login Screens, HUD) overlaid on top of the Phaser Canvas. TypeScript ensures the AI agent maintains strict data contracts between the UI and the Game.
*   **Styling:** **Tailwind CSS**. *Why:* Standardized, rapid mobile-responsive UI design.
*   **Backend, Database & Auth:** **Supabase** (PostgreSQL-based BaaS). *Why:* It provides out-of-the-box email/password + OAuth login, and real-time database saving. It is incredibly easy for AI to generate SQL schemas and API calls for.
*   **Hosting:** **Vercel**. *Why:* Native Next.js support with CI/CD.

## 2. High-Level Architecture (The Moving Pieces)
The application will be divided into three distinct layers. The AI agent must build these layers so they are decoupled but communicate via a defined Event Bus.

### Layer A: The Data & Auth Layer (Supabase Backend)
*   **Authentication Service:** Manages user sessions, JWT tokens, and account creation.
*   **User Profile Table:** Stores `user_id`, `current_level`, `coins/currency`, and `inventory` (boosters).
*   **Level State Table (Optional but recommended):** If the player closes the browser mid-level, this stores the serialized state of the board to resume later.

### Layer B: The Application Layer (Next.js / React)
*   **Auth Views:** Login, Register, Forgot Password components.
*   **Meta-Game Views:** Level Select map, Store, Settings.
*   **The Game Wrapper:** A React component that initializes the Phaser Canvas and acts as a bridge. It listens to Phaser events (e.g., `EVENT_LEVEL_COMPLETE`) and triggers Supabase DB updates.

### Layer C: The Game Engine Layer (Phaser 3)
This is where the actual gameplay happens. It consists of:
*   **The Level Generator:** An algorithmic module that accepts parameters (level number) and generates a reverse-solved level schema comprising Upper Island boxes and Lower matching boxes.
*   **The Board Manager (Upper Island):** Renders the boxes and balls. Handles states (Open vs Closed) and click validation.
*   **The Conveyor Belt:** A 30-slot rotating oval array that catches dropped balls from the funnel and moves them over the matching area.
*   **The Match Evaluator (Lower Grid):** 1x3 matching boxes that suck in required colored balls as they pass overhead on the conveyor. Completing them clears them.

## 3. Data Flow Example
To help the AI understand how the pieces interact, here is the lifecycle of a player's action:

1.  **Input:** Player taps an "Open Box" on the upper island grid.
2.  **Validation (Phaser):** Board Manager checks if the box is in an Open state and not blocked by special components. If yes -> proceed.
3.  **State Update & Drop (Phaser):** Box clears, dropping its 9 balls down the Funnel onto open slots in the rotating Conveyor Belt.
4.  **Matching (Phaser):** The Conveyor rotates the balls over the Lower Grid. Balls matching top-row 1x3 boxes drop into them.
5.  **Evaluation (Phaser):** A 1x3 lower box fills with 3 matching balls. It clears, shifting remaining lower boxes upwards.
6.  **Win Condition Triggered (Phaser):** Upper Island is empty. All Lower boxes are cleared. Phaser emits `LEVEL_WON` event to React.
7.  **Data Save (React -> Supabase):** React catches the event, updates the UI to "Victory", and sends an async `POST` request to Supabase to increment `user.current_level += 1`.

## 4. Mobile Browser Specifics (AI Directives)
The AI must implement the following specific settings for mobile web game optimization:
*   **Viewport meta tag:** `user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1` (Prevents the browser from zooming in when the player taps rapidly).
*   **CSS:** `touch-action: none;` on the canvas element to prevent pull-to-refresh or scrolling while playing.
*   **Phaser Scale Manager:** Set to `Phaser.Scale.FIT` to ensure the game board automatically resizes whether the user is on an iPhone Mini or an iPad.
