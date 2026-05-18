**Project**: Web-based "Jam/Sort" Game
**Documentation**: Special Mechanics & Components (Levels 20+)

## Overview
This document outlines the special components introduced at higher difficulty levels. The level generator and grid architecture detailed in **Report 4** must be designed to accommodate these layered blockades, procedural object injections, and conditional block states.

## 1. Hidden Ball Boxes (Level 20+)
*   **Description**: Normally, a closed box displays a solid color indicating the contents inside. Hidden boxes appear as grey blocks with a `?` symbol.
*   **Mechanic**: Their color/contents remain completely unknown to the user until the box transitions to the "Open" state (by clearing an adjacent box/open space).

## 2. Hidden Conveyor Boxes (Level 30+)
*   **Description**: Normally, closed boxes in the lower matching grid show a solid color identifying what balls they accept. Hidden conveyor boxes are grey with a `?`.
*   **Mechanic**: Their required matching color is only revealed when they shift upward into the top, active row directly below the conveyor belt.

## 3. Dispensers (Level 40+)
*   **Description**: Takes up a `1x1` grid space, pointing in a specific direction at an adjacent ball box space. Grey with a number (e.g., `3`) indicating remaining dispenses.
*   **Mechanic**: When the square it points at becomes empty (e.g. its box is cleared), the dispenser pushes a new box onto that empty square and decrements its number. When it reaches `0`, the dispenser clears from the grid.
*   **Generation Constraints**: Dispensed boxes are *deterministic* and must be calculated into level generation. Optimal algorithmic solutions might require a box generated *inside* the dispenser, forcing the user to deliberately clear the path in front of it.

## 4. Metal Plates (Level 50+)
*   **Description**: A massive metal plate that occupies a `3x3` area on the grid (covering 9 standard ball box spaces). Displays a numeric counter on top.
*   **Mechanic**: Every time *any* ball box entirely on the grid is opened/cleared, the plate's number decreases by 1. Once the counter reaches `0`, the plate disappears, revealing the 9 ball boxes underneath.
*   **Generation Constraints**: Colors under the plate are deterministic and must be perfectly balanced by the generator's global ball limits.

## 5. Pins (Level 60+)
*   **Description**: An object taking a `1x3` grid space, featuring a direction. It has a round head on one end, with a needle overlapping the other two squares. It sits layered *on top* of 3 ball boxes, leaving them visible but forcing them into a locked/closed state.
*   **Mechanic**: The pin is removed when the grid square *adjacent to the head* (on the side opposite the extending needle) is cleared. Once the pin is removed, the 3 boxes underneath transition to an open state (provided normal adjacency rules still apply).

## 6. Key and Chain (Level 70+)
*   **Description**: A two-piece component. 
    *   **Key**: Takes a `1x1` grid space, placed loosely *on top* of a standard ball box somewhere on the grid.
    *   **Chain**: Stretches in a cardinal direction connecting two designated Wall Spaces, blocking access to all boxes behind/under it.
*   **Mechanic**: When the specific ball box beneath the key is cleared and releases its balls, the key is freed. This automatically unlocks and removes the corresponding chain spanning the map.
*   **Generation Constraints**: Chains are used to wall off enclosed sections of grid topology (framed by solid Wall Spaces). The generator *must* map dependencies to ensure the key is placed in an accessible starting zone and never logically locked behind the chain it is meant to unlock.

---

> **Developer Reminder: Pending Features**
> The following features require future documentation and design details to be appended to this report:
> *   Ties
> *   Arrows
> *   Vault
> *   Crates
> *   Multiplier
> *   Presents