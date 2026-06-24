# High-Level System Architecture

This document maps out the core data flow, synchronization mechanisms, automated business logic, and directory structure of the Football Team Maker application.

## 🏗 System Diagram

```mermaid
graph LR
    Client[React Frontend (Modular)] 
    DB[(Supabase Database)]
    Realtime[Supabase Realtime]

    Client -->|RPC Atomic Writes| DB
    DB -->|Triggers Event| Realtime
    Realtime -.->|Live Broadcast| Client
```

## 🧩 Architectural Decisions

### 1. Modular Directory Structure
The application has been explicitly architected for scalability and maintainability by moving away from a monolithic `App.jsx` to a clean, decoupled structure:
- **`src/config/`**: Holds all hardcoded business logic parameters (capacity limits, team themes, game days, registration windows).
- **`src/services/`**: Abstracts all Supabase interactions. UI components never talk directly to the database.
- **`src/hooks/`**: Centralizes global state, realtime event subscriptions, and boundary timers (`useGameState`, `useBoundaryTimer`).
- **`src/components/`**: Pure UI functions logically separated into `roster` and `matchup` domains.
- **`src/App.jsx`**: Acts solely as a composition shell orchestrating the hooks and components.

### 2. The Single-Row State & Atomic RPCs
Instead of managing complex relational tables linking `users`, `games`, and `waitlists`, the core application runs off a **single row** in the PostgreSQL `game_state` table containing JSONB arrays for players and the matchup configuration.

To prevent race conditions during high-traffic moments (e.g., 7:00 AM registration):
- The app uses **Atomic PostgreSQL RPC Functions** (`add_player`, `remove_player`).
- These functions execute directly on the database server to guarantee sequence integrity, automatically managing waitlist thresholds and safely resetting team drafts if capacity changes mid-draft.

### 3. Dynamic Capacity Scaling
The application natively adapts to player volume. As total registrations cross predefined constants (`10`, `14`, `18`), the active confirmed list auto-expands from a 5v5 game up to 7v7, and ultimately a 9v9 format. Anyone joining beyond the current calculated capacity falls perfectly into the waitlist.

### 4. Lazy Automation (Serverless Daily Rollover)
Typically, clearing a database waitlist at midnight requires a constantly running Node.js server and a Cron job. We bypassed this completely with **Lazy Automation**.
- The logic for checking if the date has advanced lives directly in the React frontend.
- The first user to load the app after midnight inherently triggers the update logic, forcing the DB to roll over, truncating the waitlist, and locking the `last_rollover_date` column so no subsequent visitors trigger it again.

### 5. Client-Side Time Defenses
The application utilizes aggressive, client-side safeguards to enforce IST (Indian Standard Time) constraints without hitting server limits:
- **Edge-Rendered Dates:** Dynamic conversion ensures that even if a user is traveling in a foreign timezone, their registration logic evaluates against IST, preserving the strict 7:00 AM access lock.
- **Boundary Auto-Refresh:** The `useBoundaryTimer` hook sets precise milliseconds-accurate `setTimeout` triggers that forcefully reload the browser exactly at Midnight and 7:00 AM IST. This ensures that users camping the page immediately see the open gates or the rolled-over day.
- **Bulletproof Tab Resumption:** The `visibilitychange` listener instantly refetches master state anytime the user switches tabs or re-opens their mobile browser, entirely eliminating the risk of stale views.
